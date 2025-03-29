/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // 在构建过程中忽略 ESLint 错误
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 在构建过程中忽略 TypeScript 错误
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig 