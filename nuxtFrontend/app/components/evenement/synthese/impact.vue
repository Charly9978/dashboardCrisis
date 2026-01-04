<template>
    <UCard>
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-globe-alt" class="text-xl" />
                <h3>Impacts & Protection</h3>
            </div>
        </template>

        <div class="space-y-6">
            
            <UFormField label="Niveau de Risque / Impact">
                <USelect 
                    v-model="event!.impact_level" 
                    :items="impactOptions"
                    placeholder="Sélectionner un niveau..."
                    class="w-full md:w-1/2"
                >
                    <template #leading>
                        <UIcon name="i-heroicons-exclamation-triangle" class="text-orange-500" />
                    </template>
                </USelect>
            </UFormField>

            <UDivider label="Protection du Personnel" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div class="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <UIcon name="i-heroicons-user-group" /> Évacuation Personnel
                        </span>
                        <USwitch 
                            :model-value="event!.evacuation" 
                            @update:model-value="eventStore.toggleEvacuation" 
                            size="lg"
                            color="warning"
                        />
                    </div>
                    <div class="text-sm text-gray-500 flex items-center gap-2 h-8">
                        <template v-if="event!.evacuation">
                            <div class="flex items-center gap-2 bg-white dark:bg-gray-900 rounded px-2 py-1 border border-gray-200 dark:border-gray-700 shadow-sm w-full">
                                <span class="text-xs font-medium whitespace-nowrap">Heure :</span>
                                <input 
                                    type="time" 
                                    :value="formatTime(event!.evacuation_at)" 
                                    @change="(e) => updateTime(e, 'evacuation_at')"
                                    class="bg-transparent border-none text-xs font-mono font-bold focus:ring-0 p-0 text-gray-900 dark:text-white w-full"
                                />
                            </div>
                        </template>
                        <span v-else class="italic text-xs">Non effectuée</span>
                    </div>
                </div>

                <div class="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <UIcon name="i-heroicons-home-modern" /> Confinement Personnel
                        </span>
                        <USwitch 
                            :model-value="event!.confinement" 
                            @update:model-value="eventStore.toggleConfinement" 
                            size="lg"
                            color="indigo"
                        />
                    </div>
                    <div class="text-sm text-gray-500 flex items-center gap-2 h-8">
                        <template v-if="event!.confinement">
                            <div class="flex items-center gap-2 bg-white dark:bg-gray-900 rounded px-2 py-1 border border-gray-200 dark:border-gray-700 shadow-sm w-full">
                                <span class="text-xs font-medium whitespace-nowrap">Heure :</span>
                                <input 
                                    type="time" 
                                    :value="formatTime(event!.confinement_at)" 
                                    @change="(e) => updateTime(e, 'confinement_at')"
                                    class="bg-transparent border-none text-xs font-mono font-bold focus:ring-0 p-0 text-gray-900 dark:text-white w-full"
                                />
                            </div>
                        </template>
                        <span v-else class="italic text-xs">Non effectué</span>
                    </div>
                </div>

            </div>

            <UDivider label="Conséquences" />

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField label="Impact sur site (Interne)">
                    <UTextarea v-model="event!.impact_on_site" :rows="3" class="w-full" placeholder="Dégâts matériels, arrêts de production..." />
                </UFormField>

                <div class="space-y-4">
                    <UFormField label="Impact hors site (Externe)">
                        <UTextarea v-model="event!.impact_outside" :rows="3" class="w-full" placeholder="Environnement, voisinage..." />
                    </UFormField>

                    <div class="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-100 dark:border-red-900">
                        <UCheckbox 
                            v-model="event!.possibleRiskForPopulation" 
                            label="Risque possible pour la population"
                            :ui="{ label: 'text-red-600 dark:text-red-400 font-bold' }" 
                        />
                    </div>
                </div>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import { useEvenementStore } from '~/stores/eventStore'
import { storeToRefs } from 'pinia'
import { Timestamp } from 'firebase/firestore'

const eventStore = useEvenementStore()
const { event } = storeToRefs(eventStore)
const toast = useToast()

// Options pour le niveau d'impact
const impactOptions = [
    'I-Pas de risque extérieur',
    'II-POI Risque Toxique/explosion',
    'III-Effets à l\'extérieur'
]

// --- HELPERS GESTION DU TEMPS ---

function formatTime(ts: any): string {
    if (!ts) return ''
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
}

// Fonction générique pour mettre à jour l'heure d'un champ Timestamp spécifique
function updateTime(e: Event, fieldName: 'evacuation_at' | 'confinement_at') {
    const target = e.target as HTMLInputElement
    const timeValue = target.value // "HH:MM"
    
    // @ts-ignore
    const currentTs = event.value?.[fieldName]

    if (!timeValue || !currentTs) return

    // On préserve la date du jour, on ne change que l'heure
    const date = currentTs.toDate ? currentTs.toDate() : new Date(currentTs)
    const [hours, minutes] = timeValue.split(':').map(Number)
    
    date.setHours(hours!)
    date.setMinutes(minutes!)
    date.setSeconds(0)

    // Mise à jour du store
    // @ts-ignore
    event.value[fieldName] = Timestamp.fromDate(date)
    
    // Sauvegarde immédiate
    eventStore.triggerAutoSave()
    toast.add({ title: 'Heure modifiée', color: 'success', timeout: 1000 })
}
</script>