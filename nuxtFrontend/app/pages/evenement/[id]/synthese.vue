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
                    <UBadge v-if="saveStatus !== 'idle'" :color="saveStatusColor!" variant="subtle" size="sm"
                        class="shadow-md">
                        <UIcon :name="saveStatusIcon!" class="mr-1" />
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
import { useEvenementStore } from '~/stores/eventStore';

const eventStore = useEvenementStore()
const route = useRoute()
const eventId = route.params.id as string

onMounted(()=>{eventStore.setEventId(eventId)})

const {event,pending,saveStatus} = storeToRefs(eventStore)


// --- LOGIQUE AUTO-SAVE (Inchangée) ---

const saveStatusText = computed(() => ({ 'saving': 'Enregistrement...', 'saved': 'Enregistré', 'error': 'Erreur', 'idle': '' }[saveStatus.value]))
const saveStatusColor = computed(() => ({ 'saving': 'warning', 'saved': 'primary', 'error': 'error', 'idle': 'neutral' }[saveStatus.value]))
const saveStatusIcon = computed(() => ({ 'saving': 'i-heroicons-arrow-path', 'saved': 'i-heroicons-check', 'error': 'i-heroicons-exclamation-triangle' }[saveStatus.value]))
</script>