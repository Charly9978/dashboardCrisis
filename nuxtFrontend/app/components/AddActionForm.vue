<template>
  <UForm :schema="schema" :state="state" @submit="onSubmit" class="flex gap-4">
    
    <UFormField name="nom_action" class="grow">
      <UInput 
        v-model="state.nom_action" 
        placeholder="Entrer une nouvelle action manuelle..." 
        size="lg"
      />
    </UFormField>

    <UButton 
      type="submit" 
      :loading="isLoading" 
      size="lg" 
      icon="i-heroicons-plus"
    >
      Ajouter
    </UButton>
  </UForm>
</template>

<script setup>
import { z } from 'zod'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

// Ce composant doit savoir à quel événement il appartient.
// Nous lui passons l'ID en "prop" depuis la page.
const props = defineProps({
  eventId: {
    type: String,
    required: true
  }
})

const store = useProfilStore()
const db = useFirestore()
const toast = useToast()
const isLoading = ref(false)

// 1. Validation Zod pour le champ unique
const schema = z.object({
  nom_action: z.string().min(3, 'Le nom de l\'action est trop court')
})

// 2. État du formulaire
const state = ref({
  nom_action: undefined
})

// 3. Fonction de soumission
async function onSubmit() {
  // Sécurité (déjà gérée par le v-if sur la page, mais double sécurité)
  if (!store.isActeur || !store.profil) return

  isLoading.value = true
  try {
    // 4. Préparer les données de la nouvelle action
    const newActionData = {
      evenement_id: props.eventId,
      nom_action: state.value.nom_action,
      statut_actuel: "Demandé", // Statut par défaut
      
      // Infos de traçabilité (basées sur l'utilisateur actuel)
      created_at: serverTimestamp(),
      demandeur_id: store.profil.user_auth_id,
      demandeur_nom: store.profil.nom_complet,
      last_updated_at: serverTimestamp(),
      last_updated_by_id: store.profil.user_auth_id,
      last_updated_by_nom: store.profil.nom_complet
    }
    
    // 5. Envoyer à Firestore
    await addDoc(collection(db, 'actions'), newActionData)
    
    // 6. Réinitialiser le formulaire et notifier l'utilisateur
    state.value.nom_action = undefined
    toast.add({ title: 'Action manuelle ajoutée', color: 'green' })
    
  } catch (error) {
    toast.add({ title: 'Erreur', description: error.message, color: 'red' })
  } finally {
    isLoading.value = false
  }
}
</script>