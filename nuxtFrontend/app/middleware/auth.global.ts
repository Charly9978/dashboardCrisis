import { useProfilStore } from '~/stores/profilStore'

export default defineNuxtRouteMiddleware(async (to) => {
  console.log('début du middleware', to.path)
  const store = useProfilStore()

  // Pages publiques
  const publicPages = ['/login']
  if (publicPages.includes(to.path)){
    console.log('middle: publicpage')
    return
  }

  // Redirige si pas connecté
  if (!store.profil) {
    const cacheProfil = localStorage.getItem('cacheProfil')
    if(!cacheProfil){
      console.log('middleware: envoir vers login')
      return navigateTo('/login')
    }
    const profil = JSON.parse(cacheProfil)
    console.log('profil from cache',profil)
    store.setProfil(profil)
    const expirationTime = localStorage.getItem('expirationTime')
    if(expirationTime)store.setExpirationTime(parseInt(expirationTime))
  }

  if(store.expirationTime && store.isProfilExpired){
    //return navigateTo('/login')
    return navigateTo({
      path:'/login',
      query:{'redirect':to.path}
    })
  }

  console.log('fin du middleware')
})
