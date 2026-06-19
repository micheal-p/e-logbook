// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/supabase', '@nuxtjs/tailwindcss'],

  // @nuxtjs/supabase reads SUPABASE_URL + SUPABASE_KEY from .env automatically.
  supabase: {
    redirectOptions: {
      login: '/login',
      callback: '/confirm',
      // Pages reachable while logged OUT. Everything else requires auth.
      exclude: ['/', '/about', '/siwes', '/signup', '/reset-password', '/update-password'],
    },
  },

  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
  },

  app: {
    head: {
      title: 'Caleb University E-Logbook',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'SIWES industrial-training electronic logbook' },
      ],
      link: [{ rel: 'icon', type: 'image/png', href: '/caleb-logo.png' }],
    },
  },
})
