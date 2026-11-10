"use client";

import { formatFiat, useLedger } from "@/lib/ledger";

/**
 * Mock ledger activity. Pending requests can be marked paid, which
 * credits the mock balance — simulating the other side paying.
 */
export function ActivityList() {
  const { activity, markRequestPaid } = useLedger();

  return (
    <div className="activity">
      {activity.length === 0 ? (
        <div className="empty">
          No activity yet. Use Send or Request above to move some test money.
        </div>
      ) : (
        activity.map((item) => (
          <div className="activity-row" key={item.id}>
            <div>
              <div className="what">
                {item.kind === "send"
                  ? `Sent to ${item.counterparty}`
                  : item.kind === "request"
                    ? `Requested from ${item.counterparty}`
                    : item.kind === "exchange-buy"
                      ? "Exchange — bought ETH (demo)"
                      : item.kind === "exchange-sell"
                        ? "Exchange — sold ETH (demo)"
                        : item.kind === "link-create"
                          ? "Payment link created"
                          : "Payment link paid"}{" "}
                — {formatFiat(item.currency, item.amount)}
              </div>
              <div className="when">
                {new Date(item.createdAt).toLocaleString()} · test money
                {item.detail ? ` · ${item.detail}` : ""}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {item.kind === "request" && item.status === "pending" ? (
                <button
                  type="button"
                  className="small"
                  onClick={() => markRequestPaid(item.id)}
                >
                  Mark paid (simulate)
                </button>
              ) : null}
              <span
                className={
                  item.status === "pending" ? "badge pending" : "badge done"
                }
              >
                {item.status}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
