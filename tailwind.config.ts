import type { Config } from 'tailwindcss'

// Palette sampled from the real Caleb University site & logo:
//   navy  #021E40  (wordmark "UNIVERSITY", primary dark — header/footer/headings)
//   cyan  #00AFEF  (logo band + brand accent)
//   green #00A859  (the dove emblem — success / approval accents)
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
          navy: '#021E40',
          'navy-dark': '#01122A',
          cyan: '#00AFEF',
          'cyan-dark': '#0A7AAC', // readable cyan for text/links
          green: '#00A859',
          'green-dark': '#008746',
          surface: '#F1F6FB', // light blue-tinted background
          text: '#1A1A1A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
