<template>
    <UHeader toggle-side="left" title="Gestion de crise" to="/">
        <template #title>
            <div class="flex items-center gap-2 w-full text-primary">
                <SoitecLogo class="h-10 w-auto text-gray-900 dark:text-white"/>
            </div>
        </template>
        <UNavigationMenu :items="items" variant="pill" />
        <template #right>
            <UUser class="hidden md:contents" :name="userStore.profil?.nom_complet"
                :description="userStore.profil?.role" :avatar="{
                    src: userStore.profil?.photoUrl,
                    icon: 'i-lucide-image'
                }" />
            <UPopover class="contents md:hidden" mode="hover">
                <UAvatar :src="userStore.profil?.photoUrl" :alt="userStore.profil?.nom_complet" />
                <template #content>
                    <UUser :name="userStore.profil?.nom_complet" :description="userStore.profil?.role" />
                </template>
            </UPopover>
            <UButton icon="i-lucide-log-out" color="neutral" variant="ghost" to="/" />
        </template>
        <template #body>
            <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
        </template>
    </UHeader>
    <UMain>
        <slot />
    </UMain>

</template>
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const userStore = useProfilStore()
const route = useRoute()
route.params.id
const items = computed<NavigationMenuItem[]>(() => [{
    label: 'Tableau de bord',
    to: `/evenement/${route.params.id}`
},{
    label: 'Suivant des actions',
    to: `/evenement/${route.params.id}`
},
 {
    label: 'Main courante',
    to: `/evenement/${route.params.id}`
},])
</script>