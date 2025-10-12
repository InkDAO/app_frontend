import "../components/editor/Editor.css";
import { useState, useCallback, useEffect, useRef } from "react";
import { Edit3, Eye } from 'lucide-react';
import Editor from "../components/editor/Editor";
import EditorTextParser from "../components/editor/EditorTextParser";
import { useAccount, useSignMessage } from 'wagmi';
import { createGroupPost, updateFileById, useAddAsset, publishFile } from '@/services/dXService';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEditor } from '@/context/EditorContext';
import { PublishData } from '@/components/PublishOverlay';

type EditorData = {
	time?: number;
	blocks?: any[];
	version?: string;
};

const EditorPage = () => {
	const [isPreviewMode, setIsPreviewMode] = useState(false);
	const [data, setData] = useState<EditorData>({ blocks: [] });
	const [documentTitle, setDocumentTitle] = useState('');
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isPublishing, setIsPublishing] = useState(false);
	const [isLoadingContent, setIsLoadingContent] = useState(false);
	const [showPublishOverlay, setShowPublishOverlay] = useState(false);
	const editorInstanceRef = useRef<any>(null);
	const justSavedOrLoaded = useRef(false);
	
	const { address } = useAccount();
	const { signMessageAsync } = useSignMessage();
	const { toast } = useToast();
	const { cid } = useParams();
	const navigate = useNavigate();
	const { ensureAuthenticated, isAuthenticated } = useAuth();
	const { setEditorProps } = useEditor();
	const { addAsset, isPending: isContractPending, isConfirming: isContractConfirming, isConfirmed: isContractConfirmed, isError: isContractError, hash: txHash } = useAddAsset();

	// Load existing post content from IPFS when CID is present
	useEffect(() => {
		const loadExistingPost = async () => {
			if (!cid) return;
			
			setIsLoadingContent(true);
			try {
				const { fetchFileContentByCid } = await import('@/services/dXService');
				const contentData = await fetchFileContentByCid(cid);
				
				if (contentData) {
					try {
						const parsedResponse = typeof contentData === 'string' ? JSON.parse(contentData) : contentData;
						
						if (parsedResponse.content) {
							setData(parsedResponse.content);
							if (parsedResponse.title) {
								setDocumentTitle(parsedResponse.title);
							}
						} else {
							setData(contentData);
						}
					} catch (error) {
						setData(contentData);
					}
					// Reset unsaved changes flag after loading
					setHasUnsavedChanges(false);
					justSavedOrLoaded.current = true;
				}
			} catch (error) {
				console.error('Error loading content from IPFS:', error);
				toast({
					title: "Error",
					description: "Failed to load content from IPFS.",
					variant: "destructive"
				});
			} finally {
				setIsLoadingContent(false);
			}
		};

		loadExistingPost();
	}, [cid, toast]);

	function togglePreview() {
		setIsPreviewMode(!isPreviewMode);
	}

	// Save content to IPFS
	const saveToAPI = useCallback(async () => {
		if (!address) {
			toast({
				title: "Error",
				description: "Please connect your wallet to save.",
				variant: "destructive"
			});
			return false;
		}

		const authenticated = await ensureAuthenticated();
		if (!authenticated) {
			toast({
				title: "Authentication Required",
				description: "Please authenticate with your wallet to save content.",
				variant: "destructive"
			});
			return false;
		}

		setIsSaving(true);
		try {
			// Get the latest data from the editor before saving
			let currentData = data;
			if (editorInstanceRef.current) {
				try {
					currentData = await editorInstanceRef.current.save();
				} catch (error) {
					console.error('Error getting data from editor:', error);
				}
			}
			
			if (cid) {
				// Update existing post
				const result = await updateFileById(cid, currentData, documentTitle, address, signMessageAsync);
				const newCid = result?.upload?.cid || result?.cid || result?.data?.cid;
				
				if (newCid) {
					toast({
						title: "Success",
						description: "Content updated successfully!",
					});
					navigate(`/app/editor/${newCid}`);
				}
			} else {
				// Create new post
				const timestamp = Math.floor(Date.now() / 1000);
				const salt = `I want to create a new file at timestamp - ${timestamp}`;
				const signature = await signMessageAsync({ 
					message: salt,
					account: address as `0x${string}`
				});
				
				const result = await createGroupPost(currentData, documentTitle, address, signature, salt);
				const newCid = result?.updatedUpload?.cid || result?.cid || result?.data?.cid;
				
				if (newCid) {
					toast({
						title: "Success",
						description: "Content saved successfully!",
					});
					navigate(`/app/editor/${newCid}`);
				}
			}
			
			setHasUnsavedChanges(false);
			justSavedOrLoaded.current = true;
			return true;
		} catch (error: any) {
			console.error('Error saving:', error);
			toast({
				title: "Error",
				description: error.message || "Failed to save content.",
				variant: "destructive"
			});
			return false;
		} finally {
			setIsSaving(false);
		}
	}, [address, signMessageAsync, ensureAuthenticated, cid, data, documentTitle, toast, navigate]);

	// Track changes when data updates
	useEffect(() => {
		// Don't mark as unsaved while loading from IPFS
		if (isLoadingContent) return;
		
		// If we just saved or loaded, skip marking as unsaved this time
		if (justSavedOrLoaded.current) {
			justSavedOrLoaded.current = false;
			return;
		}
		
		// Mark as unsaved when there are actual changes
		const hasContent = data?.blocks?.length || documentTitle;
		if (hasContent) {
			setHasUnsavedChanges(true);
		}
	}, [data, documentTitle, isLoadingContent]);

	// Check if editor is empty
	const isEmpty = !documentTitle.trim() && (!data?.blocks || data.blocks.length === 0);

	// Monitor transaction hash (transaction submitted to wallet)
	useEffect(() => {
		if (txHash && isPublishing) {
			toast({
				title: "Transaction Submitted",
				description: "Waiting for blockchain confirmation...",
			});
		}
	}, [txHash, isPublishing, toast]);

	// Monitor contract transaction confirmation
	useEffect(() => {
		if (isContractConfirmed && isPublishing) {
			setIsPublishing(false);
			toast({
				title: "Success",
				description: "Content published to blockchain successfully!",
			});
		}
	}, [isContractConfirmed, isPublishing, toast]);

	// Monitor contract transaction errors
	useEffect(() => {
		if (isContractError && isPublishing) {
			setIsPublishing(false);
			toast({
				title: "Transaction Failed",
				description: "The blockchain transaction failed. Please try again.",
				variant: "destructive"
			});
		}
	}, [isContractError, isPublishing, toast]);

	// Safety timeout - reset publishing state after 5 minutes if stuck
	useEffect(() => {
		if (isPublishing) {
			const timeout = setTimeout(() => {
				console.warn('Publishing timeout - resetting state');
				setIsPublishing(false);
				toast({
					title: "Timeout",
					description: "Publishing took too long. Please check your transaction and try again if needed.",
					variant: "destructive"
				});
			}, 5 * 60 * 1000); // 5 minutes

			return () => clearTimeout(timeout);
		}
	}, [isPublishing, toast]);

	// Publish with data from overlay (with thumbnail upload)
	const publishWithData = useCallback(async (publishData: PublishData) => {
		if (!address) {
			toast({
				title: "Error",
				description: "Please connect your wallet to publish.",
				variant: "destructive"
			});
			return false;
		}

		if (!cid) {
			toast({
				title: "Error",
				description: "Please save your content first before publishing.",
				variant: "destructive"
			});
			return false;
		}

		// Ensure user is authenticated before publishing
		const authenticated = await ensureAuthenticated();
		if (!authenticated) {
			toast({
				title: "Authentication Required",
				description: "Please authenticate with your wallet to publish content.",
				variant: "destructive"
			});
			return false;
		}

		setIsPublishing(true);
		try {
			const timestamp = Math.floor(Date.now() / 1000);
			
			// Convert price to wei (assuming 18 decimals for ETH)
			const priceInWei = (parseFloat(publishData.price || '0') * Math.pow(10, 18)).toString();
			
			// Step 1: Upload thumbnail image to get thumbnail CID
			let thumbnailCid = "";
			if (publishData.thumbnail) {
				try {
					toast({
						title: "Uploading Thumbnail",
						description: "Please sign the transaction to upload your thumbnail image...",
					});
					
					const result = await publishFile(publishData.thumbnail, address, signMessageAsync, cid);
					thumbnailCid = result.thumbnailCid;
					
					toast({
						title: "Thumbnail Uploaded",
						description: "Thumbnail uploaded successfully! Now publishing to blockchain...",
					});
					
				} catch (uploadError) {
					console.error('❌ Error uploading thumbnail:', uploadError);
					toast({
						title: "Upload Error",
						description: "Failed to upload thumbnail image. Please try again.",
						variant: "destructive"
					});
					setIsPublishing(false);
					return false;
				}
			}
			
			// Step 2: Call the smart contract to add the asset to blockchain
			try {
				await addAsset({
					salt: timestamp.toString(16),
					assetTitle: documentTitle,
					assetCid: cid,
					thumbnailCid: thumbnailCid,
					description: publishData.description || "",
					costInNative: priceInWei
				});
				
				// Close the overlay
				setShowPublishOverlay(false);
				
				// Transaction submitted - wait for confirmation via useEffect
				return true;
				
			} catch (contractError) {
				console.error('❌ Error calling addAsset contract:', contractError);
				toast({
					title: "Error",
					description: "Failed to publish to blockchain. Please try again.",
					variant: "destructive"
				});
				setIsPublishing(false);
				return false;
			}
			
		} catch (error: any) {
			console.error('Error publishing:', error);
			const errorMessage = error.message || "Failed to publish content.";
			toast({
				title: "Error",
				description: errorMessage,
				variant: "destructive"
			});
			setIsPublishing(false);
			return false;
		}
	}, [address, ensureAuthenticated, cid, documentTitle, toast, addAsset, signMessageAsync]);

	// Simple publish without overlay (no thumbnail/price/description) - kept for backward compatibility
	const publishToAPI = useCallback(async () => {
		// Just call publishWithData with empty values
		return await publishWithData({
			thumbnail: null,
			description: "",
			price: "0"
		});
	}, [publishWithData]);

	// Set editor props in context for TopHeader
	useEffect(() => {
		setEditorProps({
			onSave: saveToAPI,
			onPublish: publishToAPI,
			onPublishWithData: publishWithData,
			isSaving,
			isPublishing,
			isAuthenticated,
			hasUnsavedChanges,
			isEmpty,
			showPublishOverlay,
			setShowPublishOverlay,
		});
	}, [isSaving, isPublishing, isAuthenticated, hasUnsavedChanges, isEmpty, saveToAPI, publishToAPI, publishWithData, showPublishOverlay, setEditorProps]);

	return (
		<div className="bg-white dark:bg-gray-950 py-0 sm:py-8 px-0 sm:px-6 lg:px-8">
			<div className="max-w-5xl mx-auto w-full">
				{/* Card Container */}
				<div className="sm:bg-gray-50 sm:dark:bg-gray-800 sm:rounded-xl sm:shadow-lg overflow-hidden sm:border sm:border-gray-200 sm:dark:border-gray-700">
					<div className="px-4 py-4 sm:p-10 md:p-12 lg:p-16">
					{/* Title input */}
					<div className="mb-6">
						<input
							type="text"
							value={documentTitle}
							onChange={(e) => setDocumentTitle(e.target.value)}
							className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-transparent border-none outline-none w-full text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-0"
							placeholder="Give your post a title..."
							disabled={isPreviewMode}
						/>
					</div>

					{/* Tab Navigation */}
					<div className="mb-6">
						<nav className="flex justify-end items-center" aria-label="Tabs">
							{/* Edit/Preview Toggle */}
							<div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 shadow-sm">
								<button
									onClick={() => {
										if (isPreviewMode) {
											setIsPreviewMode(false);
										}
									}}
									className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
										!isPreviewMode
											? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
											: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
									}`}
								>
									<Edit3 className="w-4 h-4" />
									<span className="hidden sm:inline">Edit</span>
								</button>
								<button
									onClick={togglePreview}
									className={`flex items-center justify-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
										isPreviewMode
											? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
											: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
									}`}
								>
									<Eye className="w-4 h-4" />
									<span className="hidden sm:inline">Preview</span>
								</button>
							</div>
						</nav>
					</div>

				{/* Editor Content */}
				<div className="min-h-[500px] w-full">
					{isLoadingContent ? (
						<div className="flex items-center justify-center py-12">
							<div className="text-center">
								<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
								<p className="text-gray-600 dark:text-gray-400">Loading content...</p>
							</div>
						</div>
					) : isPreviewMode ? (
						<EditorTextParser data={data} />
					) : (
						<Editor 
							key={cid || 'new'} 
							data={data} 
							setData={setData}
							editorInstanceRef={editorInstanceRef}
						/>
					)}
				</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditorPage;