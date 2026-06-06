import {
  hapticFeedback,
  init,
  isTMA,
  miniApp,
  swipeBehavior,
  themeParams,
  viewport,
} from '@tma.js/sdk-react';

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'rigid' | 'soft';
type NoticeStyle = 'success' | 'warning' | 'error';

const canUseTMA = () => {
  try {
    return isTMA();
  } catch {
    return false;
  }
};

const callSafely = (fn: () => void) => {
  try {
    fn();
  } catch {
    // Telegram methods are optional in local browsers.
  }
};

export function bootTelegramMiniApp() {
  if (!canUseTMA()) {
    document.documentElement.dataset.tg = 'browser';
    return;
  }

  document.documentElement.dataset.tg = 'mini-app';

  callSafely(() => init());
  callSafely(() => themeParams.mount.ifAvailable());
  callSafely(() => themeParams.bindCssVars.ifAvailable());
  callSafely(() => miniApp.mount.ifAvailable());
  callSafely(() => miniApp.bindCssVars.ifAvailable());
  callSafely(() => viewport.mount.ifAvailable());
  callSafely(() => viewport.bindCssVars.ifAvailable());
  callSafely(() => viewport.expand.ifAvailable());
  callSafely(() => viewport.requestFullscreen.ifAvailable());
  callSafely(() => swipeBehavior.mount.ifAvailable());
  callSafely(() => swipeBehavior.disableVertical.ifAvailable());
  callSafely(() => miniApp.setHeaderColor.ifAvailable('bg_color'));
  callSafely(() => miniApp.setBottomBarColor.ifAvailable('secondary_bg_color'));
  callSafely(() => miniApp.ready.ifAvailable());
}

export function impact(style: ImpactStyle = 'light') {
  callSafely(() => hapticFeedback.impactOccurred.ifAvailable(style));
  if (!canUseTMA() && 'vibrate' in navigator) {
    navigator.vibrate(style === 'heavy' ? 16 : 8);
  }
}

export function notify(style: NoticeStyle = 'success') {
  callSafely(() => hapticFeedback.notificationOccurred.ifAvailable(style));
  if (!canUseTMA() && 'vibrate' in navigator) {
    navigator.vibrate(style === 'success' ? [8, 24, 8] : [12, 30, 12]);
  }
}

export function selection() {
  callSafely(() => hapticFeedback.selectionChanged.ifAvailable());
  if (!canUseTMA() && 'vibrate' in navigator) {
    navigator.vibrate(6);
  }
}
