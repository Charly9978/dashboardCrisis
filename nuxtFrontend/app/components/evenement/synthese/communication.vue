<template>
    <UCard>
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-megaphone" class="text-xl" />
                <h3>Communication Externe</h3>
            </div>
        </template>

        <div class="space-y-4">
            <div class="flex flex-wrap gap-6">
                <UCheckbox v-model="event!.contactMunicipalty" label="Mairie contactée" />
                <UCheckbox v-model="event!.contactNeighbourhood" label="Voisinage contacté" />
            </div>

            <UDivider />

            <UFormField label="Éléments de langage (Presse / Public)">
                <UTextarea v-model="event!.external_communication" :rows="2" class="w-full"
                    placeholder="Message officiel..." />
            </UFormField>
        </div>
    </UCard>

</template>

<script setup lang="ts">
const eventStore = useEvenementStore()
const { event } = storeToRefs(eventStore)
</script>