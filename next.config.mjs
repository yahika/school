/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    // pdfkit/fontkit peer dep — not needed at runtime in Next.js
    config.resolve.alias['iconv-lite'] = false
    return config
  },
}

export default nextConfig
