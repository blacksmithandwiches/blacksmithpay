import type { MetadataRoute } from "next";

// Required so the manifest route also works in the Capacitor static
// export build (output: "export"); a no-op for the default server build.
export const dynamic = "force-static";

// Web app manifest for the BlacksmithPay PWA (installable web app).
// Served by Next.js at /manifest.webmanifest. TEST MONEY ONLY framing is
// kept in the description, same as everywhere else in this prototype.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BlacksmithPay",
    short_name: "BlacksmithPay",
    description:
      "BlacksmithPay prototype — send and request test money, fiat-style balances plus MetaMask on Sepolia testnet. TEST MONEY ONLY: no real money moves in this app.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafafa",
    theme_color: "#2f6fb4",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
