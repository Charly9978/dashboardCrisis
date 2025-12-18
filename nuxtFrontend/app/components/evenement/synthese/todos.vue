<template>
    <UCard :ui="{ header: 'bg-indigo-50' }">
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-pencil-square" class="text-xl" />
                <h3>Suivi des Actions & Tâches</h3>
            </div>
        </template>
        <div>
            <div class="space-y-4">

                <div class="flex items-start gap-2">
                    <div class="grow flex gap-2">
                        <UInput v-model="newTodo" placeholder="Nouvelle action..." icon="i-heroicons-plus-circle"
                            class="grow" :ui="{ trailing: { pointerEvents: 'auto' } }" @keyup.enter="addManualTodo"
                            :loading="isAdding" autofocus />

                        <UInput v-model="newTodoDelay" type="number" placeholder="Délai" class="w-24" min="0"
                            @keyup.enter="addManualTodo">
                            <template #trailing>
                                <span class="text-xs text-gray-400">min</span>
                            </template>
                        </UInput>

                        <UButton icon="i-heroicons-arrow-right" color="neutral" variant="subtle" :disabled="!newTodo"
                            @click="addManualTodo" />
                    </div>

                    <UDropdownMenu :items="scenarioItems" :content="{ align: 'end', side: 'bottom' }">
                        <UButton color="neutral" variant="subtle" icon="i-heroicons-bolt" label="Scénarios"
                            trailing-icon="i-heroicons-chevron-down" />
                    </UDropdownMenu>
                </div>

                <div class="space-y-2">
                    <div v-if="todos && todos.length > 0" class="space-y-2">
                        <div v-for="todo in todos" :key="todo.id"
                            class="flex items-start gap-3 p-2.5 rounded-md border transition-all group"
                            :class="getTodoClasses(todo)">
                            <UCheckbox :model-value="todo.completed"
                                @update:model-value="(val) => toggleTodo(todo.id, val as boolean)" class="mt-1" />

                            <div class="grow min-w-0">
                                <div class="flex justify-between items-start gap-2">
                                    <p class="text-sm font-medium truncate-2-lines transition-all"
                                        :class="{ 'line-through text-gray-500': todo.completed, 'text-gray-900 dark:text-gray-100': !todo.completed }">
                                        {{ todo.titre }}
                                    </p>

                                    <UBadge v-if="isOverdue(todo)" size="sm" color="error" variant="solid"
                                        class="animate-pulse shrink-0">
                                        EN RETARD
                                    </UBadge>
                                </div>

                                <div class="flex flex-wrap gap-2 mt-1.5">
                                    <UBadge v-if="todo.deadline && !todo.completed" size="sm"
                                        :color="isOverdue(todo) ? 'error' : 'neutral'" variant="subtle"
                                        class="flex items-center gap-1">
                                        <UIcon name="i-heroicons-clock" class="w-3 h-3" />
                                        {{ isOverdue(todo) ? 'Dû à' : 'Pour' }} {{ formatDate(todo.deadline) }}
                                    </UBadge>
                                    <UBadge v-if="todo.completed && todo.completed_at" size="sm" color="success"
                                        variant="subtle" class="flex items-center gap-1">
                                        <UIcon name="i-heroicons-check-circle" class="w-3 h-3" />
                                        Fait le {{ formatDateTime(todo.completed_at) }}
                                    </UBadge>

                                    <span v-if="todo.scenario_source"
                                        class="text-xs text-gray-400 flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-1.5 rounded border border-gray-200 dark:border-gray-700">
                                        <UIcon name="i-heroicons-bolt" class="w-3 h-3" /> {{ todo.scenario_source }}
                                    </span>
                                </div>
                            </div>

                            <UButton icon="i-heroicons-trash" size="xs" color="neutral" variant="ghost"
                                class="opacity-0 group-hover:opacity-100 transition-opacity"
                                @click="deleteTodo(todo.id)" />
                        </div>
                    </div>

                    <div v-else
                        class="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                        <UIcon name="i-heroicons-clipboard-document-list" class="text-gray-300 text-3xl mb-2" />
                        <p class="text-sm text-gray-400">Aucune tâche en cours</p>
                    </div>
                </div>
            </div>

        </div>
    </UCard>

</template>

