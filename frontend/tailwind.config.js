export default {
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
    },
  },
  plugins: [],
};
