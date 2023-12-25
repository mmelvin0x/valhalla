/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: "loose",
    serverComponentsExternalPackages: ["mongoose"],
  },
  // and the following to enable top-level await support for Webpack
  webpack: (config) => {
    config.experiments = {
      layers: true,
      topLevelAwait: true,
    };
    return config;
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.arweave.net",
        port: "",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
        port: "",
        pathname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
