<script setup lang="ts">

import type { NavigationMenuItem } from '@nuxt/ui'
import { h, resolveComponent } from 'vue'
import { useCollection } from 'vuefire'
import { collection, query, where, Timestamp, doc } from 'firebase/firestore'
import type { ColumnDef, Row } from '@tanstack/vue-table'

interface TableActions {
    action: string,
    updateDate: string,
    updateBy: string,
    status: string
}


const store = useProfilStore()
const route = useRoute()
const db = useFirestore()
const toast = useToast()

const UButton = resolveComponent('UButton')

const items = computed<NavigationMenuItem[]>(() => [{
    label: 'Suivi actions',
    to: '/benj'
},
{
    label: 'Main courante',
},{
    label: 'admin',
    to: '/admin'
},])

const eventId = route.params.id

// 1. On récupère les détails de l'événement (1 seul document)
// 'useDocument' le mettra à jour en temps réel si le titre change
const eventRef = doc(db, 'evenements', eventId)
const { data: evenement, pending: eventPending } = useDocument(eventRef)

const actionsCollection = collection(db, 'actions')
const actionsQuery = query(actionsCollection, where("evenement_id", "==", eventId))
const { data: actions, pending: actionsPending } = useCollection(actionsQuery)
const evacActions = computed(() => {
    return actions.value.filter(action => action.categorie == 'evacuation')
})
const arretTechActions = computed(() => {
    return actions.value.filter(action => action.categorie == 'arrets_techniques')
})
const securiteActions = computed(() => {
    return actions.value.filter(action => action.categorie == 'sécurité')
})

const colors = {
    'Non requis': 'neutral',
    'Demandé': 'info',
    'En cours': 'warning',
    'Réalisé': 'success',
    'Problème': 'error'
}

const columns: ColumnDef<TableActions>[] = [
    {
        accessorKey: 'nom_action',
        header: 'Action',

    }, {
        accessorKey: 'statut_actuel',
        header: 'Status',
        cell: ({ row }) => {
            const colorsBis = colors[row.getValue('statut_actuel') as string]
            return h(UButton, {
                class: 'capitalize',
                variant: 'subtle',
                size: 'sm',
                color: colorsBis,
                onclick: () => openModal(row)
            }, () => row.getValue('statut_actuel')
            )
        }
    }

    , {
        accessorKey: 'last_updated_at',
        header: 'Date de mise à jour',
        cell: ({ row }) => {
            const timestamp = row.getValue('last_updated_at') as Timestamp
            if (timestamp) {
                return timestamp.toDate().toLocaleTimeString()
            }
        }
    }, {
        accessorKey: 'last_updated_by_nom',
        header: 'Mise à jour par'
    }, {
        accessorKey: 'comment',
        header: 'Commentaire'
    }
]

//...........modale pour modification de status.............
const isModalOpen = ref(false)
const selectedRow = ref<any>(null)

function openModal(row: Row<TableActions>) {
    if (!store.isActeur || !store.profil) {
        toast.add({ title: 'Accès refusé', color: 'error' })
        return
    }

    // copie locale pour édition
    console.log('id', row.original)
    selectedRow.value = { ...row.original, id: row.original.id }
    isModalOpen.value = true
}

//............................................................

</script>

<template>
    <div v-if="eventPending || actionsPending" class="flex h-screen items-center justify-center">
        <USpinner size="xl" />
    </div>

    <div v-else-if="!evenement" class="flex h-screen items-center justify-center">
        <UAlert color="error" title="Événement non trouvé"
            description="Cet événement n'existe pas ou a été supprimé." />
    </div>
    <UContainer>

            <div class="flex flex-row-reverse">
                <EvenementAddModal />
            </div>
            <h3 class="text-xl font-bold mt-4">Evacuation</h3>
            <UTable :data="evacActions" :columns="columns" />
            <h3 class="text-xl font-bold mt-8">Arrets techniques</h3>
            <UTable :data="arretTechActions" :columns="columns" />
            <h3 class="text-xl font-bold mt-8">Mesures de sécurité</h3>
            <UTable :data="securiteActions" :columns="columns" />
    </UContainer>
    <!-- MODAL EXTERNE -->
    <EvenementUpdateRowModale v-if="selectedRow" v-model="isModalOpen" :row="selectedRow" />
</template>