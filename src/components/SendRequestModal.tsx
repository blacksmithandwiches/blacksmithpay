"use client";

import { useEffect, useState } from "react";
import { formatFiat, useLedger, type FiatCurrency } from "@/lib/ledger";
import { round2, transferFee } from "@/lib/fees";

export type FlowMode = "send" | "request";

type SendRequestModalProps = {
  mode: FlowMode;
  onClose: () => void;
  onDone: (message: string) => void;
};

/**
 * Mock send/request flow. Moves TEST money in the local mock ledger
 * only — no real payment leaves the device.
 */
export function SendRequestModal({
  mode,
  onClose,
  onDone,
}: SendRequestModalProps) {
  const { balances, send, createRequest } = useLedger();
  const [currency, setCurrency] = useState<FiatCurrency>("CAD");
  const [amountText, setAmountText] = useState("");
  const [counterparty, setCounterparty] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [mode]);

  const amount = Number.parseFloat(amountText);
  const isSend = mode === "send";
  // BlacksmithPay transfer fee (0.5%) — shown to the user BEFORE confirming.
  const fee = isSend && Number.isFinite(amount) && amount > 0 ? transferFee(amount) : 0;
  const totalDebit = round2((Number.isFinite(amount) ? amount : 0) + fee);

  function handleSubmit() {
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (isSend && totalDebit > balances[currency]) {
      setError(
        `Not enough test money — amount + fee is ${formatFiat(currency, totalDebit)} but your ${currency} balance is ${formatFiat(currency, balances[currency])}.`,
      );
      return;
    }
    const who = counterparty.trim() || "Someone";
    if (isSend) {
      send(currency, amount, who);
      onDone(
        `Sent ${formatFiat(currency, amount)} (test) to ${who}. BlacksmithPay fee ${formatFiat(currency, fee)} (0.5%) went to BlacksmithPay revenue (test).`,
      );
    } else {
      createRequest(currency, amount, who);
      onDone(
        `Request for ${formatFiat(currency, amount)} (test) sent to ${who} — it sits as Pending until it is "paid".`,
      );
    }
    onClose();
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isSend ? "Send test money" : "Request test money"}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>{isSend ? "Send money" : "Request money"}</h3>
        <p className="hint">
          Mock flow — this moves TEST money in the demo ledger only.
        </p>

        <div className="field">
          <label htmlFor="rw-currency">Currency</label>
          <select
            id="rw-currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as FiatCurrency)}
          >
            <option value="CAD">CAD — Canadian dollar (test)</option>
            <option value="USD">USD — US dollar (test)</option>
          </select>
        </div>

        <div className="field">
          <label htmlFor="rw-amount">Amount</label>
          <input
            id="rw-amount"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            placeholder="0.00"
            value={amountText}
            onChange={(e) => setAmountText(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="rw-who">{isSend ? "Send to" : "Request from"}</label>
          <input
            id="rw-who"
            type="text"
            placeholder="Name or @handle"
            value={counterparty}
            onChange={(e) => setCounterparty(e.target.value)}
          />
        </div>

        {isSend ? (
          <>
            <div className="breakdown" aria-label="Fee breakdown">
              <div className="row">
                <span>Amount sent</span>
                <span>
                  {Number.isFinite(amount)
                    ? formatFiat(currency, amount)
                    : formatFiat(currency, 0)}
                </span>
              </div>
              <div className="row">
                <span>BlacksmithPay fee (0.5%)</span>
                <span>{formatFiat(currency, fee)}</span>
              </div>
              <div className="row total">
                <span>Total taken from your balance</span>
                <span>{formatFiat(currency, totalDebit)}</span>
              </div>
            </div>
            <p className="hint">
              Available: {formatFiat(currency, balances[currency])} (test).
              The fee is always shown before you confirm — never hidden.
            </p>
          </>
        ) : null}
        {error ? <p className="error">{error}</p> : null}

        <div className="actions" style={{ marginTop: 18, marginBottom: 0 }}>
          <button type="button" className="primary" onClick={handleSubmit}>
            {isSend ? "Send (test)" : "Send request (test)"}
          </button>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
