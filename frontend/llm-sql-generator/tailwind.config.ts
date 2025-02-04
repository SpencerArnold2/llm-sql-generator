import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./pages/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      textColor: {
        DEFAULT: '#4B5563', // This is Tailwind's gray-600
      },
    },
  },
  plugins: [],
};

export default config;

