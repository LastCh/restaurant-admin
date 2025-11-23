import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';
import { message } from 'antd';

interface UseApiOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  showNotifications?: boolean;
}

export const useApi = <T,>(options: UseApiOptions = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<T | null>(null);

  const execute = useCallback(
    async (apiCall: () => Promise<T>) => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiCall();
        setData(result);
        if (options.showNotifications !== false) {
          options.onSuccess?.();
        }
        return result;
      } catch (err) {
        const axiosError = err as AxiosError;
        const errorMsg =
          (axiosError.response?.data as any)?.message ||
          axiosError.message ||
          'Произошла ошибка';
        setError(errorMsg);
        if (options.showNotifications !== false) {
          message.error(errorMsg);
          options.onError?.(errorMsg);
        }
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options]
  );

  return {
    data,
    loading,
    error,
    execute,
  };
};

export default useApi;
