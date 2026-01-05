import {doc, getDoc,updateDoc } from 'firebase/firestore'
import {type Profil, useProfilStore} from '~/stores/profilStore'
import {type User} from 'firebase/auth'

export default async function(user:User) {
    const profilStore = useProfilStore()
    console.log('checkAuthFireStore user',user)
   const db = useFirestore()
   const email = user.email!
   const userId = user.uid
   const photoURL = user.photoURL

   try {
       const docRef = doc(db,'profils',email)
       const docSnap = await getDoc(docRef)
       console.log('docSnap from firestore',docSnap)
       if(!docSnap.data()) throw new Error("unauthorized")
        const user = docSnap.data() as Profil
         console.log('user from firestore',user)
       if(!user.user_auth_id || !user.photoUrl){
        console.log('test update firestore')
        await updateDoc(docRef,{ "user_auth_id": userId ,"photoUrl": photoURL} )
        profilStore.setProfil({...user, user_auth_id: userId, photoUrl: photoURL})
        localStorage.setItem('cacheProfil',JSON.stringify({...user, user_auth_id: userId, photoUrl: photoURL}))
        return
       }
       profilStore.setProfil(user)
       localStorage.setItem('cacheProfil',JSON.stringify(user))
       return
    
   } catch (error) {
        console.error(error)
        profilStore.clearProfil()
        localStorage.removeItem('cacheProfil')
        throw new Error((error as Error).message)
   }
}