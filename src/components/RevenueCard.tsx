"use client";

import { formatFiat, useLedger } from "@/lib/ledger";

/**
 * BlacksmithPay revenue (test) — every fee the demo charges (exchange,
 * fiat transfer, payment link) accrues here, per currency. This is
 * the monetization model made visible: TEST numbers only.
 */
export function RevenueCard() {
  const { revenue } = useLedger();

  return (
    <div className="card revenue">
      <div className="label">BlacksmithPay revenue (test)</div>
      <div className="amount">
        {formatFiat("CAD", revenue.CAD)} · {formatFiat("USD", revenue.USD)}
      </div>
      <div className="sub">
        Fees collected in this demo: exchange 0.85% · fiat transfer 0.5% ·
        payment links 2.9% + $0.30. Test numbers — not real income.
      </div>
    </div>
  );
}
