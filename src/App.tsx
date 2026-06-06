import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BadgeCheck,
  Banknote,
  CakeSlice,
  ChevronRight,
  Coffee,
  Croissant,
  Gift,
  History,
  Home,
  Leaf,
  Minus,
  Plus,
  QrCode,
  Send,
  Settings2,
  ShoppingBag,
  Snowflake,
  Trash2,
  Sandwich,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import {
  categories,
  operations,
  orderHistory,
  packages,
  products,
  successCopy,
  type Category,
  type Product,
} from './data';
import { bootTelegramMiniApp, impact, notify, selection } from './telegram';

type Screen = 'home' | 'menu' | 'orders' | 'profile';
type TimeMode = 'now' | '15' | 'time';
type AppSheet = 'gift' | 'giftReceive' | 'topup' | 'referral' | 'checkout' | 'settings' | 'orderDetails' | 'queue' | null;
type PaymentMethod = 'balance' | 'card';
type ActiveOrderMode = 'merge' | 'separate';
type CartItem = Product & { lineId: string; quantity: number; size: string; syrup: string; extraShot: boolean };
type SuccessKind = keyof typeof successCopy;

const money = (value: number) => `${value.toLocaleString('uk-UA')} грн`;
const cartLineId = (product: Product, size: string, syrup: string, extraShot: boolean) => `${product.id}:${size}:${syrup}:${extraShot ? 'shot' : 'base'}`;
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
  const [screen, setScreen] = useState<Screen>('menu');
  const [category, setCategory] = useState<Category>('hot');
  const [selected, setSelected] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [balance, setBalance] = useState(1250);
  const [animatedBalance, setAnimatedBalance] = useState(1250);
  const [timeMode, setTimeMode] = useState<TimeMode | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [activeOrderMode, setActiveOrderMode] = useState<ActiveOrderMode | null>(null);
  const [sheet, setSheet] = useState<AppSheet>(null);
  const [success, setSuccess] = useState<SuccessKind | null>(null);
  const [pickupCode, setPickupCode] = useState('4831');
  const [giftMode, setGiftMode] = useState<'drink' | 'amount'>('drink');
  const [giftProductId, setGiftProductId] = useState(products[1].id);
  const [topUpAmount, setTopUpAmount] = useState(packages[1].amount);
  const [referralRewardAvailable, setReferralRewardAvailable] = useState(200);
  const [toast, setToast] = useState('');
  const [topbarScrolled, setTopbarScrolled] = useState(false);
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

  useEffect(() => {
    const updateTopbar = () => setTopbarScrolled(window.scrollY > 8);
    updateTopbar();
    window.addEventListener('scroll', updateTopbar, { passive: true });
    return () => window.removeEventListener('scroll', updateTopbar);
  }, []);

  const filtered = products.filter((product) => product.category === category);
  const activeCategoryTitle = categories.find((item) => item.id === category)?.title ?? 'Каталог';
  const activeOrderItems = useMemo(() => [
    { product: products[0], quantity: 1 },
    { product: products[4], quantity: 1 },
    { product: products[1], quantity: 1 },
    { product: products[6], quantity: 1 },
  ], []);
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
    const size = overrides?.size ?? 'Medium';
    const syrup = overrides?.syrup ?? 'Без сиропа';
    const extraShot = overrides?.extraShot ?? false;
    const lineId = cartLineId(product, size, syrup, extraShot);
    setCart((items) => {
      const existing = items.find((item) => item.lineId === lineId);
      if (existing) {
        return items.map((item) => (item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [
        ...items,
        {
          ...product,
          lineId,
          quantity: 1,
          size,
          syrup,
          extraShot,
        },
      ];
    });
  };

  const removeFromCart = (lineId: string) => {
    impact('light');
    setCart((items) => {
      const next = items.filter((item) => item.lineId !== lineId);
      if (!next.length) window.setTimeout(() => setSheet(null), 0);
      return next;
    });
  };

  const incrementCartLine = (lineId: string) => {
    impact('light');
    setCart((items) => items.map((item) => (item.lineId === lineId ? { ...item, quantity: item.quantity + 1 } : item)));
  };

  const decrementCartLine = (lineId: string) => {
    impact('light');
    setCart((items) => {
      const next = items.flatMap((item) => {
        if (item.lineId !== lineId) return [item];
        if (item.quantity <= 1) return [];
        return [{ ...item, quantity: item.quantity - 1 }];
      });
      if (!next.length) window.setTimeout(() => setSheet(null), 0);
      return next;
    });
  };

  const clearCart = () => {
    impact('medium');
    setCart([]);
    setSheet(null);
    showToast('Корзина очищена');
  };

  const checkout = () => {
    if (!cart.length) {
      addToCart(products[0]);
      return;
    }
    if (!timeMode) {
      showToast('Выбери время приготовления');
      notify('error');
      return;
    }
    if (!paymentMethod) {
      showToast('Выбери способ оплаты');
      notify('error');
      return;
    }
    if (!activeOrderMode) {
      showToast('Выбери: добавить к текущему заказу или оформить отдельно');
      notify('error');
      return;
    }
    if (paymentMethod === 'balance' && balance < total) {
      showToast('На балансе не хватает денег. Пополни баланс или выбери карту');
      notify('error');
      return;
    }
    const code = activeOrderMode === 'merge' ? pickupCode : String(Math.floor(1000 + Math.random() * 8999));
    setPickupCode(code);
    if (paymentMethod === 'balance') {
      setBalance((value) => Math.max(0, value - total));
    }
    setCart([]);
    setTimeMode(null);
    setPaymentMethod(null);
    setActiveOrderMode(null);
    setSheet(null);
    notify('success');
    setSuccess('order');
  };

  const topUp = (amount: number, bonus: number) => {
    setBalance((value) => value + amount + bonus);
    notify('success');
    setSheet(null);
  };

  const openTopUp = (amount = packages[1].amount) => {
    selection();
    setTopUpAmount(amount);
    setSheet('topup');
  };

  const openGift = (product?: Product) => {
    selection();
    if (product) {
      setGiftMode('drink');
      setGiftProductId(product.id);
    }
    setSheet('gift');
  };

  const withdrawReferralReward = () => {
    selection();
    if (referralRewardAvailable <= 0) {
      showToast('В партнерке пока нет суммы к выводу');
      return;
    }
    const amount = referralRewardAvailable;
    setBalance((value) => value + amount);
    setReferralRewardAvailable(0);
    setSheet(null);
    notify('success');
    setSuccess('reward');
  };

  const isPrimaryScreen = (['home', 'menu', 'orders', 'profile'] as Screen[]).includes(screen);

  return (
    <div className="app">
      <header className={classNames('topbar', topbarScrolled && 'scrolled')}>
        <button className="icon-button ghost" onClick={() => (isPrimaryScreen ? go('profile') : go('home'))} aria-label={isPrimaryScreen ? 'Профиль' : 'Назад'}>
          {isPrimaryScreen ? <span className="avatar-photo" /> : <X size={20} />}
        </button>
        <div>
          <div className="brand">{screen === 'home' ? 'Доброе утро' : 'TG Coffee'}</div>
          <div className="branch">Арсенальная · 4 мин</div>
        </div>
        <button className="balance-chip" onClick={() => openTopUp()}>
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
            <BeginnerHome
              onMenu={() => go('menu')}
              onTopUp={() => openTopUp()}
              onGift={() => openGift()}
              onInvite={() => setSheet('referral')}
              onQueue={() => setSheet('queue')}
            />
          </section>
        )}

        {screen === 'menu' && (
          <section className="screen enter">
            <SectionHeader title="Что заказать?" text="Выбери напиток или еду. Нажми “Добавить”, потом корзину справа сверху." icon={<ShoppingBag />} />
            <MenuFirstHelp />
            <CategoryTabs category={category} onChange={setCategory} />
            <div className="block-title standalone"><h2>{activeCategoryTitle}</h2><Coffee size={18} /></div>
            <div className="product-list">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} onPick={setSelected} onAdd={addToCart} onGift={openGift} />
              ))}
            </div>
            <MenuPickupExplainer onOpen={() => setSheet('queue')} />
          </section>
        )}

        {screen === 'orders' && (
          <section className="screen enter">
            <SectionHeader title="Заказы" text="Проверь ближайшую выдачу, код бариста и историю заказов." icon={<ShoppingBag />} />
            <ActiveOrderCard code={pickupCode} items={activeOrderItems} onDetails={() => setSheet('orderDetails')} />
            <HistoryBlock onMenu={() => go('menu')} />
          </section>
        )}

        {screen === 'profile' && (
          <section className="screen enter">
            <SectionHeader title="Профиль" text="Баланс, подарки, партнерка и история операций." icon={<UserRound />} />
            <div className="profile-card">
              <div className="avatar">SN</div>
              <div><strong>Сергей</strong><span>+380 67 000 00 00</span></div>
            </div>
            <ProfileBalance balance={animatedBalance} onTopUp={openTopUp} onGift={() => openGift()} />
            <ReferralProfileCard
              available={referralRewardAvailable}
              onReward={withdrawReferralReward}
              onDetails={() => setSheet('referral')}
            />
            <ProfileGiftsCard onGift={() => openGift()} onReceive={() => setSheet('giftReceive')} />
            <Operations />
            <SettingsBlock onProfile={() => setSheet('settings')} onGifts={() => setSheet('giftReceive')} />
          </section>
        )}

      </main>

      <CartBar
        count={cartCount}
        total={total}
        onCheckout={() => setSheet('checkout')}
        visible={!selected && !success && screen === 'menu' && cartCount > 0}
      />
      {!selected && !success && <BottomNav screen={screen} onChange={go} />}
      {selected && <ProductSheet product={selected} onClose={() => setSelected(null)} onAdd={addToCart} onGift={() => { openGift(selected); setSelected(null); }} />}
      {sheet === 'checkout' && (
        <CheckoutSheet
          items={cart}
          count={cartCount}
          total={total}
          balance={animatedBalance}
          activeOrderCode={pickupCode}
          activeOrderMode={activeOrderMode}
          timeMode={timeMode}
          paymentMethod={paymentMethod}
          onActiveOrderMode={setActiveOrderMode}
          onTime={setTimeMode}
          onPayment={setPaymentMethod}
          onRemove={removeFromCart}
          onIncrement={incrementCartLine}
          onDecrement={decrementCartLine}
          onClear={clearCart}
          onTopUp={() => openTopUp()}
          onClose={() => setSheet(null)}
          onConfirm={checkout}
        />
      )}
      {sheet === 'gift' && (
        <GiftSheet
          initialProductId={giftProductId}
          giftMode={giftMode}
          onGiftMode={setGiftMode}
          onClose={() => setSheet(null)}
          onCopy={() => showToast('Ссылка на подарок скопирована')}
          onShare={() => showToast('Откроется отправка подарка в Telegram')}
          onDone={() => { setSheet(null); notify('success'); setSuccess('gift'); }}
        />
      )}
      {sheet === 'giftReceive' && <GiftReceiveSheet onClose={() => setSheet(null)} onActivate={() => { setSheet(null); notify('success'); setSuccess('receivedGift'); }} />}
      {sheet === 'topup' && <TopUpSheet initialAmount={topUpAmount} onClose={() => setSheet(null)} onTopUp={topUp} />}
      {sheet === 'referral' && (
        <ReferralSheet
          available={referralRewardAvailable}
          totalEarned={640}
          onClose={() => setSheet(null)}
          onReward={withdrawReferralReward}
          onCopy={() => showToast('Ссылка приглашения скопирована')}
          onShare={() => showToast('Откроется отправка в Telegram')}
        />
      )}
      {sheet === 'orderDetails' && <OrderDetailsSheet code={pickupCode} items={activeOrderItems} onClose={() => setSheet(null)} />}
      {sheet === 'queue' && <QueueSheet onClose={() => setSheet(null)} onOrders={() => { setSheet(null); go('orders'); }} />}
      {sheet === 'settings' && <SettingsSheet onClose={() => setSheet(null)} />}
      {success && <SuccessModal kind={success} code={pickupCode} onQr={() => showToast('QR-код будет доступен после подключения backend')} onClose={() => setSuccess(null)} />}
      {toast && <div className="toast" role="status">{toast}</div>}
    </div>
  );
}

