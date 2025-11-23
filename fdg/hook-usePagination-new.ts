# НОВЫЙ: hooks/usePagination.ts

import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  initialPage?: number;
  initialSize?: number;
}

interface PaginationState {
  page: number;
  size: number;
  total: number;
  totalPages: number;
}

export const usePagination = (options: UsePaginationOptions = {}) => {
  const { initialPage = 0, initialSize = 10 } = options;

  const [pagination, setPagination] = useState<PaginationState>({
    page: initialPage,
    size: initialSize,
    total: 0,
    totalPages: 0,
  });

  // ✅ Установить информацию о пагинации
  const setPaginationInfo = useCallback((data: {
    total: number;
    totalPages?: number;
    currentPage?: number;
    pageSize?: number;
  }) => {
    setPagination((prev) => ({
      ...prev,
      total: data.total,
      totalPages: data.totalPages || Math.ceil(data.total / prev.size),
      page: data.currentPage ?? prev.page,
      size: data.pageSize ?? prev.size,
    }));
  }, []);

  // ✅ Перейти на страницу
  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(0, page),
    }));
  }, []);

  // ✅ Перейти на следующую страницу
  const nextPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.page < prev.totalPages - 1) {
        return { ...prev, page: prev.page + 1 };
      }
      return prev;
    });
  }, []);

  // ✅ Перейти на предыдущую страницу
  const prevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(0, prev.page - 1),
    }));
  }, []);

  // ✅ Установить размер страницы
  const setPageSize = useCallback((size: number) => {
    setPagination((prev) => ({
      ...prev,
      size,
      page: 0,
    }));
  }, []);

  // ✅ Сбросить пагинацию
  const reset = useCallback(() => {
    setPagination({
      page: initialPage,
      size: initialSize,
      total: 0,
      totalPages: 0,
    });
  }, [initialPage, initialSize]);

  return {
    ...pagination,
    setPaginationInfo,
    goToPage,
    nextPage,
    prevPage,
    setPageSize,
    reset,
    hasNext: pagination.page < pagination.totalPages - 1,
    hasPrev: pagination.page > 0,
  };
};
