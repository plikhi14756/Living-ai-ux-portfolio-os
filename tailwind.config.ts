import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        paper: "#f8f7f3",
        moss: "#5f7f65",
        ember: "#b85f45",
        iris: "#6b67b8",
        cyan: "#2f8f9d"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(23, 33, 31, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
