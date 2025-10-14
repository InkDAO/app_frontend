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
    // Convert all tags to lowercase for consistent searching
    const lowercaseTags = tags.map(tag => tag.trim().toLowerCase());
    const tagsParam = lowercaseTags.join(',');
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