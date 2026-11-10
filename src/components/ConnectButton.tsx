"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";

/**
 * MetaMask connect button (via wagmi's injected connector).
 * Graceful states: no wallet installed / not connected / connecting /
 * connected (with disconnect).
 */
export function ConnectButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <button type="button" onClick={() => disconnect()} title={address}>
        Disconnect {address.slice(0, 6)}…{address.slice(-4)}
      </button>
    );
  }

  const injected = connectors[0];

  return (
    <span>
      <button
        type="button"
        className="primary"
        disabled={!injected || isPending}
        onClick={() => injected && connect({ connector: injected })}
      >
        {isPending ? "Connecting…" : "Connect MetaMask"}
      </button>
      {error ? (
        <span className="error" style={{ marginLeft: 10 }}>
          No wallet found — install MetaMask to connect.
        </span>
      ) : null}
    </span>
  );
}
