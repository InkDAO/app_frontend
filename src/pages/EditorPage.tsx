import "../components/editor/Editor.css";
import { useState, useCallback, useEffect } from "react";
import { Edit3, Eye } from 'lucide-react';
import Editor from "../components/editor/Editor";
import EditorTextParser from "../components/editor/EditorTextParser";
import { useAccount, useSignMessage } from 'wagmi';
import { createGroupPost, updateFileById } from '@/services/dXService';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useEditor } from '@/context/EditorContext';

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
	
	const { address } = useAccount();
	const { signMessageAsync } = useSignMessage();
	const { toast } = useToast();
	const { cid } = useParams();
	const navigate = useNavigate();
	const { ensureAuthenticated, isAuthenticated } = useAuth();
	const { setEditorProps } = useEditor();

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
			if (cid) {
				// Update existing post
				const result = await updateFileById(cid, data, documentTitle, address, signMessageAsync);
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
				
				const result = await createGroupPost(data, documentTitle, address, signature, salt);
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

	// Publish content
	const publishToAPI = useCallback(async () => {
		if (!cid) {
			toast({
				title: "Error",
				description: "Please save your content first before publishing.",
				variant: "destructive"
			});
			return false;
		}

		setIsPublishing(true);
		toast({
			title: "Publishing",
			description: "Publishing content to blockchain...",
		});
		
		// Simulate publishing - replace with actual implementation
		setTimeout(() => {
			setIsPublishing(false);
			toast({
				title: "Success",
				description: "Content published successfully!",
			});
		}, 2000);
		
		return true;
	}, [cid, toast]);

	// Track changes when data updates
	useEffect(() => {
		setHasUnsavedChanges(true);
	}, [data, documentTitle]);

	// Check if editor is empty
	const isEmpty = !documentTitle.trim() && (!data?.blocks || data.blocks.length === 0);

	// Set editor props in context for TopHeader
	useEffect(() => {
		setEditorProps({
			onSave: saveToAPI,
			onPublish: publishToAPI,
			isSaving,
			isPublishing,
			isAuthenticated,
			hasUnsavedChanges,
			isEmpty,
			showPublishOverlay: false,
			setShowPublishOverlay: () => {},
		});
	}, [isSaving, isPublishing, isAuthenticated, hasUnsavedChanges, isEmpty, saveToAPI, publishToAPI, setEditorProps]);

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
						{isPreviewMode ? (
							<EditorTextParser data={data} />
						) : (
							<Editor data={data} setData={setData} />
						)}
					</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default EditorPage;