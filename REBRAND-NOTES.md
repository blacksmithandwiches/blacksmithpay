# BlacksmithPay rebrand — main wallet demo (Nov 9, 2026)

The demo at https://rockwallet-blacksmithandwiches.vercel.app still wore the
old working name RockWallet in its visible copy. Rebranded to **BlacksmithPay**
(the name Dmitri chose Nov 6, 2026), following the pattern used for the
Blacksmith Forge variant (see ../forge-app/DEPLOY-NOTES.md). The app's own
light look and blue metallic liner are unchanged — no reskin.

## Visible strings changed (RockWallet → BlacksmithPay)
- Page title/meta: "BlacksmithPay — prototype" (src/app/layout.tsx) + meta description.
- Header logo on all three screens: Blacksmith**Pay** (was Rock/Wallet split markup).
- Revenue counter label: "BlacksmithPay revenue (test)" (RevenueCard + home).
- All fee copy: exchange fee label + result messages, send/request modal fee
  label + messages, payment-link seller fee label + paid messages, crypto-send
  "No BlacksmithPay fee on crypto sends" copy, ledger fee activity detail.
- Footers on home / exchange / payments: "BlacksmithPay P1 prototype. …"
- Mock payment-link domain: `https://blacksmithpay.demo/pay/<id>` (was rockwallet.demo).
- package.json: name `blacksmithpay`, description updated. README updated
  (history line notes RockWallet was the original working name).

## Internal change to note
- localStorage key renamed `rockwallet-mock-ledger-v1` →
  `blacksmithpay-mock-ledger-v1`. This resets demo balances/activity in
  browsers that used the old demo (test money only — acceptable, and it keeps
  the two demos' state separate, same as the Forge variant did).

## Unchanged
- Fee model in src/lib/fees.ts: exchange 0.85% (0.0085), fiat sends 0.5%
  (0.005), payment links 2.9% + $0.30 (0.029), crypto sends no app fee.
  Only brand-name mentions in comments were renamed; no rates or logic touched.
- TEST MONEY / Sepolia labelling, routes (/ /exchange /payments), functionality.
- Public URL unchanged; blacksmithpay.com NOT purchased (on hold by Dmitri).

## Build & deploy record
- `npm run build` OK — all 3 routes static.
- Redeployed to the SAME Vercel project (.vercel/project.json, projectId
  prj_wZYPymGnHOK6DdlqFnn9FxUhDolC) with `npx vercel --prod --yes`.
- Live verification (direct fetch after deploy): HTTP 200 on /, /payments,
  /exchange; served <title> "BlacksmithPay — prototype"; 6–9 BlacksmithPay
  mentions per page, ZERO RockWallet; compiled payments bundle contains
  blacksmithpay.demo and the new storage key, zero rockwallet.demo.
  No login wall (unauthenticated fetch returns the app).
