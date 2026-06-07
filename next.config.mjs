/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias['iconv-lite'] = false
    return config
  },
}

export default nextConfig
