/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: 'var(--brand, #E23744)',
        page: '#FFFFFF',
        section: '#F7F7F8',
        card: '#FFFFFF',
        border: {
          DEFAULT: '#ECECEC',
          light: '#ECECEC',
          subtle: '#F0F0F0',
        },
        text: {
          main: '#111111',
          sub: '#555555',
          muted: '#6B6B6B',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08)',
        cardHover: '0 4px 12px rgba(0,0,0,0.08)',
        float: '0 8px 24px rgba(0,0,0,0.14)',
        modal: '0 12px 32px rgba(0,0,0,0.16)',
      },
      fontFamily: {
        sans: [
          'Inter',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};
