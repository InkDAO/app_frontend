import "../components/editor/Editor.css";
import { useState, useCallback, useEffect, useRef } from "react";
import { Edit3, Eye, BookOpen, ExternalLink, AlertTriangle, Save, Trash2, X } from 'lucide-react';
import Editor from "../components/editor/Editor";
import EditorTextParser from "../components/editor/EditorTextParser";
import { useAccount, useSignTypedData, usePublicClient } from 'wagmi';
import { createGroupPost, updateFileById, useAddAsset, publishFile } from '@/services/dXService';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEditor } from '@/context/EditorContext';
import { useSidebar } from '@/context/SidebarContext';
import { PublishData } from '@/components/PublishOverlay';
import PublishProgressModal, { PublishStep } from '@/components/PublishProgressModal';
import { clearAssetsCache } from '@/utils/cacheUtils';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { marketPlaceContract } from "@/contracts/marketPlace";

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
	const [showNavigationDialog, setShowNavigationDialog] = useState(false);
	const [editorKey, setEditorKey] = useState(0);
	const editorInstanceRef = useRef<any>(null);
	const titleTextareaRef = useRef<HTMLTextAreaElement>(null);
	const justSavedOrLoaded = useRef(false);
	const pendingNavigationRef = useRef<string | null>(null);
	const allowNavigationRef = useRef(false);
	
	// Get sidebar state for navbar positioning
	const { sidebarOpen, showSidebar } = useSidebar();
	
	// Publishing progress state
	const [publishStep, setPublishStep] = useState<PublishStep>('uploading');
	const [showProgressModal, setShowProgressModal] = useState(false);
	const [publishError, setPublishError] = useState<string>('');
	const [publishedAssetAddress, setPublishedAssetAddress] = useState<string>('');
	const [lastPublishData, setLastPublishData] = useState<PublishData | null>(null);
	const [uploadedThumbnailCid, setUploadedThumbnailCid] = useState<string>('');
	const [failedStep, setFailedStep] = useState<PublishStep | null>(null);
	
	const { address } = useAccount();
	const { signTypedDataAsync } = useSignTypedData();
	const publicClient = usePublicClient();
	const { cid } = useParams();
	const navigate = useNavigate();
	const location = useLocation();
	const { ensureAuthenticated, isAuthenticated } = useAuth();
	const { setEditorProps } = useEditor();
	const { addAsset, isPending: isContractPending, isConfirming: isContractConfirming, isConfirmed: isContractConfirmed, isError: isContractError, hash: txHash } = useAddAsset();

	// Load existing post content from IPFS when CID is present, or clear editor when no CID
	useEffect(() => {
		const loadExistingPost = async () => {
			if (!cid) {
				// Clear the editor when navigating to new post
				setData({ blocks: [] });
				setDocumentTitle('');
				setHasUnsavedChanges(false);
				justSavedOrLoaded.current = true;
				// Force remount of editor component by changing the key
				setEditorKey(prev => prev + 1);
				return;
			}
			
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
				// Redirect to new editor page after a short delay
				setTimeout(() => {
					navigate('/app/editor');
				}, 1500);
			} finally {
				setIsLoadingContent(false);
			}
		};

		loadExistingPost();
	}, [cid, navigate]);

	// Auto-adjust title textarea height when content changes
	useEffect(() => {
		if (titleTextareaRef.current) {
			titleTextareaRef.current.style.height = 'auto';
			titleTextareaRef.current.style.height = titleTextareaRef.current.scrollHeight + 'px';
		}
	}, [documentTitle]);

	async function togglePreview() {
		// If switching to preview mode, save the current editor state first
		if (!isPreviewMode && editorInstanceRef.current) {
			try {
				const currentData = await editorInstanceRef.current.save();
				setData(currentData);
			} catch (error) {
				console.error('Error getting data from editor:', error);
			}
		}
		setIsPreviewMode(!isPreviewMode);
	}

	// Save content to IPFS
	const saveToAPI = useCallback(async () => {
		if (!address) {
			return false;
		}

		const authenticated = await ensureAuthenticated();
		if (!authenticated) {
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
			const result = await updateFileById(cid, currentData, documentTitle, address, signTypedDataAsync);
			const newCid = result?.upload?.cid || result?.cid || result?.data?.cid;
			
			if (newCid) {
				navigate(`/app/editor/${newCid}`);
			}
		} else {
			// Create new post
			const result = await createGroupPost(currentData, documentTitle, address, signTypedDataAsync);
			const newCid = result?.updatedUpload?.cid || result?.cid || result?.data?.cid;
			
			if (newCid) {
				navigate(`/app/editor/${newCid}`);
			}
		}
			
			setHasUnsavedChanges(false);
			justSavedOrLoaded.current = true;
			return true;
		} catch (error: any) {
			console.error('Error saving:', error);
			return false;
		} finally {
			setIsSaving(false);
		}
	}, [address, signTypedDataAsync, ensureAuthenticated, cid, data, documentTitle, navigate]);

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

	// Prevent browser unload when there are unsaved changes
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (hasUnsavedChanges && !allowNavigationRef.current) {
				e.preventDefault();
				e.returnValue = '';
				return '';
			}
		};

		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	}, [hasUnsavedChanges]);

	// Intercept navigation by clicking links
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (!hasUnsavedChanges || allowNavigationRef.current) return;

			// Check if click is on a link or inside a link
			let target = e.target as HTMLElement;
			let link: HTMLAnchorElement | null = null;

			// Traverse up to find an anchor tag
			while (target && target !== document.body) {
				if (target.tagName === 'A') {
					link = target as HTMLAnchorElement;
					break;
				}
				target = target.parentElement as HTMLElement;
			}

			if (link && link.href) {
				const linkUrl = new URL(link.href);
				const currentUrl = new URL(window.location.href);

				// Only intercept same-origin navigations that change the path
				if (linkUrl.origin === currentUrl.origin && linkUrl.pathname !== currentUrl.pathname) {
					e.preventDefault();
					e.stopPropagation();
					pendingNavigationRef.current = linkUrl.pathname;
					setShowNavigationDialog(true);
				}
			}
		};

		document.addEventListener('click', handleClick, true);
		return () => document.removeEventListener('click', handleClick, true);
	}, [hasUnsavedChanges]);

	// Handle navigation dialog actions
	const handleSaveAndLeave = async () => {
		const saved = await saveToAPI();
		if (saved && pendingNavigationRef.current) {
			allowNavigationRef.current = true;
			setHasUnsavedChanges(false);
			navigate(pendingNavigationRef.current);
			setTimeout(() => {
				allowNavigationRef.current = false;
			}, 100);
			pendingNavigationRef.current = null;
		}
		setShowNavigationDialog(false);
	};

	const handleDiscardAndLeave = () => {
		if (pendingNavigationRef.current) {
			allowNavigationRef.current = true;
			setHasUnsavedChanges(false);
			navigate(pendingNavigationRef.current);
			setTimeout(() => {
				allowNavigationRef.current = false;
			}, 100);
			pendingNavigationRef.current = null;
		}
		setShowNavigationDialog(false);
	};

	const handleCancelNavigation = () => {
		pendingNavigationRef.current = null;
		setShowNavigationDialog(false);
	};

	// Check if editor is empty
	const isEmpty = !documentTitle.trim() && (!data?.blocks || data.blocks.length === 0);

	// Monitor transaction hash (transaction submitted to wallet)
	useEffect(() => {
		if (txHash && isPublishing && publishStep === 'signing') {
			setPublishStep('confirming');
		}
	}, [txHash, isPublishing, publishStep]);

	// Monitor contract transaction confirmation and extract asset address
	useEffect(() => {
		const handleConfirmation = async () => {
			
			if (isContractConfirmed && isPublishing && cid) {
				try {
					// Get the token ID from the postCidToTokenId mapping
					const tokenId = await publicClient?.readContract({
						address: marketPlaceContract.address as `0x${string}`,
						abi: marketPlaceContract.abi,
						functionName: 'postCidToTokenId',
						args: [cid],
					}) as bigint;

				if (tokenId && tokenId > 0n) {
					setPublishedAssetAddress(tokenId.toString());
					setPublishStep('completed');
					setIsPublishing(false);
					// Clear stored data on success
					setUploadedThumbnailCid('');
					setFailedStep(null);
					setLastPublishData(null);
					// Clear assets cache to show new post immediately
					clearAssetsCache();
				} else {
					setPublishStep('completed');
					setIsPublishing(false);
					setUploadedThumbnailCid('');
					setFailedStep(null);
					setLastPublishData(null);
					// Clear assets cache to show new post immediately
					clearAssetsCache();
				}
			} catch (error) {
				// Still show success even if we couldn't get the address
				setPublishStep('completed');
				setIsPublishing(false);
				// Clear stored data on success
				setUploadedThumbnailCid('');
				setFailedStep(null);
				setLastPublishData(null);
				// Clear assets cache to show new post immediately
				clearAssetsCache();
			}
			}
		};

		handleConfirmation();
	}, [isContractConfirmed, isPublishing, cid, publicClient, publishStep, txHash]);

	// Fallback: Manually check transaction receipt if stuck on confirming for too long
	useEffect(() => {
		if (!txHash || !isPublishing || publishStep !== 'confirming' || !publicClient) {
			return;
		}

		const checkReceipt = async () => {
			const receipt = await publicClient.getTransactionReceipt({ hash: txHash as `0x${string}` });
			
			if (receipt) {
				
				if (receipt.status === 'success') {
					
					if (cid) {
						try {
							const tokenId = await publicClient.readContract({
								address: marketPlaceContract.address as `0x${string}`,
								abi: marketPlaceContract.abi,
								functionName: 'postCidToTokenId',
								args: [cid],
							}) as bigint;

							if (tokenId && tokenId > 0n) {
								setPublishedAssetAddress(tokenId.toString());
							} else {
								console.warn('⚠️ Fallback: Token ID is 0 or undefined');
							}
						} catch (error) {
							console.warn('⚠️ Fallback: Could not fetch token ID:', error);
						}
					}

				setPublishStep('completed');
				setIsPublishing(false);
				setUploadedThumbnailCid('');
				setFailedStep(null);
				setLastPublishData(null);
				// Clear assets cache to show new post immediately
				clearAssetsCache();
			} else {
				console.error('❌ Fallback: Transaction failed on blockchain');
				setPublishStep('error');
				setFailedStep('confirming');
				setPublishError('Transaction failed on the blockchain.');
				setIsPublishing(false);
			}
			}
		};

		// Check immediately
		checkReceipt();

		// Then check every 3 seconds
		const interval = setInterval(checkReceipt, 3000);

		// Clean up after 5 minutes
		const timeout = setTimeout(() => {
			clearInterval(interval);
		}, 5 * 60 * 1000);

		return () => {
			clearInterval(interval);
			clearTimeout(timeout);
		};
	}, [txHash, isPublishing, publishStep, publicClient, cid]);

	// Monitor contract transaction errors
	useEffect(() => {
		if (isContractError && isPublishing) {
			setPublishStep('error');
			setFailedStep('confirming');
			setPublishError('The blockchain transaction failed. Please try again.');
			setIsPublishing(false);
		}
	}, [isContractError, isPublishing]);

	// Safety timeout - reset publishing state after 5 minutes if stuck
	useEffect(() => {
		if (isPublishing) {
			const timeout = setTimeout(() => {
				setPublishStep('error');
				setPublishError('Publishing took too long. Please check your transaction and try again if needed.');
				setIsPublishing(false);
			}, 5 * 60 * 1000); // 5 minutes

			return () => clearTimeout(timeout);
		}
	}, [isPublishing]);

	// Publish with data from overlay (with thumbnail upload)
	const publishWithData = useCallback(async (publishData: PublishData) => {
		if (!address) {
			return false;
		}

		if (!cid) {
			return false;
		}

		// Ensure user is authenticated before publishing
		const authenticated = await ensureAuthenticated();
		if (!authenticated) {
			return false;
		}

		// Store publish data for retry
		setLastPublishData(publishData);

		// Reset state and show progress modal
		setIsPublishing(true);
		setPublishStep('uploading');
		setPublishError('');
		setPublishedAssetAddress('');
		setShowProgressModal(true);
		setShowPublishOverlay(false);

		try {
			const timestamp = Math.floor(Date.now() / 1000);
			
			// Convert price to wei (assuming 18 decimals for ETH)
			const priceInWei = (parseFloat(publishData.price || '0') * Math.pow(10, 18)).toString();
			
		// Step 1: Upload thumbnail image to get thumbnail CID
		// Skip if we already have a thumbnail CID from a previous attempt
		let thumbnailCid = uploadedThumbnailCid;
		if (publishData.thumbnail && !thumbnailCid) {
			try {
				const result = await publishFile(publishData.thumbnail, address, signTypedDataAsync, cid, publishData.hashtags);
				thumbnailCid = result.thumbnailCid;
				// Store the thumbnail CID for potential retry
				setUploadedThumbnailCid(thumbnailCid);
			} catch (uploadError) {
				console.error('❌ Error uploading thumbnail:', uploadError);
				setPublishStep('error');
				setFailedStep('uploading');
				setPublishError('Failed to upload thumbnail image. Please try again.');
				setIsPublishing(false);
				return false;
			}
		}
			
			// Step 2: Call the smart contract to add the asset to blockchain
			try {
				setPublishStep('signing');
				
			// Generate unique salt combining timestamp, random value, and address
			// This prevents collisions even if publishing at the same time
			const randomValue = Math.floor(Math.random() * 1000000);
			const uniqueSalt = `${timestamp}${randomValue}${address?.slice(2, 10) || ''}`;
			
			await addAsset({
				salt: uniqueSalt,
				postTitle: documentTitle,
				postCid: cid,
				thumbnailCid: thumbnailCid,
				description: publishData.description || "",
				priceInNative: priceInWei
			});
				// Transaction submitted - wait for confirmation via useEffect
				return true;
				
		} catch (contractError: any) {
			console.error('❌ Error calling addAsset contract:', contractError);
			
			// Parse specific contract errors for better user feedback
			let errorMsg = 'Failed to publish to blockchain. Please try again.';
			
			if (contractError.message?.includes('user rejected')) {
				errorMsg = 'Transaction was rejected by user.';
			} else if (contractError.message?.includes('AssetAlreadyAdded')) {
				errorMsg = 'This content has already been published. Please try with different content.';
			} else if (contractError.message?.includes('EmptyAssetTitle')) {
				errorMsg = 'Asset title cannot be empty. Please add a title.';
			} else if (contractError.message?.includes('AssetTitleLengthTooBig')) {
				errorMsg = 'Asset title is too long. Please shorten your title.';
			} else if (contractError.message?.includes('DescriptionTooBig')) {
				errorMsg = 'Description is too long. Please shorten your description.';
			} else if (contractError.message?.includes('InvalidAssetCid')) {
				errorMsg = 'Invalid content CID. Please save your content first.';
			} else if (contractError.message?.includes('InvalidThumbnailCid')) {
				errorMsg = 'Invalid thumbnail CID. Please select a valid thumbnail image.';
			} else if (contractError.message?.includes('EnforcedPause')) {
				errorMsg = 'The contract is currently paused. Please try again later.';
			} else if (contractError.message?.includes('insufficient funds')) {
				errorMsg = 'Insufficient funds to pay for gas. Please add ETH to your wallet.';
			}
			
			setPublishStep('error');
			setFailedStep('signing');
			setPublishError(errorMsg);
			setIsPublishing(false);
			return false;
		}
			
		} catch (error: any) {
			console.error('Error publishing:', error);
			const errorMessage = error.message || "Failed to publish content.";
			setPublishStep('error');
			setPublishError(errorMessage);
			setIsPublishing(false);
			return false;
		}
	}, [address, ensureAuthenticated, cid, documentTitle, addAsset, signTypedDataAsync, uploadedThumbnailCid]);

	// Simple publish without overlay (no thumbnail/price/description) - kept for backward compatibility
	const publishToAPI = useCallback(async () => {
		// Just call publishWithData with empty values
		return await publishWithData({
			thumbnail: null,
			description: "",
			price: "0",
			hashtags: ""
		});
	}, [publishWithData]);

	// Close progress modal and reset state
	const handleCloseProgressModal = useCallback(() => {
		setShowProgressModal(false);
		setPublishStep('uploading');
		setPublishError('');
		setUploadedThumbnailCid('');
		setFailedStep(null);
		setLastPublishData(null);
	}, []);

	// Retry publishing with the last publish data
	const handleRetryPublish = useCallback(() => {
		if (lastPublishData) {
			setShowProgressModal(false);
			setPublishError('');
			
			// If thumbnail upload failed, reset the thumbnail CID to retry upload
			if (failedStep === 'uploading') {
				setUploadedThumbnailCid('');
				setPublishStep('uploading');
			} else {
				// If blockchain transaction failed, skip to signing step
				setPublishStep('signing');
			}
			
			// Retry with the stored publish data
			publishWithData(lastPublishData);
		}
	}, [lastPublishData, failedStep, publishWithData]);

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
		<div className="bg-white dark:bg-gray-950 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
			<div className="max-w-7xl mx-auto w-full">
				{/* Tutorial Banner */}
				<div className="mb-6 sm:mb-8 max-w-6xl mx-auto">
					<div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-950/40 dark:via-blue-950/40 dark:to-cyan-950/40 p-4 sm:p-6 lg:p-8 border-0 shadow-2xl dark:shadow-primary/10">
						{/* Animated Background Blobs */}
						<div className="absolute top-0 left-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-indigo-400/30 to-blue-400/30 rounded-full blur-3xl animate-pulse" />
						<div className="absolute bottom-0 right-0 w-64 h-64 sm:w-96 sm:h-96 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
						{/* Background Pattern */}
						<div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] dark:bg-grid-slate-400/5" />
						
						<div className="relative z-10">
							<div className="flex items-start gap-3 sm:gap-4">
								<div className="p-2.5 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-500 via-blue-600 to-cyan-600 shadow-lg sm:shadow-xl shadow-indigo-500/50 flex-shrink-0 transform hover:scale-105 transition-transform duration-300">
									<BookOpen className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
								</div>
								<div className="flex-1 min-w-0">
									<h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-extrabold tracking-tight mb-1.5 sm:mb-2 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-600 dark:from-indigo-300 dark:via-blue-300 dark:to-cyan-300 bg-clip-text text-transparent drop-shadow-sm">
										Create Your Post
									</h2>
									<p className="text-sm sm:text-base lg:text-lg xl:text-xl text-muted-foreground font-semibold mb-2 sm:mb-2.5">
										Write, format, and publish your content. <span className="text-foreground font-bold">Monetize your knowledge</span>
									</p>
									<div className="flex items-center gap-2 text-xs sm:text-sm lg:text-base text-muted-foreground/80 font-medium">
										{/* <span>Need help getting started?</span> */}
										<a 
											href="https://docs.inkdao.tech/tutorials/creating-first-post" 
											target="_blank" 
											rel="noopener noreferrer"
											className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold hover:underline transition-colors"
										>
											Read the tutorial
											<ExternalLink className="h-3 w-3 sm:h-4 sm:w-4" />
										</a>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

			{/* Modern Glassy Editor Container */}
			<div className="max-w-6xl mx-auto">
				{/* Glowing border effect */}
				<div className="relative group">
					<div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-500"></div>
					
					{/* Main Editor Card */}
					<div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-md rounded-3xl shadow-2xl dark:shadow-primary/10 border-0 overflow-hidden">
						{/* Subtle animated blobs */}
						<div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse pointer-events-none"></div>
						<div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none"></div>
						
						{/* Background Pattern */}
						<div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,white,transparent)] dark:bg-grid-slate-400/5 opacity-30 pointer-events-none"></div>
						
			{/* Content Container */}
			<div className="relative z-10 px-6 pt-6 pb-16 sm:px-12 sm:pt-8 sm:pb-20 lg:px-16 lg:pt-10 lg:pb-24 xl:px-20 xl:pb-28">
					{/* Title input */}
					<div className="mb-6 mt-8 sm:mt-12 md:mt-16">
						<textarea
							ref={titleTextareaRef}
							value={documentTitle}
							onChange={(e) => setDocumentTitle(e.target.value)}
							onInput={(e) => {
								e.currentTarget.style.height = 'auto';
								e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
							}}
							rows={1}
							className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-transparent border-none outline-none w-full text-foreground placeholder-muted-foreground focus:ring-0 resize-none overflow-hidden"
							placeholder="Give your post a title..."
							disabled={isPreviewMode}
						/>
				</div>

					{/* Editor/Preview Content */}
						<div className="min-h-[300px] sm:min-h-[500px] w-full">
							{isLoadingContent ? (
								<div className="flex items-center justify-center py-12">
									<div className="text-center">
										<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
										<p className="text-muted-foreground font-medium">Loading content...</p>
									</div>
								</div>
							) : isPreviewMode ? (
								<EditorTextParser data={data} />
							) : (
								<Editor 
									key={cid || `new-${editorKey}`} 
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
		</div>

	{/* Floating Navigation Bar - Modern Design */}
	<div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${showSidebar && sidebarOpen ? 'lg:left-[calc(50%+9rem)]' : ''}`}>
		<div className="relative">
			{/* Glow effect */}
			<div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl rounded-full animate-pulse"></div>
			
			{/* Main navbar container */}
			<div className="relative flex items-center gap-1 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 backdrop-blur-2xl rounded-full p-1 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-gray-200/50 dark:border-gray-700/50">
				<button
					onClick={() => {
						if (isPreviewMode) {
							setIsPreviewMode(false);
						}
					}}
					className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-sm transition-all duration-300 ${
						!isPreviewMode
							? 'text-white'
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
					}`}
				>
					{!isPreviewMode && (
						<span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 rounded-full shadow-lg shadow-blue-500/50 dark:shadow-blue-500/30 animate-gradient-x"></span>
					)}
					<Edit3 className={`relative z-10 w-4 h-4 transition-transform duration-200 ${!isPreviewMode ? 'scale-110' : ''}`} />
					<span className="relative z-10 hidden sm:inline">Edit</span>
				</button>
				
				<button
					onClick={togglePreview}
					className={`relative flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full font-medium text-sm transition-all duration-300 ${
						isPreviewMode
							? 'text-white'
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
					}`}
				>
					{isPreviewMode && (
						<span className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 rounded-full shadow-lg shadow-purple-500/50 dark:shadow-purple-500/30 animate-gradient-x"></span>
					)}
					<Eye className={`relative z-10 w-4 h-4 transition-transform duration-200 ${isPreviewMode ? 'scale-110' : ''}`} />
					<span className="relative z-10 hidden sm:inline">Preview</span>
				</button>
			</div>
		</div>
	</div>

	{/* Unsaved Changes Warning Dialog */}
		<AlertDialog open={showNavigationDialog} onOpenChange={setShowNavigationDialog}>
			<AlertDialogContent className="w-[calc(100vw-2rem)] max-w-[500px] max-h-[90vh] overflow-y-auto">
				{/* Close button */}
				<button
					onClick={handleCancelNavigation}
					className="absolute right-4 top-4 z-20 rounded-lg p-1.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all shadow-sm hover:shadow-md border border-border/30"
				>
					<X className="h-4 w-4 text-foreground" />
				</button>

				{/* Decorative blobs */}
				<div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/20 to-orange-400/20 rounded-full blur-3xl pointer-events-none"></div>
				<div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-red-400/10 to-pink-400/10 rounded-full blur-3xl pointer-events-none"></div>
				
				<AlertDialogHeader className="relative z-10 pr-8">
					<div className="flex items-center gap-3 mb-2">
						<div className="p-2 sm:p-2.5 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/40 dark:to-orange-900/40 backdrop-blur-sm shadow-lg flex-shrink-0">
							<AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 dark:text-amber-400" />
						</div>
						<AlertDialogTitle className="text-left text-lg sm:text-xl">Unsaved Changes</AlertDialogTitle>
					</div>
					<AlertDialogDescription className="text-left text-sm">
						You have unsaved changes. What would you like to do?
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="relative z-10 flex-col sm:flex-row gap-2 pt-4">
					<AlertDialogAction
						onClick={handleDiscardAndLeave}
						className="w-full sm:w-auto bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold shadow-lg hover:shadow-xl transition-all px-3 sm:px-4 py-2 text-sm sm:text-base"
					>
						<Trash2 className="h-4 w-4 mr-1.5 flex-shrink-0" />
						<span className="whitespace-nowrap">Discard</span>
					</AlertDialogAction>
					<AlertDialogAction
						onClick={handleSaveAndLeave}
						disabled={isSaving}
						className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-lg hover:shadow-xl transition-all px-3 sm:px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
					>
						<Save className="h-4 w-4 mr-1.5 flex-shrink-0" />
						<span className="whitespace-nowrap">{isSaving ? 'Saving...' : 'Save & Leave'}</span>
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>

		{/* Publish Progress Modal */}
		<PublishProgressModal
			isOpen={showProgressModal}
			currentStep={publishStep}
			txHash={txHash}
			error={publishError}
			onClose={handleCloseProgressModal}
			onRetry={handleRetryPublish}
			assetAddress={publishedAssetAddress}
		/>
		</div>
	);
};

export default EditorPage;