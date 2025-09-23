import { createContext, useContext, useState, ReactNode } from 'react';
import { PublishData } from '@/components/PublishOverlay';

interface EditorContextType {
  onSave?: () => void;
  onPublish?: () => void;
  onPublishWithData?: (publishData: PublishData) => void;
  isSaving: boolean;
  isPublishing: boolean;
  isAuthenticated: boolean;
  hasUnsavedChanges: boolean;
  isEmpty: boolean;
  showPublishOverlay: boolean;
  setShowPublishOverlay: (show: boolean) => void;
  setEditorProps: (props: {
    onSave?: () => void;
    onPublish?: () => void;
    onPublishWithData?: (publishData: PublishData) => void;
    isSaving: boolean;
    isPublishing: boolean;
    isAuthenticated: boolean;
    hasUnsavedChanges: boolean;
    isEmpty: boolean;
    showPublishOverlay: boolean;
    setShowPublishOverlay: (show: boolean) => void;
  }) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [editorProps, setEditorProps] = useState({
    onSave: undefined as (() => void) | undefined,
    onPublish: undefined as (() => void) | undefined,
    onPublishWithData: undefined as ((publishData: PublishData) => void) | undefined,
    isSaving: false,
    isPublishing: false,
    isAuthenticated: false,
    hasUnsavedChanges: false,
    isEmpty: true,
    showPublishOverlay: false,
    setShowPublishOverlay: (show: boolean) => {},
  });

  const setEditorPropsHandler = (props: {
    onSave?: () => void;
    onPublish?: () => void;
    onPublishWithData?: (publishData: PublishData) => void;
    isSaving: boolean;
    isPublishing: boolean;
    isAuthenticated: boolean;
    hasUnsavedChanges: boolean;
    isEmpty: boolean;
    showPublishOverlay: boolean;
    setShowPublishOverlay: (show: boolean) => void;
  }) => {
    setEditorProps(prev => ({
      ...prev,
      ...props
    }));
  };

  return (
    <EditorContext.Provider value={{
      ...editorProps,
      setEditorProps: setEditorPropsHandler,
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
