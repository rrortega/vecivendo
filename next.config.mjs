/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'chambapro-appwrite.s3.us-east-1.amazonaws.com',
                port: '',
                pathname: '/storage/uploads/**',
            },
            {
                protocol: 'https',
                hostname: 's3.us-east-1.amazonaws.com',
                port: '',
                pathname: '/**',
            },
        ],
    },
};

export default nextConfig;
