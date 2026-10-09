# Favorable Chicken – Daily tools

A simple phone app for the shop. No password, no server, works offline.

| Tab | What it does |
|---|---|
| **Daily sales** | Cash-up: Front + Delivery, minus Just Eat / Uber / Deliveroo / Delivery Drop / P.out / Dojo / Teya = expected cash. Count the till (or count notes & coins), take off the float, and see if you're balanced, over or short. Last-7-days chart. Send to WhatsApp or get a PDF. |
| **Food spend** | Weekly stock food docket: one amount per day Mon–Sat, week total, compare with last week, last-8-weeks chart, PDF. Optional item log for deliveries and waste. |
| **Shifts** | Clock staff in and out, add shifts by hand (works past midnight), tap a time to correct it. Pay periods: this week, last 2 weeks, this month or custom. Hours and pay per person, PDF timesheet. |
| **Order pad** | Tap items to build the supplier order. Type an item that isn't there to add it – it stays on the list. *Edit list* to remove items you don't order any more or change the usual amount. Repeat last order. Send to WhatsApp. |

## Important: where data is saved
Everything is saved **on the phone you use it on** (browser storage). Two phones won't share data.
Use **Settings (gear) › Download backup** every week, and **Restore** to move to a new phone.

## Put it online (GitHub Pages – free)
1. Repo › **Settings › Pages** › Source: *Deploy from a branch* › Branch: `main` / `(root)` › Save.
2. After a minute the app is live at https://hammadcheema1222-jpg.github.io/daily-tools/.
3. Open that link on the shop phone once with internet, then *Add to Home Screen*. After that it works offline.

## Making changes
Edit files straight on GitHub – GitHub Pages updates in about a minute.
- Shop item list: `DEFAULT_ITEMS` near the top of `app.js` (only used on first open / reset; normally just use *Edit list* in the app).
- Sales fields: `SALES_GROUPS` in `app.js`.
- Colours: top of `styles.css`. Illustrations: `art.js`.
- **After any change, bump `VERSION` in `sw.js`** (e.g. `fc-daily-v3`) so phones pick up the update.
