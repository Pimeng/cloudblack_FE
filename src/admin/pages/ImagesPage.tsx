import { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext, useNavigate, useLocation } from 'react-router-dom';
import { useUrlState, useUrlStateNumber } from '../hooks';
import { cn } from '@/lib/utils';
import {
  Image,
  RefreshCw,
  Upload,
  Trash2,
  FolderOpen,
  Search,
  X,
  FileImage,
  Folder,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { AdminDataContext } from '../hooks/useAdminData';
import { API_BASE } from '../types';
import { toast } from 'sonner';
import {
  LoadingSpinner,
  EmptyState,
  AdminDialogContent,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  LoadingButton,
  PageHeader,
  ConfirmDialog,
  SelectPagination,
} from '../components';
import { DialogContent } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApiMutation } from '../hooks';

interface ImageItem {
  filename: string;
  path: string;
  size: number;
  created_at: string;
  modified_at: string;
}

interface Subfolder {
  name: string;
  file_count: number;
}

export function ImagesPage() {
  const { token, adminLevel } = useOutletContext<AdminDataContext>();
  const navigate = useNavigate();
  const location = useLocation();

  // Permissions - 等级3+可以查看和操作
  const canUploadImage = adminLevel >= 3;
  const canDeleteImage = adminLevel >= 3;

  // State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);
  
  // 从 URL 获取状态
  const [page, setPage] = useUrlStateNumber('page', 1);
  const [perPage, setPerPage] = useUrlStateNumber('per_page', 20);
  const [subfolder, setSubfolder] = useUrlState<string>('folder', 'appeals');
  const [search, setSearch] = useState('');

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingImage, setDeletingImage] = useState<ImageItem | null>(null);
  const [uploadLoading, _setUploadLoading] = useState(false);
  
  // API mutations
  const { mutate: deleteMutate, loading: deleteLoading } = useApiMutation(token, {
    successMessage: '文件已删除',
  });

  const fetchImages = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        subfolder,
      });
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`${API_BASE}/api/admin/images?${params}`, {
        headers: { 'Authorization': token },
      });

      if (response.status === 401 || response.status === 403) {
        toast.error('登录已过期，请重新登录');
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_info');
        // 记录当前页面路径到 goto 参数，登录后可以返回
        const currentPath = location.pathname + location.search;
        navigate(`/admin?goto=${encodeURIComponent(currentPath)}`);
        return;
      }

      const data = await response.json();
      if (data.success) {
        setImages(data.data.items);
        setTotal(data.data.total);
        setPage(data.data.page);
        setPages(data.data.pages);
      } else {
        toast.error(data.message || '获取图片列表失败');
      }
    } catch (err) {
      toast.error('获取图片列表失败');
    } finally {
      setLoading(false);
    }
  }, [token, page, perPage, subfolder, search]);

  const fetchSubfolders = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/api/admin/images/subdirectories`, {
        headers: { 'Authorization': token },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSubfolders(data.data.subfolders);
        }
      }
    } catch (err) {
      console.error('获取子目录列表失败:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchImages();
      fetchSubfolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, perPage, subfolder]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (token) {
        setPage(1);
        fetchImages();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // 验证文件
  const validateFile = (file: File): boolean => {
    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('不支持的文件类型，请上传 png, jpg, jpeg, gif 或 webp 格式的图片');
      return false;
    }
    // Validate file size (3MB)
    if (file.size > 3 * 1024 * 1024) {
      toast.error('文件大小超过 3MB 限制');
      return false;
    }
    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && validateFile(file)) {
      setUploadFile(file);
    }
  };

  // 拖放事件处理
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
    // 设置 dropEffect 以指示这是复制操作
    e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setUploadFile(file);
      }
    }
  }, []);

  const uploadImage = async () => {
    if (!uploadFile) return;

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('subfolder', subfolder);

    // Custom fetch for FormData (multipart/form-data)
    try {
      const response = await fetch(`${API_BASE}/api/admin/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': token || '',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        toast.success(data.existing ? '文件已存在' : '上传成功');
        setUploadDialogOpen(false);
        setUploadFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchImages();
        fetchSubfolders();
      } else {
        toast.error(data.message || '上传失败');
      }
    } catch (err) {
      toast.error('上传失败');
    }
  };

  const deleteImage = async () => {
    if (!deletingImage) return;

    const params = new URLSearchParams();
    params.append('path', deletingImage.path);
    const result = await deleteMutate(
      `/api/admin/images?${params}`,
      { method: 'DELETE' }
    );
    
    if (result) {
      setDeleteDialogOpen(false);
      setDeletingImage(null);
      fetchImages();
      fetchSubfolders();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getImageUrl = (path: string): string => {
    return `${API_BASE}/uploads/${path}`;
  };

  const handleSubfolderChange = (value: string) => {
    setSubfolder(value);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="图片管理" description="管理上传的图片文件">
        <div className="flex flex-wrap gap-2">
          {canUploadImage && (
            <Button
              onClick={() => setUploadDialogOpen(true)}
              className="bg-brand hover:bg-brand-dark"
            >
              <Upload className="w-4 h-4 mr-2" />
              上传图片
            </Button>
          )}
          <Button onClick={() => { fetchImages(); fetchSubfolders(); }} variant="outline" size="icon">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-muted-foreground" />
            <Select value={subfolder} onValueChange={handleSubfolderChange}>
              <SelectTrigger className="w-[180px] bg-muted border-border">
                <SelectValue placeholder="选择目录" />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border">
                {subfolders.map((sf) => (
                  <SelectItem key={sf.name} value={sf.name}>
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4" />
                      {sf.name} ({sf.file_count})
                    </div>
                  </SelectItem>
                ))}
                {subfolders.length === 0 && (
                  <SelectItem value="appeals">appeals</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文件名..."
              className="pl-10 bg-muted border-border"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground">
            共 {total} 个文件
          </div>
        </div>
      </div>

      {/* Images Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : images.length === 0 ? (
        <EmptyState icon={Image} description="暂无图片文件" />
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {images.map((image) => (
              <div
                key={image.path}
                className="group glass rounded-xl overflow-hidden hover:border-brand/50 transition-colors"
              >
                <div
                  className="aspect-square bg-muted/50 cursor-pointer relative overflow-hidden"
                  onClick={() => setPreviewImage(image)}
                >
                  <img
                    src={getImageUrl(image.path)}
                    alt={image.filename}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '';
                      (e.target as HTMLImageElement).style.display = 'none';
                      (e.target as HTMLImageElement).parentElement?.classList.add('flex', 'items-center', 'justify-center');
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      (e.target as HTMLImageElement).parentElement?.appendChild(icon.firstChild!);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="w-8 h-8 text-foreground" />
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-foreground/80 truncate" title={image.filename}>
                    {image.filename}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs bg-muted">
                      {formatFileSize(image.size)}
                    </Badge>
                    {canDeleteImage && (
                      <Button
                        onClick={() => { setDeletingImage(image); setDeleteDialogOpen(true); }}
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <SelectPagination
            page={page}
            totalPages={pages}
            onPageChange={(newPage) => setPage(newPage)}
            perPage={perPage}
            onPerPageChange={(newPerPage) => { setPerPage(newPerPage); setPage(1); }}
            className="pt-4"
          />
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>上传图片</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              上传图片到 {subfolder} 目录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-foreground/80">选择文件</label>
              <div
                ref={dropZoneRef}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                  isDragOver
                    ? "border-brand bg-brand/10 scale-[1.02]"
                    : "border-border hover:border-border hover:bg-muted/50"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  {uploadFile ? (
                    <>
                      <FileImage className="w-12 h-12 text-brand" />
                      <p className="text-foreground font-medium">{uploadFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(uploadFile.size)}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault();
                          setUploadFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                      >
                        重新选择
                      </Button>
                    </>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-muted-foreground" />
                      <p className="text-foreground/80">点击选择图片或拖拽到此处</p>
                      <p className="text-xs text-muted-foreground">
                        支持 png, jpg, jpeg, gif, webp，最大 3MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-foreground/80">目标目录</label>
              <Select value={subfolder} onValueChange={setSubfolder}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border">
                  {subfolders.map((sf) => (
                    <SelectItem key={sf.name} value={sf.name}>
                      {sf.name}
                    </SelectItem>
                  ))}
                  {subfolders.length === 0 && (
                    <SelectItem value="appeals">appeals</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              取消
            </Button>
            <LoadingButton
              onClick={uploadImage}
              loading={uploadLoading}
              disabled={!uploadFile}
              icon={Upload}
              className="bg-brand hover:bg-brand-dark"
            >
              上传
            </LoadingButton>
          </DialogFooter>
        </AdminDialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除图片"
        description={
          deletingImage && (
            <div className="space-y-2">
              <p>确定要删除以下图片吗？此操作不可恢复。</p>
              <p className="font-mono text-sm bg-muted p-2 rounded">
                {deletingImage.filename}
              </p>
            </div>
          )
        }
        onConfirm={deleteImage}
        loading={deleteLoading}
        icon={Trash2}
        confirmText="确认删除"
      />

      {/* Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl w-[calc(100%-2rem)] bg-card border-border p-0 overflow-hidden">
          <div className="relative">
            {previewImage && (
              <img
                src={getImageUrl(previewImage.path)}
                alt={previewImage.filename}
                className="w-full max-h-[70vh] object-contain bg-black"
              />
            )}

          </div>
          {previewImage && (
            <div className="p-4 space-y-2">
              <p className="text-foreground font-medium truncate">{previewImage.filename}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>大小: {formatFileSize(previewImage.size)}</span>
                <span>创建于: {previewImage.created_at}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getImageUrl(previewImage.path), '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  在新窗口打开
                </Button>
                {canDeleteImage && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500 hover:text-red-400"
                    onClick={() => {
                      setPreviewImage(null);
                      setDeletingImage(previewImage);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    删除
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
