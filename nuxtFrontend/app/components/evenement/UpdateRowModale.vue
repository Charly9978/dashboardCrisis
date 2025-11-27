<script setup lang="ts">
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore'

const db = useFirestore()
const toast = useToast()
const store = useProfilStore()

const { modelValue, row } = defineProps<{
    row: any,
    modelValue: boolean
}>()

const emit = defineEmits(['update:modelValue', 'save'])

// Propriété pour v-model interne
const isOpen = computed({
    get: () => modelValue,
    set: (val) => emit('update:modelValue', val)
})

const items = ref(['Non requis', 'Demandé', 'En cours', 'Réalisé', 'Problème'])

//fonction pour modifier un status
function updateData() {
    try {
        const doctoUpdate = doc(db, 'actions', row.id)
        updateDoc(doctoUpdate, {
            comment: row.comment,
            statut_actuel: row.statut_actuel,
            last_updated_at: serverTimestamp(),
            last_updated_by_id: store.profil!.user_auth_id,
            last_updated_by_nom: store.profil!.nom_complet
        })
    } catch (error) {
        if (error instanceof Error) {
            console.error("Erreur de mise à jour:", error)
            toast.add({ title: 'Erreur', description: error.message, color: 'error' })
        }
    } finally {
        isOpen.value = false
    }

}

</script>
<template>
    <UModal v-model:open="isOpen" title="Modifier le status" :description="row.nom_action">
        <template #body>
            <div class="space-y-4">
                <URadioGroup v-model="row.statut_actuel" :items="items" />
                <UFormField label="Commentaire">
                    <UTextarea v-model="row.comment" class="w-full" />
                </UFormField>
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton label="Enregister" @click="updateData" />
            </div>
        </template>
    </UModal>

</template>