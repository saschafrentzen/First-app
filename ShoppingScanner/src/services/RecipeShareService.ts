import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {
  Recipe,
  RecipeShare,
  RecipePermissions,
  RecipeInvitation,
  SharedRecipeStats,
  ServiceResponse
} from '../types';

class RecipeShareService {
  private static instance: RecipeShareService;
  private readonly recipeSharesCollection = 'recipe_shares';
  private readonly recipeInvitationsCollection = 'recipe_invitations';

  private constructor() {}

  public static getInstance(): RecipeShareService {
    if (!RecipeShareService.instance) {
      RecipeShareService.instance = new RecipeShareService();
    }
    return RecipeShareService.instance;
  }

  private getCurrentUser() {
    const user = auth().currentUser;
    if (!user) throw new Error('Nicht authentifiziert');
    return user;
  }

  /**
   * Teilt ein Rezept mit anderen Benutzern
   */
  public async shareRecipe(
    recipeId: string,
    userEmails: string[],
    permissions: RecipePermissions,
    message?: string
  ): Promise<ServiceResponse<string[]>> {
    try {
      const user = this.getCurrentUser();
      const invitationIds: string[] = [];

      // Erstelle Einladungen für jeden Benutzer
      for (const email of userEmails) {
        const invitationId = `invitation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const invitation: RecipeInvitation = {
          invitationId,
          recipeId,
          fromUser: user.uid,
          toEmail: email,
          message,
          permissions,
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 Tage gültig
        };

        await firestore()
          .collection(this.recipeInvitationsCollection)
          .doc(invitationId)
          .set(invitation);

        invitationIds.push(invitationId);
      }

      return { success: true, data: invitationIds };
    } catch (error) {
      console.error('Error sharing recipe:', error);
      return {
        success: false,
        error: 'Fehler beim Teilen des Rezepts',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Akzeptiert eine Rezept-Einladung
   */
  public async acceptInvitation(invitationId: string): Promise<ServiceResponse<void>> {
    try {
      const user = this.getCurrentUser();
      
      const invitationDoc = await firestore()
        .collection(this.recipeInvitationsCollection)
        .doc(invitationId)
        .get();

      if (!invitationDoc.exists) {
        return { success: false, error: 'Einladung nicht gefunden' };
      }

      const invitation = invitationDoc.data() as RecipeInvitation;
      
      if (invitation.status !== 'pending') {
        return { success: false, error: 'Einladung ist nicht mehr aktiv' };
      }

      if (invitation.toEmail !== user.email) {
        return { success: false, error: 'Keine Berechtigung' };
      }

      const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Hole das Rezept
      const recipeDoc = await firestore().collection('recipes').doc(invitation.recipeId).get();
      if (!recipeDoc.exists) {
        return { success: false, error: 'Rezept nicht gefunden' };
      }

      const recipe = recipeDoc.data() as Recipe;
      
      // Erstelle den Share
      const share: RecipeShare = {
        shareId,
        recipeId: invitation.recipeId,
        recipe,
        sharedBy: invitation.fromUser,
        sharedWith: [user.uid],
        permissions: invitation.permissions,
        sharedAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };

      // Speichere den Share und aktualisiere die Einladung
      await firestore().collection(this.recipeSharesCollection).doc(shareId).set(share);
      await firestore()
        .collection(this.recipeInvitationsCollection)
        .doc(invitationId)
        .update({ status: 'accepted' });

      return { success: true };
    } catch (error) {
      console.error('Error accepting invitation:', error);
      return {
        success: false,
        error: 'Fehler beim Akzeptieren der Einladung',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Lehnt eine Rezept-Einladung ab
   */
  public async declineInvitation(invitationId: string): Promise<ServiceResponse<void>> {
    try {
      const user = this.getCurrentUser();
      
      const invitationDoc = await firestore()
        .collection(this.recipeInvitationsCollection)
        .doc(invitationId)
        .get();

      if (!invitationDoc.exists) {
        return { success: false, error: 'Einladung nicht gefunden' };
      }

      const invitation = invitationDoc.data() as RecipeInvitation;
      
      if (invitation.toEmail !== user.email) {
        return { success: false, error: 'Keine Berechtigung' };
      }

      await firestore()
        .collection(this.recipeInvitationsCollection)
        .doc(invitationId)
        .update({ status: 'declined' });

      return { success: true };
    } catch (error) {
      console.error('Error declining invitation:', error);
      return {
        success: false,
        error: 'Fehler beim Ablehnen der Einladung',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Holt alle geteilten Rezepte eines Benutzers
   */
  public async getSharedRecipes(): Promise<ServiceResponse<RecipeShare[]>> {
    try {
      const user = this.getCurrentUser();
      
      const snapshot = await firestore()
        .collection(this.recipeSharesCollection)
        .where('sharedWith', 'array-contains', user.uid)
        .get();

      const shares = snapshot.docs.map(doc => doc.data() as RecipeShare);
      
      return { success: true, data: shares };
    } catch (error) {
      console.error('Error getting shared recipes:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der geteilten Rezepte',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Holt alle ausstehenden Einladungen eines Benutzers
   */
  public async getPendingInvitations(): Promise<ServiceResponse<RecipeInvitation[]>> {
    try {
      const user = this.getCurrentUser();
      
      const snapshot = await firestore()
        .collection(this.recipeInvitationsCollection)
        .where('toEmail', '==', user.email)
        .where('status', '==', 'pending')
        .get();

      const invitations = snapshot.docs.map(doc => doc.data() as RecipeInvitation);
      
      return { success: true, data: invitations };
    } catch (error) {
      console.error('Error getting pending invitations:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Einladungen',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Entfernt einen Benutzer aus einem geteilten Rezept
   */
  public async removeUserFromShare(shareId: string, userId: string): Promise<ServiceResponse<void>> {
    try {
      const user = this.getCurrentUser();
      
      const shareDoc = await firestore()
        .collection(this.recipeSharesCollection)
        .doc(shareId)
        .get();

      if (!shareDoc.exists) {
        return { success: false, error: 'Geteiltes Rezept nicht gefunden' };
      }

      const share = shareDoc.data() as RecipeShare;
      
      // Prüfe Berechtigungen
      if (share.sharedBy !== user.uid && userId !== user.uid) {
        return { success: false, error: 'Keine Berechtigung' };
      }

      const updatedSharedWith = share.sharedWith.filter(id => id !== userId);
      
      if (updatedSharedWith.length === 0) {
        // Wenn keine Benutzer mehr übrig sind, lösche den Share
        await firestore().collection(this.recipeSharesCollection).doc(shareId).delete();
      } else {
        // Aktualisiere die Benutzerliste
        await firestore()
          .collection(this.recipeSharesCollection)
          .doc(shareId)
          .update({
            sharedWith: updatedSharedWith,
            lastModified: new Date().toISOString()
          });
      }

      return { success: true };
    } catch (error) {
      console.error('Error removing user from share:', error);
      return {
        success: false,
        error: 'Fehler beim Entfernen des Benutzers',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Aktualisiert die Berechtigungen eines geteilten Rezepts
   */
  public async updateSharePermissions(
    shareId: string,
    permissions: RecipePermissions
  ): Promise<ServiceResponse<void>> {
    try {
      const user = this.getCurrentUser();
      
      const shareDoc = await firestore()
        .collection(this.recipeSharesCollection)
        .doc(shareId)
        .get();

      if (!shareDoc.exists) {
        return { success: false, error: 'Geteiltes Rezept nicht gefunden' };
      }

      const share = shareDoc.data() as RecipeShare;
      
      if (share.sharedBy !== user.uid) {
        return { success: false, error: 'Keine Berechtigung' };
      }

      await firestore()
        .collection(this.recipeSharesCollection)
        .doc(shareId)
        .update({
          permissions,
          lastModified: new Date().toISOString()
        });

      return { success: true };
    } catch (error) {
      console.error('Error updating share permissions:', error);
      return {
        success: false,
        error: 'Fehler beim Aktualisieren der Berechtigungen',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Holt die Statistiken zu einem geteilten Rezept
   */
  public async getRecipeShareStats(recipeId: string): Promise<ServiceResponse<SharedRecipeStats>> {
    try {
      const user = this.getCurrentUser();
      
      // Hole alle aktiven Shares
      const sharesSnapshot = await firestore()
        .collection(this.recipeSharesCollection)
        .where('recipeId', '==', recipeId)
        .get();

      // Hole alle ausstehenden Einladungen
      const invitationsSnapshot = await firestore()
        .collection(this.recipeInvitationsCollection)
        .where('recipeId', '==', recipeId)
        .where('status', '==', 'pending')
        .get();

      const shares = sharesSnapshot.docs.map(doc => doc.data() as RecipeShare);
      
      const stats: SharedRecipeStats = {
        totalShares: shares.length,
        activeShares: shares.length,
        pendingInvitations: invitationsSnapshot.size,
        lastSharedAt: shares.length > 0
          ? shares.reduce((latest, share) => {
              return latest > share.sharedAt ? latest : share.sharedAt;
            }, shares[0].sharedAt)
          : null
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting recipe share stats:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Statistiken',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }
}

export const recipeShareService = RecipeShareService.getInstance();