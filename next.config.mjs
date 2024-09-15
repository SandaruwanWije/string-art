/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: function (config, env) {
    config.resolve.alias['@'] = path.resolve(__dirname);
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
    };
    return config;
  },
  output: "export",
};

export default nextConfig;
