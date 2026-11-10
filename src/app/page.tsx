"use client";

import { useState } from "react";
import { useAccount, useBalance } from "wagmi";
import { sepolia } from "wagmi/chains";
import { formatEther } from "viem";
import { useLedger, formatFiat } from "@/lib/ledger";
import { TestBanner } from "@/components/TestBanner";
import { BalanceCard } from "@/components/BalanceCard";
import { ConnectButton } from "@/components/ConnectButton";
import {
  SendRequestModal,
  type FlowMode,
} from "@/components/SendRequestModal";
import { ActivityList } from "@/components/ActivityList";
import { Nav } from "@/components/Nav";
import { RevenueCard } from "@/components/RevenueCard";
import { CryptoSend } from "@/components/CryptoSend";

/**
 * BlacksmithPay home — the first screen.
 * Three balances (CAD, USD, crypto), Send / Request, activity.
 */
export default function HomePage() {
  const { balances, demoEth, resetDemo } = useLedger();
  const { address, isConnected } = useAccount();
  const { data: ethBalance, isLoading: ethLoading } = useBalance({
    address,
    chainId: sepolia.id,
    query: { enabled: Boolean(address) },
  });

  const [flow, setFlow] = useState<FlowMode | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const cryptoAmount = !isConnected
    ? "—"
    : ethLoading
      ? "Loading…"
      : ethBalance
        ? `${Number(formatEther(ethBalance.value)).toFixed(4)} ETH`
        : "0 ETH";

  const cryptoSub = !isConnected
    ? "Connect MetaMask to see your Sepolia testnet balance."
    : `Sepolia testnet · ${address}`;

  return (
    <main className="shell">
      <TestBanner />

      <header className="top">
        <div>
          <div className="logo">
            Blacksmith<span>Pay</span>
          </div>
          <div className="tagline">
            Fiat and crypto in one wallet — prototype build.
          </div>
        </div>
        <ConnectButton />
      </header>

      <Nav />

      {notice ? (
        <div className="notice" role="status">
          {notice}
        </div>
      ) : null}

      <section className="cards" aria-label="Balances">
        <BalanceCard
          label="CAD · test balance"
          amount={formatFiat("CAD", balances.CAD)}
          sub="Mock ledger — not real money."
        />
        <BalanceCard
          label="USD · test balance"
          amount={formatFiat("USD", balances.USD)}
          sub="Mock ledger — not real money."
        />
        <BalanceCard
          label="Crypto · Sepolia testnet"
          amount={cryptoAmount}
          sub={cryptoSub}
        />
        <BalanceCard
          label="ETH (demo) · from Exchange"
          amount={`${demoEth.toFixed(6)} ETH`}
          sub="Mock ETH in the app ledger from demo exchanges — separate from your Sepolia wallet above."
        />
        <RevenueCard />
      </section>

      <div className="actions">
        <button
          type="button"
          className="primary"
          onClick={() => setFlow("send")}
        >
          Send
        </button>
        <button type="button" onClick={() => setFlow("request")}>
          Request
        </button>
        <button
          type="button"
          onClick={() => {
            resetDemo();
            setNotice("Demo reset — mock balances restored.");
          }}
        >
          Reset demo
        </button>
      </div>

      <h2 className="section">Activity</h2>
      <ActivityList />

      <h2 className="section" style={{ marginTop: 28 }}>
        Crypto send
      </h2>
      <CryptoSend />

      <footer className="foot">
        BlacksmithPay P1 prototype. Fiat balances are a mock ledger stored only
        in this browser. Crypto connects through MetaMask to the Sepolia
        testnet — test ETH has no value. Exchange and payment links are
        demos on mock numbers; every fee is shown before you confirm.
        Real-money features come only after the licensed-partner and
        compliance step (Blueprint §4). Not affiliated with PayPal or
        MetaMask.
      </footer>

      {flow ? (
        <SendRequestModal
          mode={flow}
          onClose={() => setFlow(null)}
          onDone={(message) => setNotice(message)}
        />
      ) : null}
    </main>
  );
}
