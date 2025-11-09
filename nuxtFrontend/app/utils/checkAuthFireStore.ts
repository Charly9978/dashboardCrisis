import {doc, getDoc,updateDoc } from 'firebase/firestore'
import {type Profil, useProfilStore} from '~/stores/profilStore'

export default async function(email:string,userId:string){
    const profilStore = useProfilStore()
   const db = useFirestore()
   try {
       const docRef = doc(db,'profils',email)
       const docSnap = await getDoc(docRef)
       console.log('docSnap from firestore',docSnap)
       if(!docSnap.data()) throw new Error("unauthorized")
        const user = docSnap.data() as Profil
         console.log('user from firestore',user)
       if(!user.user_auth_id){
        await updateDoc(docRef,{ "user_auth_id":userId})
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