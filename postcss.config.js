/**
 * @type {import('postcss-load-config').Config}
 */
module.exports = {
  map: false,
  plugins: {
    'postcss-import': {},
    '@tailwindcss/postcss': {},
    autoprefixer: {}
  },
}
