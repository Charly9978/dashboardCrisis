<template>
    <UCard>
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-bell-alert" class="text-xl" />
                <h3>Alertes & Moyens</h3>
            </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
                class="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-sm text-gray-700 dark:text-gray-200">Plan d'Opération Interne
                        (POI)</span>
                    <USwitch :model-value="!!event!.poi_open_at" @update:model-value="eventStore.togglePOI" size="lg" />
                </div>
                <div class="text-sm text-gray-500 flex items-center gap-1 h-5">
                    <template v-if="event!.poi_open_at">
                        <UIcon name="i-heroicons-clock" />
                        <div class="text-xs">
                            Déclenché à <span class="font-mono font-bold">{{ formatTime(event!.poi_open_at)}}</span>
                        </div>
                    </template>
                    <span v-else class="italic text-xs">Non déclenché</span>
                </div>
            </div>

            <div
                class="flex flex-col gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <div class="flex justify-between items-center">
                    <span class="font-bold text-sm text-gray-700 dark:text-gray-200">Appel Secours
                        Extérieurs</span>
                    <USwitch :model-value="event!.emergency_call" @update:model-value="eventStore.toggleEmergency" color="secondary"
                        size="lg" />
                </div>
                <div class="text-sm text-gray-500 flex items-center gap-1 h-5">
                    <template v-if="event!.emergency_call && event!.emergency_call_at">
                        <UIcon name="i-heroicons-phone" />
                        <div class="text-xs">
                            Appelés à <span class="font-mono font-bold">{{
                                formatTime(event!.emergency_call_at) }}</span>
                        </div>
                    </template>
                    <span v-else class="italic text-xs">Non appelés</span>
                </div>
            </div>
        </div>
    </UCard>

</template>
<script setup lang="ts">
const eventStore = useEvenementStore()
const { event } = storeToRefs(eventStore)

// Helpers d'affichage heure
function formatTime(ts: any) {
    if (!ts) return ''
    // Gestion robuste : soit c'est un Timestamp Firestore, soit une Date JS (parfois lors de l'optimistic UI)
    const date = ts.toDate ? ts.toDate() : new Date(ts)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>