import { useState, useEffect, useCallback } from 'react';

const SITE_KEY = '6Lfo4Y8sAAAAAPGoebHiXYXbHFesHxk6yHXsQafD';

export interface UseRecaptchaOptions {
  /** 验证成功回调 */
  onSuccess?: (token: string) => void;
  /** 验证失败回调 */
  onError?: (error: string) => void;
  /** 操作名称，用于 reCaptcha 评分 */
  action?: string;
}

export function useRecaptcha(options: UseRecaptchaOptions = {}) {
  const { onSuccess, onError, action = 'SUBMIT' } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const [isReady, setIsReady] = useState(false);

  // 检查 reCaptcha 是否加载完成
  useEffect(() => {
    const checkScript = () => {
      if ((window as any).grecaptcha?.enterprise) {
        setIsReady(true);
        setIsLoading(false);
      } else {
        setTimeout(checkScript, 100);
      }
    };

    checkScript();
  }, []);

  // 执行验证
  const execute = useCallback(async () => {
    if (!isReady || !(window as any).grecaptcha?.enterprise) {
      setError('验证组件未加载完成');
      onError?.('验证组件未加载完成');
      return null;
    }

    setError('');
    
    try {
      const grecaptcha = (window as any).grecaptcha.enterprise;
      await grecaptcha.ready();
      
      const newToken = await grecaptcha.execute(SITE_KEY, { action });
      setToken(newToken);
      onSuccess?.(newToken);
      return newToken;
    } catch (err: any) {
      const errorMsg = err?.message || '验证失败，请重试';
      setError(errorMsg);
      onError?.(errorMsg);
      return null;
    }
  }, [isReady, action, onSuccess, onError]);

  // 重置验证
  const reset = useCallback(() => {
    setToken('');
    setError('');
  }, []);

  return {
    isLoading,
    error,
    token,
    execute,
    reset,
    isReady,
  };
}

// 全局类型声明
declare global {
  interface Window {
    grecaptcha?: {
      enterprise: {
        ready: (callback?: () => void) => Promise<void>;
        execute: (siteKey: string, options: { action: string }) => Promise<string>;
      };
    };
  }
}
