import type { Config } from 'tailwindcss'

// THEME: the app is coloured to match the physical SIWES/ITF logbook (green +
// paper), NOT the school's navy/cyan. The token *names* under `caleb.*` are kept
// as-is so we don't have to touch 200+ class references across the app — only the
// hex values are remapped here. Read "navy" = primary green ink, "cyan" = accent
// green. Values align to Tailwind's green scale so the green-100/green-800 status
// pills used around the app harmonise automatically.
//   navy  green-800  primary — headers, headings, primary buttons
//   cyan  green-500  accent — progress bars, highlights
//   green green-600  success / approval
export default <Partial<Config>>{
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/composables/**/*.{js,ts}',
    './app/app.vue',
    './app/error.vue',
  ],
  theme: {
    extend: {
      colors: {
        caleb: {
          navy: '#166534', // green-800 — primary ink / buttons / headings
          'navy-dark': '#14532D', // green-900 — hover / darker
          cyan: '#22C55E', // green-500 — bright accent (progress fill)
          'cyan-dark': '#15803D', // green-700 — readable accent for text/links
          green: '#16A34A', // green-600 — success / approval
          'green-dark': '#15803D',
          surface: '#F2F6F1', // faint green-tinted paper background
          text: '#1A1A1A', // ink
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
