<template>
  <div>
    <UContainer class="py-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold">Tableau de Bord</h1>
        
        <UButton
          v-if="store.isAdmin"
          label="Nouvel Événement"
          icon="i-heroicons-plus-circle"
          size="lg"
          @click="goToCreateEvent"
        />
      </div>

      <h2 class="text-2xl font-semibold mb-4">Événements en cours</h2>

      <div v-if="pending" class="flex justify-center py-12">
        <USpinner size="xl" />
      </div>

      <UAlert
        v-else-if="error"
        color="error"
        variant="soft"
        icon="i-heroicons-exclamation-triangle"
        title="Erreur de chargement"
        description="Impossible de charger les événements depuis la base de données."
      />

      <div v-else-if="evenementsEnCours && evenementsEnCours.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <UCard v-for="event in evenementsEnCours" :key="event.id">
          <template #header>
            <h3 class="font-bold text-lg">{{ event.titre }}</h3>
          </template>

          <p class="text-gray-500 dark:text-gray-400 mb-2">
            Lieu : {{ event.lieu }}
          </p>
          <p class="text-sm text-gray-400">
            Créé par : {{ event.createur_nom }}
          </p>

          <template #footer>
            <UButton
              label="Ouvrir le SITREP"
              variant="soft"
              block
              @click="openEvent(event.id)"
            />
          </template>
        </UCard>
      </div>

      <div v-else class="text-center text-gray-500 py-12">
        <UIcon name="i-heroicons-check-circle" class="text-4xl mb-2" />
        <p>Aucun événement en cours.</p>
      </div>

    </UContainer>
  </div>
</template>

<script setup>
import { collection, query, where, orderBy } from 'firebase/firestore'
//import { useCollection } from 'nuxt-vuefire' // L'outil magique pour le temps réel

// 1. Récupérer le store pour connaître le rôle de l'utilisateur
const store = useProfilStore()
const router = useRouter()
const db = useFirestore() // Vient de VueFire

// 2. Définir la requête Firestore
// On veut la collection 'evenements'
const evenementsRef = collection(db, 'evenements')

// On crée une requête filtrée :
// - 'statut' doit être 'En cours'
// - On trie par 'date_evenement' (le plus récent d'abord)
const q = query(
  evenementsRef, 
  where('statut', '==', 'En cours'),
  orderBy('date_evenement', 'desc')
)

// 3. Lancer la requête en temps réel
// 'data' sera une liste (ref) qui se met à jour toute seule !
// 'pending' est un booléen pour le chargement.
// 'error' gère les erreurs de la requête.
const { data: evenementsEnCours, pending, error } = useCollection(q, {
  // 'withId' ajoute l'ID du document à l'objet, c'est crucial
  // pour que 'event.id' fonctionne
  withIdField: 'id' 
})

// 4. Fonctions de navigation
function goToCreateEvent() {
  router.push('/admin/create-event') // On ira créer cette page après
}

function openEvent(eventId) {
  router.push(`/evenement/${eventId}`) // On ira créer ce dossier de page après
}
</script>