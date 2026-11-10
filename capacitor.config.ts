import type { CapacitorConfig } from "@capacitor/cli";

// Capacitor shell for the BlacksmithPay store builds (Android + iOS).
// The web bundle comes from the Next.js static export:
//   CAPACITOR_BUILD=1 npm run build   ->  out/
//   npx cap sync
// This prototype moves TEST MONEY ONLY (mock ledger + Sepolia testnet).
const config: CapacitorConfig = {
  appId: "com.blacksmithandwitches.blacksmithpay",
  appName: "BlacksmithPay",
  webDir: "out",
};

export default config;
