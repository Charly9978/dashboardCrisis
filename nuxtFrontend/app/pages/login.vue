<template>
  <UContainer class="py-24">
    <UCard class="max-w-md mx-auto">
      <template #header>
        <h2 class="text-2xl font-bold text-center">
          Outil de Crise 
        </h2>
      </template>

      <div class="space-y-4">
        <UButton
          @click="signInWithGoogle"
          label="Se connecter avec Google"
          icon="i-simple-icons-google"
          color="red"
          variant="solid"
          size="xl"
          block
          :loading="isLoading"
        />

        <UAlert
          v-if="authError"
          icon="i-heroicons-exclamation-triangle-solid"
          color="error"
          variant="soft"
          title="Erreur d'authentification"
          :description="errorMessage"
        />
        <UAlert
          v-if="$route.query.error === 'unauthorized'"
          icon="i-heroicons-exclamation-triangle-solid"
          color="error"
          variant="soft"
          title="Vous n'êtes pas autorisé à accéder à cette application"
          :description="authError"
        />
      </div>
    </UCard>
  </UContainer>
</template>

<script setup>
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'
import { useProfilStore } from '~/stores/profilStore'

// On utilise VueFire pour l'authentification
const auth = useFirebaseAuth()
const route = useRoute()
const profilStore = useProfilStore()

const authError= ref(false)
const errorMessage = ref('')

async function signInWithGoogle() {
  try {
    const provider = new GoogleAuthProvider()
    const userCredential = await signInWithPopup(auth, provider)
    const user = userCredential.user
    await checkAuthFireStore(user.email,user.uid)
    const idTokenResult = await user.getIdTokenResult()
    console.log('idToken',idTokenResult)
    const expirationTime = new Date(idTokenResult.expirationTime).getTime()
    profilStore.setExpirationTime(expirationTime)
    localStorage.setItem('expirationTime',expirationTime)
    //profilStore.setExpirationTime(Date.now()+1000*60)
    navigateTo(route.query.redirect || '/') // Redirection immédiate
  } catch (error) {
    console.error(error);
    await signOut(auth)
    authError.value=true
    errorMessage.value = error.message
  }
}
</script>

