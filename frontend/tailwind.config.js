/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        firefox: {
          ink: "#1C1B22",
          surface: "#2B2A33",
          surfaceHover: "#35343E",
          border: "#38343D",
          orange: "#FF7139",
          orangeHover: "#E65A20",
          mint: "#00DD8A",
          amber: "#FFA436",
          crimson: "#E22850",
          text: "#FBFBFE",
          muted: "#8F8F9D",
          subtle: "#5B5B66"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
