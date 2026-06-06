import {
  BadgeDollarSign,
  Gift,
  Sparkles,
} from 'lucide-react';

export type Category = 'hot' | 'cold' | 'tea' | 'bakery' | 'snack' | 'dessert';

export type Product = {
  id: string;
  category: Category;
  name: string;
  price: number;
  description: string;
  image: string;
  tags: string[];
  popular?: boolean;
};

export type BalancePackage = {
  amount: number;
  bonus: number;
  label: string;
  note: string;
};

export const categories = [
  { id: 'hot', title: 'Горячий кофе' },
  { id: 'cold', title: 'Холодный кофе' },
  { id: 'tea', title: 'Чай' },
  { id: 'bakery', title: 'Выпечка' },
  { id: 'snack', title: 'Перекус' },
  { id: 'dessert', title: 'Десерты' },
] as const;

export const products: Product[] = [
  {
    id: 'p1',
    category: 'hot',
    name: 'Капучино Flat Foam',
    price: 98,
    description: 'Плотная молочная пена, мягкий эспрессо и чистый сливочный финиш.',
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=900&q=80',
    tags: ['250 мл', 'мягкий'],
    popular: true,
  },
  {
    id: 'p2',
    category: 'hot',
    name: 'Латте Vanilla Cloud',
    price: 112,
    description: 'Большой латте с натуральной ванилью и легкой сладостью без сиропного шума.',
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=900&q=80',
    tags: ['350 мл', 'ваниль'],
    popular: true,
  },
  {
    id: 'p3',
    category: 'cold',
    name: 'Iced Espresso Tonic',
    price: 128,
    description: 'Холодный эспрессо, сухой тоник и цитрус. Быстро, свежо, не сладко.',
    image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=900&q=80',
    tags: ['холодный', 'цитрус'],
    popular: true,
  },
  {
    id: 'p4',
    category: 'tea',
    name: 'Матча Oat',
    price: 136,
    description: 'Церемониальная матча на овсяном молоке, без горечи.',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=900&q=80',
    tags: ['овсяное', 'energy'],
  },
  {
    id: 'p5',
    category: 'bakery',
    name: 'Круассан Almond',
    price: 92,
    description: 'Слоеный круассан с миндальным кремом. Хорошо работает в автозаказе.',
    image: 'https://images.unsplash.com/photo-1623334044303-241021148842?auto=format&fit=crop&w=900&q=80',
    tags: ['свежий', 'к кофе'],
    popular: true,
  },
  {
    id: 'p6',
    category: 'snack',
    name: 'Turkey Brioche',
    price: 168,
    description: 'Бриошь, индейка, сыр и легкий соус. Забрать удобно по коду.',
    image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=900&q=80',
    tags: ['завтрак', 'сытно'],
  },
  {
    id: 'p7',
    category: 'dessert',
    name: 'Basque Mini',
    price: 118,
    description: 'Мини-чизкейк с карамельной коркой и мягкой серединой.',
    image: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?auto=format&fit=crop&w=900&q=80',
    tags: ['десерт', 'мини'],
  },
];

export const packages: BalancePackage[] = [
  { amount: 500, bonus: 50, label: 'Для пары утренних заказов', note: 'Получаешь +10% сразу на баланс.' },
  { amount: 1000, bonus: 150, label: 'Самый понятный старт', note: 'Экономия заметна уже на первой неделе.' },
  { amount: 2500, bonus: 500, label: 'Для ежедневного кофе', note: 'Пополняешь один раз, экономишь на каждом заказе.' },
  { amount: 5000, bonus: 1500, label: 'Максимальная выгода', note: 'Лучший пакет для команды или семьи.' },
];

export const orderHistory = [
  { id: 'h1', title: 'Капучино + круассан', date: 'Вчера', price: 190, code: '4831' },
  { id: 'h2', title: 'Iced Espresso Tonic', date: '3 июня', price: 128, code: '2914' },
  { id: 'h3', title: 'Латте Vanilla Cloud', date: '31 мая', price: 112, code: '7302' },
];

export const operations = [
  { title: 'Пополнение 1000 грн', meta: '+150 грн бонус', value: '+1150' },
  { title: 'Капучино Flat Foam', meta: 'Оплата балансом', value: '-98' },
  { title: 'Подарок для Анны', meta: 'Кофе отправлен', value: '-112' },
  { title: 'Реферальная награда', meta: 'Выведено из партнерки', value: '+200' },
];

export const successCopy = {
  order: { icon: Sparkles, title: 'Заказ оплачен', text: 'Назови код бариста. Напиток уже в очереди приготовления.' },
  gift: { icon: Gift, title: 'Кофе отправлен', text: 'Получатель увидит подарок в Telegram и сможет забрать по коду.' },
  receivedGift: { icon: Gift, title: 'Подарок активирован', text: 'Подарок сохранен в профиле. Когда будешь в кофейне, получи код выдачи.' },
  reward: { icon: BadgeDollarSign, title: 'Награда выведена', text: 'Партнерская сумма переведена на кофейный баланс.' },
};
