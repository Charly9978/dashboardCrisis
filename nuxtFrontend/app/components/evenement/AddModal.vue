<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import {collection,addDoc, serverTimestamp} from 'firebase/firestore'

const db = useFirestore()
const store = useProfilStore()
const route = useRoute()

const categories = ["sécurité", "evacuation", "arrets_techniques", "autre"]
const items = ref(categories)

const schema = z.object({
    action: z.string().trim(),
    categorie: z.string(),
    comment: z.string().trim().optional()
})

type Schema = z.output<typeof schema>

const initialState: Partial<Schema> = {
  action: undefined,
  categorie: undefined,
  comment: undefined
}

const state = reactive({ ...initialState })

const resetForm = () => Object.assign(state, initialState)

const onClose = () => {
  resetForm()
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event.data)
  const actionCollection = collection(db,"actions")
  await addDoc(actionCollection,{
    categorie:event.data.categorie,
    comment: event.data.comment,
    created_at: serverTimestamp(),
    demandeur_id: store.profil?.user_auth_id,
    demandeur_nom: store.profil?.nom_complet,
    evenement_id: route.params.id,
    nom_action: event.data.action,
    statut_actuel:"Non requis"
  })

  resetForm()
}
</script>

<template>
  <UModal 
    title="Ajouter une nouvelle action"
    :close="{ onClick: onClose}"
    :dismissible="false"
  >
    <!-- bouton d'ouverture -->
    <UButton class="mt-4" label="Ajouter une action" icon="i-basil:add-solid"
    />

    <template #body>
      <UForm class="space-y-4" :schema="schema" :state="state" @submit="onSubmit">
        <UFormField label="Action" name="action">
          <UInput v-model="state.action"/>
        </UFormField>

        <UFormField label="Catégorie" name="categorie">
          <USelect v-model="state.categorie" :items="items" class="w-50" />
        </UFormField>

        <UFormField label="Commentaire" name="comment">
          <UTextarea v-model="state.comment"/>
        </UFormField>

        <UButton label="Ajouter" type="submit" />
      </UForm>
    </template>
  </UModal>
</template>