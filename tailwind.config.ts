import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wellness: {
          50: "#ecfdf5",
          100: "#d1fae5",
          400: "#34d399",
          500: "#10b981",
          primary: "#00C48C",
          accent: "#06B6D4",
          darkBg: "#0B111E",
          card: "#131D31",
          border: "rgba(255, 255, 255, 0.08)",
          text: "#E2E8F0",
        },
      },
    },
  },
  plugins: [],
};

export default config;