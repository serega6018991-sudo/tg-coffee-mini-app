# Order States

These states are product behavior requirements, not a visible demo block on the Orders screen.

## Active Order

Show the active pickup card with status, pickup time, product thumbnails, and the four-digit code. Tapping the `В заказе` row opens the order details bottom sheet.

## Ready Order

Show `Готово к выдаче`, keep the four-digit code large, and send a bot message: `Можно забирать. Назови код 4831 у стойки.`

## Empty Orders

If there are no active orders, show a calm empty state with one action: `Перейти в меню`.

## Payment Required

If payment fails or the coffee balance is insufficient, the order is not sent to the barista. Show `Нужна оплата`, explain the shortage, and offer card payment or balance top-up.
