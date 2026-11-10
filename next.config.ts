import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Store builds only: `CAPACITOR_BUILD=1 npm run build` produces a static
  // export in `out/` for the Capacitor Android/iOS shells (webDir: "out").
  // The default build (Vercel deployment) is unchanged — no `output` key.
  ...(process.env.CAPACITOR_BUILD === "1"
    ? { output: "export" as const, images: { unoptimized: true } }
    : {}),
  webpack: (config) => {
    // wagmi's connector bundle pulls in optional peers for connectors
    // BlacksmithPay never uses (Coinbase/Base account SDKs, React Native
    // storage). Some of those packages reference modules that are not
    // installed ('@x402/evm'). Alias the unused ones away so the
    // production build resolves; the injected (MetaMask) connector
    // used here needs none of them.
    config.resolve = config.resolve ?? {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@x402/evm": false,
      "@coinbase/cdp-sdk": false,
      "@base-org/account": false,
      "@react-native-async-storage/async-storage": false,
    };
    config.externals = [...(config.externals ?? []), "pino-pretty"];
    return config;
  },
};

export default nextConfig;
