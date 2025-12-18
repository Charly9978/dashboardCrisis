<template>
    <UCard :ui="{ header: 'bg-purple-100' }">
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-eye" class="text-xl" />
                <h3>Situation & Organisation</h3>
            </div>
        </template>

        <div class="space-y-5">
            <UFormField label="Description de l'événement">
                <UTextarea v-model="event!.descriptif" :rows="3" placeholder="Que se passe-t-il ?" class="w-full" />
            </UFormField>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="space-y-4">
                    <UFormField label="Lieu précis">
                        <UInput v-model="event!.lieu" icon="i-heroicons-map-pin" />
                    </UFormField>
                </div>

                <div class="space-y-4">
                    <UFormField label="Cinétique de l'événement">
                        <USelect class="w-50" v-model="event!.cinetic"
                            :items="[{ label: 'Cinétique Lente', value: 'slow' }, { label: 'Cinétique Rapide', value: 'fast' }]"
                            placeholder="Cinétique">
                            <template #item-label>
                                <span :class="event!.cinetic === 'fast' ? 'text-red-500 font-bold' : 'text-green-600'">
                                    {{ event!.cinetic === 'fast' ? '🚀 Cinétique Rapide' : '🐢 Cinétique Lente' }}
                                </span>
                            </template>
                        </USelect>
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
import { useEvenementStore } from '~/stores/eventStore';

    const eventStore = useEvenementStore()

    const {event,error,pending} = storeToRefs(eventStore)

</script>