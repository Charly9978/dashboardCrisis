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
                            class="grow" :ui="{ trailing: { pointerEvents: 'auto' } }" @keyup.enter="handleAddTodo"
                            :loading="isAdding" autofocus />

                        <UInput v-model="newTodoDelay" type="number" placeholder="Délai" class="w-24" min="0"
                            @keyup.enter="handleAddTodo">
                            <template #trailing>
                                <span class="text-xs text-gray-400">min</span>
                            </template>
                        </UInput>

                        <UButton icon="i-heroicons-arrow-right" color="neutral" variant="subtle" :disabled="!newTodo"
                            @click="handleAddTodo" />
                    </div>
                </div>

                <div class="space-y-2">
                    <div v-if="pending" class="text-center py-4 text-gray-400 text-sm">
                        Chargement...
                    </div>

                    <div v-else-if="todos && todos.length > 0" class="space-y-2">
                        <div v-for="todo in todos" :key="todo.id"
                            class="flex items-start gap-3 p-2.5 rounded-md border transition-all group"
                            :class="getTodoClasses(todo)">
                            
                            <UCheckbox :model-value="todo.completed"
                                @update:model-value="(val) => todoStore.toggleTodo(todo.id, val as boolean)" class="mt-1" />

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
                                @click="handleDelete(todo.id)" />
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
import { useNow } from '@vueuse/core'
import { useTodoStore } from '~/stores/todoStore'
import { useProfilStore } from '~/stores/profilStore'

const route = useRoute()
const profilStore = useProfilStore()
const todoStore = useTodoStore()
const toast = useToast()
const now = useNow()

// --- INITIALISATION ---
// On lie le store à l'ID de l'événement présent dans l'URL
onMounted(() => {
    if (route.params.id) {
        todoStore.bindTodos(route.params.id as string)
    }
})

// Sécurité : si on change d'événement (peu probable sans rechargement, mais bonne pratique)
watch(() => route.params.id, (newId) => {
    if (newId) todoStore.bindTodos(newId as string)
})

// On récupère la liste triée depuis le store
const { todos, pending } = storeToRefs(todoStore)

// --- ACTIONS ---
const newTodo = ref('')
const newTodoDelay = ref<number | undefined>()
const isAdding = ref(false)

async function handleAddTodo() {
  if (!newTodo.value.trim() || !profilStore.isActeur) return
  isAdding.value = true
  
  try {
    // Appel direct à l'action du store
    await todoStore.addTodo(
        newTodo.value, 
        newTodoDelay.value, 
        profilStore.profil?.nom_complet || 'Utilisateur'
    )
    
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

async function handleDelete(id: string) {
    if(!profilStore.isActeur) return
    if(confirm('Supprimer cette tâche ?')) {
        await todoStore.deleteTodo(id)
    }
}

// --- HELPERS VISUELS ---
function isOverdue(todo: any) {
    if (todo.completed || !todo.deadline) return false
    const deadlineDate = todo.deadline.toDate ? todo.deadline.toDate() : new Date(todo.deadline)
    return deadlineDate < now.value
}

function getTodoClasses(todo: any) {
    if (todo.completed) {
        return 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 opacity-60'
    }
    if (isOverdue(todo)) {
        return 'border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
    }
    return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
}

function formatDate(ts: any) {
    if(!ts) return ''
    const d = ts.toDate ? ts.toDate() : new Date(ts)
    return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
}

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