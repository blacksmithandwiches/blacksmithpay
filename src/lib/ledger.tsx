"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  linkFee,
  quoteExchange,
  round2,
  transferFee,
} from "./fees";

/**
 * Mock ledger for the BlacksmithPay prototype.
 *
 * TEST MONEY ONLY. Balances live in React state and persist to
 * localStorage on this device. There is no server, no database, no
 * real funds and no payment rails behind this — it exists so the
 * flows can be clicked through end to end.
 *
 * On top of the mock fiat balances, this store now holds:
 * - `demoEth`: mock ETH bought through the demo Exchange. It is an
 *   app-ledger number only, kept SEPARATE from the real Sepolia
 *   wallet balance (which stays read-only, read via the connected
 *   wallet or the built-in demo wallet).
 * - `revenue`: every BlacksmithPay fee (exchange / transfer / payment
 *   link), accrued per fiat currency — "BlacksmithPay revenue (test)".
 * - `paymentLinks`: demo payment links created in the app.
 *
 * (Blueprint P1 calls for a PostgreSQL ledger behind an API later;
 * this store is the stand-in until then.)
 */

export type FiatCurrency = "CAD" | "USD";

export type ActivityItem = {
  id: string;
  kind:
    | "send"
    | "request"
    | "exchange-buy"
    | "exchange-sell"
    | "link-create"
    | "link-paid";
  currency: FiatCurrency;
  amount: number;
  counterparty: string;
  status: "completed" | "pending";
  createdAt: number;
  /** Optional human-readable extra, e.g. the fee that was charged. */
  detail?: string;
};

export type PaymentLink = {
  id: string;
  currency: FiatCurrency;
  amount: number;
  status: "open" | "paid";
  createdAt: number;
};

type LedgerState = {
  balances: Record<FiatCurrency, number>;
  demoEth: number;
  revenue: Record<FiatCurrency, number>;
  paymentLinks: PaymentLink[];
  activity: ActivityItem[];
};

const STORAGE_KEY = "blacksmithpay-mock-ledger-v1";

/** Starting TEST balances so the demo has something to move around. */
const INITIAL_STATE: LedgerState = {
  balances: { CAD: 1250.0, USD: 860.0 },
  demoEth: 0,
  revenue: { CAD: 0, USD: 0 },
  paymentLinks: [],
  activity: [],
};

type LedgerContextValue = LedgerState & {
  /** Send fiat; a 0.5% BlacksmithPay fee is charged to the sender on top. */
  send: (currency: FiatCurrency, amount: number, counterparty: string) => void;
  createRequest: (
    currency: FiatCurrency,
    amount: number,
    counterparty: string,
  ) => void;
  /** Simulates the other side paying a pending request (test money). */
  markRequestPaid: (id: string) => void;
  /**
   * Demo exchange at the MOCK rate. "buy": spend fiat, receive demo
   * ETH. "sell": spend demo ETH, receive fiat. A 0.85% fee (shown to
   * the user before confirming) accrues to revenue. Returns false when
   * the balance cannot cover it.
   */
  exchange: (
    direction: "buy" | "sell",
    currency: FiatCurrency,
    amount: number,
  ) => boolean;
  createPaymentLink: (currency: FiatCurrency, amount: number) => void;
  /**
   * Simulates a buyer paying an open link: the seller balance is
   * credited amount minus the 2.9% + $0.30 seller fee, which accrues
   * to revenue.
   */
  payPaymentLink: (id: string) => void;
  resetDemo: () => void;
};

const LedgerContext = createContext<LedgerContextValue | null>(null);

function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

