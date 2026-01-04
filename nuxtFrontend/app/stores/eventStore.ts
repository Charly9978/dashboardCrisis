import { defineStore } from 'pinia'
import { useDocument, useFirestore } from 'vuefire'
import { doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore'
import { ref, computed, watch } from 'vue'

// --- ENUMS ---
export enum IncidentStatus {
  EVOLUTION = 'inevolution',
  CONTROLLED = 'controlled',
  FINISHED = 'finish'
}

export enum IncidentCinetic {
  SLOW = 'slow',
  FAST = 'fast'
}

// AJOUT : Niveaux d'impact
export enum ImpactLevel {
  NO_RISK = 'I-Pas de risque extérieur',
  TOXIC_EXPLOSION = 'II-POI Risque Toxique/explosion',
  EXTERNAL_EFFECTS = 'III-Effets à l\'extérieur'
}

export interface IncidentData {
  // Situation & Organisation
  incident_at?: Timestamp | null
  descriptif?: string
  lieu?: string
  status?: IncidentStatus | string
  cinetic?: IncidentCinetic | string
  observations?: string
  updated_at?: string
  
  // Salle de crise
  crisisRoom?: { id: string, nom: string, batiment: string, etage: string, site: string, telephone: string } | null

  // Alertes
  poi_open_at?: Timestamp | null
  emergency_call?: boolean
  emergency_call_at?: Timestamp | null

  // AJOUT : Impacts & Protection
  impact_level?: ImpactLevel | string // Le niveau I, II ou III
  
  evacuation?: boolean
  evacuation_at?: Timestamp | null
  
  confinement?: boolean
  confinement_at?: Timestamp | null

  // Impacts existants
  impact_on_site?: string
  impact_outside?: string
  possibleRiskForPopulation?: boolean

  // Autres champs inchangés...
  facilities_stop?: boolean
  facilties_actions?: string
  victims_death?: number
  victims_ua?: number
  victims_ur?: number
  victims_involved?: number
  chemical_name?: string
  chemical_qty?: string
  risk_toxic?: boolean
  risk_thermic?: boolean
  risk_surpressure?: boolean
  risk_environmental?: boolean
  contactMunicipalty?: boolean
  contactNeighbourhood?: boolean
  external_communication?: string
}

export const useEvenementStore = defineStore('evenement', () => {
  const db = useFirestore()
  const currentEventId = ref<string | null>(null)
  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  let saveTimeout: NodeJS.Timeout | null = null

  const docRef = computed(() => 
    currentEventId.value ? doc(db, 'evenements', currentEventId.value) : null
  )
  const { data: event, pending, error } = useDocument<IncidentData>(docRef, { once: true })

  // --- ACTIONS DE BASE ---
  function setEventId(id: string) { currentEventId.value = id }

  function triggerAutoSave() {
    if (!currentEventId.value || !event.value) return
    saveStatus.value = 'saving'
    if (saveTimeout) clearTimeout(saveTimeout)
    saveTimeout = setTimeout(async () => {
      try {
        if (!docRef.value) return
        const dataToSave = { ...event.value }
        await updateDoc(docRef.value, { ...dataToSave, updated_at: serverTimestamp() })
        saveStatus.value = 'saved'
        setTimeout(() => { if (saveStatus.value === 'saved') saveStatus.value = 'idle' }, 2000)
      } catch (e) {
        console.error("Erreur auto-save:", e)
        saveStatus.value = 'error'
      }
    }, 1500)
  }

  // --- ACTIONS LOGIQUE MÉTIER ---

  function togglePOI(isActive: boolean) {
    if (!event.value) return
    if (isActive && !event.value.poi_open_at) event.value.poi_open_at = Timestamp.now() as any
    else if (!isActive) event.value.poi_open_at = null
    triggerAutoSave()
  }

  function toggleEmergency(isActive: boolean) {
    if (!event.value) return
    event.value.emergency_call = isActive
    if (isActive && !event.value.emergency_call_at) event.value.emergency_call_at = Timestamp.now() as any
    else if (!isActive) event.value.emergency_call_at = null
    triggerAutoSave()
  }

  // AJOUT : Toggle Évacuation
  function toggleEvacuation(isActive: boolean) {
    if (!event.value) return
    event.value.evacuation = isActive
    if (isActive && !event.value.evacuation_at) event.value.evacuation_at = Timestamp.now() as any
    else if (!isActive) event.value.evacuation_at = null
    triggerAutoSave()
  }

  // AJOUT : Toggle Confinement
  function toggleConfinement(isActive: boolean) {
    if (!event.value) return
    event.value.confinement = isActive
    if (isActive && !event.value.confinement_at) event.value.confinement_at = Timestamp.now() as any
    else if (!isActive) event.value.confinement_at = null
    triggerAutoSave()
  }

  watch(event, (newVal) => {
    if (!pending.value && newVal) triggerAutoSave()
  }, { deep: true })

  return { 
      event, pending, error, saveStatus, currentEventId, // Bien exporté ici
      setEventId, togglePOI, toggleEmergency, toggleEvacuation, toggleConfinement, triggerAutoSave 
  }
})