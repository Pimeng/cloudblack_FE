import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Image as ImageIcon, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

// 待上传的图片文件
export interface PendingImage {
  file: File;
  preview: string;
}

interface ImageUploadDropzoneProps {
  images: PendingImage[];
  onImagesChange: (images: PendingImage[]) => void;
  maxImages?: number;
  maxSizeMB?: number;
  onError?: (message: string) => void;
  onImageClick?: (src: string, index: number) => void;
  className?: string;
}

export function ImageUploadDropzone({
  images,
  onImagesChange,
  maxImages = 3,
  maxSizeMB = 3,
  onError,
  onImageClick,
  className,
}: ImageUploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 验证文件
  const validateFiles = useCallback((files: FileList | null): File[] => {
    if (!files || files.length === 0) return [];

    const validFiles: File[] = [];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 检查文件类型
      if (!allowedTypes.includes(file.type)) {
        onError?.(`不支持的文件类型: ${file.name}，请上传 png, jpg, jpeg, gif 或 webp 格式的图片`);
        continue;
      }

      // 检查文件大小
      if (file.size > maxSizeMB * 1024 * 1024) {
        onError?.(`图片 ${file.name} 大小超过 ${maxSizeMB}MB 限制`);
        continue;
      }

      validFiles.push(file);
    }

    return validFiles;
  }, [maxSizeMB, onError]);

  // 添加图片
  const addImages = useCallback((files: File[]) => {
    if (files.length === 0) return;

    const remainingSlots = maxImages - images.length;
    if (remainingSlots <= 0) {
      onError?.(`最多只能上传 ${maxImages} 张图片`);
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      onError?.(`最多只能上传 ${maxImages} 张图片，已自动过滤多余图片`);
    }

    const newImages: PendingImage[] = filesToAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    onImagesChange([...images, ...newImages]);
  }, [images, maxImages, onImagesChange]);

  // 移除图片
  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    URL.revokeObjectURL(images[index].preview);
    onImagesChange(newImages);
  }, [images, onImagesChange]);

  // 清理所有预览 URL（组件卸载时）
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview));
    };
  }, []);

  // 文件选择处理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = validateFiles(e.target.files);
    addImages(files);
    // 清空 input 以便可以再次选择相同文件
    e.target.value = '';
  };

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 确保是真正离开 drop zone，而不是进入子元素
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = validateFiles(e.dataTransfer.files);
    addImages(files);
  }, [validateFiles, addImages]);

  // 粘贴上传处理
  const handlePaste = useCallback((e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 检查剪贴板中是否有图片
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          imageFiles.push(file);
        }
      }
    }

    // 如果有图片，阻止默认行为并上传
    if (imageFiles.length > 0) {
      e.preventDefault();
      const validFiles = validateFiles(imageFiles as unknown as FileList);
      addImages(validFiles);
    }
    // 如果没有图片（如粘贴的是文本），不阻止默认行为，让输入框正常处理
  }, [validateFiles, addImages]);

  // 添加粘贴事件监听
  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  // 点击上传区域时触发文件选择
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* 已上传图片预览 */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((img, index) => (
            <div
              key={index}
              className="relative w-14 h-14 rounded-lg overflow-hidden group cursor-pointer"
              onClick={() => onImageClick?.(img.preview, index)}
            >
              <img
                src={img.preview}
                alt={`待上传图片 ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* 拖拽上传区域 */}
      {images.length < maxImages && (
        <div
          ref={dropZoneRef}
          onClick={handleClick}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className={cn(
            "relative border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200",
            isDragOver
              ? "border-brand bg-brand/10 scale-[1.02]"
              : "border-border/50 hover:border-brand/50 hover:bg-brand/5"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="flex flex-col items-center gap-1.5">
            {isDragOver ? (
              <Upload className="w-6 h-6 text-brand" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground" />
            )}
            <p className="text-sm text-foreground/80">
              {isDragOver ? '释放以上传图片' : '点击选择、拖拽或粘贴图片'}
            </p>
            <p className="text-xs text-muted-foreground">
              支持格式：PNG、JPG、GIF、WebP | 单张最大 {maxSizeMB}MB | 最多 {maxImages} 张
            </p>
            {images.length === 0 && (
              <p className="text-xs text-yellow-500 mt-1">
                ⚠️ 请至少上传 1 张图片作为证明
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
