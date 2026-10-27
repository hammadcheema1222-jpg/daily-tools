# Favorable Chicken — Daily tools

A phone-friendly shop app hosted on GitHub Pages. Works offline after the first online visit. Records stay in the current phone’s browser storage; there is no account, cloud database or automatic sharing between phones.

## Shop operations edition

- **Daily sales:** five-step closing routine, Draft/Completed status, discrepancy notes and review checks. Editing a completed day reopens it as Draft. Plain order exports and the seven-day sales PDF remain available.
- **Trading day:** configurable cutoff in Settings, default 04:00. A new cash-up at 01:00 starts on the previous trading date. Existing dates are never automatically moved.
- **Weekly partner report:** sales, food docket, separately logged deliveries, recorded wages, waste and cash differences in one branded PDF. Missing entries and unpriced shifts are flagged. Docket and delivery logs are separate views, not additive; this report is not a profit calculation or full payroll.
- **Sales trends:** comparable elapsed weekdays and previous matching weekdays. Percentage comparisons require completed records on both sides.
- **Food spend:** seven days, Monday–Sunday; itemised deliveries with quantities/units and waste with reasons and weekly cause totals.
- **Shifts:** overnight shifts, validated breaks, and recorded hourly rates retained with new shifts. Legacy shifts using a current rate are identified in the weekly report.
- **Order pad:** dated drafts and saved orders, supplier filters, units, supplier-specific copy/WhatsApp/PDF, and weekly quantity comparisons. Increased ordering is not proof of increased consumption. Use **Order done — clear** to archive a finished order. Existing history is retained without the former 20-order cap; records previously discarded cannot be reconstructed.
- **Edit list:** change an existing item’s name, unit or supplier while retaining its ID. Saved orders keep their original names and units.
- **Recurring stock reminders:** configurable needed weekday and advance notice. Veggie Oil defaults to Monday with a Sunday reminder where that item exists. Reminders appear inside the app, not as background push notifications.
- **Records:** search sales days, food entries, deliveries, waste, shifts and saved/draft orders; filter dates/type, open records and export filtered records to CSV. Recently deleted sales, shifts and ledger entries can be restored.
- **Save and backup status:** visible device-save status, last backup download and a seven-day reminder. Backups include new data. Restore validates supported backup structure and downloads a recovery copy before replacing app data. Keep downloaded backup files somewhere safe; downloading cannot prove they remain available.

## Using it

Open https://hammadcheema1222-jpg.github.io/daily-tools/ online and add it to your home screen. After an update, reopen online to receive the refreshed app shell. Your existing `fc.*` records are retained. Changing the website does not transfer records to another phone: download a backup and restore it on the other device. Restoring replaces that device’s app records; it does not merge two phones.

## Implementation and checks

`app.js` contains the existing shop screens; `operations.js` adds workflow/search/reminders; `ops-core.js` contains pure calculations and backup validation. `reports.js` and bundled MIT-licensed `pdf-lib.min.js` generate PDFs on the device. The existing emblem and visual palette are preserved.

Validation covered 14 domain regression checks (cutoff boundaries, amounts, overnight shifts, comparable periods, reports, preserved history, units, recurring reminders, CSV escaping and backup recovery), existing export/pagination checks, closing/renaming/search browser flows, a 390px mobile layout check and rendered weekly PDF inspection.

Host the repository root on GitHub Pages from `main`. Bump `VERSION` in `sw.js` when changing the app shell. No private shop records belong in this public repository.
