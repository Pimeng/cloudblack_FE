import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { API_BASE } from '../types';

interface UseApiMutationOptions<T = unknown> {
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

interface UseApiMutationReturn<T = unknown, V = unknown> {
  mutate: (url: string, options?: RequestInit, body?: V) => Promise<T | null>;
  loading: boolean;
  error: string | null;
  reset: () => void;
}

export function useApiMutation<T = unknown, V = unknown>(
  token: string | null | undefined,
  options: UseApiMutationOptions<T> = {}
): UseApiMutationReturn<T, V> {
  const {
    onSuccess,
    onError,
    successMessage,
    errorMessage = '操作失败',
    showSuccessToast = true,
    showErrorToast = true,
  } = options;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (url: string, requestOptions: RequestInit = {}, body?: V): Promise<T | null> => {
      if (!token) {
        const err = '未登录';
        setError(err);
        if (showErrorToast) toast.error(err);
        return null;
      }

      setLoading(true);
      setError(null);

      try {
        const isFormData = body instanceof FormData;
        const headers: Record<string, string> = {
          Authorization: token,
          ...(body && !isFormData && { 'Content-Type': 'application/json' }),
          ...((requestOptions.headers as Record<string, string>) || {}),
        };

        const response = await fetch(`${API_BASE}${url}`, {
          ...requestOptions,
          headers,
          body: body ? (isFormData ? body : JSON.stringify(body)) : requestOptions.body,
        });

        const data = await response.json();

        if (data.success) {
          if (showSuccessToast && successMessage) {
            toast.success(successMessage);
          }
          onSuccess?.(data.data);
          return data.data;
        } else {
          const errMsg = data.message || errorMessage;
          setError(errMsg);
          if (showErrorToast) toast.error(errMsg);
          onError?.(errMsg);
          return null;
        }
      } catch (err) {
        const errMsg = errorMessage;
        setError(errMsg);
        if (showErrorToast) toast.error(errMsg);
        onError?.(errMsg);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, onSuccess, onError, successMessage, errorMessage, showSuccessToast, showErrorToast]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { mutate, loading, error, reset };
}

// 专用 mutation hooks

export function useCreateMutation<T = unknown, V = unknown>(
  token: string | null | undefined,
  options: UseApiMutationOptions<T> = {}
) {
  const { mutate, loading, error, reset } = useApiMutation<T, V>(token, {
    ...options,
    successMessage: options.successMessage || '创建成功',
  });

  const create = useCallback(
    (url: string, body: V) => mutate(url, { method: 'POST' }, body),
    [mutate]
  );

  return { create, loading, error, reset };
}

export function useUpdateMutation<T = unknown, V = unknown>(
  token: string | null | undefined,
  options: UseApiMutationOptions<T> = {}
) {
  const { mutate, loading, error, reset } = useApiMutation<T, V>(token, {
    ...options,
    successMessage: options.successMessage || '更新成功',
  });

  const update = useCallback(
    (url: string, body: V) => mutate(url, { method: 'PUT' }, body),
    [mutate]
  );

  return { update, loading, error, reset };
}

export function useDeleteMutation<T = unknown>(
  token: string | null | undefined,
  options: UseApiMutationOptions<T> = {}
) {
  const { mutate, loading, error, reset } = useApiMutation<T>(token, {
    ...options,
    successMessage: options.successMessage || '删除成功',
  });

  const deleteItem = useCallback(
    (url: string, body?: unknown) => mutate(url, { method: 'DELETE' }, body),
    [mutate]
  );

  return { deleteItem, loading, error, reset };
}

export function useGetMutation<T = unknown>(
  token: string | null | undefined,
  options: UseApiMutationOptions<T> = {}
) {
  const { mutate, loading, error, reset } = useApiMutation<T>(token, {
    ...options,
    successMessage: options.successMessage || '',
    showSuccessToast: false,
  });

  const get = useCallback(
    (url: string) => mutate(url, { method: 'GET' }),
    [mutate]
  );

  return { get, loading, error, reset };
}
