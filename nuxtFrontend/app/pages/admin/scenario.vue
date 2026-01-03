<template>
    <UContainer class="py-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Scénarios de Tâches</h1>
            <UButton label="Ajouter un scénario" icon="i-heroicons-plus" @click="openModal()" />
        </div>

        <div v-if="pending" class="flex justify-center py-8">
            <USpinner size="xl" />
        </div>

        <div v-else class="flex flex-wrap gap-6 mt-5">
            <UCard v-for="scenario in scenarios" :key="scenario.id" class="w-80" variant="subtle">
                <template #header>
                    <div class="flex justify-between items-start">
                        <h3 class="text-lg font-bold truncate" :title="scenario.nom">{{ scenario.nom }}</h3>
                        <UBadge color="neutral" variant="subtle" size="xs">
                            {{ scenario.taches?.length || 0 }} tâches
                        </UBadge>
                    </div>
                    <p class="text-sm font-light">{{ scenario.description }}</p>
                </template>
                
                <template #default>
                    <ul class="space-y-2 text-sm text-gray-600 dark:text-gray-400 min-h-20">
                        <li v-for="(task, index) in scenario.taches?.slice(0, 3)" :key="index" class="flex flex-col border-b border-gray-100 dark:border-gray-800 pb-1 last:border-0">
                            <div class="flex justify-between font-medium">
                                <span class="truncate pr-2">{{ task.titre }}</span>
                                <span v-if="task.delai_minutes" class="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded h-fit">
                                    +{{ task.delai_minutes }}m
                                </span>
                            </div>
                            <div v-if="task.is_recurring" class="text-xs text-orange-600 flex items-center gap-1 mt-0.5">
                                <UIcon name="i-heroicons-arrow-path" />
                                <span>Toutes les {{ task.recurrence_interval }} min</span>
                            </div>
                        </li>
                        <li v-if="(scenario.taches?.length || 0) > 3" class="text-xs italic text-gray-400 pl-1 pt-1">
                            ... et {{ scenario.taches.length - 3 }} autres
                        </li>
                        <li v-if="!scenario.taches?.length" class="text-xs italic text-gray-400">
                            Aucune tâche définie
                        </li>
                    </ul>
                </template>

                <template #footer>
                    <div class="flex justify-end gap-2">
                        <UButton 
                            size="sm" 
                            icon="i-heroicons-magnifying-glass" 
                            color="neutral" 
                            variant="subtle" 
                            @click="openModal(scenario, true)"
                            label="Voir les détails"
                        />
                    </div>
                </template>
            </UCard>
        </div>

        <UModal v-model:open="isModalOpen" :title="title">
            <template #body>
                    <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4" :disabled="isReadOnly">
    
                        <UFormField label="Nom du scénario" name="nom">
                            <UInput class="w-full" v-model="state.nom" placeholder="Ex: Alerte Mairie" autofocus />
                        </UFormField>
                        <UFormField label="Description du déclencheur du scénario" name="description">
                            <UTextarea class="w-full" v-model="state.description" placeholder="Ex: Décision d'alerter les mairies" />
                        </UFormField>
    
                        <div class="border-t pt-4 mt-4 bg-gray-50/50 dark:bg-gray-800/30 -mx-4 px-4 pb-4">
                            <div v-if="!isReadOnly">
                            <p class="text-sm font-semibold mb-3 pt-2">Ajouter une tâche</p>
                            
                            <div class="space-y-3 p-3 bg-white dark:bg-gray-900 rounded-md shadow-sm border border-gray-200 dark:border-gray-700">
                                
                                <div class="flex gap-2">
                                    <div class="grow">
                                        <label class="text-xs text-gray-500 mb-1 block">Description</label>
                                        <UTextarea v-model="newTask.titre" placeholder="Ex: Appeler le Maire" @keyup.enter="addTaskToState" />
                                    </div>
                                    <div class="w-24">
                                        <label class="text-xs text-gray-500 mb-1 block">Délai (min)</label>
                                        <UInput v-model="newTask.delai_minutes" type="number" placeholder="0">
                                            <template #trailing><span class="text-xs text-gray-400">m</span></template>
                                        </UInput>
                                    </div>
                                </div>

                                <div class="flex items-center gap-4">
                                    <UCheckbox v-model="newTask.is_recurring" label="Tâche répétitive ?" />
                                    
                                    <transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0 translate-y-1" enter-to-class="opacity-100 translate-y-0">
                                        <div v-if="newTask.is_recurring" class="flex items-center gap-2">
                                            <span class="text-sm text-gray-600">Tous les</span>
                                            <UInput v-model="newTask.recurrence_interval" type="number" class="w-20" size="sm" />
                                            <span class="text-sm text-gray-600">min</span>
                                        </div>
                                    </transition>
                                </div>

                                <UButton label="Ajouter la tâche" icon="i-heroicons-plus" color="neutral" block size="sm" variant="solid" @click="addTaskToState" :disabled="!newTask.titre" />
                            </div>
                            </div>
                            <div v-if="state.taches.length > 0" class="mt-4 space-y-2">
                                <p class="text-xs text-gray-500 font-medium uppercase tracking-wide">Tâches incluses ({{ state.taches.length }})</p>
                                <ul class="space-y-1 max-h-48 overflow-y-auto pr-1">
                                    <li v-for="(t, i) in state.taches" :key="i" class="text-sm flex justify-between items-start group p-2 rounded bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                                        <div class="flex flex-col gap-0.5">
                                            <div class="flex items-center gap-2">
                                                <span class="font-medium">{{ t.titre }}</span>
                                                <span v-if="t.delai_minutes > 0" class="text-xs text-gray-500 bg-gray-100 dark:bg-gray-700 px-1.5 rounded">
                                                    +{{ t.delai_minutes }}m
                                                </span>
                                            </div>
                                            <div v-if="t.is_recurring" class="flex items-center gap-1 text-xs text-orange-600">
                                                <UIcon name="i-heroicons-arrow-path" class="w-3 h-3" />
                                                <span>Répéter toutes les {{ t.recurrence_interval }} min</span>
                                            </div>
                                        </div>
                                        <UButton icon="i-heroicons-trash" size="xs" color="neutral" variant="ghost" class="opacity-50 group-hover:opacity-100 hover:text-red-500" @click="removeTask(i)"/>
                                    </li>
                                </ul>
                            </div>
                        </div>
    
                        <div v-if="!isReadOnly" class="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <UButton label="Annuler" color="neutral" variant="ghost" @click="isModalOpen = false" />
                            <UButton type="submit" label="Enregistrer le scénario" :loading="isLoading" />
                        </div>
                        <div v-else class="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                            <UButton size="sm" label="Modifier" color="primary" variant="ghost" icon="i-heroicons-pencil-square" @click="openModal(state as any, false)" />
                            <UButton size="sm" icon="i-heroicons-trash" color="error" variant="ghost" @click="confirmDelete(state as any)"/>
                        </div>
                    </UForm>
            </template>
        </UModal>

        <UModal v-model:open="isDeleteModalOpen" title="Confirmer la suppression">
            <template #body>
                <div class="p-4">
                    <p class="mb-4">Êtes-vous sûr de vouloir supprimer le scénario <strong>{{ state.nom }}</strong> ?</p>
                    <div class="flex justify-end gap-2">
                        <UButton label="Annuler" color="neutral" variant="ghost" @click="isDeleteModalOpen = false" />
                        <UButton label="Supprimer" color="error" :loading="isLoading" @click="deleteScenario" />
                    </div>
                </div>
            </template>
        </UModal>

    </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { type Scenario, type Tache, useScenarioStore } from '~/stores/scenarioStore'
