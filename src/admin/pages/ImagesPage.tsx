import { useEffect, useState, useRef, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Image,
  RefreshCw,
  Upload,
  Trash2,
  FolderOpen,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
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
} from '../components';
import { DialogContent } from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  // Permissions - 等级3+可以查看和操作
  const canUploadImage = adminLevel >= 3;
  const canDeleteImage = adminLevel >= 3;

  // State
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [subfolder, setSubfolder] = useState('appeals');
  const [search, setSearch] = useState('');
  const [subfolders, setSubfolders] = useState<Subfolder[]>([]);
  const [previewImage, setPreviewImage] = useState<ImageItem | null>(null);

  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingImage, setDeletingImage] = useState<ImageItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      const response = await fetch(`${API_BASE}/api/admin/images/subfolders`, {
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('不支持的文件类型，请上传 png, jpg, jpeg, gif 或 webp 格式的图片');
        return;
      }
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('文件大小超过 5MB 限制');
        return;
      }
      setUploadFile(file);
    }
  };

  const uploadImage = async () => {
    if (!uploadFile || !token) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadFile);
      formData.append('subfolder', subfolder);

      const response = await fetch(`${API_BASE}/api/admin/images`, {
        method: 'POST',
        headers: {
          'Authorization': token,
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
    } finally {
      setUploadLoading(false);
    }
  };

  const deleteImage = async () => {
    if (!deletingImage || !token) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/images/${encodeURIComponent(deletingImage.path)}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': token },
        }
      );

      const data = await response.json();
      if (data.success) {
        toast.success('文件已删除');
        setDeleteDialogOpen(false);
        setDeletingImage(null);
        fetchImages();
        fetchSubfolders();
      } else {
        toast.error(data.message || '删除失败');
      }
    } catch (err) {
      toast.error('删除失败');
    } finally {
      setDeleteLoading(false);
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
            <FolderOpen className="w-4 h-4 text-slate-400" />
            <Select value={subfolder} onValueChange={handleSubfolderChange}>
              <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700">
                <SelectValue placeholder="选择目录" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文件名..."
              className="pl-10 bg-slate-800 border-slate-700"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-slate-400">
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
                  className="aspect-square bg-slate-800/50 cursor-pointer relative overflow-hidden"
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
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="text-slate-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                      (e.target as HTMLImageElement).parentElement?.appendChild(icon.firstChild!);
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Eye className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <p className="text-xs text-slate-300 truncate" title={image.filename}>
                    {image.filename}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs bg-slate-800">
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
          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                variant="outline"
                size="sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-slate-400">
                {page} / {pages}
              </span>
              <Button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page >= pages}
                variant="outline"
                size="sm"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Select
                value={perPage.toString()}
                onValueChange={(v) => { setPerPage(parseInt(v)); setPage(1); }}
              >
                <SelectTrigger className="w-[100px] bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="10">10/页</SelectItem>
                  <SelectItem value="20">20/页</SelectItem>
                  <SelectItem value="50">50/页</SelectItem>
                  <SelectItem value="100">100/页</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <AdminDialogContent>
          <DialogHeader>
            <DialogTitle>上传图片</DialogTitle>
            <DialogDescription className="text-slate-400">
              上传图片到 {subfolder} 目录
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm text-slate-300">选择文件</label>
              <div className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center hover:border-slate-600 transition-colors">
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
                      <p className="text-white font-medium">{uploadFile.name}</p>
                      <p className="text-sm text-slate-400">
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
                      <Upload className="w-12 h-12 text-slate-500" />
                      <p className="text-slate-300">点击选择图片或拖拽到此处</p>
                      <p className="text-xs text-slate-500">
                        支持 png, jpg, jpeg, gif, webp，最大 5MB
                      </p>
                    </>
                  )}
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-slate-300">目标目录</label>
              <Select value={subfolder} onValueChange={setSubfolder}>
                <SelectTrigger className="bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
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
              <p className="font-mono text-sm bg-slate-800 p-2 rounded">
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
        <DialogContent className="max-w-4xl w-[calc(100%-2rem)] bg-slate-900 border-slate-800 p-0 overflow-hidden">
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
              <p className="text-white font-medium truncate">{previewImage.filename}</p>
              <div className="flex items-center gap-4 text-sm text-slate-400">
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
