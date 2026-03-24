import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * 将状态同步到 URL 查询参数的 Hook
 * @param key 查询参数的 key
 * @param defaultValue 默认值
 * @returns [value, setValue] 类似于 useState 的返回值
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const value = (searchParams.get(key) as T) || defaultValue;
  
  const setValue = useCallback((newValue: T) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (newValue === defaultValue) {
        newParams.delete(key);
      } else {
        newParams.set(key, newValue);
      }
      return newParams;
    });
  }, [key, defaultValue, setSearchParams]);
  
  return [value, setValue];
}

/**
 * 将多个状态同步到 URL 查询参数的 Hook
 * @param keys 查询参数的 key 数组
 * @param defaultValues 默认值对象
 * @returns 包含所有状态和 setter 的对象
 */
export function useUrlStates<T extends Record<string, string>>(
  defaultValues: T
): {
  [K in keyof T]: [T[K], (value: T[K]) => void];
} {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const result = {} as { [K in keyof T]: [T[K], (value: T[K]) => void] };
  
  (Object.keys(defaultValues) as Array<keyof T>).forEach((key) => {
    const value = (searchParams.get(key as string) as T[keyof T]) || defaultValues[key];
    
    const setValue = (newValue: T[keyof T]) => {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        if (newValue === defaultValues[key]) {
          newParams.delete(key as string);
        } else {
          newParams.set(key as string, newValue);
        }
        return newParams;
      });
    };
    
    result[key] = [value, setValue] as [T[keyof T], (value: T[keyof T]) => void];
  });
  
  return result;
}

/**
 * 同步数值型状态到 URL 查询参数的 Hook
 * @param key 查询参数的 key
 * @param defaultValue 默认值
 * @returns [value, setValue] 类似于 useState 的返回值
 */
export function useUrlStateNumber(
  key: string,
  defaultValue: number
): [number, (value: number) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const rawValue = searchParams.get(key);
  const value = rawValue ? parseInt(rawValue, 10) || defaultValue : defaultValue;
  
  const setValue = useCallback((newValue: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (newValue === defaultValue) {
        newParams.delete(key);
      } else {
        newParams.set(key, newValue.toString());
      }
      return newParams;
    });
  }, [key, defaultValue, setSearchParams]);
  
  return [value, setValue];
}
