import { createContext, useContext, useState, ReactNode } from 'react';

interface EditorContextType {
  onSave?: () => void;
  onPublish?: () => void;
  isSaving: boolean;
  isPublishing: boolean;
  isAuthenticated: boolean;
  hasUnsavedChanges: boolean;
  setEditorProps: (props: {
    onSave?: () => void;
    onPublish?: () => void;
    isSaving: boolean;
    isPublishing: boolean;
    isAuthenticated: boolean;
    hasUnsavedChanges: boolean;
  }) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider = ({ children }: { children: ReactNode }) => {
  const [editorProps, setEditorProps] = useState({
    onSave: undefined as (() => void) | undefined,
    onPublish: undefined as (() => void) | undefined,
    isSaving: false,
    isPublishing: false,
    isAuthenticated: false,
    hasUnsavedChanges: false,
  });

  const setEditorPropsHandler = (props: {
    onSave?: () => void;
    onPublish?: () => void;
    isSaving: boolean;
    isPublishing: boolean;
    isAuthenticated: boolean;
    hasUnsavedChanges: boolean;
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
