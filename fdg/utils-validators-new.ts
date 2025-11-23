# НОВЫЙ: utils/validators.ts

/**
 * Валидация электронной почты
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Валидация телефонного номера (российский)
 */
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+7|8)\d{10}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
};

/**
 * Валидация ИНН (российский 12-значный)
 */
export const validateINN = (inn: string): boolean => {
  const cleaned = inn.replace(/\D/g, '');
  if (cleaned.length !== 12) return false;

  const calculateChecksum = (digits: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < digits.length; i++) {
      sum += parseInt(digits[i]) * weights[i];
    }
    return sum % 11 % 10;
  };

  const weights1 = [3, 7, 2, 4, 10, 3, 7, 2, 4, 10, 3, 7];
  const weights2 = [7, 2, 4, 10, 3, 7, 2, 4, 10, 3, 7];

  const check1 = calculateChecksum(cleaned.slice(0, 11), weights1.slice(1));
  const check2 = calculateChecksum(cleaned.slice(0, 11), weights2);

  return parseInt(cleaned[10]) === check1 && parseInt(cleaned[11]) === check2;
};

/**
 * Валидация пароля (минимум 6 символов)
 */
export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

/**
 * Валидация имени (минимум 2 символа, буквы и пробелы)
 */
export const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[а-яА-ЯёЁa-zA-Z\s'-]+$/.test(name);
};

/**
 * Валидация цены (положительное число)
 */
export const validatePrice = (price: number | string): boolean => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return !isNaN(num) && num > 0;
};

/**
 * Валидация количества (положительное целое число)
 */
export const validateQuantity = (quantity: number | string): boolean => {
  const num = typeof quantity === 'string' ? parseInt(quantity) : quantity;
  return !isNaN(num) && num > 0 && Number.isInteger(num);
};

/**
 * Валидация даты (не в прошлом)
 */
export const validateFutureDate = (date: string | Date): boolean => {
  const dateObj = new Date(date);
  return dateObj > new Date();
};

/**
 * Валидация диапазона дат
 */
export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate;
};

/**
 * Валидация размера файла (в мегабайтах)
 */
export const validateFileSize = (file: File, maxSizeMB = 5): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Валидация типа файла
 */
export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

/**
 * Объект с правилами валидации для форм
 */
export const formRules = {
  email: [
    { required: true, message: 'Введите электронную почту' },
    { 
      validator: (_, value) => {
        if (!value || validateEmail(value)) return Promise.resolve();
        return Promise.reject(new Error('Некорректный формат email'));
      }
    }
  ],

  phone: [
    { required: true, message: 'Введите номер телефона' },
    {
      validator: (_, value) => {
        if (!value || validatePhone(value)) return Promise.resolve();
        return Promise.reject(new Error('Некорректный номер телефона'));
      }
    }
  ],

  password: [
    { required: true, message: 'Введите пароль' },
    { min: 6, message: 'Пароль должен быть минимум 6 символов' }
  ],

  name: [
    { required: true, message: 'Введите имя' },
    { min: 2, message: 'Имя должно быть минимум 2 символа' }
  ],

  price: [
    { required: true, message: 'Введите цену' },
    {
      validator: (_, value) => {
        if (!value || validatePrice(value)) return Promise.resolve();
        return Promise.reject(new Error('Цена должна быть положительным числом'));
      }
    }
  ],

  quantity: [
    { required: true, message: 'Введите количество' },
    {
      validator: (_, value) => {
        if (!value || validateQuantity(value)) return Promise.resolve();
        return Promise.reject(new Error('Количество должно быть целым положительным числом'));
      }
    }
  ],
};
