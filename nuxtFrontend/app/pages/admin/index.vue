<template>
    <UContainer>
        <div class="flex flex-row gap-10 mt-5">
        <div v-for="item in items" :key="item.title">
                <UCard class="w-40 h-30" variant="subtle">
                    <template #default>
                        <ULink :to="item.to">
                            <div class="text-center justify-center text-lg font-semibold">
                                <h3>{{ item.title }}</h3>
                            </div>
                        </ULink>
                    </template>
                </UCard>
            </div>
        </div>
    </UContainer>

</template>

<script setup lang="ts">
const items = ref([
    {
        title: "Gestion des utilisateurs",
        to: '/admin/users'
    }, {
        title: "Salles de crise",
        to: '/admin/crisis-rooms'
    }
])
</script>