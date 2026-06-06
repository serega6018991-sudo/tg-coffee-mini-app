# Deferred Features

This document keeps product ideas that are intentionally hidden from the first public UX. They should not appear in the current app navigation, home screen, profile, orders screen, bot-message previews, or checkout flow until explicitly re-enabled.

## Заказать как обычно

Status: deferred after first release.

Why deferred:
- The first release should focus on the primary habit: choose coffee, pay, receive code, pick up.
- Showing this too early adds a second ordering model before the user understands the basic one.

Intended future behavior:
- The feature appears only after the user has enough order history.
- The app suggests a habitual set, for example `Капучино + круассан`.
- The user can confirm the set, add more items, or open the menu to edit.
- The app must explain the source clearly: based on order history, not guessed silently.
- First-time users should not see the entry point.

Future entry points:
- Home quick action after enough history exists.
- Orders history row as a contextual repeat action.
- Optional profile setting for managing the saved habitual order.

Required states:
- No history yet.
- Suggested order exists.
- User edited the suggested order.
- Item from habitual order is unavailable.
- Price changed since the last order.

## Автозаказ

Status: deferred after first release.

Why deferred:
- It is powerful but adds scheduling, bot confirmation, and payment decisions before the base order flow is fully obvious.
- It should launch only after the manual order flow is stable and understood.

Intended future behavior:
- User configures days, time, and default order.
- 15 minutes before the selected time, the bot sends a confirmation message: `Делаем заказ?`.
- Tapping the bot link opens the app directly into a confirmation bottom sheet.
- The user chooses payment method: card or coffee balance.
- The order is not sent to the barista until the user confirms and payment succeeds.

Future entry points:
- Profile management panel.
- Home quick action for experienced users.
- Bot deep link for confirmation.

Required states:
- Active auto-order.
- Auto-order paused.
- Confirmation pending.
- User declined today.
- Not enough balance.
- Card payment selected.
- Order item unavailable.
- Time needs editing.

Design constraints for re-enabling:
- Keep it out of the main first-time flow.
- Explain that the bot asks before preparing the order.
- Never auto-charge without explicit confirmation.
- Keep payment method selection in the confirmation sheet.
