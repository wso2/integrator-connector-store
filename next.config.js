/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'bcentral-packageicons.azureedge.net',
      },
      {
        protocol: 'https',
        hostname: 'wso2.cachefly.net',
      },
    ],
  },
  reactStrictMode: true,
}

module.exports = nextConfig
