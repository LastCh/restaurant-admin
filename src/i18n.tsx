import { createContext, useContext } from 'react';

export const translations = {
  ru: {
    title: 'Админ-панель',
    menu: {
      dashboard: 'Панель',
      orders: 'Заказы',
      menu: 'Меню',
      reservations: 'Бронирования',
      ingredients: 'Ингредиенты',
      suppliers: 'Поставщики',
      supplies: 'Поставки',
      sales: 'Продажи',
    },
    logout: 'Выход',
    add: 'Добавить',
  },
  en: {
    title: 'Admin Panel',
    menu: {
      dashboard: 'Dashboard',
      orders: 'Orders',
      menu: 'Menu',
      reservations: 'Reservations',
      ingredients: 'Ingredients',
      suppliers: 'Suppliers',
      supplies: 'Supplies',
      sales: 'Sales',
    },
    logout: 'Logout',
    add: 'Add',
  },
};

export const LocaleContext = createContext<{ locale: 'ru' | 'en'; setLocale: (l: 'ru' | 'en') => void }>({
  locale: 'ru',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setLocale: () => {},
});

export const useLocale = () => useContext(LocaleContext);

export const useT = () => {
  const { locale } = useContext(LocaleContext);
  return (key: string) => {
    const parts = key.split('.');
    let o: any = translations[locale];
    for (const p of parts) {
      if (!o) return key;
      o = o[p];
    }
    return o ?? key;
  };
};
