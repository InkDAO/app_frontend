import "../components/editor/Editor.css";
import { useState } from "react";
import { Edit3, Eye } from 'lucide-react';
import Editor from "../components/editor/Editor";
import EditorTextParser from "../components/editor/editorTextParser";
import exampleData from "../components/editor/ExampleData";

const EditorPage1 = () => {
	const [isPreviewMode, setIsPreviewMode] = useState(false);
	const [data, setData] = useState(exampleData);
	const [documentTitle, setDocumentTitle] = useState('Editor.js Demo');

	function togglePreview() {
		setIsPreviewMode(!isPreviewMode);
	}

	return (
		<div className="EditorPage1">
			<div className="editor-page-1-content">
				{/* Title input */}
				<div className="pt-6 pb-4">
					<div className="flex items-center justify-between mb-6">
						<input
							type="text"
							value={documentTitle}
							onChange={(e) => setDocumentTitle(e.target.value)}
							className="text-3xl sm:text-4xl md:text-5xl font-bold bg-transparent border-none outline-none flex-1 text-gray-900 dark:text-gray-100 placeholder-gray-400"
							placeholder="Untitled"
							disabled={isPreviewMode}
						/>
					</div>
				</div>

				{/* Tab Navigation */}
				<div className="mb-2">
					<nav className="flex justify-end items-center" aria-label="Tabs">
						<div className="flex items-center bg-gray-100 dark:bg-gray-900 rounded-lg p-1 shadow-sm">
						<button
							onClick={() => {
								if (isPreviewMode) {
									setIsPreviewMode(false);
								}
							}}
							className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
								!isPreviewMode
									? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
									: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
							}`}
						>
							<Edit3 className="w-3 h-3 sm:w-4 sm:h-4" />
							<span>Edit</span>
						</button>
						<button
							onClick={togglePreview}
							className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-md transition-all duration-200 ${
								isPreviewMode
									? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-600'
									: 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-700/50'
							}`}
						>
							<Eye className="w-3 h-3 sm:w-4 sm:h-4" />
							<span>Preview</span>
						</button>
					</div>
				</nav>
			</div>

				<div className="tab-content">
					{isPreviewMode ? (
						<EditorTextParser data={data} />
					) : (
						<Editor data={data} setData={setData} />
					)}
				</div>
			</div>
		</div>
	);
};

export default EditorPage1;