<template>
    <UContainer class="bg-gray-50">
        <div class="fixed top-4 right-4 z-50">
             <UBadge v-if="saveStatus !== 'idle'" :color="saveStatusColor">
                 {{ saveStatusText }}
             </UBadge>
        </div>

        <div v-if="pending || !event" class="flex justify-center py-12">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-3xl text-gray-400" />
            <span class="ml-2 text-gray-500">Chargement de l'événement...</span>
        </div>

        <div v-else class="space-y-4">

            <div class="flex justify-end h-6 sticky top-4 z-20 pointer-events-none">
                <transition enter-active-class="transition duration-300 ease-out"
                    enter-from-class="transform translate-y-2 opacity-0"
                    enter-to-class="transform translate-y-0 opacity-100"
                    leave-active-class="transition duration-200 ease-in" leave-from-class="opacity-100"
                    leave-to-class="opacity-0">
                    <UBadge v-if="saveStatus !== 'idle'" :color="saveStatusColor" variant="subtle" size="sm"
                        class="shadow-md">
                        <UIcon :name="saveStatusIcon" class="mr-1" />
                        {{ saveStatusText }}
                    </UBadge>
                </transition>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

                <div class="lg:col-span-7 space-y-6">

                    <EvenementSyntheseSituation/>

                    <EvenementSyntheseTodos/>

                    <EvenementSyntheseInstallations/>

                    <EvenementSyntheseImpact/>

                    <EvenementSyntheseCommunication/>          
                </div>

                <div class="lg:col-span-5 space-y-6">

                    <EvenementSyntheseCrisisroom/>

                    <EvenementSyntheseAlerte/>

                    <EvenementSyntheseHuman/>

                    <EvenementSyntheseChemical/>
                </div>
            </div>
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { doc, updateDoc, serverTimestamp, collection, Timestamp } from 'firebase/firestore'
import type { CrisisRoom } from '~/pages/admin/crisis-rooms.vue';
import { useEvenementStore } from '~/stores/eventStore';
import { IncidentCinetic, type Incident } from '~/types/incident'

const props = defineProps<{
    //eventId: string,
    initialData: any
}>()

const db = useFirestore()
const store = useProfilStore()
const eventStore = useEvenementStore()
const route = useRoute()
const eventId = route.params.id

onMounted(()=>{eventStore.setEventId(eventId as string)})

const {event,error,pending} = storeToRefs(eventStore)

// Récupération des salles de crise pour le sélecteur
const { data: crisisRooms } = useCollection<CrisisRoom>(collection(db, 'crisis_room'))
const items = computed(() => {
    return crisisRooms.value.map(crisisroom => ({
        value: { ...crisisroom },
        label: `${crisisroom.nom}, bat ${crisisroom.batiment} niv ${crisisroom.etage}`
    }))
})
// Initialisation du formulaire
const form = reactive<Partial<Incident>>({
    victims_death: 0,
    victims_ua: 0,
    victims_ur: 0,
    victims_involved: 0,
    chemical_name: '',
    chemical_qty: '',
    risk_toxic: false,
    risk_thermic: false,
    risk_surpressure: false,
    risk_environmental: false,
    facilities_stop: false,
    facilties_actions: '',
    cinetic: IncidentCinetic.SLOW,
    description: '',
    lieu: '',
    observations: '',
    crisisRoom: {
        batiment: '',
        etage: '',
        id: '',
        nom: '',
        site: '',
        telephone: ''
    }, // Initialisé à null
    impact_on_site: '',
    impact_outside: '',
    possibleRiskForPopulation: false,
    contactMunicipalty: false,
    contactNeighbourhood: false,
    // Nouveaux champs
    poi_open_at: null,
    emergency_call: false,
    emergency_call_at: null,
    external_communication: ''
})

// Hydratation
watchEffect(() => {
    if (props.initialData) {
        Object.assign(form, props.initialData)
    }
})

// --- LOGIQUE TOGGLES AVEC TIMESTAMP ---
function togglePOI(value: boolean) {
    if (!store.isActeur) return
    // Si on active et qu'il n'y a pas de date, on met la date du jour
    if (value && !form.poi_open_at) {
        form.poi_open_at = Timestamp.now()
    } else if (!value) {
        // Optionnel : on peut décider de garder la date même si on décoche, 
        // ou de remettre à null. Ici je remets à null pour annuler.
        form.poi_open_at = null
    }
}

function toggleEmergency(value: boolean) {
    if (!store.isActeur) return
    form.emergency_call = value
    if (value && !form.emergency_call_at) {
        form.emergency_call_at = Timestamp.now()
    } else if (!value) {
        form.emergency_call_at = null
    }
}

// Helpers d'affichage heure
function formatTime(ts: any) {
    if (!ts) return ''
    // Gestion robuste : soit c'est un Timestamp Firestore, soit une Date JS (parfois lors de l'optimistic UI)
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}


// --- LOGIQUE AUTO-SAVE (Inchangée) ---
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
let timeout: NodeJS.Timeout | null = null

watch(form, () => {
    if (!store.isActeur) return

    saveStatus.value = 'saving'
    if (timeout) clearTimeout(timeout)

    timeout = setTimeout(async () => {
        await performSave()
    }, 1500)
}, { deep: true })

async function performSave() {
    try {
        const docRef = doc(db, 'evenements', props.eventId)
        await updateDoc(docRef, {
            ...form,
            updated_at: serverTimestamp(),
        })
        saveStatus.value = 'saved'
        setTimeout(() => {
            if (saveStatus.value === 'saved') saveStatus.value = 'idle'
        }, 2000)
    } catch (error) {
        console.error("Erreur auto-save", error)
        saveStatus.value = 'error'
    }
}

const saveStatusText = computed(() => ({ 'saving': 'Enregistrement...', 'saved': 'Enregistré', 'error': 'Erreur', 'idle': '' }[saveStatus.value]))
const saveStatusColor = computed(() => ({ 'saving': 'warning', 'saved': 'primary', 'error': 'error', 'idle': 'neutral' }[saveStatus.value]))
const saveStatusIcon = computed(() => ({ 'saving': 'i-heroicons-arrow-path', 'saved': 'i-heroicons-check', 'error': 'i-heroicons-exclamation-triangle' }[saveStatus.value]))
</script>