<template>
    <UCard>
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-bell-alert" class="text-xl" />
                <h3>Alertes & Moyens</h3>
            </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            <div class="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-sm text-gray-700 dark:text-gray-200">
                        Plan d'Opération Interne (POI)
                    </span>
                    <USwitch 
                        :model-value="!!event?.poi_open_at" 
                        @update:model-value="handleTogglePOI" 
                        size="lg" 
                        :disabled="isProcessing"
                    />
                </div>
                <div class="text-sm text-gray-500 flex items-center gap-1 h-8">
                    <template v-if="event?.poi_open_at">
                        <UIcon name="i-heroicons-clock" />
                        <div class="text-xs">
                            Déclenché à <span class="font-mono font-bold">{{ formatTime(event.poi_open_at) }}</span>
                        </div>
                    </template>
                    <span v-else class="italic text-xs">Non déclenché</span>
                </div>
            </div>

            <div class="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-sm text-gray-700 dark:text-gray-200">
                        Appel Secours Extérieurs
                    </span>
                    <USwitch 
                        :model-value="event?.emergency_call" 
                        @update:model-value="eventStore.toggleEmergency" 
                        color="secondary"
                        size="lg" 
                    />
                </div>
                
                <div class="text-sm text-gray-500 flex items-center gap-2 h-8">
                    <template v-if="event?.emergency_call">
                        <div class="flex items-center gap-2 bg-white dark:bg-gray-900 rounded px-2 py-1 border border-gray-200 dark:border-gray-700 shadow-sm w-full">
                            <UIcon name="i-heroicons-phone" class="text-gray-400" />
                            <span class="text-xs font-medium whitespace-nowrap">Appelés à :</span>
                            
                            <input 
                                type="time" 
                                :value="getEventTime(event.emergency_call_at)" 
                                @change="(e) => updateEmergencyTime(e)"
                                class="bg-transparent border-none text-xs font-mono font-bold focus:ring-0 p-0 text-gray-900 dark:text-white w-full"
                            />
                        </div>
                    </template>
                    
                    <span v-else class="italic text-xs">Non appelés</span>
                </div>
            </div>

        </div>
    </UCard>
</template>

<script setup lang="ts">
import { useEvenementStore } from '~/stores/eventStore'
import { useScenarioStore } from '~/stores/scenarioStore'
import { useTodoStore } from '~/stores/todoStore'
import { Timestamp } from 'firebase/firestore' // Import nécessaire pour recréer le timestamp

const eventStore = useEvenementStore()
const scenarioStore = useScenarioStore()
const todoStore = useTodoStore()
const toast = useToast()

const { event } = storeToRefs(eventStore)
const isProcessing = ref(false)

// --- LOGIQUE POI (Inchangée) ---
async function handleTogglePOI(isActive: boolean) {
    if (!event.value) return
    isProcessing.value = true
    try {
        eventStore.togglePOI(isActive)
        if (isActive) {
            // @ts-ignore
            if (!todoStore.currentEventId && eventStore.currentEventId) { todoStore.bindTodos(eventStore.currentEventId) }
            const scenarioName = "Déclenchement POI"
            const scenario = scenarioStore.scenarios.find(s => s.nom === scenarioName)
            if (scenario && scenario.taches?.length > 0) {
                await todoStore.addBatchTasks(scenario.taches, scenarioName)
                toast.add({ title: 'POI Activé', description: `${scenario.taches.length} tâches ajoutées.`, color: 'success' })
            }
        }
    } catch (error) {
        console.error(error)
        toast.add({ title: 'Erreur', color: 'error' })
    } finally {
        isProcessing.value = false
    }
}

// --- LOGIQUE SECOURS ---

// 1. Convertit le Timestamp Firestore en string "HH:MM" pour l'input type="time"
function getEventTime(ts: any): string {
    if (!ts) return ''
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    // On force le format HH:MM local
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

// 2. Met à jour l'heure dans le store quand l'utilisateur change l'input
function updateEmergencyTime(e: Event) {
    const target = e.target as HTMLInputElement
    const timeValue = target.value // Format "HH:MM"

    if (!timeValue || !event.value?.emergency_call_at) return

    // On reprend la date existante pour garder le jour/mois/année correct
    // (Attention : cela suppose que l'événement est aujourd'hui ou que la date est déjà bonne)
    const currentTs = event.value.emergency_call_at
    const date = currentTs.toDate ? currentTs.toDate() : new Date(currentTs)
    
    const [hours, minutes] = timeValue.split(':').map(Number)
    date.setHours(hours!)
    date.setMinutes(minutes!)
    date.setSeconds(0) // On remet les secondes à 0 pour être propre

    // On met à jour directement la valeur locale
    // Comme c'est un Timestamp Firestore attendu, on convertit
    // @ts-ignore
    event.value.emergency_call_at = Timestamp.fromDate(date)
    
    // On déclenche la sauvegarde manuelle car on a modifié une propriété profonde
    eventStore.triggerAutoSave()
    
    toast.add({ title: 'Heure mise à jour', color: 'success', timeout: 1000 })
}

// Helper d'affichage simple (pour le POI qui reste en lecture seule ici)
function formatTime(ts: any) {
    if (!ts) return ''
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>