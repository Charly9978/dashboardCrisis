import { defineStore } from 'pinia'
import {type DocumentData} from 'firebase/firestore'

// Le type pour notre objet profil
export interface Profil {
  email: string
  role: 'Admin' | 'Acteur' | 'Lecteur'
  nom_complet: string
  user_auth_id?: string
  photoUrl?: string
}

export const useProfilStore = defineStore('profil', {
  // L'état initial
  state: () => ({
    profil: null as Profil | null, // L'objet profil (ou null)
    isLoading: false, // L'app est-elle en train de vérifier l'auth ?
    initialized: false,
    expirationTime: null as number | null
  }),

  // Les "getters" (calculs)
  getters: {
    isLoggedIn: (state) => !!state.profil,
    isAdmin: (state) => state.profil?.role === 'Admin',
    isActeur: (state) => ['Admin', 'Acteur'].includes(state.profil?.role || ''),
    isInitialized: (state) => !!state.initialized,
    isProfilExpired: (state) => state.expirationTime! < Date.now()?true:false
  },

  // Les "actions" (mutations)
  actions: {

    setProfil(data: Profil | DocumentData) {
      this.profil = data as Profil
      this.isLoading = false
      localStorage.setItem('cacheProfil', JSON.stringify(data))
    },
    clearProfil() {
      this.profil = null
      this.isLoading = false
      localStorage.removeItem('cacheProfil')
      localStorage.removeItem('expirationTime')
    },
    setLoading(status: boolean) {
      this.isLoading = status
    },
    setInitialized(){
      this.initialized = true
    },

    setExpirationTime(time:number){
      this.expirationTime = time
      localStorage.setItem('expirationTime',time.toString())
    }
  }
})


