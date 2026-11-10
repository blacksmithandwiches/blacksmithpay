"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

/**
 * Wallet connect button (wagmi). BlacksmithPay is wallet-agnostic: any
 * injected Ethereum browser wallet works (MetaMask is only an example),
 * and WalletConnect joins the menu automatically when its project ID
 * is configured (see lib/wagmi.ts). Graceful states: no wallet found /
 * not connected / connecting / connected (with disconnect).
 *
 * Choosing: with a single available connector we connect directly;
 * with several (e.g. WalletConnect enabled) each gets its own button.
 */
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error, variables } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button type="button" onClick={() => disconnect()} title={address}>
        Disconnect {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  const ready = connectors.filter((c) => c.type !== "mock");
  const single = ready.length === 1 ? ready[0] : undefined;

  return (
    <span>
      {single ? (
        <button
          type="button"
          className="primary"
          disabled={isPending}
          onClick={() => connect({ connector: single })}
        >
          {isPending ? "Connecting…" : "Connect wallet"}
        </button>
      ) : (
        ready.map((connector) => (
          <button
            key={connector.uid}
            type="button"
            className="primary"
            disabled={isPending}
            onClick={() => connect({ connector })}
            style={{ marginRight: 8 }}
          >
            {isPending && variables?.connector === connector
              ? "Connecting…"
              : connector.type === "walletConnect"
                ? "Connect wallet — QR code"
                : "Connect wallet"}
          </button>
        ))
      )}
      {error ? (
        <span className="error" style={{ marginLeft: 10 }}>
          No wallet found in this browser — install any Ethereum wallet
          (for example MetaMask), or use the built-in demo wallet below.
        </span>
      ) : null}
    </span>
  );
}
