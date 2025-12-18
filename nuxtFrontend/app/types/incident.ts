// app/types/incident.ts

export enum IncidentStatus {
  FINISH = 'finish',
  CONTROLLED = 'controlled',
  EVOLUTION = 'inevolution',
  ARCHIVED = 'archived',
}

export enum IncidentCinetic {
  SLOW = 'slow',
  FAST = 'fast',
}

export interface Incident {
  id: string
  // --- Metadatas ---
  created_at: any // Timestamp Firestore
  updated_at: any
  close_at?: any
  is_exercice: boolean
  
  // --- Situation ---
  titre: string
  lieu: string
  description: string
  observations: string | null
  status: IncidentStatus
  cinetic: IncidentCinetic
  
  // --- Bilan Humain ---
  victims_death: number
  victims_ua: number
  victims_ur: number
  victims_involved: number
  
  // --- Technique / Risques ---
  chemical_name: string | null
  chemical_qty: string | null
  risk_thermic: boolean | null
  risk_toxic: boolean | null
  risk_surpressure: boolean | null
  risk_environmental: boolean | null
  
  // --- Installations ---
  facilities_stop: boolean | null
  facilties_actions: string | null
  
  // --- Impacts ---
  impact_on_site: string | null
  impact_outside: string | null
  possibleRiskForPopulation: boolean | null
  
  // --- Communication ---
  contactMunicipalty: boolean
  contactNeighbourhood: boolean
  emergency_call: boolean
  external_communication: string | null
  
  // --- Organisation ---
  poi_open_at: string | null
  poi_close_at: string | null
  crisisRoom: { nom: string, id: string, batiment: string, etage: string, telephone: string, site: string }
}