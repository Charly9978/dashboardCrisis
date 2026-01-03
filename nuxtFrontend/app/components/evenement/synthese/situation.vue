<<template>
    <UCard :ui="{ header: 'bg-purple-100' }">
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-eye" class="text-xl" />
                <h3>Situation & Organisation</h3>
            </div>
        </template>

        <div class="space-y-5">
                                <UFormField label="Date et Heure de l'incident">
                        <div class="flex gap-2">
                            <UInput 
                                type="datetime-local" 
                                v-model="localDate" 
                                icon="i-heroicons-calendar-days"
                                class="w-full"
                            />
                            <UButton 
                                :icon="isDateModified?'i-lucide-save':'i-heroicons-check'" 
                                color="neutral" 
                                variant="soft"
                                @click="saveDate"
                                :disabled="!isDateModified"
                                title="Enregistrer la date"
                            />
                        </div>
                    </UFormField>
                    <UFormField label="Lieu précis">
                        <UInput v-model="event!.lieu" icon="i-heroicons-map-pin" />
                    </UFormField>
            <UFormField label="Description de l'événement">
                <UTextarea v-model="event!.descriptif" :rows="3" placeholder="Que se passe-t-il ?" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <UFormField label="Statut de l'événement">
                        <USelect 
                            v-model="event!.status" 
                            :items="statusItems"
                            placeholder="Sélectionner le statut..."
                            class="w-full"
                        >
                            <template #leading>
                                <UIcon name="i-heroicons-signal" :class="getStatusColor(event!.status)" />
                            </template>
                        </USelect>
                    </UFormField>
                </div>

                <div class="space-y-4">
                    

                    <UFormField label="Cinétique de l'événement">
                        <USelect 
                            v-model="event!.cinetic"
                            :items="cineticItems"
                            placeholder="Cinétique"
                            class="w-full"
                        />
                    </UFormField>
                </div>
            </div>

            <UFormField label="Observations / Main Courante Rapide">
                <UTextarea v-model="event!.observations" :rows="2" color="primary" class="w-full" />
            </UFormField>
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

// --- VARIABLES LOCALES ---
// On utilise une ref locale pour "bufferiser" la saisie de l'utilisateur
const localDate = ref('')

// --- OPTIONS LISTES ---
const statusItems = [
    { label: 'C - En cours d\'évolution', value: 'inevolution' },
    { label: 'B - Maîtrisé', value: 'controlled' },
    { label: 'A - Terminé', value: 'finish' }
]

const cineticItems = [
    { label: 'Cinétique Lente', value: 'slow' },
    { label: 'Cinétique Rapide', value: 'fast' }
]

// --- HELPERS VISUELS ---
function getStatusColor(status: string | undefined) {
    switch (status) {
        case 'inevolution': return 'text-red-600'
        case 'controlled': return 'text-orange-500'
        case 'finish': return 'text-green-600'
        default: return 'text-gray-400'
    }
}

// --- LOGIQUE DE DATE ---

/**
 * 1. SYNCHRONISATION INITIALE (Store -> Local)
 * Quand les données arrivent de Firestore, on met à jour l'input local.
 */
watch(() => event.value?.incident_at, (newTs) => {
    if (newTs) {
        const date = newTs.toDate ? newTs.toDate() : new Date(newTs)
        localDate.value = formatForInput(date)
    } else {
        localDate.value = ''
    }
}, { immediate: true })

/**
 * Helper : Date JS -> String "YYYY-MM-DDThh:mm"
 */
function formatForInput(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
}

/**
 * Détecte si la date locale est différente de celle du store
 * (Pour activer/désactiver le bouton)
 */
const isDateModified = computed(() => {
    if (!event.value) return false
    
    // Date actuelle du store formatée
    let storeDateStr = ''
    if (event.value.incident_at) {
        const d = event.value.incident_at.toDate ? event.value.incident_at.toDate() : new Date(event.value.incident_at)
        storeDateStr = formatForInput(d)
    }

    return localDate.value !== storeDateStr
})

/**
 * 2. SAUVEGARDE MANUELLE (Local -> Store)
 * Appelé uniquement au clic sur le bouton
 */
function saveDate() {
    if (!event.value) return

    if (!localDate.value) {
        event.value.incident_at = null
    } else {
        const date = new Date(localDate.value)
        // @ts-ignore
        event.value.incident_at = Timestamp.fromDate(date)
    }

    // On déclenche explicitement la sauvegarde
    eventStore.triggerAutoSave()
    
    toast.add({ title: 'Date enregistrée', color: 'success', timeout: 1500 })
}
</script>