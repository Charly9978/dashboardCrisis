<template>
  <div class="space-y-4">
    
    <div class="flex justify-end h-6 sticky top-4 z-20 pointer-events-none">
        <transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="transform translate-y-2 opacity-0"
            enter-to-class="transform translate-y-0 opacity-100"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100"
            leave-to-class="opacity-0"
        >
            <UBadge v-if="saveStatus !== 'idle'" :color="saveStatusColor" variant="subtle" size="sm" class="shadow-md">
                <UIcon :name="saveStatusIcon" class="mr-1" />
                {{ saveStatusText }}
            </UBadge>
        </transition>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      <div class="lg:col-span-4 space-y-6">
        
        <UCard>
          <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-user-group" class="text-xl" />
                <h3>Bilan Humain</h3>
            </div>
          </template>
          
          <div class="grid grid-cols-2 gap-4">
            <UFormField label="Décédés">
                <UInput v-model.number="form.victims_death" type="number" color="red" variant="outline" class="font-bold" />
            </UFormField>
            
            <UFormField label="Impliqués">
                <UInput v-model.number="form.victims_involved" type="number" color="gray" />
            </UFormField>

            <UFormField label="Urgence Absolue (UA)">
                <UInput v-model.number="form.victims_ua" type="number" color="orange" />
            </UFormField>

            <UFormField label="Urgence Relative (UR)">
                <UInput v-model.number="form.victims_ur" type="number" color="yellow" />
            </UFormField>
          </div>
        </UCard>

        <UCard>
          <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-beaker" class="text-xl" />
                <h3>Nature & Risques</h3>
            </div>
          </template>

          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-2">
                <UFormField label="Produit Chimique">
                    <UInput v-model="form.chemical_name" placeholder="Nom..." />
                </UFormField>
                <UFormField label="Quantité">
                    <UInput v-model="form.chemical_qty" placeholder="Ex: 500L" />
                </UFormField>
            </div>

            <UDivider label="Risques identifiés" />

            <div class="grid grid-cols-2 gap-y-3">
                <UCheckbox v-model="form.risk_toxic" label="Toxique" color="red" />
                <UCheckbox v-model="form.risk_thermic" label="Thermique" color="orange" />
                <UCheckbox v-model="form.risk_surpressure" label="Surpression" color="yellow" />
                <UCheckbox v-model="form.risk_environmental" label="Pollution" color="green" />
            </div>
          </div>
        </UCard>

        <UCard>
            <template #header>
                <div class="flex items-center justify-between text-gray-900 dark:text-white font-semibold">
                    <div class="flex items-center gap-2">
                        <UIcon name="i-heroicons-cog-6-tooth" class="text-xl" />
                        <h3>Installations</h3>
                    </div>
                    <UToggle v-model="form.facilities_stop" color="red" />
                </div>
            </template>
            <div class="space-y-2">
                <p class="text-sm text-gray-500 mb-1">Actions entreprises sur les installations :</p>
                <UTextarea v-model="form.facilties_actions" placeholder="Vannage, délestage électrique..." :rows="3" />
            </div>
        </UCard>

      </div>

      <div class="lg:col-span-8 space-y-6">
        
        <UCard>
            <template #header>
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                        <UIcon name="i-heroicons-eye" class="text-xl" />
                        <h3>Situation</h3>
                    </div>
                    
                    <USelectMenu 
                        v-model="form.cinetic" 
                        :options="[{label:'Cinétique Lente', value:'slow'}, {label:'Cinétique Rapide', value:'fast'}]"
                        value-attribute="value"
                        option-attribute="label"
                        placeholder="Cinétique"
                    >
                        <template #label>
                            <span :class="form.cinetic === 'fast' ? 'text-red-500 font-bold' : 'text-green-600'">
                                {{ form.cinetic === 'fast' ? '🚀 Cinétique Rapide' : '🐢 Cinétique Lente' }}
                            </span>
                        </template>
                    </USelectMenu>
                </div>
            </template>

            <div class="space-y-4">
                <UFormField label="Description de l'événement">
                    <UTextarea v-model="form.description" :rows="3" placeholder="Que se passe-t-il ?" />
                </UFormField>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <UFormField label="Lieu précis">
                        <UInput v-model="form.lieu" icon="i-heroicons-map-pin" />
                    </UFormField>
                    <UFormField label="Salle de crise activée">
                        <UInput :model-value="form.crisisRoom?.nom" readonly disabled icon="i-heroicons-building-office" />
                    </UFormField>
                </div>

                <UFormField label="Observations / Main Courante Rapide">
                    <UTextarea v-model="form.observations" :rows="2" color="gray" variant="filled" />
                </UFormField>
            </div>
        </UCard>

        <UCard>
            <template #header>
                <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <UIcon name="i-heroicons-globe-alt" class="text-xl" />
                    <h3>Impacts & Conséquences</h3>
                </div>
            </template>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UFormField label="Impact sur site (Interne)">
                    <UTextarea v-model="form.impact_on_site" :rows="3" />
                </UFormField>
                
                <div class="space-y-4">
                    <UFormField label="Impact hors site (Externe)">
                        <UTextarea v-model="form.impact_outside" :rows="3" />
                    </UFormField>
                    
                    <div class="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-100 dark:border-red-900">
                        <UCheckbox 
                            v-model="form.possibleRiskForPopulation" 
                            label="Risque possible pour la population" 
                            :ui="{ label: 'text-red-600 dark:text-red-400 font-bold' }"
                        />
                    </div>
                </div>
            </div>
        </UCard>

        <UCard>
            <template #header>
                <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                    <UIcon name="i-heroicons-megaphone" class="text-xl" />
                    <h3>Communication Externe</h3>
                </div>
            </template>

            <div class="space-y-4">
                <div class="flex flex-wrap gap-6">
                    <UCheckbox v-model="form.contactMunicipalty" label="Mairie contactée" />
                    <UCheckbox v-model="form.contactNeighbourhood" label="Voisinage contacté" />
                    <UCheckbox v-model="form.emergency_call" label="Appel Secours (18/112)" color="red" />
                </div>
                
                <UDivider />

                <UFormField label="Éléments de langage (Presse / Public)">
                    <UTextarea v-model="form.external_communication" :rows="2" placeholder="Message officiel..." />
                </UFormField>
            </div>
        </UCard>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { IncidentCinetic, type Incident } from '~/types/incident'

