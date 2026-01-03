import { defineStore } from 'pinia'
import { useFirestore, useCollection } from 'vuefire'
import { collection, doc, setDoc, deleteDoc, updateDoc, serverTimestamp, writeBatch, Timestamp } from 'firebase/firestore'
import { ref, computed } from 'vue'

export interface Todo {
  id: string
  titre: string
  completed: boolean
  completed_at?: any
  deadline?: any
  created_at: any
  created_by?: string
  scenario_source?: string
}

// --- HELPER (DRY) ---
// Centralise la logique de création d'une tâche pour qu'elle soit identique partout
const createTodoObject = (id: string, titre: string, delayMinutes: number | undefined, author: string, scenarioName?: string) => {
    let deadline = null
    // Calcul de la deadline si un délai est fourni
    if (delayMinutes && delayMinutes > 0) {
        const d = new Date()
        d.setMinutes(d.getMinutes() + Number(delayMinutes))
        deadline = Timestamp.fromDate(d)
    }

    return {
        id: id, // On stocke l'ID explicitement dans le document
        titre: titre,
        completed: false,
        deadline: deadline,
        created_at: serverTimestamp(),
        created_by: author,
        scenario_source: scenarioName || null
    }
}

export const useTodoStore = defineStore('todo', () => {
  const db = useFirestore()
  
  // --- STATE ---
  const currentEventId = ref<string | null>(null)
  
  // --- VUEFIRE BINDING ---
  // Référence réactive à la collection 'todos' de l'événement en cours
  const todosRef = computed(() => 
    currentEventId.value 
      ? collection(db, 'evenements', currentEventId.value, 'todos') 
      : null
  )

  // Récupération brute des données (sans tri complexe côté serveur)
  const { data: rawTodos, pending } = useCollection<Todo>(todosRef)

  // --- COMPUTED : TRI INTELLIGENT ---
  // C'est ici qu'on applique la logique métier d'affichage
  const sortedTodos = computed(() => {
      if (!rawTodos.value) return []

      const pendingList = rawTodos.value.filter(t => !t.completed)
      const completedList = rawTodos.value.filter(t => t.completed)

      // 1. Tri des tâches EN ATTENTE : Par Deadline croissante (Urgents en premier)
      pendingList.sort((a, b) => {
          const timeA = a.deadline ? (a.deadline.toMillis ? a.deadline.toMillis() : new Date(a.deadline).getTime()) : 9999999999999
          const timeB = b.deadline ? (b.deadline.toMillis ? b.deadline.toMillis() : new Date(b.deadline).getTime()) : 9999999999999
          return timeA - timeB
      })

      // 2. Tri des tâches FINIES : Par date de réalisation décroissante (Récents en premier)
      completedList.sort((a, b) => {
          const timeA = a.completed_at ? (a.completed_at.toMillis ? a.completed_at.toMillis() : new Date(a.completed_at).getTime()) : 0
          const timeB = b.completed_at ? (b.completed_at.toMillis ? b.completed_at.toMillis() : new Date(b.completed_at).getTime()) : 0
          return timeB - timeA
      })

      return [...pendingList, ...completedList]
  })

  // --- ACTIONS ---

  function bindTodos(eventId: string) {
    currentEventId.value = eventId
  }

  /**
   * Ajout manuel d'une seule tâche
   */
  async function addTodo(titre: string, delayMinutes: number | undefined, author: string) {
    if (!todosRef.value) return

    // 1. On réserve une référence (et un ID)
    const newDocRef = doc(todosRef.value)
    
    // 2. On crée l'objet propre
    const todoData = createTodoObject(newDocRef.id, titre, delayMinutes, author)
    
    // 3. On sauvegarde (setDoc car on a déjà la ref et l'ID)
    await setDoc(newDocRef, todoData)
  }

  /**
   * Ajout groupé depuis un scénario (Optimisé Batch)
   */
  async function addBatchTasks(tasks: any[], scenarioName: string) {
    if (!todosRef.value) return

    const batch = writeBatch(db)

    tasks.forEach((task: any) => {
        // 1. On réserve une référence pour chaque tâche
        // Le '!' assure à TS que todosRef.value existe (vérifié par le if au dessus)
        const newDocRef = doc(todosRef.value!)
        
        // 2. On utilise le helper pour créer la donnée (DRY)
        const todoData = createTodoObject(
            newDocRef.id, 
            task.titre, 
            task.delai_minutes, 
            'Système', 
            scenarioName
        )

        // 3. On ajoute à la pile d'envoi
        batch.set(newDocRef, todoData)
    })

    // 4. Envoi groupé atomique
    await batch.commit()
  }

  async function toggleTodo(id: string, isCompleted: boolean) {
    if (!currentEventId.value) return
    const todoDoc = doc(db, 'evenements', currentEventId.value, 'todos', id)
    
    await updateDoc(todoDoc, { 
        completed: isCompleted,
        completed_at: isCompleted ? serverTimestamp() : null 
    })
  }

  async function deleteTodo(id: string) {
    if (!currentEventId.value) return
    const todoDoc = doc(db, 'evenements', currentEventId.value, 'todos', id)
    await deleteDoc(todoDoc)
  }

  return {
    todos: sortedTodos, // On expose directement la liste triée
    rawTodos,
    pending,
    bindTodos,
    addTodo,
    addBatchTasks,
    toggleTodo,
    deleteTodo
  }
})