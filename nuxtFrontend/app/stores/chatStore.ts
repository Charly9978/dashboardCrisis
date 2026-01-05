import { defineStore } from 'pinia'
import { useFirestore, useCollection } from 'vuefire'
import { collection, addDoc, query, orderBy, serverTimestamp, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { ref, computed } from 'vue'

// Format compatible Nuxt UI v4 / AI SDK
export interface ChatPart {
  type: 'text' | 'image'
  text?: string
  image?: string // URL de l'image
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system' // Utilisé pour le style par défaut
  name: string // Nom de l'expéditeur
  avatar?: string
  parts: ChatPart[]
  createdAt: any
  isPinned?: boolean
  tags?: string[]
  // Métadonnées internes
  senderId?: string 
}

export const useChatStore = defineStore('chat', () => {
  const db = useFirestore()
  const storage = getStorage()
  
  const currentEventId = ref<string | null>(null)
  
  // --- STATE ---
  const messagesRef = computed(() => 
    currentEventId.value 
      ? collection(db, 'evenements', currentEventId.value, 'messages') 
      : null
  )

  const messagesQuery = computed(() => 
    messagesRef.value 
      ? query(messagesRef.value, orderBy('createdAt', 'asc')) 
      : null
  )

  const { data: rawMessages, pending } = useCollection<ChatMessage>(messagesQuery)

  // --- ACTIONS ---
  function bindChat(eventId: string) {
    currentEventId.value = eventId
  }

  async function sendMessage(text: string, senderProfile: { name: string, id: string, avatar?: string }, file: File | null = null, tags: string[] = []) {
    if (!messagesRef.value) return

    const parts: ChatPart[] = []

    // 1. Gestion de l'image (Upload)
    if (file) {
      try {
        const path = `events/${currentEventId.value}/chat/${Date.now()}_${file.name}`
        const fileRef = storageRef(storage, path)
        await uploadBytes(fileRef, file)
        const url = await getDownloadURL(fileRef)
        parts.push({ type: 'image', image: url })
      } catch (e) {
        console.error("Erreur upload:", e)
        throw new Error("Impossible d'envoyer l'image")
      }
    }

    // 2. Ajout du texte
    if (text.trim()) {
      parts.push({ type: 'text', text: text })
    }

    if (parts.length === 0) return

    // 3. Envoi Firestore (Format v4)
    await addDoc(messagesRef.value, {
      parts,
      role: 'user', // Dans un chat humain, tout le monde est 'user'
      name: senderProfile.name,
      avatar: senderProfile.avatar || '',
      senderId: senderProfile.id,
      isPinned: false,
      tags,
      createdAt: serverTimestamp()
    })
  }

  async function togglePin(messageId: string, currentStatus: boolean) {
    if (!currentEventId.value) return
    const msgDoc = doc(db, 'evenements', currentEventId.value, 'messages', messageId)
    await updateDoc(msgDoc, { isPinned: !currentStatus })
  }

  return {
    rawMessages,
    pending,
    bindChat,
    sendMessage,
    togglePin
  }
})