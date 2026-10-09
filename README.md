# Favorable Chicken – Daily tools

A simple phone app for the shop. No password, no server, works offline.

**Live app:** https://hammadcheema1222-jpg.github.io/daily-tools/

| Tab | What it does |
|---|---|
| **Daily sales** | Cash-up: Front + Delivery, minus Just Eat / Uber / Deliveroo / Delivery Drop / P.out / Dojo / Teya = expected cash. Count the till (or count notes & coins), take off the float, and see if you're balanced, over or short. Last-7-days chart. Send to WhatsApp. |
| **Stock** | Ledger of deliveries in and waste out, week by week. Remembers last price and supplier per item. Shows weekly spend and biggest spends. |
| **Shifts** | Clock staff in and out, or add shifts by hand (works past midnight). Hours per person per week, optional hourly rate for wages. |
| **Order pad** | Tap items to build the supplier order. Type an item that isn't there to add it – it stays on the list. *Edit list* to remove items you don't order any more or change the usual amount. Repeat last order. Send to WhatsApp. |

## Important: where data is saved
Everything is saved **on the phone you use it on** (browser storage). Two phones won't share data.
Use **Settings (gear) › Download backup** every week, and **Restore** to move to a new phone.

## Hosting (GitHub Pages – free)
Repo › **Settings › Pages** › Deploy from a branch › `main` / `(root)`. Open the live link once on the shop phone with internet, then *Add to Home Screen*. After that it works offline.

## Making changes
Edit files straight on GitHub – GitHub Pages updates in about a minute.
- Shop item list: `DEFAULT_ITEMS` near the top of `app.js` (only used on first open / reset; normally just use *Edit list* in the app).
- Sales fields: `SALES_GROUPS` in `app.js`.
- Colours: top of `styles.css`.
- **After any change, bump `VERSION` in `sw.js`** (e.g. `fc-daily-v2`) so phones pick up the update.
