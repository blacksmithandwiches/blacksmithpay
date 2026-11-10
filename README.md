# BlacksmithPay

**Send money like a message — fiat and crypto in one wallet.**

BlacksmithPay is a payment app with a familiar send/request flow:
accounts with CAD and USD balances, payment links anyone can pay,
MetaMask built in for crypto, and an exchange between fiat and
crypto — with every fee shown up front, before you confirm. No
hidden charges, ever.

## Download the app

- **Android:** [download the app file (.apk)](https://rockwallet-blacksmithandwiches.vercel.app/download.html) — signed release build, installs directly.
- **iPhone / iPad:** open the demo below in Safari → Share → *Add to Home Screen* — it installs like an app.
- **Web:** just open the demo — no install needed.

**TEST MONEY ONLY.** The app moves no real money: balances are a mock
ledger and crypto runs on the Sepolia test network.

## Try the live demos

- **BlacksmithPay (main demo):** https://rockwallet-blacksmithandwiches.vercel.app
- **Blacksmith Forge (dark vault variant):** https://blacksmith-forge.vercel.app

> **Status: working prototype — TEST MONEY ONLY.**
> Fiat balances are a demo ledger; crypto runs on the Sepolia
> testnet. No real funds move, there are no signups and no API
> keys. Everything below describes the prototype honestly,
> including what is mock and what is real.

## Sponsor / support this work

BlacksmithPay is built by one independent author-developer under
his own **Blacksmith & Witches** label. If you want to see it
reach a public launch, you can support the work on Patreon:

**https://www.patreon.com/c/BlacksmithAndWitches**

Sponsorship funds development time and the compliance path
described in the roadmap below. It buys no equity and comes with
no promises — just a front-row seat and our thanks.

---

# BlacksmithPay — P1 Prototype (developer notes)

Dmitri's payment app: a familiar send/request wallet flow for fiat
(CAD + USD) with MetaMask built in for crypto, plus an exchange
between the two and demo payment links. **TEST MONEY ONLY
throughout.** No real funds, no real payment rails, no signups, no
API keys.

Decisions baked in (Nov 5, 2026): currencies
**CAD + USD + crypto**; first screen = **wallet home** showing all
three balances. Name: **BlacksmithPay** (chosen Nov 6, 2026,
superseding the original working name RockWallet; visible branding
updated Nov 9, 2026).

## What exists

- **Wallet home** (`src/app/page.tsx`) — first screen with balance
  cards: CAD, USD, crypto (ETH on Sepolia), ETH (demo) held from
  exchanges, and a "BlacksmithPay revenue (test)" card, plus Send /
  Request buttons, an activity list, and a Sepolia crypto-send panel.
- **Mock ledger** (`src/lib/ledger.tsx`) — in-browser store with
  starting test balances (CAD 1,250.00 / USD 860.00), persisted to
  localStorage. Send deducts a balance (plus the transfer fee);
  Request creates a pending item; "Mark paid (simulate)" on a pending
  request credits the balance, so the whole flow clicks through end
  to end. "Reset demo" restores the starting state (balances, demo
  ETH, revenue, links, activity).
- **Exchange** (`src/app/exchange/page.tsx`) — CAD/USD ↔ ETH at a
  clearly-labelled **mock rate** (1 ETH = CAD 4,200 / USD 3,100).
  Bought ETH is "ETH (demo)", a mock-ledger balance kept separate
  from the real Sepolia wallet balance.
- **Payment links** (`src/app/payments/page.tsx`) — create a demo
  link for an amount in CAD/USD, then "Pay (simulate)": the seller
  balance is credited minus the seller fee, which lands in revenue.
- **Crypto send** (`src/components/CryptoSend.tsx`) — a real Sepolia
  testnet ETH send via wagmi `sendTransaction` when MetaMask is
  connected, with the transaction hash and a Sepolia Etherscan link
  shown after sending. Disabled-with-explanation when not connected.
- **Revenue counter** (`src/components/RevenueCard.tsx`,
  `src/lib/fees.ts`) — every fee accrues per currency to "BlacksmithPay
  revenue (test)" on the wallet home.
- **MetaMask connect** (`src/lib/wagmi.ts`,
  `src/components/ConnectButton.tsx`) — wagmi + viem, Sepolia testnet
  only, using the injected connector: no WalletConnect project ID or
  API key needed. When connected, the crypto card shows the wallet's
  live Sepolia ETH balance and address; when not connected it shows a
  graceful placeholder.
- **TEST-money labelling everywhere** — banner, cards, modal, footer.

## How to run

```bash
cd ~/workspace/payment-app/app
npm install   # first time only — free/open-source packages
npm run dev   # http://localhost:3000
```

Other scripts: `npm run build`, `npm start`, `npm run typecheck`.

To see the crypto card work: install MetaMask in the browser, switch
it to the Sepolia network, click **Connect MetaMask**. Test ETH comes
from any Sepolia faucet (free, no value).

## Fee schedule (prototype — all fees shown BEFORE confirming)

| Flow                     | BlacksmithPay fee              | Who pays   |
| ------------------------ | --------------------------- | ---------- |
| Exchange (fiat ↔ ETH)    | **0.85%** of the fiat side  | Exchanger  |
| Fiat Send (CAD/USD)      | **0.5%**, on top of amount  | Sender     |
| Payment link (when paid) | **2.9% + $0.30**            | Seller     |
| Crypto send (Sepolia)    | **None**                    | —          |

Every fee is displayed as its own line before the user confirms and
accrues to the "BlacksmithPay revenue (test)" counter. Fees are never
hidden. Crypto sends carry no app fee: the sender pays the network
gas fee, which goes to the Ethereum network — never to BlacksmithPay.

## Mock vs real

| Part            | State in this prototype                                   |
| --------------- | --------------------------------------------------------- |
| CAD / USD       | **Mock.** Numbers in localStorage; nothing real moves.    |
| Send / Request  | **Mock flow.** Adjusts the mock ledger only (fee applies). |
| Crypto balance  | **Real read, test network.** Live Sepolia balance via MetaMask. |
| Crypto send     | **Built.** Real Sepolia testnet send via MetaMask.        |
| Exchange        | **Built.** Mock rates; ETH (demo) in the mock ledger.     |
| Payment links   | **Built.** Demo links, simulated payment, seller fee.     |
| Accounts/sign-in| Not built yet (blueprint P1 item).                        |
| Database        | None yet — blueprint stack targets PostgreSQL later.      |

## Next steps (per BLUEPRINT.md §5)

1. Email accounts + sign-in, and the ledger moved behind an API +
   PostgreSQL.
2. P2: private demo + landing page. P3 (licensed partners /
   compliance) is a decision gate with Dmitri before ANY real money.

## Roadmap — the honest version

Moving other people's money is regulated, and this project treats
that as a fact, not a footnote. A public launch will **not** hold
or move real funds on its own: the plan is to launch through
**licensed partners** (established payment/crypto infrastructure
providers carry the regulated legs) while BlacksmithPay provides
the product, the flow, and the fee transparency. The direct route
was also researched for Canada — it requires federal registrations
(a FINTRAC money services business registration and a Bank of
Canada registration under the Retail Payment Activities Act) —
and stays on the table for later. Until a licensed route is in
place, BlacksmithPay remains exactly what this repository is: a
working, test-money prototype.

## Author

Built by **Dmitri (Dima Grossman)** — guitarist, songwriter, and
author — under his creator label **Blacksmith & Witches**
(books, films, music, and now this). Support the work:
https://www.patreon.com/c/BlacksmithAndWitches

## Licence

MIT — see [LICENSE](LICENSE). Copyright (c) 2026 Dmitri (Dima Grossman), Blacksmith & Witches.