/** Merge a persisted (possibly older-shaped) state over the defaults. */
function withDefaults(parsed: Partial<LedgerState> | null): LedgerState {
  if (!parsed || !parsed.balances || !Array.isArray(parsed.activity)) {
    return INITIAL_STATE;
  }
  return {
    balances: { ...INITIAL_STATE.balances, ...parsed.balances },
    demoEth: typeof parsed.demoEth === "number" ? parsed.demoEth : 0,
    revenue: { ...INITIAL_STATE.revenue, ...(parsed.revenue ?? {}) },
    paymentLinks: Array.isArray(parsed.paymentLinks)
      ? parsed.paymentLinks
      : [],
    activity: parsed.activity,
  };
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LedgerState>(INITIAL_STATE);
  const loaded = useRef(false);

  // Load persisted mock state after mount (keeps SSR/first render stable).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setState(withDefaults(JSON.parse(raw) as Partial<LedgerState>));
      }
    } catch {
      // Corrupt storage -> fall back to the initial demo state.
    }
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full/blocked — the in-memory ledger still works.
    }
  }, [state]);

  const send = useCallback(
    (currency: FiatCurrency, amount: number, counterparty: string) => {
      setState((prev) => {
        const fee = transferFee(amount);
        const total = round2(amount + fee);
        if (amount <= 0 || total > prev.balances[currency]) return prev;
        return {
          ...prev,
          balances: {
            ...prev.balances,
            [currency]: round2(prev.balances[currency] - total),
          },
          revenue: {
            ...prev.revenue,
            [currency]: round2(prev.revenue[currency] + fee),
          },
          activity: [
            {
              id: newId(),
              kind: "send",
              currency,
              amount,
              counterparty: counterparty.trim() || "Someone",
              status: "completed",
              createdAt: Date.now(),
              detail: `BlacksmithPay fee ${fee.toFixed(2)} ${currency} (0.5%)`,
            },
            ...prev.activity,
          ],
        };
      });
    },
    [],
  );

  const createRequest = useCallback(
    (currency: FiatCurrency, amount: number, counterparty: string) => {
      setState((prev) => {
        if (amount <= 0) return prev;
        return {
          ...prev,
          activity: [
            {
              id: newId(),
              kind: "request",
              currency,
              amount,
              counterparty: counterparty.trim() || "Someone",
              status: "pending",
              createdAt: Date.now(),
            },
            ...prev.activity,
          ],
        };
      });
    },
    [],
  );

  const markRequestPaid = useCallback((id: string) => {
    setState((prev) => {
      const item = prev.activity.find((a) => a.id === id);
      if (!item || item.kind !== "request" || item.status !== "pending") {
        return prev;
      }
      return {
        ...prev,
        balances: {
          ...prev.balances,
          [item.currency]: round2(prev.balances[item.currency] + item.amount),
        },
        activity: prev.activity.map((a) =>
          a.id === id ? { ...a, status: "completed" as const } : a,
        ),
      };
    });
  }, []);

  const exchange = useCallback(
    (
      direction: "buy" | "sell",
      currency: FiatCurrency,
      amount: number,
    ): boolean => {
      let ok = false;
      setState((prev) => {
        if (amount <= 0) return prev;
        if (direction === "buy") {
          if (amount > prev.balances[currency]) return prev;
          const q = quoteExchange("buy", currency, amount);
          ok = true;
          return {
            ...prev,
            balances: {
              ...prev.balances,
              [currency]: round2(prev.balances[currency] - amount),
            },
            demoEth: prev.demoEth + q.ethOut,
            revenue: {
              ...prev.revenue,
              [currency]: round2(prev.revenue[currency] + q.fee),
            },
            activity: [
              {
                id: newId(),
                kind: "exchange-buy" as const,
                currency,
                amount,
                counterparty: "Exchange",
                status: "completed" as const,
                createdAt: Date.now(),
                detail: `Bought ${q.ethOut.toFixed(6)} ETH (demo) at mock rate · fee ${q.fee.toFixed(2)} ${currency} (0.85%)`,
              },
              ...prev.activity,
            ],
          };
        }
        // sell
        if (amount > prev.demoEth) return prev;
        const q = quoteExchange("sell", currency, amount);
        ok = true;
        return {
          ...prev,
          demoEth: prev.demoEth - amount,
          balances: {
            ...prev.balances,
            [currency]: round2(prev.balances[currency] + q.fiatOut),
          },
          revenue: {
            ...prev.revenue,
            [currency]: round2(prev.revenue[currency] + q.fee),
          },
          activity: [
            {
              id: newId(),
              kind: "exchange-sell" as const,
              currency,
              amount: q.fiatIn,
              counterparty: "Exchange",
              status: "completed" as const,
              createdAt: Date.now(),
              detail: `Sold ${amount} ETH (demo) at mock rate · received ${q.fiatOut.toFixed(2)} ${currency} · fee ${q.fee.toFixed(2)} ${currency} (0.85%)`,
            },
            ...prev.activity,
          ],
        };
      });
      return ok;
    },
    [],
  );

  const createPaymentLink = useCallback(
    (currency: FiatCurrency, amount: number) => {
      setState((prev) => {
        if (amount <= 0) return prev;
        const link: PaymentLink = {
          id: newId().slice(0, 10),
          currency,
          amount,
          status: "open",
          createdAt: Date.now(),
        };
        return {
          ...prev,
          paymentLinks: [link, ...prev.paymentLinks],
          activity: [
            {
              id: newId(),
              kind: "link-create",
              currency,
              amount,
              counterparty: "Payment link",
              status: "completed",
              createdAt: Date.now(),
              detail: `Link ${link.id} created`,
            },
            ...prev.activity,
          ],
        };
      });
    },
    [],
  );

  const payPaymentLink = useCallback((id: string) => {
    setState((prev) => {
      const link = prev.paymentLinks.find((l) => l.id === id);
      if (!link || link.status !== "open") return prev;
      const fee = linkFee(link.amount);
      const received = round2(link.amount - fee);
      if (received <= 0) return prev;
      return {
        ...prev,
        balances: {
          ...prev.balances,
          [link.currency]: round2(prev.balances[link.currency] + received),
        },
        revenue: {
          ...prev.revenue,
          [link.currency]: round2(prev.revenue[link.currency] + fee),
        },
        paymentLinks: prev.paymentLinks.map((l) =>
          l.id === id ? { ...l, status: "paid" as const } : l,
        ),
        activity: [
          {
            id: newId(),
            kind: "link-paid",
            currency: link.currency,
            amount: received,
            counterparty: "Payment link",
            status: "completed",
            createdAt: Date.now(),
            detail: `Link ${link.id} paid ${link.amount.toFixed(2)} ${link.currency} · seller fee ${fee.toFixed(2)} ${link.currency} (2.9% + $0.30)`,
          },
          ...prev.activity,
        ],
      };
    });
  }, []);

  const resetDemo = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const value = useMemo<LedgerContextValue>(
    () => ({
      ...state,
      send,
      createRequest,
      markRequestPaid,
      exchange,
      createPaymentLink,
      payPaymentLink,
      resetDemo,
    }),
    [
      state,
      send,
      createRequest,
      markRequestPaid,
      exchange,
      createPaymentLink,
      payPaymentLink,
      resetDemo,
    ],
  );

  return (
    <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>
  );
}

export function useLedger(): LedgerContextValue {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside <LedgerProvider>");
  return ctx;
}

export function formatFiat(currency: FiatCurrency, amount: number): string {
  return new Intl.NumberFormat(currency === "CAD" ? "en-CA" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
