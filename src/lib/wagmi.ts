import { createConfig, http, type CreateConnectorFn } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

/**
 * wagmi config for the BlacksmithPay prototype.
 *
 * - Sepolia testnet ONLY. No mainnet, no real funds.
 * - Wallet-agnostic (Dmitri's ruling, Nov 10, 2026): the app talks to
 *   the Ethereum network and takes whatever wallet the visitor brings.
 *   `injected()` covers any browser wallet (MetaMask, Rabby, Coinbase
 *   Wallet, Brave Wallet…) with no API key and no signup — MetaMask is
 *   only an example, never a requirement.
 * - WalletConnect (phone wallets by QR code) is included ONLY when a
 *   project ID is configured via NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID.
 *   A project ID is free from Reown / WalletConnect Cloud, but the
 *   registration must be Dmitri's own account — until he registers one,
 *   the env var stays unset, the connector is absent, and nothing
 *   breaks. No project ID is invented or hardcoded here.
 */

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

const connectors: CreateConnectorFn[] = [injected()];
if (walletConnectProjectId) {
  connectors.push(walletConnect({ projectId: walletConnectProjectId }));
}

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors,
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