import { storeToRefs } from 'pinia'

// --- TYPES (Pour le typage local si besoin, sinon on peut importer depuis le store) ---
// Note: Idéalement, déplacez ces interfaces dans ~/types/scenario.ts ou exportez-les du store


// --- CONFIG STORE ---
const scenarioStore = useScenarioStore()
const { scenarios, pending } = storeToRefs(scenarioStore)
const toast = useToast()

// --- ZOD SCHEMA ---
const schema = z.object({
    nom: z.string().min(3, 'Le nom est trop court'),
    description: z.string().min(3,'la description est trop courte'),
    taches: z.array(z.object({
        titre: z.string(),
        delai_minutes: z.number(),
        is_recurring: z.boolean(),
        recurrence_interval: z.number().nullable()
    }))
})

type Schema = z.output<typeof schema>

// État global du formulaire
const initialState: Schema & {id: string | undefined} = {
    id: undefined,
    nom: '',
    description: '',
    taches: []
}
const state = reactive({ ...initialState })

// État local pour le formulaire d'ajout de tâche
const initialNewTask = {
    titre: '',
    delai_minutes: null as number | null,
    is_recurring: false,
    recurrence_interval: null as number | null
}

const newTask = reactive(initialNewTask)

// --- LOGIQUE MODALE ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const isReadOnly = ref(false)
const isLoading = ref(false)

