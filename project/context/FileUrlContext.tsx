import { createContext, useContext, useState, ReactNode } from "react";

const initialFileUrl = '';

export const FileUrlContext = createContext<{
  fileUrl: string;
  setFileUrl: (url: string) => void;
}>({
  fileUrl: initialFileUrl,
  setFileUrl: () => {} // No-op function for default context
});

export const FileUrlProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fileUrl, setFileUrl] = useState<string>(initialFileUrl);

  return (
    <FileUrlContext.Provider value={{ fileUrl, setFileUrl }}>
      {children}
    </FileUrlContext.Provider>
  );
};

export const useFileUrl = () => useContext(FileUrlContext);
