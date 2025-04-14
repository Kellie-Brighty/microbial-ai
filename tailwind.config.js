/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: "#3BCEAC",
        purple: "#6A67CE",
        lightPurple: "#9D9AFA",
        charcoal: "#2A2B2E",
        offWhite: "#F7F9FC",
        lightGray: "#E8EDF5",
        dim: {
          white: "#F8F8F8",
          offWhite: "#EEF1F6",
          mint: "#34B99A",
          purple: "#5F5CB8",
          gray50: "#F2F2F2",
          gray100: "#E6E6E6",
        },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out forwards",
        "cell-division": "cell-division 3s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "cell-division": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.3)" },
        },
      },
    },
  },
  plugins: [],
};