function BeginnerHome({
  onMenu,
  onTopUp,
  onGift,
  onInvite,
  onQueue,
}: {
  onMenu: () => void;
  onTopUp: () => void;
  onGift: () => void;
  onInvite: () => void;
  onQueue: () => void;
}) {
  return (
    <>
      <section className="beginner-hero">
        <div>
          <span>Самое важное</span>
          <h1>Закажи кофе и забери без очереди</h1>
          <p>Выбираешь напиток, оплачиваешь картой или балансом, получаешь 4 цифры и называешь их бариста.</p>
        </div>
        <button className="primary-button wide" onClick={onMenu}><Coffee size={18} />Перейти к меню</button>
      </section>

      <section className="simple-steps-card">
        <div className="block-title"><h2>Как это работает</h2><QrCode size={18} /></div>
        <div className="simple-step"><b>1</b><div><strong>Выбери кофе</strong><span>Нажми “Добавить” рядом с напитком.</span></div></div>
        <div className="simple-step"><b>2</b><div><strong>Выбери время</strong><span>Сейчас, через 15 минут или ко времени.</span></div></div>
        <div className="simple-step"><b>3</b><div><strong>Оплати и назови код</strong><span>После оплаты появятся 4 цифры для бариста.</span></div></div>
      </section>

      <section className="plain-feature-list">
        <button onClick={onTopUp}>
          <Wallet size={22} />
          <div><strong>Баланс</strong><span>Бонус к пополнению</span></div>
          <ChevronRight size={18} />
        </button>
        <button onClick={onGift}>
          <Gift size={22} />
          <div><strong>Подарить</strong><span>Кофе или сумма ссылкой</span></div>
          <ChevronRight size={18} />
        </button>
        <button onClick={onInvite}>
          <Send size={22} />
          <div><strong>Соседи</strong><span>Награда за приглашения</span></div>
          <ChevronRight size={18} />
        </button>
        <button onClick={onQueue}>
          <QrCode size={22} />
          <div><strong>Код выдачи</strong><span>4 цифры для бариста</span></div>
          <ChevronRight size={18} />
        </button>
      </section>
    </>
  );
}

