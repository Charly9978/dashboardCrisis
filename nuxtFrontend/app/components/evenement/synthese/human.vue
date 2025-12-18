<template>
    <UCard :ui="{ header: 'bg-teal-100 dark:bg-gray-800/50' }">
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-user-group" class="text-xl" />
                <h3>Bilan Humain</h3>
            </div>
        </template>

        <div class="grid grid-cols-2 gap-4">
            <UFormField label="Décédés">
                <UInputNumber v-model="event!.victims_death" color="error" variant="outline" class="font-bold" />
            </UFormField>
            <UFormField label="Urgence Absolue (UA)">
                <UInputNumber v-model="event!.victims_ua" color="warning" />
            </UFormField>
            <UFormField label="Urgence Relative (UR)">
                <UInputNumber v-model="event!.victims_ur" color="info" />
            </UFormField>
            <UFormField label="Impliqués">
                <UInputNumber v-model="event!.victims_involved" color="neutral" />
            </UFormField>
        </div>
    </UCard>

</template>

<script setup lang="ts">
const eventStore = useEvenementStore()
const { event } = storeToRefs(eventStore)
</script>