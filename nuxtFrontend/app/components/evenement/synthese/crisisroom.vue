<template>
    <div v-if="items">
    <UCard :ui="{ header: 'bg-yellow-100' }">
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-home" class="text-xl" />
                <h3>Salle de crise</h3>
            </div>
        </template>
        <template #default>
            <UFormField>
                <USelect v-model="event!.crisisRoom" :items="items" placeholder="Choisir une salle..."
                    icon="i-heroicons-building-office" class="w-full">
                </USelect>
            </UFormField>
            <div v-if="event!.crisisRoom && event!.crisisRoom!.id" class="p-4">
                <UBadge :label="event!.crisisRoom?.telephone" icon="i-heroicons-phone" variant="subtle" size="lg" />
            </div>
        </template>
    </UCard>
    </div>

</template>

<script setup lang="ts">
import { doc, updateDoc, serverTimestamp, collection, Timestamp } from 'firebase/firestore'
import type { CrisisRoom } from '~/pages/admin/crisis-rooms.vue';

const eventStore = useEvenementStore()
const { event } = storeToRefs(eventStore)

const db = useFirestore()

// Récupération des salles de crise pour le sélecteur
const { data: crisisRooms } = useCollection<CrisisRoom>(collection(db, 'crisis_room'))
const items = computed(() => {
    return crisisRooms.value.map(crisisroom => ({
        value: { ...crisisroom },
        label: `${crisisroom.nom}, bat ${crisisroom.batiment} niv ${crisisroom.etage}`
    }))
})
</script>