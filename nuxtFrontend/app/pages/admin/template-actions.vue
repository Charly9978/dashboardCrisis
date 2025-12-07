<template>
    <UContainer class="py-8">
        <div class="flex justify-between items-center mb-2">
            <h1 class="text-3xl font-bold">Modèles d'actions</h1>
            <UButton label="Ajouter un modèle" icon="i-heroicons-plus" @click="openModal()" />
        </div>
        <div class="flex mb-6">
            <p>Actions crées à l'ouverture d'un nouvelle incident</p>
        </div>

        <div v-if="pending" class="flex justify-center py-8">
            <USpinner size="xl" />
        </div>

        <UCard v-else>
            <div class="flex px-4 py-3.5 border-b border-gray-200 dark:border-gray-700">
                <UInput v-model="globalFilter" class="max-w-sm" placeholder="Filtrer..." />
            </div>

            <UTable 
                v-model:global-filter="globalFilter" 
                :data="templates"
                :columns="columns"
            >
                <template #categorie-cell="{ row }">
                    <UBadge :color="getCategoryColor(row.original.categorie)" variant="subtle">
                        {{ row.original.categorie }}
                    </UBadge>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex gap-2">
                        <UButton 
                            icon="i-heroicons-pencil-square" 
                            size="xs" 
                            color="warning" 
                            variant="soft"
                            @click="openModal(row.original)" 
                        />
                        <UButton 
                            icon="i-heroicons-trash" 
                            size="xs" 
                            color="error" 
                            variant="soft"
                            @click="confirmDelete(row.original)" 
                        />
                    </div>
                </template>
            </UTable>
        </UCard>

        <UModal v-model:open="isModalOpen" :title="isEditing ? 'Modifier le modèle' : 'Créer un modèle'">
            <template #body>
                <div class="p-4">
                    <h3 class="text-lg font-semibold mb-4">
                        {{ isEditing ? 'Modifier l\'action type' : 'Nouvelle action type' }}
                    </h3>
    
                    <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
    
                        <UFormField label="Nom de l'action" name="nom_action">
                            <UInput v-model="state.nom_action" placeholder="Ex: Coupure Gaz" autofocus />
                        </UFormField>
    
                        <UFormField label="Catégorie" name="categorie">
                            <USelect v-model="state.categorie" :items="categories" placeholder="Sélectionner une catégorie" />
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
                    <p class="mb-4">Êtes-vous sûr de vouloir supprimer le modèle <strong>{{ state?.nom_action }}</strong> ?</p>
                    <div class="flex justify-end gap-2">
                        <UButton label="Annuler" color="neutral" variant="ghost" @click="isDeleteModalOpen = false" />
                        <UButton label="Supprimer" color="error" :loading="isLoading" @click="deleteTemplate" />
                    </div>
                </div>
            </template>
        </UModal>

    </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { collection, doc, setDoc, deleteDoc, addDoc, query, orderBy } from 'firebase/firestore'
import type { ColumnDef } from '@tanstack/vue-table'

// Interface
export interface ActionTemplate {
  id: string
  nom_action: string
  categorie: string
}

// --- CONFIG ---
const db = useFirestore()
const toast = useToast()

// Collection Firestore
const templatesCollection = collection(db, 'templates_actions')
//const qQuery = query(templatesCollection, orderBy('categorie'), orderBy('nom_action'))
const { data: templates, pending } = useCollection(templatesCollection)

// --- CONFIGURATION TABLEAU (Style TanStack) ---
const globalFilter = ref('')

// Définition des colonnes comme dans users.vue
const columns: ColumnDef<ActionTemplate>[] = [
  { accessorKey: 'nom_action', header: 'Action' },
  { accessorKey: 'categorie', header: 'Catégorie' },
  { accessorKey: 'actions', header: 'Actions' } // Colonne virtuelle pour les boutons
]

// Liste des catégories (simple tableau de strings pour USelect, ou objets {label, value})
// Ici je mets des strings simples pour matcher avec votre users.vue 'rolesOptions'
const categories = ['evacuation', 'arrets_techniques', 'sécurité', 'autre']

function getCategoryColor(cat: string) {
    switch (cat) {
        case 'evacuation': return 'warning' // ou 'warning' selon votre thème
        case 'sécurité': return 'error'    // 'error' = rouge dans Nuxt UI défaut
        case 'arrets_techniques': return 'primary' // 'primary' = vert/bleu selon config
        default: return 'neutral'
    }
}

// --- GESTION DU FORMULAIRE (ZOD) ---
const schema = z.object({
    nom_action: z.string().min(3, 'Le nom est trop court'),
    categorie: z.string().min(1, 'La catégorie est requise')
})

type Schema = z.output<typeof schema>

// État initial
const initialState:Schema & {id:string|undefined} = {
    id: undefined ,
    nom_action: '',
    categorie: ''
}

const state = reactive({ ...initialState })

// --- LOGIQUE MODALES ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const isLoading = ref(false)

function openModal(template?: ActionTemplate) {
    if (template) {
        isEditing.value = true
        Object.assign(state,{...template})
    } else {
        isEditing.value = false
    }
    isModalOpen.value = true
}

async function onSubmit() {
    isLoading.value = true
    try {
        const templateActionDocRef = isEditing.value?doc(templatesCollection,state.id):doc(templatesCollection)
        // Préparation des données,
        const dataToSave = {
            id: templateActionDocRef.id,
            nom_action: state.nom_action,
            categorie: state.categorie
        }

        await setDoc(templateActionDocRef, dataToSave, { merge: true })

        toast.add({ title: 'Succès', description: 'Modèle enregistrée', color: 'success' })
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

function confirmDelete(template: ActionTemplate) {
    Object.assign(state,{...template})
    isDeleteModalOpen.value = true
}

async function deleteTemplate() {
    if (!state.id) return
    isLoading.value = true
    try {
        await deleteDoc(doc(templatesCollection,state.id))
        toast.add({ title: 'Succès', description: 'Modèle supprimé', color: 'success' })
        isDeleteModalOpen.value = false
    } catch (e: any) {
        toast.add({ title: 'Erreur', description: e.message, color: 'error' })
    } finally {
        isLoading.value = false
        Object.assign(state, {...initialState})
    }
}

// Middleware Admin
definePageMeta({
    middleware: 'admin'
})
</script>