/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.12)",
        primary: "#2bb673",
        accent: "#ffd164",
        brandBlue: "#2f80ed",
        danger: "#ff6b6b"
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
        26: "6.5rem"
      },
      backdropBlur: {
        xs: "2px"
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        pulseSlow: "pulseSlow 4s ease-in-out infinite",
        bounceSoft: "bounceSoft 2s ease-in-out infinite",
        wiggle: "wiggle 1.8s ease-in-out infinite",
        coinPop: "coinPop 0.9s ease-in-out infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" }
        },
        pulseSlow: {
          "0%, 100%": { opacity: 0.8 },
          "50%": { opacity: 1 }
        },
        bounceSoft: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-6px)" }
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-1deg)" },
          "50%": { transform: "rotate(1deg)" }
        },
        coinPop: {
          "0%": { transform: "scale(0.8)", opacity: 0 },
          "60%": { transform: "scale(1.1)", opacity: 1 },
          "100%": { transform: "scale(1)", opacity: 0 }
        }
      }
    }
  },
  plugins: []
};
