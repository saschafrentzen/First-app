import firestore from '@react-native-firebase/firestore';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { sharedListService, SharedList } from './SharedListService';
import { ServiceResponse } from '../types';

export interface HouseholdMember {
  userId: string;
  email: string;
  role: 'admin' | 'member';
  joinedAt: string;
  displayName?: string;
  avatar?: string;
  settings: {
    notifications: boolean;
    listAccess: 'all' | 'shared';
    budgetView: boolean;
  };
}

export interface Household {
  householdId: string;
  name: string;
  createdAt: string;
  createdBy: string;
  members: HouseholdMember[];
  settings: {
    allowInvites: boolean;
    autoShareLists: boolean;
    sharedBudget: boolean;
    currency: string;
  };
  sharedLists: string[]; // Array von shareIds
  statistics: {
    totalSpent: number;
    lastUpdate: string;
  };
}

export interface HouseholdInvitation {
  invitationId: string;
  householdId: string;
  fromUser: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
  message?: string;
}

class HouseholdService {
  private static instance: HouseholdService;
  private readonly householdsCollection = 'households';
  private readonly invitationsCollection = 'household_invitations';

  private constructor() {}

  public getCurrentUser = () => {
    const user = auth().currentUser;
    if (!user) throw new Error('Nicht authentifiziert');
    return user;
  };

  public static getInstance(): HouseholdService {
    if (!HouseholdService.instance) {
      HouseholdService.instance = new HouseholdService();
    }
    return HouseholdService.instance;
  }

