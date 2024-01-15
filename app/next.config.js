/** @type {import('next').NextConfig} */
const nextConfig = {
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
