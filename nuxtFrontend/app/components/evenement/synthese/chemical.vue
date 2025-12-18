<template>
    <UCard :ui="{ header: 'bg-orange-100 dark:bg-gray-800/50' }">
        <template #header>
            <div class="flex items-center gap-2 text-gray-900 dark:text-white font-semibold">
                <UIcon name="i-heroicons-beaker" class="text-xl" />
                <h3>Nature & Risques</h3>
            </div>
        </template>
        <template #default>
            <div class="space-y-4">
                <div class="grid grid-cols-2 gap-2">
                    <UFormField label="Produit Chimique">
                        <UInput v-model="event!.chemical_name" placeholder="Nom..." />
                    </UFormField>
                    <UFormField label="Quantité">
                        <UInput v-model="event!.chemical_qty" placeholder="Ex: 500L" />
                    </UFormField>
                </div>
                <USeparator label="Risques identifiés" />
                <div class="grid grid-cols-2 gap-y-3">
                    <UCheckbox v-model="event!.risk_toxic" label="Toxique" color="error" />
                    <UCheckbox v-model="event!.risk_thermic" label="Thermique" color="warning" />
                    <UCheckbox v-model="event!.risk_surpressure" label="Surpression" color="info" />
                    <UCheckbox v-model="event!.risk_environmental" label="Pollution" color="primary" />
                </div>
            </div>
        </template>
    </UCard>

</template>
<script setup lang="ts">
const eventStore = useEvenementStore()
const { event } = storeToRefs(eventStore)
</script>