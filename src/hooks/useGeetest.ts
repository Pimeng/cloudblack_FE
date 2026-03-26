import { useState, useEffect, useRef, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'https://cloudblack-api.07210700.xyz';

export interface GeetestConfig {
  enabled: boolean;
  captcha_id: string;
}

export interface GeetestResult {
  lot_number: string;
  captcha_output: string;
  pass_token: string;
  gen_time: string;
}

export interface UseGeetestOptions {
  /** 验证成功回调 */
  onSuccess?: (result: GeetestResult) => void;
  /** 验证失败回调 */
  onError?: (error: string) => void;
  /** 验证关闭回调 */
  onClose?: () => void;
  /** 展现形式: float-浮动式, popup-弹出式, bind-绑定式 */
  product?: 'float' | 'popup' | 'bind';
  /** 语言 */
  language?: string;
}

export function useGeetest(options: UseGeetestOptions = {}) {
  const { onSuccess, onError, onClose, product = 'float', language = 'zho' } = options;
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<GeetestResult | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [config, setConfig] = useState<GeetestConfig | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);
  const captchaRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // 使用 ref 保存回调函数，避免依赖变化导致重新初始化
  const callbacksRef = useRef({ onSuccess, onError, onClose });
  callbacksRef.current = { onSuccess, onError, onClose };

  // 获取极验配置
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/admin/geetest-config`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setConfig(data.data);
          setIsEnabled(data.data.enabled);
          
          // 如果极验未启用，直接标记为准备就绪
          if (!data.data.enabled) {
            setIsLoading(false);
            setIsReady(true);
          }
        } else {
          // 如果获取配置失败，默认启用极验
          setIsEnabled(true);
        }
      } catch (err) {
        console.error('获取极验配置失败:', err);
        // 如果请求失败，默认启用极验
        setIsEnabled(true);
      }
    };

    fetchConfig();
  }, []);

  // 检查 Geetest 脚本是否加载完成
  useEffect(() => {
    // 如果极验未启用，不需要检查脚本
    if (!isEnabled) return;

    const checkScript = () => {
      if ((window as any).initGeetest4) {
        setIsReady(true);
      } else {
        setTimeout(checkScript, 100);
      }
    };

    checkScript();
  }, [isEnabled]);

  // 初始化验证码
  const initCaptcha = useCallback(() => {
    // 如果极验未启用，不需要初始化
    if (!isEnabled) {
      return;
    }

    if (!isReady || !(window as any).initGeetest4) {
      return;
    }

    // 如果没有获取到配置，等待配置获取完成
    if (!config?.captcha_id) {
      return;
    }

    // bind 模式不需要容器，其他模式需要
    if (product !== 'bind' && !containerRef.current) {
      return;
    }

    // 如果已经初始化，先销毁
    if (captchaRef.current) {
      captchaRef.current.destroy();
      captchaRef.current = null;
    }

    (window as any).initGeetest4(
      {
        captchaId: config.captcha_id,
        product,
        language,
        nativeButton: {
          width: '100%',
          height: '44px',
        },
      },
      (captcha: any) => {
        captchaRef.current = captcha;

        // 将验证码挂载到 DOM（非 bind 模式）
        if (product !== 'bind' && containerRef.current) {
          captcha.appendTo(containerRef.current);
        }

        // 验证码准备就绪
        captcha.onReady(() => {
          setIsLoading(false);
        });

        // 验证成功回调
        captcha.onSuccess(() => {
          const validate = captcha.getValidate();
          if (validate) {
            const resultData: GeetestResult = {
              lot_number: validate.lot_number,
              captcha_output: validate.captcha_output,
              pass_token: validate.pass_token,
              gen_time: validate.gen_time,
            };
            setResult(resultData);
            callbacksRef.current.onSuccess?.(resultData);
          }
        });

        // 验证失败回调
        captcha.onFail(() => {
          const errorMsg = '验证失败，请重试';
          setError(errorMsg);
          callbacksRef.current.onError?.(errorMsg);
        });

        // 验证错误回调
        captcha.onError((err: any) => {
          const errorMsg = err?.msg || err?.desc?.detail || '验证加载失败，请刷新页面重试';
          setError(errorMsg);
          setIsLoading(false);
          callbacksRef.current.onError?.(errorMsg);
        });

        // 验证关闭回调（仅 popup/bind 模式）
        captcha.onClose(() => {
          callbacksRef.current.onClose?.();
        });
      }
    );
  }, [isReady, isEnabled, config, product, language]);

  // 当准备就绪且有配置时初始化
  useEffect(() => {
    // bind 模式不需要容器，其他模式需要
    const shouldInit = isReady && config && (product === 'bind' || containerRef.current);
    if (shouldInit) {
      initCaptcha();
    }

    return () => {
      if (captchaRef.current) {
        captchaRef.current.destroy();
        captchaRef.current = null;
      }
    };
  }, [isReady, config, product, initCaptcha]);

  // 重置验证
  const reset = useCallback(() => {
    setResult(null);
    setError('');
    if (captchaRef.current) {
      captchaRef.current.reset();
    }
  }, []);

  // 主动触发验证（用于 bind 模式）
  const verify = useCallback(() => {
    if (captchaRef.current) {
      captchaRef.current.showCaptcha();
    }
  }, []);

  // 销毁验证码
  const destroy = useCallback(() => {
    if (captchaRef.current) {
      captchaRef.current.destroy();
      captchaRef.current = null;
    }
  }, []);

  return {
    containerRef,
    isLoading,
    error,
    result,
    reset,
    verify,
    destroy,
    isReady,
    isEnabled,
    config,
  };
}

// 全局类型声明
declare global {
  interface Window {
    initGeetest4: (
      config: {
        captchaId: string;
        product?: 'float' | 'popup' | 'bind';
        language?: string;
        nativeButton?: {
          width: string;
          height: string;
        };
      },
      callback: (captcha: any) => void
    ) => void;
  }
}
