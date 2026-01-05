<template>
  <UCard class="flex flex-col h-[600px]" :ui="{ body: { base: 'flex-1 overflow-hidden p-0 flex flex-col' } }">
    
    <template #header>
      <div class="flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <h3 class="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UIcon name="i-heroicons-chat-bubble-left-right" />
            Main Courante
          </h3>
          <div class="flex gap-2">
             <UButton 
                :color="showPinnedOnly ? 'yellow' : 'gray'" 
                variant="ghost" 
                icon="i-heroicons-paper-clip" 
                size="xs"
                @click="showPinnedOnly = !showPinnedOnly"
                title="Voir les épinglés"
             />
             <UInput 
               v-model="searchQuery" 
               icon="i-heroicons-magnifying-glass" 
               placeholder="Chercher..." 
               size="xs" 
               class="w-40" 
             />
          </div>
        </div>
      </div>
    </template>

    <div class="flex-1 overflow-y-auto p-4" ref="chatContainer">
      <UChatMessages
        v-if="filteredMessages.length"
        :messages="filteredMessages"
      >

      </UChatMessages>
      
      <div v-else class="text-center text-gray-400 py-10 text-sm">
        <UIcon name="i-heroicons-chat-bubble-oval-left" class="text-4xl mb-2 opacity-20" />
        <p>Aucun message pour le moment</p>
      </div>
    </div>

    <template #footer>
      <div class="flex flex-col gap-2">
        <div v-if="selectedFile" class="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div class="relative">
             <UIcon name="i-heroicons-photo" class="text-primary text-xl" />
             <div class="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></div>
          </div>
          <span class="text-xs truncate flex-1 font-medium">{{ selectedFile.name }}</span>
          <UButton icon="i-heroicons-x-mark" size="xs" color="neutral" variant="ghost" @click="selectedFile = null" />
        </div>

        <div class="flex items-end gap-2">
          <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileSelect" />
          <UButton 
            icon="i-heroicons-camera" 
            color="gray" 
            variant="ghost" 
            class="mb-1"
            @click="$refs.fileInput.click()" 
            :ui="{ rounded: 'rounded-full' }"
          />

          <UChatPrompt
            v-model="input"
            placeholder="Message... (#tag pour étiqueter)"
            :rows="1"
            autoresize
            class="flex-1"
            @keydown.enter.exact.prevent="sendMessage"
          >
             <template #trailing>
                <UChatPromptSubmit 
                   @click="sendMessage" 
                   :loading="isSending"
                   :disabled="!input.trim() && !selectedFile"
                   size="xs"
                />
             </template>
          </UChatPrompt>
        </div>
      </div>
    </template>
  </UCard>
</template>

<script setup lang="ts">
import { useChatStore } from '~/stores/chatStore'
import { useProfilStore } from '~/stores/profilStore'

definePageMeta({
  layout: 'event',
})

const route = useRoute()
const eventId = route.params.id as string

const chatStore = useChatStore()
const profilStore = useProfilStore()
const { rawMessages } = storeToRefs(chatStore)

const input = ref('')
const searchQuery = ref('')
const showPinnedOnly = ref(false)
const selectedFile = ref<File | null>(null)
const isSending = ref(false)
const chatContainer = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

// --- INIT ---
onMounted(() => {
  chatStore.bindChat(eventId)
  scrollToBottom()
})

// Auto-scroll intelligent
watch(() => rawMessages.value?.length, () => nextTick(scrollToBottom))

// --- LOGIQUE FILTRES ---
const filteredMessages = computed(() => {
  if (!rawMessages.value) return []
  
  let msgs = rawMessages.value

  // Filtre épinglé
  if (showPinnedOnly.value) {
    msgs = msgs.filter(m => m.isPinned)
  }

  // Filtre recherche
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    msgs = msgs.filter(m => 
      m.parts.some(p => p.type === 'text' && p.text?.toLowerCase().includes(q)) ||
      m.name.toLowerCase().includes(q) ||
      m.tags?.some(t => t.toLowerCase().includes(q))
    )
  }

  return msgs
})

// --- ACTIONS ---
function isMe(id?: string) {
  return id === profilStore.profil?.email
}

function handleFileSelect(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) selectedFile.value = target.files[0]
}

async function sendMessage() {
  if ((!input.value.trim() && !selectedFile.value) || isSending.value) return

  isSending.value = true
  try {
    // Extraction des tags (ex: #urgent #info)
    const tags = input.value.match(/#[\w-]+/g)?.map(t => t.substring(1)) || []
    
    // On nettoie le message des tags pour l'affichage ? (Optionnel)
    // const textContent = input.value.replace(/#[\w-]+/g, '').trim()
    
    await chatStore.sendMessage(
      input.value, // On envoie le texte brut (avec les tags visibles dans le texte aussi)
      {
        name: profilStore.profil?.nom_complet || 'Utilisateur',
        id: profilStore.profil?.email || 'unknown',
        // avatar: profilStore.profil?.avatarUrl
      },
      selectedFile.value,
      tags
    )

    input.value = ''
    selectedFile.value = null
    // Reset focus
    // (Non nécessaire avec UChatPrompt qui garde le focus souvent)
  } catch (e) {
    console.error(e)
  } finally {
    isSending.value = false
  }
}

function scrollToBottom() {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight
  }
}

function formatTime(ts: any) {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
/* Petite animation pour l'ajout de fichier */
.animate-fade-in {
  animation: fadeIn 0.2s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>