const props = defineProps<{
  eventId: string,
  initialData: any
}>()

const db = useFirestore()
const store = useProfilStore()

// Initialisation du formulaire avec des valeurs par défaut pour éviter les "undefined"
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
  crisisRoom: { nom: '', id: '' },
  impact_on_site: '',
  impact_outside: '',
  possibleRiskForPopulation: false,
  contactMunicipalty: false,
  contactNeighbourhood: false,
  emergency_call: false,
  external_communication: ''
})

// Hydratation à l'ouverture
watchEffect(() => {
  if (props.initialData) {
    Object.assign(form, props.initialData)
  }
})

// --- LOGIQUE AUTO-SAVE ---
const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
let timeout: NodeJS.Timeout | null = null

watch(form, () => {
  if(!store.isActeur) return // Sécurité front

  saveStatus.value = 'saving'
  
  if (timeout) clearTimeout(timeout)

  // Debounce de 1.5s pour éviter trop d'écritures
  timeout = setTimeout(async () => {
    await performSave()
  }, 1500)
}, { deep: true })

async function performSave() {
  try {
    const docRef = doc(db, 'evenements', props.eventId)
    
    // On met à jour uniquement les champs du formulaire + timestamp
    await updateDoc(docRef, {
      ...form,
      updated_at: serverTimestamp(),
      // On pourrait ajouter ici : last_editor_id: store.profil.id
    })
    
    saveStatus.value = 'saved'
    
    // Remettre le statut à idle après 2 secondes
    setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'idle'
    }, 2000)

  } catch (error) {
    console.error("Erreur auto-save", error)
    saveStatus.value = 'error'
  }
}

// Helpers pour le style du badge de sauvegarde
const saveStatusText = computed(() => ({'saving':'Enregistrement...','saved':'Enregistré','error':'Erreur','idle':''}[saveStatus.value]))
const saveStatusColor = computed(() => ({'saving':'orange','saved':'green','error':'red','idle':'gray'}[saveStatus.value]))
const saveStatusIcon = computed(() => ({'saving':'i-heroicons-arrow-path','saved':'i-heroicons-check','error':'i-heroicons-exclamation-triangle'}[saveStatus.value]))
</script>