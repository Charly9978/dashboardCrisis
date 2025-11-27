<template>
  <UContainer class="py-12">
    <UCard class="max-w-xl mx-auto">
      <template #header>
        <h1 class="text-2xl font-bold">Créer un nouvel événement</h1>
      </template>

      <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
        
        <UFormField label="Titre de l'événement" name="titre">
          <UInput v-model="state.titre" placeholder="Incendie Usine X" />
        </UFormField>

        <UFormField label="Lieu" name="lieu">
          <UInput v-model="state.lieu" placeholder="12 rue de la Paix, Paris" />
        </UFormField>

        <UFormField label="Descriptif" name="descriptif">
          <UTextarea v-model="state.descriptif" autoresize :rows="5" />
        </UFormField>

        <UButton
          type="submit"
          label="Créer l'événement"
          size="lg"
          :loading="isLoading"
          block
        />
      </UForm>
      
    </UCard>
  </UContainer>
</template>

<script setup>
import { z } from 'zod' // On importe Zod
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'

const store = useProfilStore()
const db = useFirestore()
const router = useRouter()
const toast = useToast() // Le système de notification de Nuxt UI

const isLoading = ref(false)

// 1. Définir le schéma de validation avec Zod
const schema = z.object({
  titre: z.string().min(5, 'Doit contenir au moins 5 caractères'),
  lieu: z.string().min(5, 'Doit contenir au moins 5 caractères'),
  descriptif: z.string().optional(),
})

// 2. Définir l'état (le v-model) du formulaire
const state = ref({
  titre: undefined,
  lieu: undefined,
  descriptif: undefined,
})

// 3. La fonction de soumission
async function onSubmit(event) {
  // 'event.data' contient les données validées par Zod
  const formData = event.data

  // Vérification de sécurité (le middleware fait déjà le gros du travail)
  if (!store.isAdmin || !store.profil) {
    toast.add({ title: 'Erreur', description: 'Vous n\'êtes pas autorisé.', color: 'red' })
    return
  }

  isLoading.value = true

  try {
    // 4. Préparer l'objet pour Firestore
    const newEventData = {
      titre: formData.titre,
      lieu: formData.lieu,
      descriptif: formData.descriptif || '', // Gère le champ optionnel
      statut: 'En cours',
      date_evenement: serverTimestamp(), // Utilise l'horodatage du serveur
      createur_id: store.profil.user_auth_id,
      createur_nom: store.profil.nom_complet,
    }

    // 5. Envoyer à Firestore
    const eventsRef = collection(db, 'evenements')
    const docRef = await addDoc(eventsRef, newEventData)

    toast.add({
      title: 'Succès',
      description: 'Événement créé.',
      color: 'green'
    })

    // 6. Rediriger vers la page du nouvel événement
    router.push(`/evenement/${docRef.id}`)

  } catch (error) {
    console.error("Erreur lors de la création :", error)
    toast.add({
      title: 'Erreur',
      description: 'La création a échoué. ' + error.message,
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}
</script>