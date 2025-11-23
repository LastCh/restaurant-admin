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

  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(0, page),
    }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination((prev) => {
      if (prev.page < prev.totalPages - 1) {
        return { ...prev, page: prev.page + 1 };
      }
      return prev;
    });
  }, []);

  const prevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      page: Math.max(0, prev.page - 1),
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPagination((prev) => ({
      ...prev,
      size,
      page: 0,
    }));
  }, []);

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

export default usePagination;
