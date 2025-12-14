/** @type {import('tailwindcss').Config} */
export default {
  // Extend Tailwind content paths to include root-level JSX files so that
  // Tailwind classes used in App.jsx and other top‑level components are
  // included in the build. Without this, styles in these files would be
  // purged in production. Note that the original site expected a src
  // directory, but our files live in the project root.
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}