<script setup lang="ts">
import { collection, query, orderBy, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore'
import { useNow } from '@vueuse/core' // Standard dans Nuxt pour la réactivité du temps

const route = useRoute()
const db = useFirestore()
const store = useProfilStore()
const toast = useToast()

// Pour la gestion du temps réel (se met à jour chaque seconde)
const now = useNow()

// --- DATA ---
const todosRef = collection(db, 'evenements', route.params.id as string, 'todos')
// Tri : Non faites d'abord, puis par date de création
const q = query(todosRef, orderBy('completed', 'asc'), orderBy('created_at', 'desc'))
const { data: todos } = useCollection(q)

const scenariosRef = collection(db, 'scenarios')
const { data: scenarios } = useCollection(scenariosRef, { ssrKey: 'scenarios-list' })

// --- COMPUTED ---
const scenarioItems = computed(() => {
    if (!scenarios.value || scenarios.value.length === 0) {
        return [[{ label: 'Aucun scénario disponible', disabled: true }]]
    }
    const items = scenarios.value.map(scen => ({
        label: scen.nom,
        labelSuffix: `(${scen.taches?.length || 0})`, 
        icon: 'i-heroicons-bolt',
        onSelect: () => triggerScenario(scen) 
    }))
    return [items]
})

// --- HELPERS VISUELS ---

// Vérifie si une tâche est en retard
function isOverdue(todo: any) {
    if (todo.completed || !todo.deadline) return false
    // On convertit le Timestamp Firestore en Date JS pour comparer
    const deadlineDate = todo.deadline.toDate ? todo.deadline.toDate() : new Date(todo.deadline)
    return deadlineDate < now.value
}

// Génère les classes CSS dynamiques pour la ligne
function getTodoClasses(todo: any) {
    if (todo.completed) {
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60'
    }
    if (isOverdue(todo)) {
        // Style "En retard" : Bordure rouge + Fond rouge très léger
        return 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
    }
    // Style par défaut
    return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
}

// --- ACTIONS ---
const newTodo = ref('')
const newTodoDelay = ref<number | undefined>() // Nouveau champ délai
const isAdding = ref(false)

async function addManualTodo() {
  if (!newTodo.value.trim() || !store.isActeur) return
  isAdding.value = true
  
  try {
    // Calcul de la deadline si un délai est saisi
    let deadline = null
    if (newTodoDelay.value && newTodoDelay.value > 0) {
        const d = new Date()
        d.setMinutes(d.getMinutes() + Number(newTodoDelay.value))
        deadline = Timestamp.fromDate(d)
    }

    await addDoc(todosRef, {
      titre: newTodo.value,
      completed: false,
      deadline: deadline, // On enregistre la deadline calculée
      created_at: serverTimestamp(),
      created_by: store.profil?.nom_complet
    })
    
    // Reset du formulaire
    newTodo.value = ''
    newTodoDelay.value = undefined
    
    toast.add({ title: 'Tâche ajoutée', color: 'success' })
  } catch(e:any) { 
      console.error(e)
      toast.add({ title: 'Erreur', description: e.message, color: 'error' })
  } 
  finally { isAdding.value = false }
}

// ... (Le reste des fonctions triggerScenario, toggleTodo, deleteTodo est inchangé) ...

async function triggerScenario(scenario: any) {
    if(!store.isActeur) return
    try {
        const batch = writeBatch(db)
        const tasks = scenario.taches || []
        tasks.forEach((task: any) => {
            const newDocRef = doc(todosRef)
            let deadline = null
            if(task.delai_minutes) {
                const d = new Date()
                d.setMinutes(d.getMinutes() + parseInt(task.delai_minutes))
                deadline = Timestamp.fromDate(d)
            }
            batch.set(newDocRef, {
                titre: task.titre,
                completed: false,
                deadline: deadline,
                created_at: serverTimestamp(),
                scenario_source: scenario.nom
            })
        })
        await batch.commit()
        toast.add({ title: 'Scénario appliqué', description: `${tasks.length} tâches créées`, color: 'success' })
    } catch (e:any) { toast.add({ title: 'Erreur', description: e.message, color: 'error' }) }
}

async function toggleTodo(id: string, val: boolean) {
    if(!store.isActeur) return
    // On met à jour 'completed' ET 'completed_at'
    await updateDoc(doc(todosRef, id), { 
        completed: val,
        completed_at: val ? serverTimestamp() : null 
    })
}

async function deleteTodo(id: string) {
    if(!store.isActeur) return
    if(confirm('Supprimer cette tâche ?')) await deleteDoc(doc(todosRef, id))
}

function formatDate(ts: any) {
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
}

// Format complet pour l'historique : "12/11 14:30"
function formatDateTime(ts: any) {
    if(!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleString([], {
        day: '2-digit', 
        month:'2-digit', 
        hour: '2-digit', 
        minute:'2-digit'
    })
}

</script>