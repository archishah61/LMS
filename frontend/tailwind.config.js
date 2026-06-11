/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        'xs': '344px',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '60%': { transform: 'scale(1.05)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        floatUp: {
          '0%, 100%': { transform: 'translateY(0px) scale(1)', opacity: '0.7' },
          '50%': { transform: 'translateY(-18px) scale(1.08)', opacity: '1' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.85)', opacity: '0.8' },
          '70%': { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(0.85)', opacity: '0' },
        },
        shimmerText: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        dotBounce: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '0.4' },
          '40%': { transform: 'translateY(-8px)', opacity: '1' },
        },
        orbitSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeSlideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px 0px rgba(0,187,110,0.3)' },
          '50%': { boxShadow: '0 0 40px 8px rgba(0,187,110,0.6)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.4s ease-out forwards',
        bounceIn: 'bounceIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
        floatUp: 'floatUp 3s ease-in-out infinite',
        pulseRing: 'pulseRing 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite',
        shimmerText: 'shimmerText 2.5s linear infinite',
        dotBounce: 'dotBounce 1.4s ease-in-out infinite',
        orbitSpin: 'orbitSpin 4s linear infinite',
        fadeSlideUp: 'fadeSlideUp 0.6s ease-out forwards',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
      },
      colors: {
        primary: '#00BB6E',
        black: '#000000',
        white: '#FFFFFF',
        megistic: '#111827',
        forestGreen: '#002322',
        secondaryForestGreen: '#023837',
        leafGreen: '#009D5C',
        lightGreen: '#F0FBF6',
        sand: '#F9F8F6',
        darkSand: '#474747',
        experience1: '#8B045C',
        experience2: '#0667D9',
        experience3: '#02693E',
        experience4: '#DB3308'
      },
    },
  },
  plugins: [],
}