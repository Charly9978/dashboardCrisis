<template>
  <UApp>
    <div v-if="profilStore.isLoading">
      <USpinner size="xl" />
    </div>

    <div v-else>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </div>
    
    <UNotifications />
  </UApp>
</template>

<script setup>
const profilStore = useProfilStore()


</script>


