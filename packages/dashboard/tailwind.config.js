/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // App chrome — near-black with a cool green tint so the accent sits naturally
        bg: '#0e1512',
        surface: '#141d19',
        panel: '#141d19',
        raised: '#1b2621',
        border: '#25322c',
        borderStrong: '#33443b',

        // Text
        ink: '#e6ece9',
        muted: '#9aa8a1',
        faint: '#697871',

        // Brand + semantics
        accent: '#15805a',
        accentSoft: '#35b083',
        danger: '#f0555f',
        warning: '#e5a34a',
        success: '#4cc38a',
        info: '#5aa9e6',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
    },
  },
  plugins: [],
};
