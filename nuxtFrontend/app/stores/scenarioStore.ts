import { defineStore } from 'pinia'
import { useFirestore, useCollection } from 'vuefire'
import { collection, addDoc, doc, deleteDoc, updateDoc, serverTimestamp, setDoc } from 'firebase/firestore'

// --- TYPES ---
// Adaptez ces types selon les champs exacts de votre page admin/scenario.vue
export interface Tache {
    titre: string
    delai_minutes: number
    is_recurring: boolean
    recurrence_interval?:number | null
    // Vous pouvez ajouter priority, role, etc. si votre base le gère
}

export interface Scenario {
    id?: string
    nom: string
    description?: string
    taches: Tache[] // La liste des tâches modèles
    created_at?: any
}

export const useScenarioStore = defineStore('scenario', () => {
    const db = useFirestore()
    
    // --- STATE & BINDING ---
    // Liaison temps réel avec la collection 'scenarios'
    const scenariosRef = collection(db, 'scenarios')
    const { data: scenarios, pending, error } = useCollection<Scenario>(scenariosRef)

    // --- GETTERS ---
    // Récupérer un scénario spécifique par son ID (utile pour l'eventStore)
    function getScenarioById(id: string): Scenario | undefined {
        return scenarios.value.find(s => s.id === id)
    }

    // --- ACTIONS (ADMINISTRATION) ---
    
    /**
     * Créer un nouveau scénario
     */
    async function addScenario(scenario: Omit<Scenario, 'id' | 'created_at'>) {
        try {
            const docRef = doc(scenariosRef)
            const newDatas = {
                ...scenario,
                created_at: serverTimestamp(),
                id: docRef.id
            }
            await setDoc(docRef,newDatas)
        } catch (e) {
            console.error("Erreur lors de l'ajout du scénario:", e)
            throw e
        }
    }

    /**
     * Mettre à jour un scénario existant
     */
    async function updateScenario(id: string, updates: Partial<Scenario>) {
        try {
            const docRef = doc(db, 'scenarios', id)
            // On retire l'ID des données à update pour éviter la redondance
            const { id: _, ...dataToUpdate } = updates as any
            await updateDoc(docRef, {
                ...dataToUpdate,
                updated_at: serverTimestamp()
            })
        } catch (e) {
            console.error("Erreur update scénario:", e)
            throw e
        }
    }

    /**
     * Supprimer un scénario
     */
    async function deleteScenario(id: string) {
        try {
            await deleteDoc(doc(db, 'scenarios', id))
        } catch (e) {
            console.error("Erreur suppression scénario:", e)
            throw e
        }
    }

    return {
        // State
        scenarios,
        pending,
        error,
        
        // Getters
        getScenarioById,
        
        // Actions
        addScenario,
        updateScenario,
        deleteScenario
    }
})