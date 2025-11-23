export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^(\+7|8)\d{10}$/;
  return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
};

export const validateINN = (inn: string): boolean => {
  const cleaned = inn.replace(/\D/g, '');
  if (cleaned.length !== 12) return false;

  const calculateChecksum = (digits: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < digits.length; i += 1) {
      sum += parseInt(digits[i], 10) * weights[i];
    }
    return (sum % 11) % 10;
  };

  const weights1 = [3, 7, 2, 4, 10, 3, 7, 2, 4, 10, 3, 7];
  const weights2 = [7, 2, 4, 10, 3, 7, 2, 4, 10, 3, 7];

  const check1 = calculateChecksum(cleaned.slice(0, 11), weights1.slice(1));
  const check2 = calculateChecksum(cleaned.slice(0, 11), weights2);

  return parseInt(cleaned[10], 10) === check1 && parseInt(cleaned[11], 10) === check2;
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateName = (name: string): boolean => {
  return name.length >= 2 && /^[а-яА-ЯёЁa-zA-Z\s'-]+$/.test(name);
};

export const validatePrice = (price: number | string): boolean => {
  const num = typeof price === 'string' ? parseFloat(price) : price;
  return !Number.isNaN(num) && num > 0;
};

export const validateQuantity = (quantity: number | string): boolean => {
  const num = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
  return !Number.isNaN(num) && num > 0 && Number.isInteger(num);
};

export const validateFutureDate = (date: string | Date): boolean => {
  const dateObj = new Date(date);
  return dateObj > new Date();
};

export const validateDateRange = (startDate: Date, endDate: Date): boolean => {
  return startDate < endDate;
};

export const validateFileSize = (file: File, maxSizeMB = 5): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

export const validateFileType = (file: File, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(file.type);
};

export const formRules = {
  email: [
    { required: true, message: 'Введите электронную почту' },
    {
      validator: (_: unknown, value: string) => {
        if (!value || validateEmail(value)) return Promise.resolve();
        return Promise.reject(new Error('Некорректный формат email'));
      },
    },
  ],

  phone: [
    { required: true, message: 'Введите номер телефона' },
    {
      validator: (_: unknown, value: string) => {
        if (!value || validatePhone(value)) return Promise.resolve();
        return Promise.reject(new Error('Некорректный номер телефона'));
      },
    },
  ],

  password: [
    { required: true, message: 'Введите пароль' },
    { min: 6, message: 'Пароль должен быть минимум 6 символов' },
  ],

  name: [
    { required: true, message: 'Введите имя' },
    { min: 2, message: 'Имя должно быть минимум 2 символа' },
  ],

  price: [
    { required: true, message: 'Введите цену' },
    {
      validator: (_: unknown, value: number | string) => {
        if (!value || validatePrice(value)) return Promise.resolve();
        return Promise.reject(new Error('Цена должна быть положительным числом'));
      },
    },
  ],

  quantity: [
    { required: true, message: 'Введите количество' },
    {
      validator: (_: unknown, value: number | string) => {
        if (!value || validateQuantity(value)) return Promise.resolve();
        return Promise.reject(new Error('Количество должно быть целым положительным числом'));
      },
    },
  ],
} as const;
