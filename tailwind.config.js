/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./prototypes/**/*.{svelte,js,ts,html}",
    "./legacy/**/*.{svelte,js,ts,html}"
  ],
  theme: {
    extend: {
      colors: {
        // Background colors
        bg: {
          darkest: '#0f0e0d',
          dark: '#1a1815',
          medium: '#2a2520',
          light: '#3a352e',
        },
        // Accent colors
        brass: {
          DEFAULT: '#b8956e',
          light: '#d4b896',
          dark: '#8b7355',
        },
        copper: '#b87333',
        bronze: '#cd7f32',
        // Parchment/Paper
        parchment: {
          DEFAULT: '#f5f0e6',
          dark: '#e8dcc8',
          aged: '#d4c4a8',
        },
        // Status colors
        status: {
          idle: '#4a7c59',
          busy: '#c9a227',
          ready: '#5b8fa8',
          error: '#a84432',
        },
        // Patient status
        patient: {
          stable: '#4a7c59',
          guarded: '#c9a227',
          declining: '#d4742c',
          critical: '#a84432',
        },
        // Sample colors
        sample: {
          blood: '#8b0000',
          sputum: '#c9a227',
          swab: '#e8dcc8',
          urine: '#d4b896',
          csf: '#a8c5d4',
        },
      },
      fontFamily: {
        heading: ['Cinzel', 'serif'],
        body: ['Crimson Text', 'Georgia', 'serif'],
        mono: ['Courier New', 'monospace'],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      boxShadow: {
        sm: '0 1px 3px rgba(0, 0, 0, 0.4)',
        DEFAULT: '0 2px 6px rgba(0, 0, 0, 0.5)',
        md: '0 2px 6px rgba(0, 0, 0, 0.5)',
        lg: '0 4px 12px rgba(0, 0, 0, 0.6)',
      },
      borderWidth: {
        thin: '1px',
        medium: '2px',
        thick: '3px',
      },
      fontSize: {
        xs: '0.8rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.25rem',
        xl: '1.5rem',
        '2xl': '2rem',
      },
    },
  },
  plugins: [],
}
