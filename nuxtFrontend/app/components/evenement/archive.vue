<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const open = ref(false)

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

const onClosePrevent = () => {
  console.log("close:prevent OK")

  resetForm()
  open.value = false   // fermeture manuelle obligatoire
}

async function onSubmit(event: FormSubmitEvent<Schema>) {
  console.log(event.data)

  resetForm()
  open.value = false
}
</script>

<template>
  <UModal 
    v-model:open="open"
    title="Ajouter une nouvelle action"
    @close:prevent="onClosePrevent"
  >
    <!-- bouton d'ouverture -->
    <UButton class="mt-4" label="Ajouter une action" icon="i-basil:add-solid"
      @click="open = true"
    />

    <template #body>
      <UForm class="space-y-4" :schema="schema" :state="state" @submit="onSubmit">
        <UFormField label="Action" name="action">
          <UInput v-model="state.action"/>
        </UFormField>

        <UFormField label="Catégorie" name="categorie">
          <USelect v-model="state.categorie" :items="items" />
        </UFormField>

        <UFormField label="Commentaire" name="comment">
          <UTextarea v-model="state.comment"/>
        </UFormField>

        <UButton label="Ajouter" type="submit" />
      </UForm>
    </template>
  </UModal>
</template>