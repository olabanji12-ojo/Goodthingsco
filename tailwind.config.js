/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'gold': {
          50: '#FDFCF0',
          100: '#FBF8E1',
          200: '#F7F1C3',
          300: '#F3EAA5',
          400: '#EFE387',
          500: '#D4AF37', // Brand Color
          600: '#B8972E',
          700: '#9C7F25',
          800: '#80671C',
          900: '#644F13',
        },
        'cream': {
          50: '#fdfdfc',
          100: '#f9f9f7', // Editorial Background
          200: '#f2f2ed',
          300: '#ecece6',
        },
        'brand': {
          dark: '#1C140E',   // Deep Roast Espresso — high contrast headings & logo
          charcoal: '#2B231D', // Deep Warm Charcoal — nav items & icons
          umber: '#382C24',  // Rich Dark Umber — high legibility body & subtext
          medium: '#4A3B2F', // Warm Walnut — standard body text
          light: '#7A6856',  // Muted warm — captions & subtle notes
          cream: '#F5F0EB',  // Warm cream — backgrounds, cards
          ivory: '#FAF8F5',  // Off-white — page background
        },
      },
      fontFamily: {
        'handwritten': ['Caveat', 'cursive'],
        'sans': ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        'serif': ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 40px -4px rgba(0, 0, 0, 0.08)',
        'hero': '0 20px 60px -8px rgba(59, 42, 26, 0.12)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      fontSize: {
        'hero': ['clamp(2rem, 3.8vw, 3.4rem)', { lineHeight: '1.14', letterSpacing: '-0.015em' }],
        'hero-sub': ['clamp(0.95rem, 1.2vw, 1.125rem)', { lineHeight: '1.65', letterSpacing: '0.005em' }],
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'curtain': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      zIndex: {
        'background': '1',
        'curtain': '2',
        'foreground': '3',
        'overlay': '4',
        'logo': '5',
        'content': '6',
        'nav': '10',
      },
    },
  },
  plugins: [],
};
