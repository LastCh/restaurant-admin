# НОВЫЙ: utils/formatters.ts

/**
 * Форматирование денежных сумм
 */
export const formatPrice = (price: number | string, currency = '₽'): string => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return `0 ${currency}`;
  return `${num.toFixed(2)} ${currency}`;
};

/**
 * Форматирование дат
 */
export const formatDate = (date: string | Date, format = 'DD.MM.YYYY'): string => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid date';

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', String(year))
    .replace('HH', hours)
    .replace('mm', minutes);
};

/**
 * Форматирование дата + время
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'DD.MM.YYYY HH:mm');
};

/**
 * Форматирование только время
 */
export const formatTime = (date: string | Date): string => {
  const d = new Date(date);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Форматирование статусов заказов (RU)
 */
export const formatOrderStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    PENDING: 'В ожидании',
    IN_PROGRESS: 'Готовится',
    COMPLETED: 'Завершён',
    CANCELLED: 'Отменён',
  };
  return statuses[status] || status;
};

/**
 * Форматирование статусов бронирований (RU)
 */
export const formatReservationStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    ACTIVE: 'Активна',
    CANCELLED: 'Отменена',
    EXPIRED: 'Истекла',
  };
  return statuses[status] || status;
};

/**
 * Форматирование статусов поставок (RU)
 */
export const formatSupplyStatus = (status: string): string => {
  const statuses: Record<string, string> = {
    PENDING: 'Ожидание',
    CONFIRMED: 'Подтверждена',
    CANCELLED: 'Отменена',
  };
  return statuses[status] || status;
};

/**
 * Форматирование ролей (RU)
 */
export const formatRole = (role: string): string => {
  const roles: Record<string, string> = {
    ADMIN: 'Администратор',
    MANAGER: 'Менеджер',
    WAITER: 'Официант',
    CLIENT: 'Клиент',
  };
  return roles[role] || role;
};

/**
 * Сокращение текста
 */
export const truncateText = (text: string, maxLength = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Форматирование телефона
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `+${cleaned[0]} (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9)}`;
  }
  return phone;
};

/**
 * Форматирование метода оплаты (RU)
 */
export const formatPaymentMethod = (method: string): string => {
  const methods: Record<string, string> = {
    CASH: 'Наличные',
    CARD: 'Карта',
    ONLINE: 'Онлайн',
    OTHER: 'Другое',
  };
  return methods[method] || method;
};
