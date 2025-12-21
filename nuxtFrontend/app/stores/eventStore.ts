import { defineStore } from 'pinia'
import { useDocument, useFirestore } from 'vuefire'
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { ref, computed, watch } from 'vue'

// --- TYPES ---
export enum IncidentCinetic {
  SLOW = 'slow',
  FAST = 'fast'
}

export interface IncidentData {
  // Situation & Organisation
  descriptif?: string
  lieu?: string
  cinetic?: IncidentCinetic | string
  observations?: string
  updated_at?: string
  
  // Salle de crise
  crisisRoom?: {
    id: string
    nom: string
    batiment: string
    etage: string
    site: string
    telephone: string
  } | null

  // Alertes (Logique temporelle)
  poi_open_at?: Timestamp | null
  emergency_call?: boolean
  emergency_call_at?: Timestamp | null

  // Installations
  facilities_stop?: boolean
  facilties_actions?: string

  // Bilan Humain
  victims_death?: number
  victims_ua?: number
  victims_ur?: number
  victims_involved?: number

  // Nature & Risques
  chemical_name?: string
  chemical_qty?: string
  risk_toxic?: boolean
  risk_thermic?: boolean
  risk_surpressure?: boolean
  risk_environmental?: boolean

  // Impacts
  impact_on_site?: string
  impact_outside?: string
  possibleRiskForPopulation?: boolean

  // Communication
  contactMunicipalty?: boolean
  contactNeighbourhood?: boolean
  external_communication?: string
}

export const useEvenementStore = defineStore('evenement', () => {
  const db = useFirestore()
  
  // --- STATE ---
  const currentEventId = ref<string | null>(null)
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  let saveTimeout: NodeJS.Timeout | null = null

  // --- VUEFIRE BINDING ---
  // On crée une ref calculée vers le document Firestore
  const docRef = computed(() => 
    currentEventId.value ? doc(db, 'evenements', currentEventId.value) : null
  )

  // useDocument s'occupe du onSnapshot et de la mise à jour temps réel
  const { data: event, pending, error } = useDocument<IncidentData>(docRef,{once:true})

  // --- ACTIONS ---

  /**
   * Initialise le store avec l'ID de l'événement courant
   */
  function setEventId(id: string) {
    currentEventId.value = id
  }

  /**
   * Sauvegarde manuelle ou automatique (Debounce 1.5s)
   * Cette fonction ne sauvegarde que les données présentes dans `event`
   */
  function triggerAutoSave() {
    if (!currentEventId.value || !event.value) return

    saveStatus.value = 'saving'
    if (saveTimeout) clearTimeout(saveTimeout)

    saveTimeout = setTimeout(async () => {
      try {
        if (!docRef.value) return
        
        // On récupère les données brutes de l'objet Proxy de Vue
        const dataToSave = { ...event.value }
        
        await updateDoc(docRef.value, {
          ...dataToSave,
          updated_at: serverTimestamp()
        })

        saveStatus.value = 'saved'
        setTimeout(() => {
          if (saveStatus.value === 'saved') saveStatus.value = 'idle'
        }, 2000)

      } catch (e) {
        console.error("Erreur auto-save (VueFire):", e)
        saveStatus.value = 'error'
      }
    }, 1500)
  }

  /**
   * Logique métier : Toggle POI
   */
  function togglePOI(isActive: boolean) {
    if (!event.value) return

    // Modification locale (l'auto-save suivra via le watcher ou appel explicite)
    if (isActive && !event.value.poi_open_at) {
      // @ts-ignore (Parfois TypeScript râle sur les types partiels VueFire)
      event.value.poi_open_at = Timestamp.now()
    } else if (!isActive) {
      // @ts-ignore
      event.value.poi_open_at = null
    }
    triggerAutoSave() // On force la sauvegarde immédiate (enfin, debouncée)
  }

  /**
   * Logique métier : Toggle Appel Secours
   */
  function toggleEmergency(isActive: boolean) {
    if (!event.value) return

    event.value.emergency_call = isActive
    if (isActive && !event.value.emergency_call_at) {
      // @ts-ignore
      event.value.emergency_call_at = Timestamp.now()
    } else if (!isActive) {
      // @ts-ignore
      event.value.emergency_call_at = null
    }
    triggerAutoSave()
  }

  // --- WATCHER ---
  // On surveille les modifications de l'objet `event` (qui est lié à l'UI par v-model)
  // pour déclencher la sauvegarde.
  watch(event, (newVal, oldVal) => {
    console.log('pending',pending.value)
    // Petit hack: on évite de sauvegarder si c'est le chargement initial (pending)
    if (!pending.value && newVal) {
        triggerAutoSave()
    }
  }, { deep: true })


  return {
    // State
    event,           // L'objet réactif lié à Firestore
    pending,         // État de chargement VueFire
    error,           // Erreurs VueFire
    saveStatus,      // État de la sauvegarde (UI feedback)
    
    // Actions
    setEventId,
    togglePOI,
    toggleEmergency,
    triggerAutoSave
  }
})