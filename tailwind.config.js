/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#09090b', // slate-950/zinc-950 vibe
                card: '#18181b', // zinc-900
                textPrimary: '#f4f4f5', // zinc-50
                textSecondary: '#a1a1aa', // zinc-400
                accent: '#3b82f6', // blue-500
                unlived: '#27272a', // zinc-800
                lived: '#ffffff',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                calligraphy: ['"Dancing Script"', 'cursive'], // Added for quotes
            }
        },
    },
    plugins: [],
}
