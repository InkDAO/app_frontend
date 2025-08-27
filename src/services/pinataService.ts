import { PinataSDK } from 'pinata'

const pinata = new PinataSDK({
  pinataJwt: "",
  pinataGateway: import.meta.env.VITE_GATEWAY_URL
})

export interface UploadResult {
  success: boolean
  cid?: string
  ipfsLink?: string
  error?: string
  groupId?: string
}

export interface GroupResponse {
  group: {
    id: string
    name: string
    created_at: string
  } | null
  error?: string | null
}

export interface PresignedUrlResponse {
  url?: string
  group?: {
    id: string
    name: string
    created_at: string
  }
}

export const handleCreateGroup = async (group_name: string): Promise<GroupResponse> => {
  if (!group_name) {
    return {
      group: null,
      error: 'Invalid group name'
    }
  }

  try {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/create/${group_name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error('Failed to create group')
    }

    const result = await response.json()
    return {
      group: result.group,
      error: null
    }
  } catch (error) {
    return {
      group: null,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export const handleUpload = async (file_name: string, group_id: string, file: File, hashtags: string): Promise<UploadResult> => {
  if (!file || !file_name || !group_id) {
    return {
      success: false,
      error: 'Invalid file or file name or group id'
    }
  }

  try {
    // Get upload URL from server
    const urlResponse = await fetch(`${import.meta.env.VITE_SERVER_URL}/presigned_url/${group_id}`, {
      method: "GET",
      headers: {
        // Handle your own server authorization here
      }
    })
    
    if (!urlResponse.ok) {
      throw new Error('Failed to get upload URL')
    }
    const data: PresignedUrlResponse = await urlResponse.json()

    // Check if response has the expected URL or if it's returning group info
    let uploadUrl = data.url
    if (!uploadUrl && data.group) {
      // If only group info is returned, we might need to make another call or handle differently
      throw new Error('No upload URL provided in response')
    }

    if (!uploadUrl) {
      throw new Error('No upload URL found in response')
    }

    const hashtagsArray = hashtags.split(',').map(tag => tag.trim().toLowerCase());
    
    const keyvalues = hashtagsArray.reduce((acc, tag) => {
      acc[tag] = tag;
      return acc;
    }, {} as Record<string, string>);

    // Upload file to Pinata
    const upload = await pinata.upload.public
      .file(file)
      .name(file_name)
      .url(uploadUrl)
      .keyvalues(keyvalues)

    if (upload.cid) {
      const ipfsLink = await pinata.gateways.public.convert(upload.cid)
      return {
        success: true,
        cid: upload.cid,
        ipfsLink
      }
    } else {
      return {
        success: false,
        error: 'Upload failed - no CID returned'
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export const handleGetGroupByName = async (group_name: string): Promise<GroupResponse> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/groupByName/${group_name}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get group by name')
    }

    const result = await response.json()
    
    if (Array.isArray(result.groups) && result.groups.length > 0) {
      return {
        group: result.groups[0],
        error: null
      }
    }

    return {
      group: null,
      error: "No valid group found in response"
    }
  } catch (error) {
    return {
      group: null,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export interface IPFSContentResult {
  success: boolean
  content?: string
  error?: string
}

export interface FileMetadata {
  success: boolean
  id?: string
  name?: string
  cid?: string
  size?: number
  number_of_files?: number
  mime_type?: string
  group_id?: string
  keyvalues?: Record<string, string>
  created_at?: string
  error?: string
}

export const handleGetFileMetadataByCid = async (cid: string): Promise<FileMetadata> => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/fileByCid/${cid}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get file by CID')
    }

    const result = await response.json()
    return {
      success: true,
      ...result.files[0]
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export const fetchFromIPFS = async (cid: string): Promise<IPFSContentResult> => {
  if (!cid) {
    return {
      success: false,
      error: 'Invalid CID provided'
    }
  }

  try {
    // Use the gateway URL to fetch content
    const gatewayUrl = import.meta.env.VITE_GATEWAY_URL
    
    if (!gatewayUrl) {
      throw new Error('Gateway URL not configured')
    }

    const fetchUrl = `https://${gatewayUrl}/ipfs/${cid}`;
    const response = await fetch(fetchUrl)

    if (!response.ok) {
      throw new Error(`Failed to fetch content from IPFS: ${response.status}`)
    }

    const content = await response.text()
    
    return {
      success: true,
      content
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }
  }
}

export const handleGetFilesByTags = async (tags: string[]): Promise<FileMetadata[]> => {
  try {
    const tagsParam = tags.join(',');
    const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/filesByTags?tags=${tagsParam}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error('Failed to get files by tags')
    }

    const result = await response.json()
    return result.files
  } catch (error) {
    return [];
  }
}