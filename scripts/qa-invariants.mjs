import fs from 'node:fs';

const files = {
  app: 'src/App.tsx',
  data: 'src/data.ts',
  styles: 'src/styles.css',
  telegram: 'src/telegram.ts',
  packageJson: 'package.json',
  deferredFeatures: 'docs/deferred-features.md',
  botMessages: 'docs/bot-messages.md',
  orderStates: 'docs/order-states.md',
};

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read(files.app);
const data = read(files.data);
const styles = read(files.styles);
const telegram = read(files.telegram);
const deferredFeatures = read(files.deferredFeatures);
const botMessages = read(files.botMessages);
const orderStates = read(files.orderStates);
const packageJson = JSON.parse(read(files.packageJson));

const checks = [];
const check = (name, condition, detail = '') => {
  checks.push({ name, pass: Boolean(condition), detail });
};

check('Bottom navigation has exactly four product sections', /type Screen = 'home' \| 'menu' \| 'orders' \| 'profile'/.test(app));
check('App opens on menu for first-time clarity', /useState<Screen>\('menu'\)/.test(app));
check('Menu has lightweight beginner ordering instructions', /function MenuFirstHelp/.test(app) && /Первый раз\?/.test(app) && /Добавь напиток, выбери время и оплати/.test(app) && /Добавь кофе/.test(app) && /Корзина/.test(app) && /Время/.test(app) && /Код бариста/.test(app) && /menu-help-card[\s\S]*background: transparent/.test(styles) && /menu-help-card[\s\S]*box-shadow: none/.test(styles) && !/menu-help-actions|Выбрать кофе|Баланс с бонусом/.test(app + styles));
check('Menu explains pickup by code without another heavy card', /function MenuPickupExplainer/.test(app) && /Как забрать без очереди/.test(app) && /получи 4 цифры/.test(app) && /Подробнее/.test(app) && /menu-pickup-card[\s\S]*grid-template-columns: 42px/.test(styles) && /menu-pickup-card[\s\S]*background: transparent/.test(styles) && /menu-pickup-card[\s\S]*box-shadow: none/.test(styles) && !/pickup-mini-steps/.test(app + styles));
check('Queue explanation uses a light timeline instead of stacked cards', /function QueueSheet/.test(app) && /queue-steps div:not\(:last-child\)::after/.test(styles) && /queue-steps div[\s\S]*background: transparent/.test(styles) && /queue-steps div[\s\S]*box-shadow: none/.test(styles) && /queue-steps b[\s\S]*background: rgba\(255,255,255,.58\)/.test(styles));
check('Menu categories use an obvious grid, not a hidden carousel', /category-grid[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/.test(styles) && !/category-grid[\s\S]{0,240}overflow-x|scroll-snap|grid-auto-flow: column/.test(styles));
check('Product cards expose explicit add button text', /className="add-product-button"[\s\S]*<span>Добавить<\/span>/.test(app));
check('Product cards expose explicit gift button text', /className="gift-product-button"[\s\S]*<span>Подарить<\/span>/.test(app));
check('Home explains the primary coffee flow first', /function BeginnerHome/.test(app) && /Как это работает/.test(app) && /Закажи кофе и забери без очереди/.test(app) && /Выбери кофе/.test(app) && /Оплати и назови код/.test(app));
check('Secondary home features are compact, not screen-consuming', /plain-feature-list[\s\S]*grid-template-columns: repeat\(2/.test(styles) && /plain-feature-list button[\s\S]*min-height: 64px/.test(styles) && /Баланс/.test(app) && /Код выдачи/.test(app) && !/Пополняешь на 1000 грн/.test(app));
check('Balance is not a bottom navigation tab', !/\['balance'|Баланс',\s*Wallet/.test(app));
check('Header balance opens top-up flow', /className="balance-chip"[\s\S]*openTopUp\(\)/.test(app));
check('Header uses cart instead of notification bell', /header-cart-button/.test(app) && !/Bell/.test(app));
check('Topbar becomes liquid glass only after scroll', /topbarScrolled/.test(app) && /\.topbar\.scrolled[\s\S]*backdrop-filter/.test(styles));
check('Checkout receives cart items', /<CheckoutSheet[\s\S]*items=\{cart\}/.test(app));
check('Checkout displays item thumbnails', /className="checkout-cart-item"[\s\S]*<img src=\{item\.image\}/.test(app));
check('Checkout supports removing cart lines', /onRemove\(item\.lineId\)/.test(app) && /Удалить/.test(app));
check('Checkout can clear cart and adjust quantities', /onClear=\{clearCart\}/.test(app) && /onIncrement=\{incrementCartLine\}/.test(app) && /onDecrement=\{decrementCartLine\}/.test(app) && /Очистить/.test(app));
check('Checkout requires explicit time and payment', /useState<TimeMode \| null>\(null\)/.test(app) && /useState<PaymentMethod \| null>\(null\)/.test(app) && /!timeMode/.test(app) && /!paymentMethod/.test(app) && /disabled=\{!canPay\}/.test(app));
check('Checkout asks how to handle forgotten items during active order', /type ActiveOrderMode = 'merge' \| 'separate'/.test(app) && /activeOrderDecisionMissing/.test(app) && /!balanceInsufficient && !activeOrderDecisionMissing/.test(app) && /Добавить к заказу \{activeOrderCode\}/.test(app) && /Оформить отдельный заказ/.test(app) && /active-order-choice/.test(app + styles) && /activeOrderMode === 'merge' \? pickupCode/.test(app));
check('Checkout sheet scroll is limited to cart items', /className="checkout-sheet"/.test(app) && /\.bottom-sheet\.checkout-sheet[\s\S]*overflow: hidden/.test(styles) && /\.checkout-items[\s\S]*overflow-y: auto/.test(styles));
check('Cart lines include product options', /cartLineId\(product, size, syrup, extraShot\)/.test(app));
check('Same product with different options does not merge', /item\.lineId === lineId/.test(app));
check('Extra espresso total is multiplied by quantity', /\(item\.price \+ \(item\.extraShot \? 25 : 0\)\) \* item\.quantity/.test(app));
check('Payment supports card and balance', /type PaymentMethod = 'balance' \| 'card'/.test(app) && /Картой/.test(app) && /С баланса/.test(app));
check('Balance payment decrements balance only for balance method', /if \(paymentMethod === 'balance'\)[\s\S]*setBalance/.test(app));
check('Insufficient balance is blocked before checkout', /paymentMethod === 'balance' && balance < total/.test(app) && /Не хватает/.test(app));
check('Insufficient balance checkout has explicit refill path', /balanceInsufficient/.test(app) && /low-balance-notice/.test(app + styles) && /Пополнить/.test(app) && /Не хватает \${money\(balanceShortage\)}/.test(app));
check('Active order shows product thumbnails and overflow count', /active-order-thumbs/.test(app) && /\+{hidden}/.test(app));
check('Active order details live in a bottom sheet', /sheet === 'orderDetails'/.test(app) && /function OrderDetailsSheet/.test(app) && /order-detail-items/.test(styles) && !/active-order-more|active-order-summary/.test(app + styles));
check('First release hides repeat-usual and auto-order from runtime', !/sheet === 'repeat'|sheet === 'auto'|function RepeatOrderSheet|function AutoOrderSheet|function AutoOrdersPanel|Заказать как обычно|Автозаказ|Повторить/.test(app));
check('First release removes repeat-usual and auto-order style leftovers', !/repeat-|auto-|auto-payment|auto-order|auto-orders|auto-status|auto-confirm/.test(styles));
check('Deferred repeat-usual and auto-order are documented', /## Заказать как обычно/.test(deferredFeatures) && /## Автозаказ/.test(deferredFeatures) && /Status: deferred after first release/.test(deferredFeatures) && /Future entry points/.test(deferredFeatures) && /Required states/.test(deferredFeatures));
check('Top-up clearly explains pay less get more', /Платишь меньше/.test(app) && /С карты спишется/.test(app) && /На баланс придет/.test(app) && /Бонус кофейни: \+/.test(app) && /Кофейня добавит бонус/.test(app) && /balance-equation/.test(app + styles) && /Оплатить \{money\(selectedPack\.amount\)\}/.test(app));
check('Top-up active state is warm, not dark monochrome', /topup-sheet-grid button\.active[\s\S]*232, 188, 143/.test(styles) && !/topup-sheet-grid button\.active[\s\S]{0,180}background: var\(--coffee-dark\)/.test(styles));
check('Top-up packages select and pay the exact chosen amount', /const \[topUpAmount, setTopUpAmount\]/.test(app) && /function TopUpSheet\(\{ initialAmount/.test(app) && /useEffect\(\(\) => \{\s*setSelectedAmount\(initialAmount\)/.test(app) && /setSelectedAmount\(pack\.amount\)/.test(app) && /onTopUp\(selectedPack\.amount, selectedPack\.bonus\)/.test(app));
check('Profile balance is compact and packages live in top-up sheet', /function ProfileBalance/.test(app) && /Баланс не обязателен/.test(app) && !/balance-package-row/.test(app + styles) && /function TopUpSheet/.test(app) && /С карты спишется/.test(app) && /На баланс придет/.test(app) && /Бонус кофейни: \+/.test(app));
check('Gift flow selects drink or balance bundle and creates a link', /gift-picker-list/.test(app + styles) && /gift-bundle-grid/.test(app + styles) && /gift=8F4C/.test(app));
check('Gift flow preselects product opened from product card', /const \[giftProductId, setGiftProductId\]/.test(app) && /const openGift = \(product\?: Product\)/.test(app) && /setGiftProductId\(product\.id\)/.test(app) && /onGift=\{openGift\}/.test(app) && /initialProductId=\{giftProductId\}/.test(app) && /setGiftProductId\(initialProductId\)/.test(app));
check('Gift link is only shareable after payment creates it', /const \[giftReady, setGiftReady\]/.test(app) && /disabled=\{!giftReady\}/.test(app) && /setGiftReady\(true\)/.test(app) && /Ссылка готова/.test(app));
check('Gift link resets when changing gift type or selected gift', /const changeGiftMode[\s\S]*setGiftReady\(false\)[\s\S]*onGiftMode\(mode\)/.test(app) && /const changeGiftProduct[\s\S]*setGiftReady\(false\)[\s\S]*setGiftProductId\(productId\)/.test(app) && /const changeGiftPackage[\s\S]*setGiftReady\(false\)[\s\S]*setGiftPackage\(amount\)/.test(app));
check('Gift link has explicit copy and primary chat action after payment', /gift-share-actions/.test(app + styles) && /onCopy/.test(app) && /onShare/.test(app) && /Скопировать ссылку/.test(app) && /giftReady \? 'Отправить в чат'/.test(app) && /onClick=\{giftReady \? onShare : createGift\}/.test(app));
check('Gift sheet explains storage without bloating profile', /gift-storage-note/.test(app + styles) && /Где хранится подарок/.test(app) && /У отправителя ссылка остается в профиле/.test(app) && /max-height: min\(318px, 34vh\)/.test(styles));
check('Gift storage and receiving states exist without a bulky profile explainer', /function ProfileGiftsCard/.test(app) && /Подарки хранятся в профиле/.test(app) && /Открыть подарок по ссылке/.test(app) && !/gift-storage-row muted/.test(app));
check('Gift recipient can activate a received gift from link', /function GiftReceiveSheet/.test(app) && /Подарок по ссылке/.test(app) && /Активировать подарок/.test(app) && /receivedGift/.test(app + data) && /gift-claim-card/.test(app + styles));
check('Referral has accrual wallet, neighbor progress and compact share actions', /referral-wallet/.test(app + styles) && /neighbor-progress/.test(app + styles) && /referral-share-actions/.test(app + styles) && /Отправить в чат/.test(app) && /Начисление открывается после 500 грн покупок соседа/.test(app) && !/referral-rule-card/.test(app + styles));
check('Referral reward accumulates before explicit withdrawal', /const \[referralRewardAvailable, setReferralRewardAvailable\] = useState\(200\)/.test(app) && /const amount = referralRewardAvailable/.test(app) && /setBalance\(\(value\) => value \+ amount\)/.test(app) && /setReferralRewardAvailable\(0\)/.test(app) && /available > 0 \? `Вывести \$\{money\(available\)\} на баланс`/.test(app) && /Нет суммы к выводу/.test(app) && !/value \+ 100/.test(app));
check('Referral copy and share do not withdraw money', /onCopy/.test(app) && /onShare/.test(app) && /Ссылка приглашения скопирована/.test(app) && !/Скопировать<\/button>[\s\S]{0,80}onReward/.test(app));
check('Orders screen avoids demo state blocks', !/function OrderStateExamples|Состояния заказов|order-state-grid|order-state-preview|ready-order-state|empty-order-state|payment-order-state/.test(app + styles));
check('Order edge states are documented as product behavior', /## Active Order/.test(orderStates) && /## Ready Order/.test(orderStates) && /Готово к выдаче/.test(orderStates) && /## Empty Orders/.test(orderStates) && /Перейти в меню/.test(orderStates) && /## Payment Required/.test(orderStates) && /Нужна оплата/.test(orderStates) && /coffee balance is insufficient/.test(orderStates));
check('Bot dialog messages are documented but hidden from first-release UI', !/function BotMessagesBlock|Сообщения бота|bot-message-row|bot-messages-card/.test(app + styles) && /## Первый вход/.test(botMessages) && /## Нужна оплата/.test(botMessages) && /Не хватает 42 грн/.test(botMessages) && /## Заказ готов/.test(botMessages) && /## Подарок/.test(botMessages) && !/Автозаказ/.test(botMessages));
check('Profile data flow explains Telegram phone capture', /function SettingsSheet/.test(app) && /Заменить номер через Telegram/.test(app) && /без ручного ввода/.test(app) && /phone-access-card/.test(app + styles));
check('Profile settings are limited to useful order data', /function SettingsBlock/.test(app) && /Данные и помощь/.test(app) && /Только то, что нужно для заказа/.test(app) && /onProfile=\{\(\) => setSheet\('settings'\)\}/.test(app) && /onGifts=\{\(\) => setSheet\('giftReceive'\)\}/.test(app) && !/settings-inline-note|История операций уже ниже|Адрес кофейни<\/span>|Способы оплаты<\/span>|Уведомления<\/span>/.test(app + styles));
check('Bottom sheets are used for active first-release subflows', /function BottomSheet/.test(app) && /sheet === 'gift'/.test(app) && /sheet === 'queue'/.test(app) && /sheet === 'topup'/.test(app) && !/sheet === 'auto'|sheet === 'repeat'/.test(app));
check('Bottom sheets use wider modal sizing', /width: min\(920px, 100%\)/.test(styles) && /@media \(min-width: 640px\)/.test(styles) && /@media \(min-width: 840px\)/.test(styles) && /gift-picker-list[\s\S]*grid-template-columns: repeat\(3/.test(styles) && /padding: 12px 12px 0/.test(styles));
check('Telegram Mini App boot uses fullscreen and safe viewport APIs', /requestFullscreen/.test(telegram) && /viewport\.expand/.test(telegram) && /bindCssVars/.test(telegram));
check('Telegram haptics are wired', /hapticFeedback/.test(telegram) && /impactOccurred/.test(telegram) && /notificationOccurred/.test(telegram));
check('Liquid glass layer exists for nav, cart and sheets', /backdrop-filter: blur\(30px\)/.test(styles) && /\.bottom-nav/.test(styles) && /\.cart-bar/.test(styles) && /\.bottom-sheet/.test(styles));
check('Touch targets default to at least 44px', /min-width: 44px/.test(styles) && /min-height: 44px/.test(styles));
check('Reduced motion is supported', /prefers-reduced-motion/.test(styles));
check('High contrast preference is supported', /prefers-contrast: more/.test(styles));
check('No legacy admin UI data remains', !/adminStats|adminRows|quickActions|upcomingOrders|referralFriends|valueSteps/.test(app + data));
check('No obvious debug artifacts', !/TODO|FIXME|debugger|alert\(|console\.log/.test(app + data + styles + telegram));
check('Production build script exists', packageJson.scripts?.build === 'tsc && vite build');

const failed = checks.filter((item) => !item.pass);

for (const item of checks) {
  console.log(`${item.pass ? 'PASS' : 'FAIL'} ${item.name}${item.detail ? ` - ${item.detail}` : ''}`);
}

if (failed.length) {
  console.error(`\n${failed.length} invariant(s) failed.`);
  process.exit(1);
}

console.log(`\n${checks.length} invariants passed.`);
