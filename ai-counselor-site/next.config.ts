import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import withPWAInit from "next-pwa";
import { withSentryConfig } from "@sentry/nextjs";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(withBundleAnalyzer(withPWA(nextConfig)));