const title = computed(() => {
    if(isEditing.value && isReadOnly.value) return 'Détail du scénario'
    if(isEditing.value) return 'Modifier le scénario'
    return 'Créer un nouveau scénario'
})

function openModal(scenario?: any, isRO?: boolean) {
    if (scenario) {
        isReadOnly.value = !!isRO
        isEditing.value = true
        Object.assign(state, { ...scenario })
    } else {
        isReadOnly.value = false
        isEditing.value = false
        // On reset bien l'ID et les tâches
        Object.assign(state, { ...initialState, id: undefined, taches: [] })
    }
    // Reset du formulaire d'ajout
    Object.assign(newTask, { ...initialNewTask })
    isModalOpen.value = true
}

// --- GESTION DES TACHES (LOCAL - Pas de changement ici, c'est de l'UI pure) ---
function addTaskToState() {
    if(!newTask.titre.trim()) return
    
    if (newTask.is_recurring && (!newTask.recurrence_interval || newTask.recurrence_interval <= 0)) {
        toast.add({ title: 'Erreur', description: 'Intervalle de répétition invalide', color: 'error' })
        return
    }

    state.taches.push({
        titre: newTask.titre,
        delai_minutes: newTask.delai_minutes ? Number(newTask.delai_minutes) : 0,
        is_recurring: newTask.is_recurring,
        recurrence_interval: newTask.is_recurring ? Number(newTask.recurrence_interval) : null
    })  
    Object.assign(newTask, { ...initialNewTask })
}

function removeTask(index: number) {
    state.taches.splice(index, 1)
}

// --- ACTIONS (VIA STORE) ---
async function onSubmit() {
    isLoading.value = true
    try {
        const scenarioData = {
            nom: state.nom,
            description: state.description,
            taches: state.taches
        }

        if (isEditing.value && state.id) {
            // Mise à jour via le store
            await scenarioStore.updateScenario(state.id, scenarioData)
        } else {
            // Création via le store
            await scenarioStore.addScenario(scenarioData)
        }

        toast.add({ title: 'Succès', description: 'Scénario enregistré', color: 'success' })
        isModalOpen.value = false
    } catch (e: any) {
        console.error(e)
        toast.add({ title: 'Erreur', description: e.message, color: 'error' })
    } finally {
        isLoading.value = false
    }
}

// --- DELETE (VIA STORE) ---
const isDeleteModalOpen = ref(false)

function confirmDelete(scenario: any) {
    Object.assign(state, { ...scenario })
    isDeleteModalOpen.value = true
}

async function deleteScenario() {
    if (!state.id) return
    isLoading.value = true
    try {
        await scenarioStore.deleteScenario(state.id)
        toast.add({ title: 'Succès', description: 'Scénario supprimé', color: 'success' })
        isDeleteModalOpen.value = false
        isModalOpen.value = false // On ferme aussi la modale de détail si elle était ouverte
    } catch (e: any) {
        toast.add({ title: 'Erreur', description: e.message, color: 'error' })
    } finally {
        isLoading.value = false
        // On reset le state proprement
        Object.assign(state, { ...initialState })
    }
}

definePageMeta({
    middleware: 'admin'
})
</script>