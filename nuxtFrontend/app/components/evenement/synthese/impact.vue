<template>
    <UCard>
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-globe-alt" class="text-xl" />
                <h3>Impacts & Conséquences</h3>
            </div>
        </template>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <UFormField label="Impact sur site (Interne)">
                <UTextarea v-model="event!.impact_on_site" :rows="3" class="w-full" />
            </UFormField>

            <div class="space-y-4">
                <UFormField label="Impact hors site (Externe)">
                    <UTextarea v-model="event!.impact_outside" :rows="3" class="w-full" />
                </UFormField>

                <div class="bg-red-50 dark:bg-red-950/30 p-3 rounded-md border border-red-100 dark:border-red-900">
                    <UCheckbox v-model="event!.possibleRiskForPopulation" label="Risque possible pour la population"
                        :ui="{ label: 'text-red-600 dark:text-red-400 font-bold' }" />
                </div>
            </div>
        </div>
    </UCard>

</template>
<script setup lang="ts">
const eventStore = useEvenementStore()
const { event } = storeToRefs(eventStore)
</script>