  /**
   * Erstellt einen neuen Haushalt
   */
  public async createHousehold(
    name: string,
    settings: Household['settings']
  ): Promise<string> {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const householdId = `household_${Date.now()}`;
      const household: Household = {
        householdId,
        name,
        createdAt: new Date().toISOString(),
        createdBy: user.uid,
        members: [{
          userId: user.uid,
          email: user.email || '',
          role: 'admin',
          joinedAt: new Date().toISOString(),
          settings: {
            notifications: true,
            listAccess: 'all',
            budgetView: true
          }
        }],
        settings,
        sharedLists: [],
        statistics: {
          totalSpent: 0,
          lastUpdate: new Date().toISOString()
        }
      };

      await firestore()
        .collection(this.householdsCollection)
        .doc(householdId)
        .set(household);

      return householdId;
    } catch (error) {
      console.error('Error creating household:', error);
      throw new Error('Fehler beim Erstellen des Haushalts');
    }
  }

  /**
   * Lädt einen Haushalt
   */
  public async getHousehold(householdId: string): Promise<Household> {
    try {
      const doc = await firestore()
        .collection(this.householdsCollection)
        .doc(householdId)
        .get();

      if (!doc.exists) throw new Error('Haushalt nicht gefunden');
      return doc.data() as Household;
    } catch (error) {
      console.error('Error getting household:', error);
      throw new Error('Fehler beim Laden des Haushalts');
    }
  }

  /**
   * Aktualisiert Haushaltseinstellungen
   */
  public async updateHouseholdSettings(
    householdId: string,
    settings: Partial<Household['settings']>
  ): Promise<void> {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const household = await this.getHousehold(householdId);
      if (!this.isHouseholdAdmin(household, user.uid)) {
        throw new Error('Keine Berechtigung zum Ändern der Einstellungen');
      }

      await firestore()
        .collection(this.householdsCollection)
        .doc(householdId)
        .update({
          'settings': { ...household.settings, ...settings }
        });
    } catch (error) {
      console.error('Error updating household settings:', error);
      throw new Error('Fehler beim Aktualisieren der Haushaltseinstellungen');
    }
  }

  /**
   * Fügt eine Einkaufsliste zum Haushalt hinzu
   */
  public async addListToHousehold(
    householdId: string,
    shareId: string
  ): Promise<void> {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const household = await this.getHousehold(householdId);
      if (!this.canManageLists(household, user.uid)) {
        throw new Error('Keine Berechtigung zum Hinzufügen von Listen');
      }

      if (household.sharedLists.includes(shareId)) {
        throw new Error('Liste bereits im Haushalt vorhanden');
      }

      await firestore()
        .collection(this.householdsCollection)
        .doc(householdId)
        .update({
          sharedLists: firestore.FieldValue.arrayUnion(shareId)
        });
    } catch (error) {
      console.error('Error adding list to household:', error);
      throw new Error('Fehler beim Hinzufügen der Liste zum Haushalt');
    }
  }

  /**
   * Lädt alle Haushalte eines Benutzers
   */
  public async getUserHouseholds(): Promise<Household[]> {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const snapshot = await firestore()
        .collection(this.householdsCollection)
        .where('members', 'array-contains', { userId: user.uid })
        .get();

      return snapshot.docs.map(doc => doc.data() as Household);
    } catch (error) {
      console.error('Error getting user households:', error);
      throw new Error('Fehler beim Laden der Haushalte');
    }
  }

  /**
   * Lädt alle Einkaufslisten eines Haushalts
   */
  public async getHouseholdLists(householdId: string): Promise<SharedList[]> {
    try {
      const household = await this.getHousehold(householdId);
      const lists: SharedList[] = [];

      for (const shareId of household.sharedLists) {
        try {
          const list = await sharedListService.getSharedListById(shareId);
          if (list) lists.push(list);
        } catch (error) {
          console.warn(`Fehler beim Laden der Liste ${shareId}:`, error);
        }
      }

      return lists;
    } catch (error) {
      console.error('Error getting household lists:', error);
      throw new Error('Fehler beim Laden der Haushaltslisten');
    }
  }

  /**
   * Lädt die Statistiken eines Haushalts
   */
  public async getHouseholdStatistics(householdId: string): Promise<Household['statistics']> {
    try {
      const household = await this.getHousehold(householdId);
      return household.statistics;
    } catch (error) {
      console.error('Error getting household statistics:', error);
      throw new Error('Fehler beim Laden der Haushaltsstatistiken');
    }
  }

  /**
   * Aktualisiert die Mitgliedereinstellungen eines Benutzers
   */
  public async updateMemberSettings(
    householdId: string,
    settings: Partial<HouseholdMember['settings']>
  ): Promise<void> {
    try {
      const user = this.getCurrentUser();
      if (!user) throw new Error('Nicht authentifiziert');

      const household = await this.getHousehold(householdId);
      const memberIndex = household.members.findIndex(m => m.userId === user.uid);
      
      if (memberIndex === -1) throw new Error('Nicht Mitglied des Haushalts');

      const updatedSettings = {
        ...household.members[memberIndex].settings,
        ...settings
      };

      await firestore()
        .collection(this.householdsCollection)
        .doc(householdId)
        .update({
          [`members.${memberIndex}.settings`]: updatedSettings
        });
    } catch (error) {
      console.error('Error updating member settings:', error);
      throw new Error('Fehler beim Aktualisieren der Mitgliedereinstellungen');
    }
  }

  // Private Hilfsmethoden

  private isHouseholdAdmin(household: Household, userId: string): boolean {
    const member = household.members.find(m => m.userId === userId);
    return member?.role === 'admin';
  }

  private canManageLists(household: Household, userId: string): boolean {
    const member = household.members.find(m => m.userId === userId);
    return member?.role === 'admin' || member?.settings.listAccess === 'all';
  }

  /**
   * Aktualisiert den Namen eines Haushalts
   */
  public async updateHouseholdName(householdId: string, name: string): Promise<void> {
    try {
      const user = this.getCurrentUser();
      const household = await this.getHousehold(householdId);

      if (!this.isHouseholdAdmin(household, user.uid)) {
        throw new Error('Keine Berechtigung zum Ändern des Namens');
      }

      await firestore()
        .collection(this.householdsCollection)
        .doc(householdId)
        .update({ name });
    } catch (error) {
      console.error('Error updating household name:', error);
      throw new Error('Fehler beim Aktualisieren des Haushaltsnamens');
    }
  }

  /**
   * Überträgt die Admin-Rechte an ein anderes Mitglied
   */
  public async transferOwnership(householdId: string, newAdminId: string): Promise<void> {
    try {
      const user = this.getCurrentUser();
      const household = await this.getHousehold(householdId);

      if (!this.isHouseholdAdmin(household, user.uid)) {
        throw new Error('Keine Berechtigung zum Übertragen der Admin-Rechte');
      }

      const currentAdminIndex = household.members.findIndex(m => m.userId === user.uid);
      const newAdminIndex = household.members.findIndex(m => m.userId === newAdminId);

      if (newAdminIndex === -1) {
        throw new Error('Neuer Administrator nicht gefunden');
      }

      // Aktualisiere die Rollen
      await firestore().collection(this.householdsCollection).doc(householdId).update({
        [`members.${currentAdminIndex}.role`]: 'member',
        [`members.${newAdminIndex}.role`]: 'admin',
      });
    } catch (error) {
      console.error('Error transferring ownership:', error);
      throw new Error('Fehler beim Übertragen der Admin-Rechte');
    }
  }

  /**
   * Entfernt ein Mitglied aus dem Haushalt
   */
  public async removeMemberFromHousehold(householdId: string, memberId: string): Promise<void> {
    try {
      const user = this.getCurrentUser();
      const household = await this.getHousehold(householdId);

      if (!this.isHouseholdAdmin(household, user.uid)) {
        throw new Error('Keine Berechtigung zum Entfernen von Mitgliedern');
      }

      if (memberId === user.uid) {
        throw new Error('Sie können sich nicht selbst entfernen');
      }

      const updatedMembers = household.members.filter(m => m.userId !== memberId);

      await firestore()
        .collection(this.householdsCollection)
        .doc(householdId)
        .update({
          members: updatedMembers,
        });
    } catch (error) {
      console.error('Error removing member:', error);
      throw new Error('Fehler beim Entfernen des Mitglieds');
    }
  }

  /**
   * Löscht einen Haushalt
   */
  public async deleteHousehold(householdId: string): Promise<void> {
    try {
      const user = this.getCurrentUser();
      const household = await this.getHousehold(householdId);

      if (!this.isHouseholdAdmin(household, user.uid)) {
        throw new Error('Keine Berechtigung zum Löschen des Haushalts');
      }

      // Lösche alle geteilten Listen
      const deleteListPromises = household.sharedLists.map(shareId =>
        firestore().collection('shared_lists').doc(shareId).delete()
      );

      // Lösche alle Einladungen
      const deleteInvitationPromises = firestore()
        .collection(this.invitationsCollection)
        .where('householdId', '==', householdId)
        .get()
        .then(snapshot =>
          snapshot.docs.map(doc => doc.ref.delete())
        );

      // Warte auf alle Löschoperationen
      await Promise.all([
        ...deleteListPromises,
        deleteInvitationPromises,
        firestore().collection(this.householdsCollection).doc(householdId).delete(),
      ]);
    } catch (error) {
      console.error('Error deleting household:', error);
      throw new Error('Fehler beim Löschen des Haushalts');
    }
  }
}

export const householdService = HouseholdService.getInstance();