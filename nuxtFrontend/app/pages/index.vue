<script setup lang="ts">
import { useProfilStore } from '~/stores/profilStore'
import { getAuth, signOut } from 'firebase/auth'

const store = useProfilStore()
const auth = getAuth()
const router = useRouter()


async function logout() {
  await signOut(auth)
  store.clearProfil()
  router.push('/login')
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen p-6">
    <UCard class="max-w-lg w-full text-center space-y-4">
      <h1 class="text-2xl font-bold">Bienvenue, {{ store.profil?.nom_complet }}</h1>

      <p class="text-gray-600">
        <span class="font-semibold">Email :</span>
        {{ store.profil?.email }}
      </p>

      <p class="text-gray-600">
        <span class="font-semibold">Rôle :</span>
        {{ store.profil?.role }}
      </p>

      <UButton color="primary" variant="soft" class="mt-6" @click="logout">
        Se déconnecter
      </UButton>
    </UCard>
  </div>
</template>
