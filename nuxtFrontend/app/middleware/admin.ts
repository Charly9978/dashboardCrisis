/**
 * Ce middleware vérifie si l'utilisateur est un Admin.
 * Il s'appliquera automatiquement à toutes les pages
 * du dossier /admin/
 */
export default defineNuxtRouteMiddleware((to, from) => {
  const store = useProfilStore()

  // Le middleware 'auth.global.ts' (que vous avez déjà)
  // a déjà dû hydrater le store depuis le localStorage.
  
  if (!store.isAdmin) {
    // Si l'utilisateur n'est pas un Admin, on le bloque.
    console.warn(`Accès non-admin refusé à : ${to.path}`)
    
    // On le renvoie au tableau de bord.
    return navigateTo('/dashboard')
    
    // (Optionnel : vous pourriez ajouter une query d'erreur
    // return navigateTo('/dashboard?error=admin_required')
  }
  
  // Si on arrive ici, c'est un Admin. On le laisse passer.
})