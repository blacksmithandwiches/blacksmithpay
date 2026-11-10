import { createConfig, http } from "wagmi";
import { sepolia } from "wagmi/chains";
import { injected } from "wagmi/connectors";

/**
 * wagmi config for the BlacksmithPay prototype.
 *
 * - Sepolia testnet ONLY. No mainnet, no real funds.
 * - `injected()` covers MetaMask (and other browser wallets) with no
 *   API key and no signup. WalletConnect can be added later with a
 *   free project ID if Dmitri wants QR-code pairing.
 */
export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [injected()],
  transports: {
    [sepolia.id]: http(),
  },
  ssr: true,
});
