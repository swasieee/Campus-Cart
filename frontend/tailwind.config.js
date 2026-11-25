export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0F172A",
        chalk: "#FAFAFA",
        mark: "#0F172A",
        slate2: "#64748B",
        rule: "#E2E8F0",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        display: ['"Plus Jakarta Sans"', '"Inter"', "system-ui", "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-in": "slideInRight 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
        "pop-in": "popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
      },
    },
  },
  plugins: [],
};
