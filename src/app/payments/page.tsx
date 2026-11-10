"use client";

import { useState } from "react";
import { formatFiat, useLedger, type FiatCurrency } from "@/lib/ledger";
import { linkFee, round2 } from "@/lib/fees";
import { TestBanner } from "@/components/TestBanner";
import { ConnectButton } from "@/components/ConnectButton";
import { Nav } from "@/components/Nav";

/**
 * Payment links (demo). Create a link for an amount in CAD/USD, then
 * "Pay (simulate)" it: the seller balance is credited the amount
 * minus the seller fee (2.9% + $0.30), and the fee accrues to
 * BlacksmithPay revenue (test). Links are mock local IDs — the URL is a
 * demo address that goes nowhere.
 */
export default function PaymentsPage() {
  const { paymentLinks, createPaymentLink, payPaymentLink } = useLedger();
  const [currency, setCurrency] = useState<FiatCurrency>("CAD");
  const [amountText, setAmountText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const amount = Number.parseFloat(amountText);
  const valid = Number.isFinite(amount) && amount > 0;
  const feePreview = valid ? linkFee(amount) : 0;
  const receivePreview = valid ? round2(amount - feePreview) : 0;

  function handleCreate() {
    setError(null);
    setNotice(null);
    if (!valid) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (receivePreview <= 0) {
      setError(
        "That amount is too small — after the seller fee (2.9% + $0.30) nothing would be left to receive.",
      );
      return;
    }
    createPaymentLink(currency, amount);
    setNotice(
      `Payment link created for ${formatFiat(currency, amount)} (test). Use "Pay (simulate)" on it below to see the seller fee in action.`,
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
          <div className="tagline">Payment links — demo.</div>
        </div>
        <ConnectButton />
      </header>

      <Nav />

      {notice ? (
        <div className="notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="panel" aria-label="Create a payment link">
        <h3 style={{ marginTop: 0 }}>Create a payment link (demo)</h3>
        <p className="hint">
          A payment link lets a seller ask for a set amount. When it is
          paid, the seller pays a BlacksmithPay fee of{" "}
          <strong>2.9% + $0.30</strong> — shown here before anything
          happens, never hidden. Demo links are local to this device and
          the URL is a mock address.
        </p>

        <div className="field">
          <label htmlFor="rw-pl-currency">Currency</label>
          <select
            id="rw-pl-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as FiatCurrency)}
          >
            <option value="CAD">CAD — Canadian dollar (test)</option>
            <option value="USD">USD — US dollar (test)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="rw-pl-amount">Amount requested</label>
          <input
            id="rw-pl-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>

        {valid ? (
          <div className="breakdown" aria-label="Seller fee preview">
            <div className="row">
              <span>Buyer pays</span>
              <span>{formatFiat(currency, amount)}</span>
            </div>
            <div className="row">
              <span>BlacksmithPay seller fee (2.9% + $0.30)</span>
              <span>{formatFiat(currency, feePreview)}</span>
            </div>
            <div className="row total">
              <span>Seller receives</span>
              <span>{formatFiat(currency, receivePreview)}</span>
            </div>
          </div>
        ) : null}

        {error ? <p className="error">{error}</p> : null}

        <div className="actions" style={{ marginTop: 18, marginBottom: 0 }}>
          <button type="button" className="primary" onClick={handleCreate}>
            Create link (demo)
          </button>
        </div>
      </section>

      <h2 className="section" style={{ marginTop: 28 }}>
        Your payment links
      </h2>
      <div className="activity">
        {paymentLinks.length === 0 ? (
          <div className="empty">
            No payment links yet. Create one above with test money.
          </div>
        ) : (
          paymentLinks.map((link) => {
            const fee = linkFee(link.amount);
            const received = round2(link.amount - fee);
            return (
              <div className="activity-row" key={link.id}>
                <div>
                  <div className="what">
                    {formatFiat(link.currency, link.amount)} —{" "}
                    <code>https://blacksmithpay.demo/pay/{link.id}</code>
                  </div>
                  <div className="when">
                    Created {new Date(link.createdAt).toLocaleString()} ·
                    demo link · seller fee {formatFiat(link.currency, fee)}{" "}
                    (2.9% + $0.30) · seller receives{" "}
                    {formatFiat(link.currency, received)}
                  </div>
                </div>
                <div
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  {link.status === "open" ? (
                    <button
                      type="button"
                      className="small"
                      onClick={() => {
                        payPaymentLink(link.id);
                        setNotice(
                          `Link paid (simulated): you received ${formatFiat(link.currency, received)} (test); the ${formatFiat(link.currency, fee)} seller fee went to BlacksmithPay revenue (test).`,
                        );
                      }}
                    >
                      Pay (simulate)
                    </button>
                  ) : null}
                  <span
                    className={
                      link.status === "open" ? "badge pending" : "badge done"
                    }
                  >
                    {link.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <footer className="foot">
        BlacksmithPay P1 prototype. Payment links are a demo on this device
        only — no real checkout, no real money. Seller fees here mirror
        the launch model in the Blueprint&apos;s Monetization section.
        Not affiliated with PayPal or MetaMask.
      </footer>
    </main>
  );
}
