import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CakeSlice,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Contact,
  Croissant,
  Gift,
  Grid2X2,
  History,
  Home,
  Leaf,
  Minus,
  PanelRight,
  Plus,
  QrCode,
  Repeat2,
  ScanLine,
  Send,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Snowflake,
  Trash2,
  Sandwich,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import {
  adminRows,
  adminStats,
  categories,
  operations,
  orderHistory,
  packages,
  products,
  quickActions,
  referralFriends,
  successCopy,
  upcomingOrders,
  valueSteps,
  type Category,
  type Product,
} from './data';
import { bootTelegramMiniApp, impact, notify, selection } from './telegram';

type Screen = 'home' | 'menu' | 'orders' | 'profile';
type TimeMode = 'now' | '15' | 'time';
type AppSheet = 'auto' | 'gift' | 'topup' | 'referral' | 'checkout' | 'settings' | null;
type PaymentMethod = 'balance' | 'card';
type CartItem = Product & { quantity: number; size: string; syrup: string; extraShot: boolean };
type SuccessKind = keyof typeof successCopy;

const money = (value: number) => `${value.toLocaleString('uk-UA')} грн`;
const productCountLabel = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
};

function classNames(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(' ');
}

export function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [category, setCategory] = useState<Category>('hot');
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [balance, setBalance] = useState(1250);
  const [animatedBalance, setAnimatedBalance] = useState(1250);
  const [timeMode, setTimeMode] = useState<TimeMode>('15');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [sheet, setSheet] = useState<AppSheet>(null);
  const [success, setSuccess] = useState<SuccessKind | null>(null);
  const [pickupCode, setPickupCode] = useState('4831');
  const [giftMode, setGiftMode] = useState<'drink' | 'amount'>('drink');
  const [toast, setToast] = useState('');
  const toastTimer = useRef<number | null>(null);

  useEffect(() => {
    bootTelegramMiniApp();
  }, []);

  useEffect(() => {
    if (animatedBalance === balance) return;
    const diff = balance - animatedBalance;
    const step = Math.max(1, Math.round(Math.abs(diff) / 14)) * Math.sign(diff);
    const id = window.setTimeout(() => {
      setAnimatedBalance((current) => (Math.abs(balance - current) <= Math.abs(step) ? balance : current + step));
    }, 18);
    return () => window.clearTimeout(id);
  }, [animatedBalance, balance]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [screen]);

  const filtered = products.filter((product) => product.category === category);
  const activeCategoryTitle = categories.find((item) => item.id === category)?.title ?? 'Каталог';
  const popular = products.filter((product) => product.popular);
  const total = cart.reduce((sum, item) => sum + (item.price + (item.extraShot ? 25 : 0)) * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const showToast = (message: string) => {
    setToast(message);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(''), 1900);
  };

  const go = (next: Screen) => {
    selection();
    setScreen(next);
    setSelected(null);
    setSheet(null);
    window.scrollTo(0, 0);
  };

  const addToCart = (product: Product, overrides?: Partial<CartItem>) => {
    impact('medium');
    setToast('');
    setCart((items) => {
      const existing = items.find((item) => item.id === product.id);
      if (existing) {
        return items.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [
        ...items,
        {
          ...product,
          quantity: 1,
          size: overrides?.size ?? 'Medium',
          syrup: overrides?.syrup ?? 'Без сиропа',
          extraShot: overrides?.extraShot ?? false,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    impact('light');
    setCart((items) => {
      const next = items.filter((item) => item.id !== id);
      if (!next.length) window.setTimeout(() => setSheet(null), 0);
      return next;
    });
  };

  const checkout = () => {
    if (!cart.length) {
      addToCart(products[0]);
      return;
    }
    const code = String(Math.floor(1000 + Math.random() * 8999));
    setPickupCode(code);
    if (paymentMethod === 'balance') {
      setBalance((value) => Math.max(0, value - total));
    }
    setCart([]);
    setSheet(null);
    notify('success');
    setSuccess('order');
  };

  const topUp = (amount: number, bonus: number) => {
    setBalance((value) => value + amount + bonus);
    notify('success');
    setSheet(null);
  };

  const isPrimaryScreen = (['home', 'menu', 'orders', 'profile'] as Screen[]).includes(screen);

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-button ghost" onClick={() => (isPrimaryScreen ? go('profile') : go('home'))} aria-label={isPrimaryScreen ? 'Профиль' : 'Назад'}>
          {isPrimaryScreen ? <span className="avatar-photo" /> : <X size={20} />}
        </button>
        <div>
          <div className="brand">{screen === 'home' ? 'Доброе утро' : 'TG Coffee'}</div>
          <div className="branch">Арсенальная · 4 мин</div>
        </div>
        <button className="balance-chip" onClick={() => go('profile')}>
          <Wallet size={16} />
          {money(animatedBalance)}
        </button>
        <button
          className="icon-button header-cart-button"
          onClick={() => {
            selection();
            if (cartCount > 0) {
              setToast('');
              setSheet('checkout');
              return;
            }
            setScreen('menu');
            window.scrollTo(0, 0);
            showToast('Корзина пустая. Выбери напиток');
          }}
          aria-label={cartCount > 0 ? `Корзина: ${productCountLabel(cartCount)}` : 'Корзина'}
        >
          <ShoppingBag size={19} />
          {cartCount > 0 && <span>{cartCount}</span>}
        </button>
      </header>

      <main className="screen-shell">
        {screen === 'home' && (
          <section className="screen enter">
            <HomeBanners onOrder={() => { addToCart(popular[0]); go('menu'); }} onInvite={() => setSheet('referral')} product={popular[0]} />
            <HomeActionTiles
              onRepeat={() => { addToCart(products[0]); addToCart(products[4]); go('menu'); }}
              onAuto={() => setSheet('auto')}
              onInvite={() => setSheet('referral')}
              onTopUp={() => setSheet('topup')}
            />
            <FavoriteDrinks products={popular.slice(0, 3)} onPick={setSelected} onAdd={addToCart} />
            <PopularCards products={popular} onNavigate={() => go('menu')} onPick={setSelected} onAdd={addToCart} />
            <QueueInfoCard onOpen={() => go('orders')} />
          </section>
        )}

        {screen === 'menu' && (
          <section className="screen enter">
            <SectionHeader title="Каталог" text="Выбери кофе, добавь настройки и оформи получение по коду." icon={<ShoppingBag />} />
            <CategoryTabs category={category} onChange={setCategory} />
            <div className="block-title standalone"><h2>{activeCategoryTitle}</h2><Coffee size={18} /></div>
            <div className="product-list">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onPick={setSelected} onAdd={addToCart} onGift={() => { notify('success'); setSuccess('gift'); }} />
              ))}
            </div>
          </section>
        )}

        {screen === 'orders' && (
          <section className="screen enter">
            <SectionHeader title="Заказы" text="Повтори любимый напиток или проверь ближайшую выдачу." icon={<ShoppingBag />} />
            <ActiveOrderCard code={pickupCode} items={[
              { product: products[0], quantity: 1 },
              { product: products[4], quantity: 1 },
              { product: products[1], quantity: 1 },
              { product: products[6], quantity: 1 },
            ]} />
            <HistoryBlock onRepeat={() => { addToCart(products[0]); go('menu'); }} />
          </section>
        )}

        {screen === 'profile' && (
          <section className="screen enter">
            <SectionHeader title="Профиль" text="Баланс, подарки, партнерка и история операций." icon={<UserRound />} />
            <div className="profile-card">
              <div className="avatar">SN</div>
              <div><strong>Сергей</strong><span>+380 67 000 00 00</span></div>
            </div>
            <ProfileBalance balance={animatedBalance} onTopUp={() => setSheet('topup')} onGift={() => setSheet('gift')} />
            <ReferralProfileCard onReward={() => { setBalance((value) => value + 100); notify('success'); setSuccess('reward'); }} />
            <Operations />
            <SettingsBlock onOpen={() => setSheet('settings')} />
          </section>
        )}

      </main>

      <CartBar
        count={cartCount}
        total={total}
        timeMode={timeMode}
        onTime={setTimeMode}
        onCheckout={() => setSheet('checkout')}
        visible={!selected && !success && screen === 'menu' && cartCount > 0}
      />
      {!selected && !success && <BottomNav screen={screen} onChange={go} />}
      {selected && <ProductSheet product={selected} onClose={() => setSelected(null)} onAdd={addToCart} onGift={() => { setSelected(null); notify('success'); setSuccess('gift'); }} />}
      {sheet === 'checkout' && (
        <CheckoutSheet
          items={cart}
          count={cartCount}
          total={total}
          balance={animatedBalance}
          timeMode={timeMode}
          paymentMethod={paymentMethod}
          onTime={setTimeMode}
          onPayment={setPaymentMethod}
          onRemove={removeFromCart}
          onClose={() => setSheet(null)}
          onConfirm={checkout}
        />
      )}
      {sheet === 'auto' && <AutoOrderSheet onClose={() => setSheet(null)} onSaved={() => showToast('Автозаказ включен')} />}
      {sheet === 'gift' && <GiftSheet giftMode={giftMode} onGiftMode={setGiftMode} onClose={() => setSheet(null)} onContact={() => showToast('Откроется выбор контакта Telegram')} onSend={() => { setSheet(null); setBalance((value) => value - (giftMode === 'drink' ? 112 : 250)); notify('success'); setSuccess('gift'); }} />}
      {sheet === 'topup' && <TopUpSheet onClose={() => setSheet(null)} onTopUp={topUp} />}
      {sheet === 'referral' && <ReferralSheet onClose={() => setSheet(null)} onReward={() => { setSheet(null); setBalance((value) => value + 100); notify('success'); setSuccess('reward'); }} />}
      {sheet === 'settings' && <SettingsSheet onClose={() => setSheet(null)} />}
      {success && <SuccessModal kind={success} code={pickupCode} onQr={() => showToast('QR-код будет доступен после подключения backend')} onClose={() => setSuccess(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function HomeBanners({ product, onOrder, onInvite }: { product: Product; onOrder: () => void; onInvite: () => void }) {
  return (
    <section className="home-experience">
      <article className="morning-stage">
        <img src={product.image} alt="" />
        <div className="stage-copy">
          <span>готово через 15 минут</span>
          <h1>Кофе к утру</h1>
          <p>Забери по коду без очереди.</p>
        </div>
        <div className="stage-actions">
          <button className="primary-button hero-cta" onClick={onOrder}><Coffee size={19} />Заказать как обычно</button>
          <button className="stage-link" aria-label="Открыть партнерскую программу" onClick={onInvite}>Соседи дают бонусы <ChevronRight size={17} /></button>
        </div>
      </article>
    </section>
  );
}

function HomeActionTiles({
  onRepeat,
  onAuto,
  onInvite,
  onTopUp,
}: {
  onRepeat: () => void;
  onAuto: () => void;
  onInvite: () => void;
  onTopUp: () => void;
}) {
  const actions = [
    { title: 'Как обычно', caption: 'капучино + круассан', icon: Repeat2, onClick: onRepeat },
    { title: 'Автозаказ', caption: 'будни в 08:30', icon: CalendarClock, onClick: onAuto },
    { title: 'Соседи', caption: 'до 10% на баланс', icon: Send, onClick: onInvite },
    { title: 'Пополнить', caption: '+ бонус к сумме', icon: Wallet, onClick: onTopUp },
  ];

  return (
    <div className="command-strip">
      {actions.map((action) => (
        <button key={action.title} aria-label={`${action.title}: ${action.caption}`} onClick={action.onClick}>
          <action.icon size={28} />
          <div>
            <strong>{action.title}</strong>
            <span>{action.caption}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function BalanceGlassCard({ balance, onOpen }: { balance: number; onOpen: () => void }) {
  return (
    <button className="balance-glass-card" onClick={onOpen}>
      <div>
        <span>Кофейный баланс</span>
        <strong>{money(balance)}</strong>
      </div>
      <ChevronRight size={24} />
      <b>История</b>
    </button>
  );
}

function NextOrderCard() {
  return (
    <button className="next-order-card" onClick={() => { selection(); notify('success'); }}>
      <CalendarClock size={28} />
      <div>
        <strong>Ближайший заказ</strong>
        <span>Сегодня в 10:30 · Готовим</span>
      </div>
      <ChevronRight size={24} />
    </button>
  );
}

function QueueInfoCard({ onOpen }: { onOpen: () => void }) {
  return (
    <button className="pickup-story" onClick={onOpen}>
      <div className="pickup-icon"><QrCode size={24} /></div>
      <strong>Код вместо очереди</strong>
      <span>Заказ уже в работе. На стойке просто называешь 4 цифры.</span>
      <ChevronRight size={22} />
    </button>
  );
}

function ActiveOrderCard({ code, items }: { code: string; items: Array<{ product: Product; quantity: number }> }) {
  const visible = items.slice(0, 3);
  const hidden = Math.max(0, items.length - visible.length);
  const summary = items.map((item) => item.quantity > 1 ? `${item.product.name} ×${item.quantity}` : item.product.name).join(' · ');

  return (
    <section className="active-order-card">
      <div className="order-status-row">
        <span>Готовим</span>
        <b>08:30</b>
      </div>
      <div className="active-order-products" aria-label={`Состав заказа: ${summary}`}>
        <div className="active-order-thumbs">
          {visible.map((item) => (
            <img key={item.product.id} src={item.product.image} alt="" />
          ))}
          {hidden > 0 && <span>+{hidden}</span>}
        </div>
        <div>
          <span>В заказе</span>
          <strong>{items.length} позиции</strong>
        </div>
      </div>
      <h2>Капучино + круассан</h2>
      <small className="active-order-summary">{summary}</small>
      <p>Назови код бариста, когда подойдешь к стойке.</p>
      <div className="pickup-code">
        {code.split('').map((digit, index) => <strong key={`${digit}-${index}`}>{digit}</strong>)}
      </div>
    </section>
  );
}

function PopularCards({ products: list, onNavigate, onPick, onAdd }: { products: Product[]; onNavigate: () => void; onPick: (p: Product) => void; onAdd: (p: Product) => void }) {
  return (
    <section className="drink-editorial">
      <div className="popular-header">
        <h2>Сегодня берут</h2>
        <button onClick={onNavigate}>Меню <ChevronRight size={18} /></button>
      </div>
      <div className="drink-scroll">
        {list.map((product) => (
          <article className="drink-tile" key={product.id} onClick={() => onPick(product)}>
            <img src={product.image} alt="" />
            <div>
              <strong>{product.name.replace(' Flat Foam', '').replace(' Vanilla Cloud', '')}</strong>
              <span>от {money(product.price)}</span>
            </div>
            <button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); onAdd(product); }}><Plus size={23} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

function SavingsPreview({ onTopUp }: { onTopUp: () => void }) {
  return (
    <section className="savings-card">
      <div className="block-title">
        <h2>Баланс делает кофе выгоднее</h2>
        <span>+10-20%</span>
      </div>
      <div className="saving-lines">
        {packages.slice(0, 3).map((pack) => (
          <button key={pack.amount} onClick={onTopUp}>
            <span>{money(pack.amount)} → {money(pack.amount + pack.bonus)}</span>
            <small>+{pack.bonus} грн на баланс</small>
          </button>
        ))}
      </div>
      <button className="secondary-button wide" onClick={onTopUp}>Пополнить баланс</button>
    </section>
  );
}

function ValueStrip() {
  return (
    <div className="value-strip">
      {valueSteps.map((step) => (
        <div key={step.title}>
          <strong>{step.title}</strong>
          <span>{step.text}</span>
        </div>
      ))}
    </div>
  );
}

function QuickActions({ onNavigate }: { onNavigate: (screen: string) => void }) {
  return (
    <section className="habit-card">
      <div className="block-title">
        <h2>Быстрые действия</h2>
        <span>каждое утро быстрее</span>
      </div>
      <div className="quick-grid">
        {quickActions.map((action) => (
          <button key={action.id} onClick={() => onNavigate(action.screen)}>
            <action.icon size={21} />
            <strong>{action.title}</strong>
            <span>{action.caption}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function SparklesIcon() {
  return <Coffee size={18} />;
}

function FavoriteDrinks({ products: list, onPick, onAdd }: { products: Product[]; onPick: (p: Product) => void; onAdd: (p: Product) => void }) {
  const first = list[0];
  const rest = list.slice(1);
  return (
    <section className="ritual-panel">
      <div className="block-title">
        <h2>Утренний ритуал</h2>
        <Repeat2 size={18} />
      </div>
      {first && (
        <article className="ritual-main" onClick={() => onPick(first)}>
          <img src={first.image} alt="" />
          <div>
            <span>обычно в 08:30</span>
            <strong>{first.name}</strong>
            <p>{first.tags[0]} · часто утром</p>
          </div>
          <button aria-label={`Добавить ${first.name}`} onClick={(event) => { event.stopPropagation(); onAdd(first); }}><Plus size={20} /></button>
        </article>
      )}
      <div className="ritual-mini-list">
        {rest.map((product) => (
          <article className="ritual-mini" key={product.id} onClick={() => onPick(product)}>
            <img src={product.image} alt="" />
            <div>
              <strong>{product.name}</strong>
              <span>{money(product.price)}</span>
            </div>
            <button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); onAdd(product); }}><Plus size={16} /></button>
          </article>
        ))}
      </div>
    </section>
  );
}

function CatalogPreview({
  products: list,
  onNavigate,
  onPick,
  onAdd,
}: {
  products: Product[];
  onNavigate: () => void;
  onPick: (p: Product) => void;
  onAdd: (p: Product) => void;
}) {
  return (
    <section className="catalog-preview">
      <div className="block-title">
        <h2>Каталог</h2>
        <button onClick={onNavigate}>Смотреть все</button>
      </div>
      <div className="catalog-chips">
        {categories.slice(0, 4).map((item) => <span key={item.id}>{item.title}</span>)}
      </div>
      <div className="catalog-soft-grid">
        {list.map((product) => (
          <article key={product.id} onClick={() => onPick(product)}>
            <img src={product.image} alt="" />
            <strong>{product.name}</strong>
            <div>
              <span>{money(product.price)}</span>
              <button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); onAdd(product); }}><Plus size={15} /></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function UpcomingOrders() {
  return (
    <section className="block">
      <div className="block-title"><h2>Ближайшие заказы</h2><Clock3 size={18} /></div>
      {upcomingOrders.map((order) => (
        <div className="order-line" key={order.id}>
          <div><strong>{order.title}</strong><span>{order.status}</span></div>
          <b>{order.when}</b>
        </div>
      ))}
    </section>
  );
}

function ProductRail({ title, products: list, onPick, onAdd }: { title: string; products: Product[]; onPick: (p: Product) => void; onAdd: (p: Product) => void }) {
  return (
    <section className="block">
      <div className="block-title"><h2>{title}</h2><Coffee size={18} /></div>
      <div className="product-rail">
        {list.map((product) => <ProductMini key={product.id} product={product} onPick={onPick} onAdd={onAdd} />)}
      </div>
    </section>
  );
}

function ProductMini({ product, onPick, onAdd }: { product: Product; onPick: (p: Product) => void; onAdd: (p: Product) => void }) {
  return (
    <article className="mini-card" onClick={() => onPick(product)}>
      <img src={product.image} alt="" />
      <strong>{product.name}</strong>
      <span>{money(product.price)}</span>
      <button aria-label={`Добавить ${product.name}`} onClick={(event) => { event.stopPropagation(); onAdd(product); }}><Plus size={16} /></button>
    </article>
  );
}

function SectionHeader({ title, text, icon }: { title: string; text: string; icon: JSX.Element }) {
  return (
    <div className="section-header">
      <div className="section-icon">{icon}</div>
      <div><h1>{title}</h1><p>{text}</p></div>
    </div>
  );
}

function CategoryTabs({ category, onChange }: { category: Category; onChange: (category: Category) => void }) {
  const iconByCategory = {
    hot: Coffee,
    cold: Snowflake,
    tea: Leaf,
    bakery: Croissant,
    snack: Sandwich,
    dessert: CakeSlice,
  };
  const labelByCategory = {
    hot: 'Горячий',
    cold: 'Холодный',
    tea: 'Чай',
    bakery: 'Выпечка',
    snack: 'Перекус',
    dessert: 'Десерты',
  };

  return (
    <div className="category-grid" role="tablist">
      {categories.map((item) => (
        <button className={classNames(category === item.id && 'active')} key={item.id} onClick={() => { selection(); onChange(item.id); }}>
          {(() => {
            const Icon = iconByCategory[item.id];
            return <Icon size={20} />;
          })()}
          <span>{labelByCategory[item.id]}</span>
        </button>
      ))}
    </div>
  );
}

function ProductCard({
  product,
  onPick,
  onAdd,
  onGift,
}: {
  product: Product;
  onPick: (p: Product) => void;
  onAdd: (p: Product) => void;
  onGift: (p: Product) => void;
}) {
  return (
    <article className="product-card" onClick={() => onPick(product)}>
      <img src={product.image} alt="" />
      <div>
        <strong>{product.name}</strong>
        <div className="tag-row">
          <span>{product.tags[0]}</span>
          <b>{money(product.price)}</b>
        </div>
      </div>
      <div className="product-actions">
        <button className="gift-product-button" onClick={(event) => { event.stopPropagation(); onGift(product); }} aria-label="Подарить напиток">
          <Gift size={17} />
        </button>
        <button className="add-product-button" onClick={(event) => { event.stopPropagation(); onAdd(product); }} aria-label="Добавить в заказ">
          <Plus size={20} />
        </button>
      </div>
    </article>
  );
}

function ProductSheet({
  product,
  onClose,
  onAdd,
  onGift,
}: {
  product: Product;
  onClose: () => void;
  onAdd: (p: Product, o: Partial<CartItem>) => void;
  onGift: () => void;
}) {
  const [size, setSize] = useState('Medium');
  const [syrup, setSyrup] = useState('Без сиропа');
  const [extraShot, setExtraShot] = useState(false);
  const adjusted = product.price + (size === 'Large' ? 18 : 0) + (extraShot ? 25 : 0);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <article className="product-sheet enter" onClick={(event) => event.stopPropagation()}>
        <img src={product.image} alt="" />
        <button className="icon-button close" onClick={onClose}><X size={18} /></button>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <OptionGroup label="Размер" options={['Small', 'Medium', 'Large']} value={size} onChange={setSize} />
        <OptionGroup label="Сироп" options={['Без сиропа', 'Ваниль', 'Карамель']} value={syrup} onChange={setSyrup} />
        <button className={classNames('toggle-row', extraShot && 'active')} onClick={() => setExtraShot(!extraShot)}>
          <span>Дополнительный эспрессо</span>
          {extraShot ? <Minus size={18} /> : <Plus size={18} />}
        </button>
        <button className="primary-button wide" onClick={() => { onAdd(product, { size, syrup, extraShot }); onClose(); }}>
          <ShoppingBag size={18} />
          Добавить в заказ · {money(adjusted)}
        </button>
        <button className="secondary-button wide gift-sheet-button" onClick={onGift}>
          <Gift size={18} />
          Подарить другу
        </button>
      </article>
    </div>
  );
}

function OptionGroup({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (value: string) => void }) {
  return (
    <div className="option-group">
      <span>{label}</span>
      <div>
        {options.map((option) => <button className={classNames(value === option && 'active')} key={option} onClick={() => { selection(); onChange(option); }}>{option}</button>)}
      </div>
    </div>
  );
}

function CartBar({ count, total, onCheckout, visible }: { count: number; total: number; timeMode: TimeMode; onTime: (m: TimeMode) => void; onCheckout: () => void; visible: boolean }) {
  if (!visible) return null;
  return (
    <aside className="cart-bar enter">
      <button className="primary-button wide" onClick={onCheckout}>
        <QrCode size={18} />
        {productCountLabel(count)} · {money(total)} · Оформить
      </button>
    </aside>
  );
}

function BottomSheet({ title, text, icon, onClose, children }: { title: string; text?: string; icon: JSX.Element; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop bottom-sheet-backdrop" onClick={onClose}>
      <section className="bottom-sheet enter" onClick={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="bottom-sheet-head">
          <div className="section-icon">{icon}</div>
          <div>
            <h2>{title}</h2>
            {text && <p>{text}</p>}
          </div>
          <button className="icon-button close-sheet" onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function CheckoutSheet({
  items,
  count,
  total,
  balance,
  timeMode,
  paymentMethod,
  onTime,
  onPayment,
  onRemove,
  onClose,
  onConfirm,
}: {
  items: CartItem[];
  count: number;
  total: number;
  balance: number;
  timeMode: TimeMode;
  paymentMethod: PaymentMethod;
  onTime: (mode: TimeMode) => void;
  onPayment: (method: PaymentMethod) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <BottomSheet title="Оформление" text={`${productCountLabel(count)} · выдача по коду у бариста`} icon={<QrCode />} onClose={onClose}>
      <div className="sheet-section">
        <span>Что в корзине</span>
        <div className="checkout-items">
          {items.map((item) => {
            const itemTotal = (item.price + (item.extraShot ? 25 : 0)) * item.quantity;
            return (
              <article className="checkout-cart-item" key={item.id}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.size} · {item.syrup}{item.extraShot ? ' · доп. эспрессо' : ''}</span>
                  <small>{item.quantity} шт · {money(itemTotal)}</small>
                </div>
                <button aria-label={`Удалить ${item.name}`} onClick={() => onRemove(item.id)}>
                  <Trash2 size={17} />
                </button>
              </article>
            );
          })}
        </div>
      </div>
      <div className="sheet-section">
        <span>Когда приготовить</span>
        <div className="sheet-segment">
          {[
            ['now', 'Сейчас'],
            ['15', 'Через 15 мин'],
            ['time', 'Ко времени'],
          ].map(([key, label]) => (
            <button key={key} className={classNames(timeMode === key && 'active')} onClick={() => { selection(); onTime(key as TimeMode); }}>{label}</button>
          ))}
        </div>
      </div>
      <div className="sheet-section">
        <span>Способ оплаты</span>
        <div className="payment-options">
          <button className={classNames(paymentMethod === 'card' && 'active')} onClick={() => onPayment('card')}>
            <Banknote size={20} />
            <div><strong>Картой</strong><small>Обычная оплата Apple Pay / картой</small></div>
            <b>{money(total)}</b>
          </button>
          <button className={classNames(paymentMethod === 'balance' && 'active')} onClick={() => onPayment('balance')}>
            <Wallet size={20} />
            <div><strong>С баланса</strong><small>Фишка для тех, кто пополняет заранее</small></div>
            <b>{money(balance)}</b>
          </button>
        </div>
      </div>
      <button className="primary-button wide sheet-main-action" onClick={onConfirm}>
        Оплатить {paymentMethod === 'balance' ? 'с баланса' : 'картой'} · {money(total)}
      </button>
    </BottomSheet>
  );
}

function AutoOrderSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  return (
    <BottomSheet title="Автозаказ" text="Кофе будет готов к твоему обычному приходу. Перед приготовлением придет подтверждение." icon={<CalendarClock />} onClose={onClose}>
      <div className="sheet-list">
        <div><span>Дни</span><strong>Каждый будний день</strong></div>
        <div><span>Время</span><strong>08:30</strong></div>
        <div><span>Заказ</span><strong>Капучино + круассан</strong></div>
      </div>
      <button className="primary-button wide sheet-main-action" onClick={() => { notify('success'); onSaved(); onClose(); }}>Включить автозаказ</button>
    </BottomSheet>
  );
}

function GiftSheet({ giftMode, onGiftMode, onClose, onContact, onSend }: { giftMode: 'drink' | 'amount'; onGiftMode: (mode: 'drink' | 'amount') => void; onClose: () => void; onContact: () => void; onSend: () => void }) {
  return (
    <BottomSheet title="Подарить кофе" text="Отправь напиток или сумму на баланс контакту Telegram." icon={<Gift />} onClose={onClose}>
      <Segmented value={giftMode} onChange={onGiftMode} left="Кофе" right="Баланс" />
      <div className="gift-preview sheet-gift-preview">
        <Gift size={34} />
        <strong>{giftMode === 'drink' ? 'Латте Vanilla Cloud' : '250 грн на баланс'}</strong>
        <span>Получатель выберет удобную кофейню</span>
      </div>
      <button className="secondary-button wide" onClick={() => { selection(); onContact(); }}><Contact size={18} />Выбрать контакт</button>
      <button className="primary-button wide sheet-main-action" onClick={onSend}><Send size={18} />Отправить подарок</button>
    </BottomSheet>
  );
}

function TopUpSheet({ onClose, onTopUp }: { onClose: () => void; onTopUp: (amount: number, bonus: number) => void }) {
  return (
    <BottomSheet title="Пополнить баланс" text="Баланс не обязателен. Это способ получать больше кофе за те же деньги." icon={<Wallet />} onClose={onClose}>
      <div className="topup-sheet-grid">
        {packages.map((pack) => (
          <button key={pack.amount} onClick={() => onTopUp(pack.amount, pack.bonus)}>
            <span>{money(pack.amount)}</span>
            <strong>{money(pack.amount + pack.bonus)}</strong>
            <small>{pack.label}</small>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

function ReferralSheet({ onClose, onReward }: { onClose: () => void; onReward: () => void }) {
  return (
    <BottomSheet title="Соседи оплачивают твой кофе" text="Приглашай соседей и получай до 10% от их заказов на кофейный баланс." icon={<Send />} onClose={onClose}>
      <div className="referral-link sheet-referral-link">
        <span>t.me/tgcoffee_bot/app?ref=sergey</span>
        <button onClick={onReward}><BadgeCheck size={17} />Скопировать</button>
      </div>
      <div className="referral-metrics">
        <Metric label="Соседей" value="3" />
        <Metric label="Начислено" value="200 грн" />
      </div>
      <small className="sheet-note">Условие: начисление после 500 грн покупок через приложение.</small>
    </BottomSheet>
  );
}

function SettingsSheet({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet title="Настройки" text="Основные параметры Telegram Mini App." icon={<Settings2 />} onClose={onClose}>
      <div className="sheet-list">
        {['Уведомления включены', 'Кофейня: Арсенальная', 'Оплата: карта или баланс'].map((item) => (
          <div key={item}><span>{item}</span><strong>Изменить</strong></div>
        ))}
      </div>
    </BottomSheet>
  );
}

function OrderComposer({
  cart,
  total,
  timeMode,
  onTime,
  onRemove,
  onCheckout,
}: {
  cart: CartItem[];
  total: number;
  timeMode: TimeMode;
  onTime: (mode: TimeMode) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}) {
  const first = cart[0];

  return (
    <section className="checkout-card">
      <div className="block-title">
        <h2>Ваш заказ</h2>
        <Grid2X2 size={18} />
      </div>
      {first && (
        <div className="checkout-item">
          <img src={first.image} alt="" />
          <div>
            <strong>{first.name}</strong>
            <span>{first.size} · {first.syrup}</span>
            <b>{money(total)}</b>
          </div>
          <button onClick={() => onRemove(first.id)} aria-label="Удалить из заказа">
            <Trash2 size={17} />
          </button>
        </div>
      )}
      <div className="checkout-times">
        <span>Время получения</span>
        {[
          ['now', 'Сейчас', ''],
          ['15', 'Через 15 минут', ''],
          ['time', 'Ко времени', '08:30'],
        ].map(([key, label, suffix]) => (
          <button key={key} className={classNames(timeMode === key && 'active')} onClick={() => { selection(); onTime(key as TimeMode); }}>
            <span>{label}</span>
            <b>{suffix}</b>
          </button>
        ))}
      </div>
      <div className="checkout-total">
        <strong>Итог</strong>
        <b>{money(total)}</b>
      </div>
      <button className="primary-button wide" onClick={onCheckout}>
        <QrCode size={18} />
        Оформить заказ
      </button>
      <small>Начислим 11 баллов</small>
    </section>
  );
}

function BottomNav({ screen, onChange }: { screen: Screen; onChange: (screen: Screen) => void }) {
  const items = useMemo(() => [
    ['home', Home, 'Главная'],
    ['menu', Coffee, 'Меню'],
    ['orders', ShoppingBag, 'Заказы'],
    ['profile', UserRound, 'Профиль'],
  ] as const, []);

  return (
    <nav className="bottom-nav">
      {items.map(([id, Icon, label]) => (
        <button className={classNames(screen === id && 'active')} key={id} onClick={() => onChange(id)}>
          <Icon size={19} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

function Segmented({ value, onChange, left, right }: { value: 'drink' | 'amount'; onChange: (value: 'drink' | 'amount') => void; left: string; right: string }) {
  return (
    <div className="segmented">
      <button className={classNames(value === 'drink' && 'active')} onClick={() => onChange('drink')}>{left}</button>
      <button className={classNames(value === 'amount' && 'active')} onClick={() => onChange('amount')}>{right}</button>
    </div>
  );
}

function ProfileBalance({ balance, onTopUp, onGift }: { balance: number; onTopUp: () => void; onGift: () => void }) {
  return (
    <section className="profile-balance-card">
      <div className="profile-balance-head">
        <span>Кофейный баланс</span>
        <strong>{money(balance)}</strong>
      </div>
      <div className="profile-balance-actions">
        <button className="primary-button" onClick={onTopUp}>
          <Wallet size={18} />
          Пополнить
        </button>
        <button className="secondary-button" onClick={onGift}>
          <Gift size={18} />
          Подарить другу
        </button>
      </div>
      <div className="balance-package-row">
        {packages.slice(0, 3).map((pack) => (
          <button key={pack.amount} onClick={onTopUp}>
            <span>{pack.amount}</span>
            <b>{pack.amount + pack.bonus}</b>
          </button>
        ))}
      </div>
    </section>
  );
}

function ReferralProfileCard({ onReward }: { onReward: () => void }) {
  return (
    <section className="profile-referral-card">
      <div>
        <span>Партнерская программа</span>
        <h2>Соседи оплачивают твой кофе</h2>
        <p>Приглашай соседей и получай до 10% от их заказов на свой кофейный баланс.</p>
      </div>
      <div className="referral-metrics">
        <Metric label="Соседей" value="3" />
        <Metric label="Начислено" value="200 грн" />
      </div>
      <div className="referral-link">
        <span>t.me/tgcoffee_bot/app?ref=sergey</span>
        <button onClick={onReward}><BadgeCheck size={17} />Скопировать</button>
      </div>
      <small>Условие: начисление после 500 грн покупок через приложение.</small>
    </section>
  );
}

function SettingsBlock({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="settings-block">
      {['Уведомления', 'Адрес кофейни', 'Способ оплаты'].map((item) => (
        <button key={item} onClick={onOpen}>
          <span>{item}</span>
          <ChevronRight size={18} />
        </button>
      ))}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function HistoryBlock({ onRepeat }: { onRepeat: () => void }) {
  return (
    <section className="block">
      <div className="block-title"><h2>История заказов</h2><History size={18} /></div>
      {orderHistory.map((order) => (
        <div className="list-row" key={order.id}>
          <div><strong>{order.title}</strong><span>{order.date} · код {order.code}</span></div>
          <button onClick={onRepeat}><Repeat2 size={16} />Повторить</button>
        </div>
      ))}
    </section>
  );
}

function Operations() {
  return (
    <section className="block">
      <div className="block-title"><h2>Операции</h2><Banknote size={18} /></div>
      {operations.map((operation) => (
        <div className="operation-row" key={operation.title}>
          <div><strong>{operation.title}</strong><span>{operation.meta}</span></div>
          <b>{operation.value}</b>
        </div>
      ))}
    </section>
  );
}

function SuccessModal({ kind, code, onQr, onClose }: { kind: SuccessKind; code: string; onQr: () => void; onClose: () => void }) {
  const copy = successCopy[kind];
  const Icon = copy.icon;
  const digits = code.split('');
  return (
    <div className="modal-backdrop">
      <article className="success-modal enter">
        <div className="success-mark"><Icon size={34} /></div>
        <h2>{kind === 'order' ? 'Спасибо!' : copy.title}</h2>
        {kind === 'order' && <strong className="accepted-title">Ваш заказ принят</strong>}
        <p>{copy.text}</p>
        {kind === 'order' && (
          <>
            <div className="pickup-code">
              <span>Назовите код бариста</span>
              <strong>{digits.map((digit, index) => <b key={`${digit}-${index}`}>{digit}</b>)}</strong>
            </div>
            <small className="ready-meta">Готовим к 08:30 · Арсенальная, 4</small>
            <button className="secondary-button wide" onClick={() => { selection(); onQr(); }}>Показать QR</button>
          </>
        )}
        <button className="primary-button wide" onClick={onClose}>Готово <ChevronRight size={18} /></button>
      </article>
    </div>
  );
}
