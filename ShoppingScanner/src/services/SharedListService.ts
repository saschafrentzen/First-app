import firestore from '@react-native-firebase/firestore';
import { getCurrentUser } from './auth';
import { ShoppingList, ShoppingItem } from '../types/storage';

export interface SharedListUser {
  userId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  joinedAt: string;
  lastAccess?: string;
}

export interface SharedList extends ShoppingList {
  isShared: boolean;
  sharedWith: SharedListUser[];
  shareId: string;
  ownerEmail: string;
  lastModified: string;
  version: number;
  shareSettings: {
    allowEdits: boolean;
    allowInvites: boolean;
    expiresAt?: string;
    password?: string;
  };
}

export interface ShareInvitation {
  invitationId: string;
  shareId: string;
  listId: string;
  fromUser: string;
  toEmail: string;
  role: SharedListUser['role'];
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  message?: string;
}

class SharedListService {
  private static instance: SharedListService;
  private readonly listsCollection = 'shopping_lists';
  private readonly sharesCollection = 'shared_lists';
  private readonly invitationsCollection = 'share_invitations';

  private constructor() {}

  public static getInstance(): SharedListService {
    if (!SharedListService.instance) {
      SharedListService.instance = new SharedListService();
    }
    return SharedListService.instance;
  }

  /**
   * Teilt eine Einkaufsliste mit anderen Benutzern
   */
  public async shareList(
    listId: string,
    shareWith: { email: string; role: SharedListUser['role'] }[],
    settings: SharedList['shareSettings']
  ): Promise<string> {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      // Hole die zu teilende Liste
      const listDoc = await firestore().collection(this.listsCollection).doc(listId).get();
      if (!listDoc.exists) throw new Error('Liste nicht gefunden');

      const list = listDoc.data() as ShoppingList;
      const shareId = `share_${Date.now()}`;

      // Erstelle geteilte Liste
      const sharedList: SharedList = {
        ...list,
        isShared: true,
        shareId,
        sharedWith: shareWith.map(share => ({
          userId: '', // Wird beim Akzeptieren der Einladung gesetzt
          email: share.email,
          role: share.role,
          joinedAt: new Date().toISOString()
        })),
        ownerEmail: user.email || '',
        lastModified: new Date().toISOString(),
        version: 1,
        shareSettings: settings
      };

      // Speichere in Firestore
      await firestore().collection(this.sharesCollection).doc(shareId).set(sharedList);

      // Erstelle Einladungen
      const invitationPromises = shareWith.map(share =>
        this.createShareInvitation(shareId, listId, share.email, share.role)
      );
      await Promise.all(invitationPromises);

      return shareId;
    } catch (error) {
      console.error('Error sharing list:', error);
      throw new Error('Fehler beim Teilen der Liste');
    }
  }

  /**
   * Aktualisiert eine geteilte Liste
   */
  public async updateSharedList(shareId: string, updates: Partial<SharedList>): Promise<void> {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const shareDoc = await firestore().collection(this.sharesCollection).doc(shareId).get();
      if (!shareDoc.exists) throw new Error('Geteilte Liste nicht gefunden');

      const sharedList = shareDoc.data() as SharedList;
      
      // Prüfe Berechtigungen
      if (!this.canEditList(sharedList, user.uid)) {
        throw new Error('Keine Berechtigung zum Bearbeiten der Liste');
      }

      // Aktualisiere Version und Zeitstempel
      const updatedList = {
        ...updates,
        version: (sharedList.version || 0) + 1,
        lastModified: new Date().toISOString()
      };

      await firestore()
        .collection(this.sharesCollection)
        .doc(shareId)
        .update(updatedList);
    } catch (error) {
      console.error('Error updating shared list:', error);
      throw new Error('Fehler beim Aktualisieren der geteilten Liste');
    }
  }

  /**
   * Akzeptiert eine Einladung zur geteilten Liste
   */
  public async acceptInvitation(invitationId: string): Promise<string> {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const invitationDoc = await firestore()
        .collection(this.invitationsCollection)
        .doc(invitationId)
        .get();

      if (!invitationDoc.exists) throw new Error('Einladung nicht gefunden');
      
      const invitation = invitationDoc.data() as ShareInvitation;
      if (invitation.status !== 'pending') throw new Error('Einladung ist nicht mehr gültig');
      if (invitation.toEmail !== user.email) throw new Error('Einladung ist für einen anderen Benutzer');

      // Aktualisiere die geteilte Liste
      await firestore()
        .collection(this.sharesCollection)
        .doc(invitation.shareId)
        .update({
          'sharedWith': firestore.FieldValue.arrayUnion({
            userId: user.uid,
            email: user.email,
            role: invitation.role,
            joinedAt: new Date().toISOString()
          })
        });

      // Aktualisiere den Status der Einladung
      await firestore()
        .collection(this.invitationsCollection)
        .doc(invitationId)
        .update({
          status: 'accepted'
        });

      return invitation.shareId;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      throw new Error('Fehler beim Akzeptieren der Einladung');
    }
  }

  /**
   * Holt alle geteilten Listen eines Benutzers
   */
  public async getSharedLists(): Promise<SharedList[]> {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const snapshot = await firestore()
        .collection(this.sharesCollection)
        .where('sharedWith', 'array-contains', { userId: user.uid })
        .get();

      return snapshot.docs.map(doc => doc.data() as SharedList);
    } catch (error) {
      console.error('Error getting shared lists:', error);
      throw new Error('Fehler beim Abrufen der geteilten Listen');
    }
  }

  /**
   * Holt eine spezifische geteilte Liste anhand ihrer ID
   */
  public async getSharedListById(shareId: string): Promise<SharedList | null> {
    try {
      const shareDoc = await firestore()
        .collection(this.sharesCollection)
        .doc(shareId)
        .get();

      if (!shareDoc.exists) return null;
      return shareDoc.data() as SharedList;
    } catch (error) {
      console.error('Error getting shared list by id:', error);
      throw new Error('Fehler beim Abrufen der geteilten Liste');
    }
  }

  /**
   * Entfernt einen Benutzer von einer geteilten Liste
   */
  public async removeUserFromList(shareId: string, userId: string): Promise<void> {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const shareDoc = await firestore()
        .collection(this.sharesCollection)
        .doc(shareId)
        .get();

      if (!shareDoc.exists) throw new Error('Geteilte Liste nicht gefunden');
      const sharedList = shareDoc.data() as SharedList;

      // Prüfe Berechtigungen
      if (!this.canManageUsers(sharedList, user.uid)) {
        throw new Error('Keine Berechtigung zum Entfernen von Benutzern');
      }

      // Entferne Benutzer
      const updatedSharedWith = sharedList.sharedWith.filter(u => u.userId !== userId);
      await firestore()
        .collection(this.sharesCollection)
        .doc(shareId)
        .update({
          sharedWith: updatedSharedWith,
          version: sharedList.version + 1,
          lastModified: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error removing user from list:', error);
      throw new Error('Fehler beim Entfernen des Benutzers');
    }
  }

  // Private Hilfsmethoden

  private async createShareInvitation(
    shareId: string,
    listId: string,
    toEmail: string,
    role: SharedListUser['role']
  ): Promise<string> {
    try {
      const user = getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const invitation: ShareInvitation = {
        invitationId,
        shareId,
        listId,
        fromUser: user.email || '',
        toEmail,
        role,
        status: 'pending',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 Tage gültig
      };

      await firestore()
        .collection(this.invitationsCollection)
        .doc(invitationId)
        .set(invitation);

      return invitationId;
    } catch (error) {
      console.error('Error creating share invitation:', error);
      throw new Error('Fehler beim Erstellen der Einladung');
    }
  }

  private canEditList(list: SharedList, userId: string): boolean {
    const userShare = list.sharedWith.find(share => share.userId === userId);
    return userShare?.role === 'owner' || userShare?.role === 'editor';
  }

  private canManageUsers(list: SharedList, userId: string): boolean {
    const userShare = list.sharedWith.find(share => share.userId === userId);
    return userShare?.role === 'owner';
  }
}

export const sharedListService = SharedListService.getInstance();