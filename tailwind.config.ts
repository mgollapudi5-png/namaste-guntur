import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        slideUp: {
          "0%": { transform: "translateY(40px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeOut: {
          "0%": { opacity: "1" },
          "100%": { opacity: "0", transform: "scale(0.95)" },
        },
      },
      animation: {
        "slide-up": "slideUp 0.3s ease-out forwards",
        "fade-out": "fadeOut 0.4s ease-in forwards",
      },
    },
  },
  plugins: [],
};
export default config;
