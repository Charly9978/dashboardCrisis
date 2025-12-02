// Imports de la v2 de Firebase Functions
import {onDocumentCreated, onDocumentUpdated} from "firebase-functions/v2/firestore";
import {logger} from "firebase-functions";

// Imports modulaires de l'Admin SDK
import {initializeApp} from "firebase-admin/app";
import {getFirestore, FieldValue} from "firebase-admin/firestore";

// On initialise l'application et la BDD une seule fois, au niveau global
initializeApp();
const db = getFirestore();

/**
 * Cette fonction v2 se déclenche à chaque création
 * d'un document dans la collection 'evenements'.
 */
export const createDefaultActions = onDocumentCreated(
  {
    region: "europe-west9", // <-- Assurez-vous que c'est votre région
    document: "evenements/{eventId}", // Le chemin du document à écouter
  },
  async (event) => { // 'event' remplace (snap, context) de la v1
    // 1. Récupérer les infos de l'événement qui vient d'être créé
    const eventId = event.params.eventId; // L'ID via les paramètres

    // event.data est le DocumentSnapshot
    if (!event.data) {
      logger.error("Snapshot de l'événement non trouvé (v2)");
      return;
    }
    const eventData = event.data.data(); // Les données du document

    if (!eventData) {
      logger.error("Données de l'événement non trouvées (v2)");
      return;
    }

    logger.log(`Déclenchement v2: Création des actions par défaut pour ${eventId}`);

    // 2. Récupérer TOUTES les actions de la collection 'templates_actions'
    const templatesSnap = await db.collection("templates_actions").get();

    if (templatesSnap.empty) {
      logger.warn("Aucun template d'action trouvé. Aucune action auto créée.");
      return;
    }

    // 3. Préparer un "batch" pour tout écrire en une seule fois
    const batch = db.batch();
    const actionsCollectionRef = db.collection("actions");

    templatesSnap.forEach((templateDoc) => {
      const template = templateDoc.data();
      const newActionRef = actionsCollectionRef.doc(); // Prépare un nouvel ID d'action

      // 4. Définir les données pour la nouvelle action
      const newActionData = {
        evenement_id: eventId,
        nom_action: template.nom_action,
        categorie: template.categorie,
        comment: "",
        statut_actuel: "Non requis", // Notre statut par défaut

        // Infos de traçabilité (basées sur le créateur de l'événement)
        created_at: FieldValue.serverTimestamp(), // Syntaxe modulaire
        demandeur_id: eventData.createur_id,
        demandeur_nom: eventData.createur_nom,
        last_updated_at: "", // Syntaxe modulaire
        last_updated_by_id: "",
        last_updated_by_nom: "",
      };

      batch.set(newActionRef, newActionData);
    });

    // 5. Envoyer le batch à Firestore
    await batch.commit();

    logger.log(`Succès v2: ${templatesSnap.size} actions par défaut créées pour ${eventId}`);
    // En v2, on retourne 'void' ou rien, on ne retourne plus 'null'
  }
);

// --- FONCTION 2 : HISTORISATION (NOUVELLE) ---

/**
 * Cette fonction se déclenche à chaque MODIFICATION (update)
 * d'un document dans la collection 'actions'.
 * Elle crée une archive dans 'historique_actions'.
 */
export const trackActionHistory = onDocumentUpdated(
  {
    region: "europe-west9",
    document: "actions/{actionId}",
  },
  async (event) => {
    // Si pas de données (ex: suppression), on arrête
    if (!event.data) return;

    // Récupérer l'état AVANT et APRÈS la modification
    const oldData = event.data.before.data();
    const newData = event.data.after.data();
    const actionId = event.params.actionId;

    // Sécurité basique
    if (!oldData || !newData) return;

    // On ne crée un historique QUE si le statut a changé
    // (Cela évite de créer un log si on corrige juste une faute de frappe dans le nom)
    if (oldData.statut_actuel === newData.statut_actuel) {
      return;
    }

    logger.log(`Statut modifié pour l'action ${actionId} : ${oldData.statut_actuel} -> ${newData.statut_actuel}`);

    // Préparer l'objet d'historique
    // Note : On copie (dénormalise) les noms pour que l'historique soit lisible
    // même si l'action est supprimée plus tard.
    const historyData = {
      action_id: actionId,
      evenement_id: newData.evenement_id,
      timestamp: FieldValue.serverTimestamp(), // Date précise du changement
      // Qui a fait le changement ? (Ces infos viennent du front lors de l'update)
      utilisateur_id: newData.last_updated_by_id,
      utilisateur_nom: newData.last_updated_by_nom,
      // Quoi ?
      nom_action: newData.nom_action,
      statut_precedent: oldData.statut_actuel,
      statut_nouveau: newData.statut_actuel,
      // Commentaire éventuel (si géré plus tard)
      commentaire: newData.comment || "",
    };

    // Écrire dans la collection 'historique_actions'
    await db.collection("historique_actions").add(historyData);
  }
);