function MenuFirstHelp() {
  const steps = [
    'Добавь кофе',
    'Корзина',
    'Время',
    'Код бариста',
  ];

  return (
    <section className="menu-help-card">
      <div className="menu-help-main">
        <strong>Первый раз?</strong>
        <span>Добавь напиток, выбери время и оплати.</span>
      </div>
      <div className="menu-help-steps">
        {steps.map((title, index) => (
          <span key={title}>
            <b>{index + 1}</b>
            {title}
          </span>
        ))}
      </div>
    </section>
  );
}

function MenuPickupExplainer({ onOpen }: { onOpen: () => void }) {
  return (
    <section className="menu-pickup-card">
      <div className="pickup-compact-icon">
        <QrCode size={18} />
      </div>
      <div>
        <h2>Как забрать без очереди</h2>
        <p>Оплати в приложении, получи 4 цифры и назови код бариста.</p>
      </div>
      <button className="secondary-button" onClick={onOpen}>Подробнее</button>
    </section>
  );
}

function ActiveOrderCard({ code, items, onDetails }: { code: string; items: Array<{ product: Product; quantity: number }>; onDetails: () => void }) {
  const visible = items.slice(0, 3);
  const hidden = Math.max(0, items.length - visible.length);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const summary = items.map((item) => item.quantity > 1 ? `${item.product.name} ×${item.quantity}` : item.product.name).join(' · ');

  return (
    <section className="active-order-card">
      <div className="order-status-row">
        <span>Готовим</span>
        <b>08:30</b>
      </div>
      <button className="active-order-products" onClick={onDetails} aria-label={`Открыть состав заказа: ${summary}`}>
        <div className="active-order-thumbs">
          {visible.map((item) => (
            <img key={item.product.id} src={item.product.image} alt="" />
          ))}
          {hidden > 0 && <span>+{hidden}</span>}
        </div>
        <div>
          <span>В заказе</span>
          <strong>{productCountLabel(totalQuantity)}</strong>
        </div>
        <ChevronRight size={19} />
      </button>
      <h2>Заказ готовится</h2>
      <p>Когда подойдешь к стойке, назови бариста этот код.</p>
      <div className="pickup-code">
        {code.split('').map((digit, index) => <strong key={`${digit}-${index}`}>{digit}</strong>)}
      </div>
    </section>
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
          <span>Подарить</span>
        </button>
        <button className="add-product-button" onClick={(event) => { event.stopPropagation(); onAdd(product); }} aria-label="Добавить в заказ">
          <Plus size={20} />
          <span>Добавить</span>
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

function CartBar({ count, total, onCheckout, visible }: { count: number; total: number; onCheckout: () => void; visible: boolean }) {
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

function BottomSheet({ title, text, icon, className, onClose, children }: { title: string; text?: string; icon: JSX.Element; className?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-backdrop bottom-sheet-backdrop" onClick={onClose}>
      <section className={classNames('bottom-sheet enter', className)} onClick={(event) => event.stopPropagation()}>
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
  activeOrderCode,
  activeOrderMode,
  timeMode,
  paymentMethod,
  onActiveOrderMode,
  onTime,
  onPayment,
  onRemove,
  onIncrement,
  onDecrement,
  onClear,
  onTopUp,
  onClose,
  onConfirm,
}: {
  items: CartItem[];
  count: number;
  total: number;
  balance: number;
  activeOrderCode: string;
  activeOrderMode: ActiveOrderMode | null;
  timeMode: TimeMode | null;
  paymentMethod: PaymentMethod | null;
  onActiveOrderMode: (mode: ActiveOrderMode) => void;
  onTime: (mode: TimeMode) => void;
  onPayment: (method: PaymentMethod) => void;
  onRemove: (id: string) => void;
  onIncrement: (id: string) => void;
  onDecrement: (id: string) => void;
  onClear: () => void;
  onTopUp: () => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const balanceShortage = Math.max(0, total - balance);
  const balanceInsufficient = paymentMethod === 'balance' && balanceShortage > 0;
  const activeOrderDecisionMissing = Boolean(activeOrderCode && !activeOrderMode);
  const canPay = Boolean(timeMode && paymentMethod && !balanceInsufficient && !activeOrderDecisionMissing);
  const ctaText = activeOrderDecisionMissing
    ? `К заказу ${activeOrderCode} или отдельно?`
    : !timeMode
      ? `Выбери время · ${money(total)}`
      : !paymentMethod
        ? `Выбери оплату · ${money(total)}`
        : balanceInsufficient
          ? `Не хватает ${money(balanceShortage)}`
          : `Оплатить ${paymentMethod === 'balance' ? 'с баланса' : 'картой'} · ${money(total)}`;
  return (
    <BottomSheet title="Корзина" text={`${productCountLabel(count)} · выбери время и оплату`} icon={<QrCode />} className="checkout-sheet" onClose={onClose}>
      <div className="checkout-sheet-layout">
      <div className="sheet-section checkout-products-section">
        <div className="checkout-section-head">
          <span>Что в корзине</span>
          <button onClick={onClear}>Очистить</button>
        </div>
        <div className="checkout-items">
          {items.map((item) => {
            const itemTotal = (item.price + (item.extraShot ? 25 : 0)) * item.quantity;
            return (
              <article className="checkout-cart-item" key={item.lineId}>
                <img src={item.image} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.size} · {item.syrup}{item.extraShot ? ' · доп. эспрессо' : ''}</span>
                  <small>{item.quantity} шт · {money(itemTotal)}</small>
                </div>
                <div className="cart-quantity-controls">
                  <button aria-label={`Убрать одну позицию ${item.name}`} onClick={() => onDecrement(item.lineId)}>
                    <Minus size={16} />
                  </button>
                  <b>{item.quantity}</b>
                  <button aria-label={`Добавить еще одну позицию ${item.name}`} onClick={() => onIncrement(item.lineId)}>
                    <Plus size={16} />
                  </button>
                  <button aria-label={`Удалить ${item.name}`} onClick={() => onRemove(item.lineId)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
      {activeOrderCode && (
        <div className="sheet-section active-order-decision">
          <span>Уже готовится заказ с кодом {activeOrderCode}</span>
          <div className="active-order-choice">
            <button className={classNames(activeOrderMode === 'merge' && 'active')} onClick={() => { selection(); onActiveOrderMode('merge'); }}>
              <QrCode size={18} />
              <div>
                <strong>Добавить к заказу {activeOrderCode}</strong>
                <small>Бариста увидит это как дополнение к текущему коду.</small>
              </div>
            </button>
            <button className={classNames(activeOrderMode === 'separate' && 'active')} onClick={() => { selection(); onActiveOrderMode('separate'); }}>
              <ShoppingBag size={18} />
              <div>
                <strong>Оформить отдельный заказ</strong>
                <small>Получишь новый код выдачи для второго заказа.</small>
              </div>
            </button>
          </div>
        </div>
      )}
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
            <div><strong>С баланса</strong><small>{balance >= total ? 'Списать с кофейного баланса' : `Не хватает ${money(total - balance)}`}</small></div>
            <b>{money(balance)}</b>
          </button>
        </div>
      </div>
      {balanceInsufficient && (
        <div className="low-balance-notice">
          <div>
            <strong>На балансе не хватает {money(balanceShortage)}</strong>
            <span>Пополни баланс с бонусом или выбери оплату картой.</span>
          </div>
          <button onClick={onTopUp}><Wallet size={17} />Пополнить</button>
        </div>
      )}
      <button className="primary-button wide sheet-main-action" disabled={!canPay} onClick={onConfirm}>
        {ctaText}
      </button>
      </div>
    </BottomSheet>
  );
}

function OrderDetailsSheet({ code, items, onClose }: { code: string; items: Array<{ product: Product; quantity: number }>; onClose: () => void }) {
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  return (
    <BottomSheet title="Детали заказа" text="Состав, статус и код получения в одном месте." icon={<ShoppingBag />} onClose={onClose}>
      <div className="order-detail-status">
        <div><span>Статус</span><strong>Готовим</strong></div>
        <div><span>Будет готов</span><strong>08:30</strong></div>
        <div><span>Оплата</span><strong>Картой</strong></div>
      </div>
      <div className="sheet-section">
        <span>Позиции</span>
        <div className="active-order-items order-detail-items" aria-label="Позиции активного заказа">
          {items.map((item) => (
            <div className="active-order-item" key={item.product.id}>
              <img src={item.product.image} alt="" />
              <div>
                <strong>{item.product.name}</strong>
                <span>{item.product.tags[0]} · {item.quantity} шт</span>
              </div>
              <b>{money(item.product.price * item.quantity)}</b>
            </div>
          ))}
        </div>
      </div>
      <div className="order-detail-code">
        <span>Код бариста</span>
        <strong>{code}</strong>
      </div>
      <div className="sheet-total-row"><span>Итого</span><strong>{money(total)}</strong></div>
    </BottomSheet>
  );
}

function QueueSheet({ onClose, onOrders }: { onClose: () => void; onOrders: () => void }) {
  return (
    <BottomSheet title="Как работает выдача" text="Заказ готовится заранее, а на стойке ты называешь код. Никакой очереди на оплату." icon={<QrCode />} onClose={onClose}>
      <div className="queue-steps">
        <div><b>1</b><strong>Оформляешь в приложении</strong><span>Выбираешь время: сейчас, через 15 минут или ко времени.</span></div>
        <div><b>2</b><strong>Получаешь 4 цифры</strong><span>Код появляется после оплаты и остается в активном заказе.</span></div>
        <div><b>3</b><strong>Забираешь у бариста</strong><span>Называешь код, бариста отдает именно твой заказ.</span></div>
      </div>
      <button className="primary-button wide sheet-main-action" onClick={onOrders}>Открыть мои заказы</button>
    </BottomSheet>
  );
}

function GiftSheet({
  initialProductId,
  giftMode,
  onGiftMode,
  onClose,
  onCopy,
  onShare,
  onDone,
}: {
  initialProductId: string;
  giftMode: 'drink' | 'amount';
  onGiftMode: (mode: 'drink' | 'amount') => void;
  onClose: () => void;
  onCopy: () => void;
  onShare: () => void;
  onDone: () => void;
}) {
  const [giftProductId, setGiftProductId] = useState(initialProductId);
  const [giftPackage, setGiftPackage] = useState(packages[0].amount);
  const [giftReady, setGiftReady] = useState(false);
  useEffect(() => {
    setGiftProductId(initialProductId);
    setGiftReady(false);
  }, [initialProductId]);
  const selectedGift = products.find((product) => product.id === giftProductId) ?? products[1];
  const selectedPack = packages.find((pack) => pack.amount === giftPackage) ?? packages[0];
  const giftPrice = giftMode === 'drink' ? selectedGift.price : selectedPack.amount;
  const giftValue = giftMode === 'drink' ? selectedGift.name : money(selectedPack.amount + selectedPack.bonus);
  const changeGiftMode = (mode: 'drink' | 'amount') => {
    setGiftReady(false);
    onGiftMode(mode);
  };
  const changeGiftProduct = (productId: string) => {
    selection();
    setGiftReady(false);
    setGiftProductId(productId);
  };
  const changeGiftPackage = (amount: number) => {
    selection();
    setGiftReady(false);
    setGiftPackage(amount);
  };
  const createGift = () => {
    notify('success');
    setGiftReady(true);
  };
  return (
    <BottomSheet title="Подарить кофе" text="Выбери напиток или бандл баланса, оплати подарок и отправь ссылку в любой чат." icon={<Gift />} onClose={onClose}>
      <Segmented value={giftMode} onChange={changeGiftMode} left="Кофе" right="Баланс" />
      {giftMode === 'drink' ? (
        <div className="gift-picker-list">
          {products.filter((product) => product.popular).map((product) => (
            <button key={product.id} className={classNames(giftProductId === product.id && 'active')} onClick={() => changeGiftProduct(product.id)}>
              <img src={product.image} alt="" />
              <div><strong>{product.name}</strong><span>{product.tags[0]}</span></div>
              <b>{money(product.price)}</b>
            </button>
          ))}
        </div>
      ) : (
        <div className="gift-bundle-grid">
          {packages.slice(0, 4).map((pack) => (
            <button key={pack.amount} className={classNames(giftPackage === pack.amount && 'active')} onClick={() => changeGiftPackage(pack.amount)}>
              <span>Оплатить {money(pack.amount)}</span>
              <strong>Подарок {money(pack.amount + pack.bonus)}</strong>
              <small>{pack.label}</small>
            </button>
          ))}
        </div>
      )}
      <div className="gift-link-preview">
        <span>{giftReady ? 'Ссылка готова' : 'После оплаты создадим ссылку'}</span>
        <strong>{giftReady ? 't.me/tgcoffee_bot/app?gift=8F4C' : `Подарок: ${giftValue}`}</strong>
        <small>{giftReady ? 'Теперь ссылку можно скопировать или сразу отправить в Telegram.' : 'Получатель откроет ссылку, увидит подарок и заберет напиток или баланс в профиле.'}</small>
      </div>
      <div className="gift-storage-note">
        <Gift size={17} />
        <div>
          <strong>Где хранится подарок</strong>
          <span>У отправителя ссылка остается в профиле. У получателя подарок появится после перехода по ссылке и активации.</span>
        </div>
      </div>
      <div className="gift-share-actions">
        <button className="secondary-button" disabled={!giftReady} onClick={onCopy}><BadgeCheck size={17} />Скопировать ссылку</button>
        <button className="secondary-button" disabled={!giftReady} onClick={onDone}><X size={17} />Готово</button>
      </div>
      <button className="primary-button wide sheet-main-action" onClick={giftReady ? onShare : createGift}>
        {giftReady ? <Send size={18} /> : <BadgeCheck size={18} />}
        {giftReady ? 'Отправить в чат' : `Оплатить ${money(giftPrice)} и создать ссылку`}
      </button>
    </BottomSheet>
  );
}

function TopUpSheet({ initialAmount, onClose, onTopUp }: { initialAmount: number; onClose: () => void; onTopUp: (amount: number, bonus: number) => void }) {
  const [selectedAmount, setSelectedAmount] = useState(initialAmount);
  useEffect(() => {
    setSelectedAmount(initialAmount);
  }, [initialAmount]);
  const selectedPack = packages.find((pack) => pack.amount === selectedAmount) ?? packages[1];
  return (
    <BottomSheet title="Пополнить баланс" text="Баланс не обязателен. Это способ получать больше кофе за те же деньги." icon={<Wallet />} onClose={onClose}>
      <div className="balance-explain-card">
        <span>Принцип простой</span>
        <strong>Платишь меньше, на кофе получаешь больше</strong>
        <p>Деньги сразу появляются на кофейном балансе вместе с бонусом. Потом можно платить балансом или обычной картой.</p>
      </div>
      <div className="topup-sheet-grid">
        {packages.map((pack) => (
          <button className={classNames(selectedAmount === pack.amount && 'active')} key={pack.amount} onClick={() => { selection(); setSelectedAmount(pack.amount); }}>
            <div className="balance-equation" aria-hidden="true">
              <span>
                <small>С карты спишется</small>
                <b>{money(pack.amount)}</b>
              </span>
              <i>→</i>
              <span>
                <small>На кофе будет</small>
                <b>{money(pack.amount + pack.bonus)}</b>
              </span>
            </div>
            <div className="package-value">
              <strong>Бонус кофейни: +{money(pack.bonus)}</strong>
              <small>{pack.label}</small>
            </div>
          </button>
        ))}
      </div>
      <div className="balance-result-row">
        <span>С карты спишется {money(selectedPack.amount)}</span>
        <strong>На баланс придет {money(selectedPack.amount + selectedPack.bonus)}</strong>
        <small>Кофейня добавит бонус {money(selectedPack.bonus)} сразу после оплаты.</small>
      </div>
      <button className="primary-button wide sheet-main-action" onClick={() => onTopUp(selectedPack.amount, selectedPack.bonus)}>
        Оплатить {money(selectedPack.amount)}
      </button>
    </BottomSheet>
  );
}

function ReferralSheet({
  available,
  totalEarned,
  onClose,
  onReward,
  onCopy,
  onShare,
}: {
  available: number;
  totalEarned: number;
  onClose: () => void;
  onReward: () => void;
  onCopy: () => void;
  onShare: () => void;
}) {
  const neighbors = [
    { name: 'Анна', spent: 420 },
    { name: 'Максим', spent: 500 },
    { name: 'Оля', spent: 180 },
  ];
  return (
    <BottomSheet title="Соседи оплачивают твой кофе" text="Приглашай соседей и получай до 10% от их заказов на кофейный баланс." icon={<Send />} onClose={onClose}>
      <div className="referral-wallet">
        <span>Доступно к выводу</span>
        <strong>{money(available)}</strong>
        <small>Награда копится здесь и попадает на баланс только после вывода. Начисление открывается после 500 грн покупок соседа.</small>
        <button disabled={available <= 0} onClick={onReward}><Wallet size={17} />{available > 0 ? `Вывести ${money(available)} на баланс` : 'Нет суммы к выводу'}</button>
      </div>
      <div className="referral-link sheet-referral-link">
        <span>t.me/tgcoffee_bot/app?ref=sergey</span>
      </div>
      <div className="referral-share-actions">
        <button className="secondary-button" onClick={() => { selection(); onCopy(); }}><BadgeCheck size={17} />Скопировать</button>
        <button className="secondary-button" onClick={() => { selection(); onShare(); }}><Send size={18} />Отправить в чат</button>
      </div>
      <div className="referral-metrics">
        <Metric label="Соседей" value="3" />
        <Metric label="Всего заработано" value={money(totalEarned)} />
      </div>
      <div className="neighbor-list">
        {neighbors.map((neighbor) => {
          const progress = Math.min(100, Math.round((neighbor.spent / 500) * 100));
          const remaining = Math.max(0, 500 - neighbor.spent);
          return (
            <div className="neighbor-row" key={neighbor.name}>
              <div>
                <strong>{neighbor.name}</strong>
                <span>{money(neighbor.spent)} из 500 грн · {remaining > 0 ? `осталось ${money(remaining)}` : 'условие выполнено'}</span>
              </div>
              <div className="neighbor-progress"><i style={{ width: `${progress}%` }} /></div>
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}

function SettingsSheet({ onClose }: { onClose: () => void }) {
  return (
    <BottomSheet title="Данные профиля" text="Здесь будут данные, которые реально нужны для заказа и связи с бариста." icon={<Settings2 />} onClose={onClose}>
      <div className="phone-access-card">
        <strong>Телефон нужен только для связи по заказу</strong>
        <span>При первом входе бот попросит номер одной кнопкой Telegram. Потом номер можно заменить здесь, без ручного ввода.</span>
        <button><UserRound size={17} />Заменить номер через Telegram</button>
      </div>
      <div className="sheet-list">
        <div><span>Телефон</span><strong>+380 67 000 00 00</strong></div>
        <div><span>Имя</span><strong>Сергей</strong></div>
      </div>
    </BottomSheet>
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

function ProfileBalance({ balance, onTopUp, onGift }: { balance: number; onTopUp: (amount?: number) => void; onGift: () => void }) {
  return (
    <section className="profile-balance-card">
      <div className="profile-balance-head">
        <span>Кофейный баланс</span>
        <strong>{money(balance)}</strong>
      </div>
      <div className="profile-balance-actions">
        <button className="primary-button" onClick={() => onTopUp()}>
          <Wallet size={18} />
          Пополнить
        </button>
        <button className="secondary-button" onClick={onGift}>
          <Gift size={18} />
          Подарить другу
        </button>
      </div>
      <p>Баланс не обязателен. Это способ получать больше кофе за те же деньги.</p>
    </section>
  );
}

function ReferralProfileCard({
  available,
  onReward,
  onDetails,
}: {
  available: number;
  onReward: () => void;
  onDetails: () => void;
}) {
  return (
    <section className="profile-feature-row">
      <Send size={22} />
      <div className="profile-feature-copy">
        <span>Партнерка</span>
        <strong>Соседи оплачивают твой кофе</strong>
        <small>3 соседа · {money(available)} к выводу</small>
      </div>
      <div className="referral-profile-actions">
        <button className="secondary-button" onClick={onDetails}>Подробнее</button>
        <button className="primary-button" disabled={available <= 0} onClick={onReward}><Wallet size={18} />{available > 0 ? `Вывести ${money(available)}` : 'Нет суммы'}</button>
      </div>
    </section>
  );
}

function GiftReceiveSheet({ onClose, onActivate }: { onClose: () => void; onActivate: () => void }) {
  return (
    <BottomSheet title="Подарок по ссылке" text="Так выглядит экран получателя после перехода по подарочной ссылке." icon={<Gift />} onClose={onClose}>
      <div className="gift-claim-card">
        <img src={products[1].image} alt="" />
        <div>
          <span>Подарок от Анны</span>
          <strong>Латте Vanilla Cloud</strong>
          <small>350 мл · уже оплачен отправителем</small>
        </div>
      </div>
      <div className="gift-receive-steps">
        <div><b>1</b><span>Открываешь ссылку в Telegram</span></div>
        <div><b>2</b><span>Активируешь подарок в профиле</span></div>
        <div><b>3</b><span>В кофейне получаешь код выдачи</span></div>
      </div>
      <div className="gift-link-preview">
        <span>Где хранится</span>
        <strong>Профиль · Подарки</strong>
        <small>Если подарили баланс, сумма появится на кофейном балансе. Если напиток, он хранится как активный подарок до получения.</small>
      </div>
      <button className="primary-button wide sheet-main-action" onClick={onActivate}>Активировать подарок</button>
    </BottomSheet>
  );
}

function ProfileGiftsCard({ onGift, onReceive }: { onGift: () => void; onReceive: () => void }) {
  return (
    <section className="profile-feature-row profile-gifts-row">
      <Gift size={22} />
      <div className="profile-feature-copy">
        <span>Подарки</span>
        <strong>1 активный подарок</strong>
        <small>Создай ссылку или открой подарок, который прислали тебе.</small>
      </div>
      <div className="profile-gift-actions">
        <button className="primary-button" onClick={onGift}>Создать подарок</button>
        <button className="secondary-button" onClick={onReceive}>Открыть подарок по ссылке</button>
      </div>
    </section>
  );
}

function SettingsBlock({ onProfile, onGifts }: { onProfile: () => void; onGifts: () => void }) {
  return (
    <section className="settings-block profile-plain-list">
      <div className="settings-block-head">
        <span>Данные и помощь</span>
        <small>Только то, что нужно для заказа.</small>
      </div>
      <button onClick={onProfile}>
        <UserRound size={18} />
        <span>Телефон и имя</span>
        <small>Номер можно заменить через Telegram</small>
        <ChevronRight size={18} />
      </button>
      <button onClick={onGifts}>
        <Gift size={18} />
        <span>Открыть подарок по ссылке</span>
        <small>Подарки хранятся в профиле</small>
        <ChevronRight size={18} />
      </button>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;
}

function HistoryBlock({ onMenu }: { onMenu: () => void }) {
  return (
    <section className="block">
      <div className="block-title"><h2>История заказов</h2><History size={18} /></div>
      {orderHistory.map((order) => (
        <div className="list-row" key={order.id}>
          <div><strong>{order.title}</strong><span>{order.date} · код {order.code}</span></div>
          <button onClick={onMenu}><Coffee size={16} />В меню</button>
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
