/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50:  '#E8EDF8',
          100: '#C9D4EF',
          200: '#9BADD6',
          500: '#2950A8',
          600: '#1E3E8A',
          700: '#0B1E4B',
          800: '#0F2150',
          900: '#0B1E4B',
        },
        gold: {
          DEFAULT: '#C6A84B',
          light:   '#F5EBD0',
          dark:    '#9E7F2A',
        },
        success: {
          50:  '#E8F5EE',
          500: '#1F8A4C',
          600: '#166A3A',
        },
        danger: {
          50:  '#FEE8E8',
          100: '#FDCACA',
          500: '#C73434',
          600: '#A02020',
        },
      },
      fontFamily: {
        sans:    ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xs':   '5px',
        'sm':   '8px',
        'md':   '12px',
        'lg':   '16px',
        'xl':   '20px',
        '2xl':  '24px',
        'full': '9999px',
      },
      boxShadow: {
        'xs': '0 1px 3px rgba(11,30,75,0.07)',
        'sm': '0 4px 12px rgba(11,30,75,0.09)',
        'md': '0 8px 24px rgba(11,30,75,0.11)',
        'lg': '0 14px 40px rgba(11,30,75,0.13)',
        'xl': '0 20px 64px rgba(11,30,75,0.16)',
      },
      transitionTimingFunction: {
        'ease-custom': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        'fast': '140ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
}
