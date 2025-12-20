/** PostCSS configuration https://github.com/postcss/postcss#usage */

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    autoprefixer: {},
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: { preset: 'default' },
    }),
  },
}
