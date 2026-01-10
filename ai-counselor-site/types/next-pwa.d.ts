declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    disable?: boolean;
    register?: boolean;
    skipWaiting?: boolean;
    scope?: string;
    sw?: string;
    runtimeCaching?: unknown[];
    buildExcludes?: (string | RegExp)[];
    startUrl?: string;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    fallbacks?: {
      image?: string;
      audio?: string;
      video?: string;
      document?: string;
      font?: string;
    };
    cacheOnFrontEndNav?: boolean;
    subdomainPrefix?: string;
    reloadOnOnline?: boolean;
    customWorkerDir?: string;
    publicExcludes?: string[];
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
