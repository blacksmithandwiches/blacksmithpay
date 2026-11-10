"use client";

import { useState } from "react";
import { formatFiat, useLedger, type FiatCurrency } from "@/lib/ledger";
import { MOCK_ETH_PRICE, quoteExchange } from "@/lib/fees";
import { TestBanner } from "@/components/TestBanner";
import { ConnectButton } from "@/components/ConnectButton";
import { Nav } from "@/components/Nav";

/**
 * Demo exchange: CAD/USD <-> ETH at a clearly-labelled MOCK rate.
 * A 0.85% BlacksmithPay fee is shown BEFORE confirming and accrues to
 * BlacksmithPay revenue (test). ETH here is "ETH (demo)" — a mock-ledger
 * number, SEPARATE from the real Sepolia wallet balance.
 */
export default function ExchangePage() {
  const { balances, demoEth, exchange } = useLedger();
  const [direction, setDirection] = useState<"buy" | "sell">("buy");
  const [currency, setCurrency] = useState<FiatCurrency>("CAD");
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const amount = Number.parseFloat(amountText);
  const valid = Number.isFinite(amount) && amount > 0;
  const quote = valid ? quoteExchange(direction, currency, amount) : null;
  const rate = MOCK_ETH_PRICE[currency];

  function handleExchange() {
    setError(null);
    setNotice(null);
    if (!valid || !quote) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (direction === "buy" && amount > balances[currency]) {
      setError(
        `Not enough test money — your ${currency} balance is ${formatFiat(currency, balances[currency])}.`,
      );
      return;
    }
    if (direction === "sell" && amount > demoEth) {
      setError(
        `Not enough ETH (demo) — you hold ${demoEth.toFixed(6)} ETH (demo). Buy some first.`,
      );
      return;
    }
    const ok = exchange(direction, currency, amount);
    if (!ok) {
      setError("The exchange could not be completed — check your balance.");
      return;
    }
    setNotice(
      direction === "buy"
        ? `Bought ${quote.ethOut.toFixed(6)} ETH (demo) for ${formatFiat(currency, amount)} (test). Fee ${formatFiat(currency, quote.fee)} went to BlacksmithPay revenue (test).`
        : `Sold ${amount} ETH (demo) for ${formatFiat(currency, quote.fiatOut)} (test). Fee ${formatFiat(currency, quote.fee)} went to BlacksmithPay revenue (test).`,
    );
    setAmountText("");
  }

  return (
    <main className="shell">
      <TestBanner />

      <header className="top">
        <div>
          <div className="logo">
            Blacksmith<span>Pay</span>
          </div>
          <div className="tagline">Exchange — demo, mock rates.</div>
        </div>
        <ConnectButton />
      </header>

      <Nav />

      {notice ? (
        <div className="notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="panel" aria-label="Exchange">
        <h3 style={{ marginTop: 0 }}>Exchange fiat ↔ ETH (demo)</h3>
        <p className="hint">
          <strong>Mock rate:</strong> 1 ETH = {formatFiat("CAD", MOCK_ETH_PRICE.CAD)}{" "}
          / {formatFiat("USD", MOCK_ETH_PRICE.USD)} — a made-up demo rate,
          NOT a market price. ETH bought here is <strong>ETH (demo)</strong>,
          a number in this app&apos;s mock ledger, kept separate from your
          real Sepolia wallet balance.
        </p>

        <div className="actions" style={{ marginBottom: 16 }}>
          <button
            type="button"
            className={direction === "buy" ? "primary" : undefined}
            onClick={() => setDirection("buy")}
          >
            Buy ETH with fiat
          </button>
          <button
            type="button"
            className={direction === "sell" ? "primary" : undefined}
            onClick={() => setDirection("sell")}
          >
            Sell ETH for fiat
          </button>
        </div>

        <div className="field">
          <label htmlFor="rw-ex-currency">Fiat currency</label>
          <select
            id="rw-ex-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as FiatCurrency)}
          >
            <option value="CAD">CAD — Canadian dollar (test)</option>
            <option value="USD">USD — US dollar (test)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="rw-ex-amount">
            {direction === "buy"
              ? `Amount to spend (${currency}, test)`
              : "Amount to sell (ETH, demo)"}
          </label>
          <input
            id="rw-ex-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>

        <p className="hint">
          {direction === "buy"
            ? `Available: ${formatFiat(currency, balances[currency])} (test)`
            : `Available: ${demoEth.toFixed(6)} ETH (demo)`}{" "}
          · Rate: 1 ETH = {formatFiat(currency, rate)} (mock)
        </p>

        {quote ? (
          <div className="breakdown" aria-label="Exchange breakdown">
            <div className="row">
              <span>{direction === "buy" ? "You pay" : "You sell"}</span>
              <span>
                {direction === "buy"
                  ? formatFiat(currency, quote.fiatIn)
                  : `${amount} ETH (demo) = ${formatFiat(currency, quote.fiatIn)}`}
              </span>
            </div>
            <div className="row">
              <span>BlacksmithPay fee (0.85%)</span>
              <span>{formatFiat(currency, quote.fee)}</span>
            </div>
            <div className="row total">
              <span>You receive</span>
              <span>
                {direction === "buy"
                  ? `${quote.ethOut.toFixed(6)} ETH (demo)`
                  : formatFiat(currency, quote.fiatOut)}
              </span>
            </div>
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <div className="actions" style={{ marginTop: 18, marginBottom: 0 }}>
          <button type="button" className="primary" onClick={handleExchange}>
            {direction === "buy" ? "Buy ETH (demo)" : "Sell ETH (demo)"}
          </button>
        </div>
        <p className="hint" style={{ marginTop: 12 }}>
          The fee is always shown before you confirm — never hidden.
        </p>
      </section>

      <footer className="foot">
        BlacksmithPay P1 prototype. The exchange uses mock rates and a mock
        ledger on this device only; ETH (demo) is not real crypto and is
        separate from the Sepolia testnet wallet. Not affiliated with
        PayPal or MetaMask.
      </footer>
    </main>
  );
}
