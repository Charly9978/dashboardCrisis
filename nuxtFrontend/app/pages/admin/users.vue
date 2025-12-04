<template>
    <UContainer class="py-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-3xl font-bold">Gestion des utilisateurs</h1>
            <UButton label="Ajouter un utilisateur" icon="i-heroicons-user-plus" @click="openModal()" />
        </div>

        <div v-if="pending" class="flex justify-center py-8">
            <USpinner size="xl" />
        </div>

        <UCard v-else>
            <div class="flex px-4 py-3.5 border-b border-accented">
                <UInput v-model="globalFilter" class="max-w-sm" placeholder="Filter..." />
            </div>
            <UTable v-model:global-filter="globalFilter" :data="users" :columns="columns">
                <template #role-cell="{ row }">
                    <UBadge :color="getRoleColor(row.original.role)" variant="subtle">
                        {{ row.original.role }}
                    </UBadge>
                </template>

                <template #actions-cell="{ row }">
                    <div class="flex gap-2">
                        <UButton icon="i-heroicons-pencil-square" size="xs" color="warning" variant="soft"
                            @click="openModal(row.original)" />
                        <UButton icon="i-heroicons-trash" size="xs" color="error" variant="soft"
                            @click="confirmDelete(row.original)" />
                    </div>
                </template>
            </UTable>
        </UCard>

        <UModal v-model:open="isModalOpen" :title="isEditing ? 'Modifier l\'utilisateur' : 'Inviter un utilisateur'">
            <template #body>
                <div class="p-4">
                    <h3 class="text-lg font-semibold mb-4">
                        {{ isEditing ? 'Modifier le profil' : 'Nouvel utilisateur' }}
                    </h3>
    
                    <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4">
    
                        <UFormField label="Email (Compte Google)" name="email">
                            <UInput v-model="state.email" placeholder="exemple@gmail.com" :disabled="isEditing" />
                            <span v-if="isEditing" class="text-xs text-gray-500">L'email sert d'identifiant et ne peut pas
                                être
                                modifié.</span>
                        </UFormField>
    
                        <UFormField label="Nom complet" name="nom_complet">
                            <UInput v-model="state.nom_complet" placeholder="Jean Dupont" />
                        </UFormField>
    
                        <UFormField label="Rôle" name="role">
                            <USelect v-model="state.role" :items="rolesOptions" />
                        </UFormField>
    
                        <div class="flex justify-end gap-2 mt-6">
                            <UButton label="Annuler" color="neutral" variant="ghost" @click="isModalOpen = false" />
                            <UButton type="submit" label="Enregistrer" :loading="isLoading" />
                        </div>
                    </UForm>
                </div>
            </template>
        </UModal>

        <UModal v-model:open="isDeleteModalOpen" title="Confirmer la suppression">
            <template #body>
                <div class="p-4">
                    <p class="mb-4">Êtes-vous sûr de vouloir supprimer l'accès pour <strong>{{ userToDelete?.email
                            }}</strong> ?</p>
                    <div class="flex justify-end gap-2">
                        <UButton label="Annuler" color="neutral" variant="ghost" @click="isDeleteModalOpen = false" />
                        <UButton label="Supprimer" color="error" @click="deleteUser" :loading="isLoading" />
                    </div>
                </div>
            </template>
        </UModal>

    </UContainer>
</template>

<script setup lang="ts">
import { z } from 'zod'
import { collection, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore'
import type { ColumnDef, Row } from '@tanstack/vue-table'
import { type Profil } from '~/stores/profilStore'

// --- CONFIG ---
const db = useFirestore()
const toast = useToast()

// Récupération temps réel des utilisateurs
const usersRef = collection(db, 'profils')
const q = query(usersRef, orderBy('nom_complet'))
const { data: users, pending } = useCollection(q)

// Définition des colonnes du tableau
const columns: ColumnDef<Profil>[] = [
    { accessorKey: 'nom_complet', header: 'Nom' },
    { accessorKey: 'email', header: 'Email' },
    { accessorKey: 'role', header: 'Rôle' },
    { accessorKey: 'actions', header: 'Actions' }
]

const rolesOptions = ['Admin', 'Acteur', 'Lecteur']

function getRoleColor(role: string) {
    switch (role) {
        case 'Admin': return 'error'
        case 'Acteur': return 'info'
        default: return 'neutral'
    }
}

const globalFilter = ref('')


// --- GESTION DU FORMULAIRE (ZOD) ---
const schema = z.object({
    email: z.string().email('Email invalide'),
    nom_complet: z.string().min(2, 'Nom trop court'),
    role: z.enum(['Admin', 'Acteur', 'Lecteur'])
})

const state = reactive({
    email: '',
    nom_complet: '',
    role: 'Acteur'
})

// --- MODALE & LOGIQUE ---
const isModalOpen = ref(false)
const isEditing = ref(false)
const isLoading = ref(false)

function openModal(user: any = null) {
    if (user) {
        // Mode Edition
        isEditing.value = true
        state.email = user.email // ou user.id car id = email dans votre structure
        state.nom_complet = user.nom_complet
        state.role = user.role
    } else {
        // Mode Création
        isEditing.value = false
        state.email = ''
        state.nom_complet = ''
        state.role = 'Acteur'
    }
    isModalOpen.value = true
}

async function onSubmit() {
    isLoading.value = true
    try {
        // Dans votre architecture, l'ID du document EST l'email.
        // Cela garantit qu'un utilisateur ne peut avoir qu'un seul profil par email.
        const userDocRef = doc(db, 'profils', state.email)

        const userData = {
            email: state.email,
            nom_complet: state.nom_complet,
            role: state.role,
            // On ne touche pas à user_auth_id s'il existe déjà, sinon on le laisse undefined
            // Il sera rempli lors de la première connexion via checkAuthFireStore.ts
        }

        // setDoc avec merge: true permet de créer ou mettre à jour sans écraser l'auth_id s'il est là
        await setDoc(userDocRef, userData, { merge: true })

        toast.add({ title: 'Succès', description: 'Utilisateur enregistré', color: 'success' })
        isModalOpen.value = false
    } catch (e: any) {
        toast.add({ title: 'Erreur', description: e.message, color: 'error' })
    } finally {
        isLoading.value = false
    }
}

// --- SUPPRESSION ---
const isDeleteModalOpen = ref(false)
const userToDelete = ref<any>(null)

function confirmDelete(user: any) {
    userToDelete.value = user
    isDeleteModalOpen.value = true
}

async function deleteUser() {
    if (!userToDelete.value) return
    isLoading.value = true
    try {
        await deleteDoc(doc(db, 'profils', userToDelete.value.id)) // .id est l'email fourni par VueFire
        toast.add({ title: 'Utilisateur supprimé', color: 'success' })
        isDeleteModalOpen.value = false
    } catch (e: any) {
        toast.add({ title: 'Erreur', description: e.message, color: 'error' })
    } finally {
        isLoading.value = false
    }
}

// Middleware Admin (automatique car dans le dossier /admin/ mais on peut forcer la vérification)
definePageMeta({
    middleware: 'admin'
})
</script>