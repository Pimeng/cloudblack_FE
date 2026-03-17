import { useState, useEffect, useCallback, useRef } from 'react';

const API_BASE = 'https://cloudblack-api.07210700.xyz';

export interface TurnstileConfig {
  siteKey: string;
}

export interface UseTurnstileOptions {
  /** 配置接口路径 */
  configEndpoint: string;
  /** 验证成功回调 */
  onSuccess?: (token: string) => void;
  /** 验证失败回调 */
  onError?: () => void;
  /** 验证过期回调 */
  onExpired?: () => void;
}

export function useTurnstile(options: UseTurnstileOptions) {
  const { configEndpoint, onSuccess, onError, onExpired } = options;
  const [config, setConfig] = useState<TurnstileConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [token, setToken] = useState<string>('');
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // 加载 Turnstile 配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch(`${API_BASE}${configEndpoint}`);
        const data = await response.json();
        if (data.success && data.data) {
          setConfig(data.data);
        } else {
          setError('加载验证配置失败');
        }
      } catch (err) {
        setError('加载验证配置失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [configEndpoint]);

  // 渲染 Turnstile widget
  const renderWidget = useCallback(() => {
    if (!widgetRef.current || !config?.siteKey || !(window as any).turnstile) {
      return;
    }

    // 如果已经渲染过，先移除
    if (widgetIdRef.current) {
      (window as any).turnstile.remove(widgetIdRef.current);
      widgetIdRef.current = null;
    }

    // 渲染新的 widget
    widgetIdRef.current = (window as any).turnstile.render(widgetRef.current, {
      sitekey: config.siteKey,
      callback: (token: string) => {
        setToken(token);
        onSuccess?.(token);
      },
      'error-callback': (code: string) => {
        console.error('[Turnstile] Error code:', code);
        const errorMessages: Record<string, string> = {
          '110200': '配置错误：域名未授权或 Site Key 无效',
          '110201': '密钥类型不匹配',
          '110210': 'Widget 已过期',
          '300030': '请求频率过高，请稍后重试',
        };
        setError(errorMessages[code] || `验证失败 (${code})，请重试`);
        onError?.();
      },
      'expired-callback': () => {
        setToken('');
        onExpired?.();
      },
    });
  }, [config, onSuccess, onError, onExpired]);

  // 当配置加载完成且脚本可用时渲染
  useEffect(() => {
    if (config?.siteKey) {
      // 检查 Turnstile 脚本是否已加载
      const checkScript = () => {
        if ((window as any).turnstile) {
          renderWidget();
        } else {
          // 如果脚本还没加载完，等待一下再试
          setTimeout(checkScript, 100);
        }
      };
      checkScript();
    }

    return () => {
      // 清理时移除 widget
      if (widgetIdRef.current && (window as any).turnstile) {
        (window as any).turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [config, renderWidget]);

  // 重置验证
  const reset = useCallback(() => {
    setToken('');
    if (widgetIdRef.current && (window as any).turnstile) {
      (window as any).turnstile.reset(widgetIdRef.current);
    }
  }, []);

  return {
    widgetRef,
    isLoading,
    error,
    token,
    reset,
    config,
  };
}

// 全局类型声明
declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: any) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}
