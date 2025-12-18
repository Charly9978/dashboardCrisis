<template>
    <UCard :ui="{ header: 'bg-indigo-100' }">
        <template #header>
            <div class="flex items-center justify-between text-gray-900 dark:text-white font-semibold">
                <div class="flex items-center gap-2">
                    <UIcon name="i-heroicons-cog-6-tooth" class="text-xl" />
                    <h3>Installations</h3>
                </div>
                <UToggle v-model="event!.facilities_stop" color="red" />
            </div>
        </template>
        <div class="space-y-2">
            <p class="text-sm text-gray-500 mb-1">Actions entreprises sur les installations :</p>
            <UTextarea v-model="event!.facilties_actions" placeholder="Vannage, délestage électrique..." :rows="3" />
        </div>
    </UCard>
</template>

<script setup lang="ts">
    const evenStore = useEvenementStore()
    const {event} = storeToRefs(evenStore)
</script>