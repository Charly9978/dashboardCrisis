// nuxt-app/nuxt.config.ts


export default defineNuxtConfig({
  // On garde le mode SPA (ssr: false)
  ssr: false,

  debug: true,

  // --- MODULES ---
  // On ajoute les 4 modules (UI, Pinia, VueFire, PWA)
  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    'nuxt-vuefire',
    '@vite-pwa/nuxt'
  ],

  css: ['~/assets/css/main.css'],

  // --- CONFIGURATION VUEFIRE ---
  vuefire: {
    // On dit à VueFire d'utiliser les clés de notre fichier .env
    config: {
      apiKey: process.env.NUXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NUXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NUXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NUXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NUXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NUXT_PUBLIC_FIREBASE_APP_ID,
    },
    // On active les services Firebase dont on a besoin
      auth:{
        enabled: true
      } ,       // Pour l'authentification
      firestore: true,  // Pour la base de données
  
  },

  // --- CONFIGURATION PWA ---
  pwa: {
    // On définit le "manifeste" de notre application
    manifest: {
      name: 'Outil de Crise SITREP',
      short_name: 'CriseApp',
      description: 'Tableau de bord de situation de crise',
      theme_color: '#ffffff',
      icons: [
        {
          src: 'pwa-icon-512x512.png', // On fait référence à une icône
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
    // (Pinia n'a pas besoin de configuration ici, juste d'être dans 'modules')
  },
  
  devtools: { enabled: true }
})

