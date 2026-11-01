# OjaLink content guide

Owner: Content writer (feature #4 owner). Use these words so the whole app
sounds like one friendly voice.

## Voice rules
- Simple English that a market trader and a student both understand.
- Short sentences. Say what happened and what to do next.
- Friendly, never rude or scary. Never blame the user.
- Money: Naira with the symbol and commas, e.g. ₦6,500. (Stored in kobo,
  shown in Naira.)
- Dates and times: Africa/Lagos time.
- Buttons start with a verb: "Pay now", "Accept order", "Track my order".
- No technical words for users: say "something went wrong", not "500".

## Shared buttons
| Where | Button |
|---|---|
| Home | Search products |
| Search results | View product |
| Vendor shop | Add to cart |
| Cart | Go to checkout |
| Checkout | Pay now |
| My orders | Track my order |
| Vendor incoming orders | Accept order / Reject order |
| Rider job list | Accept job |
| Rider job | Mark as picked up / Mark as delivered |
| Admin vendors | Approve / Reject |
| Login | Log in |
| Sign up | Create my account |
| Anywhere | Back / Try again |

## Empty states
| Page | Words |
|---|---|
| My orders | You haven't ordered anything yet. Go and find something nice! |
| Search results | We couldn't find anything for that search. Try another word or market. |
| Cart | Your cart is empty. Add something from a vendor's shop. |
| Vendor products | You haven't added any products yet. Add your first one. |
| Rider job list | No deliveries near you right now. Check again soon. |
| Admin vendors | No vendors are waiting for approval. |

## Error messages
| Situation | Words |
|---|---|
| Order not found | We couldn't find this order. Check the link and try again. |
| Not logged in | Please log in to continue. |
| Wrong role / not allowed | You do not have access to this page. |
| Something broke | Something went wrong on our side. Please try again. |
| Payment failed | Your payment didn't go through. You have not been charged. Please try again. |
| Required field empty | Please fill in this field. |
| Wrong email or password | Email or password is not correct. Please try again. |
| Out of stock | Sorry, this item is out of stock. |

## Order status words (buyer)
| Status | Title | Message |
|---|---|---|
| pending | Waiting for payment | We haven't received your payment yet. |
| paid | Payment received | Your order has been sent to the vendor. |
| accepted | Vendor confirmed | The vendor is getting your order ready. |
| rejected | Order not accepted | Sorry, the vendor couldn't take this order. Please contact OjaLink support. |
| picked_up | On the way | A rider has picked up your order. |
| delivered | Delivered | Your order has arrived. Enjoy! |
| cancelled | Order cancelled | This order was cancelled. |

## Emails
| Email | Subject | Body |
|---|---|---|
| pending | Payment needed for your OjaLink order | Your order from {shopName} is waiting for payment. |
| paid | Payment received for your OjaLink order | Your payment for the order from {shopName} has been received. |
| accepted | Your OjaLink order is confirmed | Good news! {shopName} has confirmed your order. |
| rejected | An update about your OjaLink order | Sorry, {shopName} couldn't accept your order. Please contact OjaLink support. |
| picked_up | Your order is on the way | Good news! Your order from {shopName} has been picked up. |
| delivered | Your OjaLink order has arrived | Your order from {shopName} has arrived. Enjoy! |
| cancelled | Your OjaLink order was cancelled | Your order from {shopName} was cancelled. |
| Vendor: new order — Proposed, for the teammate who owns notifications (feature #9). Not built yet. | You have a new order | A buyer just ordered from your shop. Open OjaLink to accept it. |

Every built status email ends with a link to the order, followed by: "Thank you for shopping on OjaLink."

## Where these words live in code (feature #4)
- src/lib/orders/status-copy.ts: order status titles and messages
- src/lib/orders/page-copy.ts: words on My orders and Track an order
- src/lib/orders/email-copy.ts: order status email words

Before finishing, check the status table and emails above match those three
files. If any wording differs, tell me instead of editing the code.
