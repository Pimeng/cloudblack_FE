import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { ImageViewer } from '@/components/ImageViewer';

interface ImageViewerContextType {
  openImage: (src: string) => void;
  closeImage: () => void;
}

const ImageViewerContext = createContext<ImageViewerContextType | null>(null);

export function ImageViewerProvider({ children }: { children: ReactNode }) {
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  const openImage = useCallback((src: string) => {
    setViewerImage(src);
  }, []);

  const closeImage = useCallback(() => {
    setViewerImage(null);
  }, []);

  return (
    <ImageViewerContext.Provider value={{ openImage, closeImage }}>
      {children}
      <ImageViewer
        src={viewerImage || ''}
        isOpen={!!viewerImage}
        onClose={closeImage}
      />
    </ImageViewerContext.Provider>
  );
}

export function useImageViewer() {
  const context = useContext(ImageViewerContext);
  if (!context) {
    throw new Error('useImageViewer must be used within ImageViewerProvider');
  }
  return context;
}
