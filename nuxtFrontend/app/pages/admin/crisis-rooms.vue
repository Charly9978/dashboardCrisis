<template>
    <UContainer class="py-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Gestion des salles de crise</h1>
            <UButton label="Ajouter une salle de crise" icon="i-heroicons-plus" @click="openModal()" />
        </div>

        <div v-if="pending" class="flex justify-center py-8">
            <USpinner size="xl" />
        </div>


        <div v-else class="flex flex-row gap-10 mt-5">
            <UCard v-for="crisisRoom in crisisRooms" :key="crisisRoom.name" class="w-60 min-h-30" variant="subtle">
                <template #header>
                    <h3 class=" text-l font-extrabold"> {{ crisisRoom.nom }}</h3>
                    <p class="text-sm font-light">{{ crisisRoom.site }}</p>
                </template>
                <template #default>
                    <p class="font-medium mb-2">Batiment: <span class="font-extralight">{{ crisisRoom.batiment }}</span></p>
                    <p class="font-medium mb-2">Etage: <span class="font-extralight">{{ crisisRoom.etage }}</span></p>
                    <p class="font-medium">Telephone: <span class="font-extralight">{{crisisRoom.telephone }}</span></p>
                </template>
                <template #footer>
                    <div class="flex justify-end">
                        <UButton size="sm" label="modifier" class="mr-1" color="primary" variant="subtle" @click="openModal(crisisRoom as CrisisRoom)" />
                        <UButton size="sm" icon="i-lucide-trash-2" color="error" variant="ghost" @click="confirmDelete(crisisRoom as CrisisRoom)"/>
                    </div>
                </template>
            </UCard>
        </div>

        <UModal v-model:open="isModalOpen" :title="isEditing ? 'Modifier une salle de crise' : 'Créer une salle de crise'">
            <template #body>
                <div class="p-4">
                    <h3 class="text-lg font-semibold mb-4">
                        {{ isEditing ? 'Modifier la salle' : 'Nouvelle salle' }}
                    </h3>
    
                    <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
    
                        <UFormField label="Nom de la salle" name="nom">
                            <UInput v-model="state.nom" :disabled="isEditing" />
                        </UFormField>
    
                        <UFormField label="Site" name="site">
                            <UInput v-model="state.site" placeholder="Bernin" />
                        </UFormField>
    
                        <UFormField label="Batiment" name="batiment">
                            <UInput v-model="state.batiment" placeholder="3B" />
                        </UFormField>

                        <UFormField label="Etage" name="etage">
                            <UInput v-model="state.etage" placeholder="2ème" />
                        </UFormField>

                        <UFormField label="Telephone" name="telephone">
                            <UInput v-model="state.telephone" placeholder="04 76 98 34 56" />
                        </UFormField>
    
                        <div class="flex justify-end gap-2 mt-6">
                            <UButton label="Annuler" color="neutral" variant="ghost" @click="isModalOpen = false" />
                            <UButton type="submit" label="Enregistrer" :loading="isLoading" />
                        </div>
                    </UForm>
                </div>
            </template>
        </UModal>

        <UModal v-model:open="isDeleteModalOpen" title="Confirmer la suppression">
            <template #body>
                <div class="p-4">
                    <p class="mb-4">Êtes-vous sûr de vouloir supprimer la salle de crise <strong>{{ state?.nom}}</strong> ?</p>
                    <div class="flex justify-end gap-2">
                        <UButton label="Annuler" color="neutral" variant="ghost" @click="isDeleteModalOpen = false" />
                        <UButton label="Supprimer" color="error" @click="deleteCrisisRoom" :loading="isLoading" />
                    </div>
                </div>
            </template>
        </UModal>

    </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { collection, doc, setDoc, deleteDoc, type DocumentData } from 'firebase/firestore'

export interface CrisisRoom {
  batiment: string
  site: string
  etage: string
  nom: string
  telephone: string
  id: string
}

// --- CONFIG ---
const db = useFirestore()
const toast = useToast()

const crisisRoomCollection = collection(db,'crisis_room')

// Récupération temps réel des salle de crises
const {data:crisisRooms,pending} = useCollection(crisisRoomCollection)



// --- GESTION DU FORMULAIRE (ZOD) ---
const schema = z.object({
    nom: z.string().min(2, 'Nom trop court'),
    batiment: z.string(),
    etage: z.string(),
    telephone: z.string(),
    site: z.string()
})

type Schema = z.output<typeof schema>

const initialState:Schema & {id:string | undefined} = {
    id: undefined,
    nom: '',
    batiment: '',
    etage: '',
    telephone:'',
    site:''
}

const state = reactive({...initialState})


// --- MODALE & LOGIQUE ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const isLoading = ref(false)

function openModal(crisisRoom?: CrisisRoom) {
    if (crisisRoom) {
        // Mode Edition
         isEditing.value = true
         Object.assign(state,{...crisisRoom})
    } else {
        // Mode Création
        isEditing.value = false
    }
    isModalOpen.value = true
}

async function onSubmit() {
    isLoading.value = true
    try {
        const crisisRoomDocRef = isEditing.value?doc(crisisRoomCollection,state.id):doc(crisisRoomCollection)

        const crisisRoomData = {
            batiment: state.batiment,
            etage: state.etage,
            nom: state.nom,
            site: state.site,
            telephone: state.telephone,
            id: crisisRoomDocRef.id
        }

        await setDoc(crisisRoomDocRef, crisisRoomData, { merge: true })

        toast.add({ title: 'Succès', description: 'Salle de crise enregistrée', color: 'success' })
        isModalOpen.value = false
    } catch (e: any) {
        toast.add({ title: 'Erreur', description: e.message, color: 'error' })
    } finally {
        isLoading.value = false
        Object.assign(state,{...initialState})
    }
}

// --- SUPPRESSION ---
const isDeleteModalOpen = ref(false)

function confirmDelete(crisisRoom: CrisisRoom) {
    Object.assign(state,{...crisisRoom})
    isDeleteModalOpen.value = true
}

async function deleteCrisisRoom() {
    if (!state.id) return
    isLoading.value = true
    try {
        await deleteDoc(doc(crisisRoomCollection, state.id)) // .id est l'email fourni par VueFire
        toast.add({ title: 'Salle de crise supprimée', color: 'success' })
        isDeleteModalOpen.value = false
    } catch (e: any) {
        toast.add({ title: 'Erreur', description: e.message, color: 'error' })
    } finally {
        isLoading.value = false
        Object.assign(state,{...initialState})
    }
}

// Middleware Admin (automatique car dans le dossier /admin/ mais on peut forcer la vérification)
definePageMeta({
    middleware: 'admin'
})
</script>