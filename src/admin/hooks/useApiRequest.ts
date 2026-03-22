import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE } from '../types';

interface UseApiRequestOptions {
  onAuthError?: () => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

interface ApiRequestState {
  loading: boolean;
  error: Error | null;
}

export function useApiRequest(options: UseApiRequestOptions = {}) {
  const [state, setState] = useState<ApiRequestState>({
    loading: false,
    error: null,
  });

  const execute = useCallback(async <T,>(
    url: string,
    requestOptions: RequestInit = {},
    customOptions?: Partial<UseApiRequestOptions>
  ): Promise<{ success: boolean; data?: T; message?: string }> => {
    const mergedOptions = { ...options, ...customOptions };
    
    setState({ loading: true, error: null });
    
    try {
      const response = await fetch(`${API_BASE}${url}`, requestOptions);
      
      // 处理认证错误
      if (response.status === 401 || response.status === 403) {
        mergedOptions.onAuthError?.();
        setState({ loading: false, error: new Error('Unauthorized') });
        return { success: false, message: '登录已过期' };
      }
      
      const data = await response.json();
      
      if (data.success) {
        if (mergedOptions.showSuccessToast !== false && mergedOptions.successMessage) {
          toast.success(mergedOptions.successMessage);
        }
        setState({ loading: false, error: null });
        return { success: true, data: data.data, message: data.message };
      } else {
        const message = data.message || mergedOptions.errorMessage || '操作失败';
        if (mergedOptions.showErrorToast !== false) {
          toast.error(message);
        }
        setState({ loading: false, error: new Error(message) });
        return { success: false, message };
      }
    } catch (err) {
      const message = mergedOptions.errorMessage || '请求失败';
      if (mergedOptions.showErrorToast !== false) {
        toast.error(message);
      }
      setState({ loading: false, error: err instanceof Error ? err : new Error(String(err)) });
      return { success: false, message };
    }
  }, [options]);

  return {
    ...state,
    execute,
  };
}

// 带 token 的 API 请求 hook
interface UseAuthApiRequestOptions extends UseApiRequestOptions {
  getToken: () => string | null;
}

export function useAuthApiRequest(options: UseAuthApiRequestOptions) {
  const { execute, ...state } = useApiRequest(options);

  const authExecute = useCallback(async <T,>(
    url: string,
    requestOptions: RequestInit = {},
    customOptions?: Partial<UseApiRequestOptions>
  ) => {
    const token = options.getToken();
    if (!token) {
      options.onAuthError?.();
      return { success: false, message: '未登录' };
    }

    const headers = {
      'Authorization': token,
      'Content-Type': 'application/json',
      ...requestOptions.headers,
    };

    return execute<T>(url, { ...requestOptions, headers }, customOptions);
  }, [execute, options]);

  return {
    ...state,
    execute: authExecute,
  };
}
