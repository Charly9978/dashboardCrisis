<template>
  <UApp>
    <div v-if="profilStore.isLoading">
      <USpinner size="xl" />
    </div>

    <div v-else>
      <NuxtPage />
    </div>
    
    <UNotifications />
  </UApp>
</template>

<script setup>
const profilStore = useProfilStore()


</script>


