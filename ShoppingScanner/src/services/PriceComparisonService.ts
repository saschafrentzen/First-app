import firestore, { GeoPoint } from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { notificationService } from './NotificationService';
import {
  PriceReport,
  Store,
  PriceHistory,
  PriceDispute,
  PriceAlert,
  PriceTrend,
  CommunityTrust,
  ServiceResponse,
  DisputeReason,
  SortOption
} from '@app/types';

class PriceComparisonService {
  private static instance: PriceComparisonService;
  private readonly priceReportsCollection = 'price_reports';
  private readonly storesCollection = 'stores';
  private readonly priceDisputesCollection = 'price_disputes';
  private readonly priceAlertsCollection = 'price_alerts';
  private readonly userTrustCollection = 'user_trust';

  private constructor() {}

  public static getInstance(): PriceComparisonService {
    if (!PriceComparisonService.instance) {
      PriceComparisonService.instance = new PriceComparisonService();
    }
    return PriceComparisonService.instance;
  }

  private getCurrentUser() {
    const user = auth().currentUser;
    if (!user) throw new Error('Nicht authentifiziert');
    return user;
  }

  /**
   * Meldet einen neuen Preis für ein Produkt
   */
  public async reportPrice(
    productId: string,
    storeId: string,
    price: number,
    location: GeoPoint,
    data: {
      currency?: string;
      imageUrl?: string;
      quantity?: number;
      unit?: string;
      validUntil?: string;
      isSpecialOffer?: boolean;
    }
  ): Promise<ServiceResponse<string>> {
    try {
      const user = this.getCurrentUser();
      
      // Prüfe, ob der Store existiert
      const storeDoc = await firestore().collection(this.storesCollection).doc(storeId).get();
      if (!storeDoc.exists) {
        return { success: false, error: 'Geschäft nicht gefunden' };
      }

      const reportId = `price_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const report: PriceReport = {
        reportId,
        productId,
        storeId,
        price,
        currency: data.currency || 'EUR',
        reportedBy: user.uid,
        reportedAt: new Date().toISOString(),
        location,
        imageUrl: data.imageUrl,
        quantity: data.quantity || 1,
        unit: data.unit || 'Stück',
        validUntil: data.validUntil || '',
        isSpecialOffer: data.isSpecialOffer || false,
        trustScore: 0, // Wird später berechnet
        verifiedByUsers: [],
        disputedByUsers: [],
        status: 'pending'
      };

      await firestore().collection(this.priceReportsCollection).doc(reportId).set(report);
      
      // Aktualisiere die Preishistorie
      await this.updatePriceHistory(productId, storeId, report);

      // Überprüfe Preisalarme
      await this.checkPriceAlerts(productId, price, location);

      return { success: true, data: reportId };
    } catch (error) {
      console.error('Error reporting price:', error);
      return {
        success: false,
        error: 'Fehler beim Melden des Preises',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Verifiziert eine Preismeldung
   */
  public async verifyPriceReport(reportId: string): Promise<ServiceResponse<void>> {
    try {
      const user = this.getCurrentUser();
      
      const reportDoc = await firestore()
        .collection(this.priceReportsCollection)
        .doc(reportId)
        .get();

      if (!reportDoc.exists) {
        return { success: false, error: 'Preismeldung nicht gefunden' };
      }

      const report = reportDoc.data() as PriceReport;
      
      if (report.reportedBy === user.uid) {
        return { success: false, error: 'Eigene Preismeldungen können nicht verifiziert werden' };
      }

      if (report.verifiedByUsers.includes(user.uid)) {
        return { success: false, error: 'Bereits verifiziert' };
      }

      const updatedVerifiedByUsers = [...report.verifiedByUsers, user.uid];
      const updatedTrustScore = this.calculateTrustScore(
        updatedVerifiedByUsers.length,
        report.disputedByUsers.length
      );

      await firestore().collection(this.priceReportsCollection).doc(reportId).update({
        verifiedByUsers: updatedVerifiedByUsers,
        trustScore: updatedTrustScore,
        status: updatedTrustScore >= 70 ? 'verified' : 'pending'
      });

      // Aktualisiere den Community Trust Score des Melders
      await this.updateUserTrustScore(report.reportedBy);

      return { success: true };
    } catch (error) {
      console.error('Error verifying price report:', error);
      return {
        success: false,
        error: 'Fehler beim Verifizieren der Preismeldung',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Meldet eine Preismeldung als fehlerhaft
   */
  public async disputePriceReport(
    reportId: string,
    reason: DisputeReason,
    comment?: string,
    imageUrl?: string
  ): Promise<ServiceResponse<string>> {
    try {
      const user = this.getCurrentUser();
      
      const reportDoc = await firestore()
        .collection(this.priceReportsCollection)
        .doc(reportId)
        .get();

      if (!reportDoc.exists) {
        return { success: false, error: 'Preismeldung nicht gefunden' };
      }

      const report = reportDoc.data() as PriceReport;
      
      if (report.reportedBy === user.uid) {
        return { success: false, error: 'Eigene Preismeldungen können nicht beanstandet werden' };
      }

      if (report.disputedByUsers.includes(user.uid)) {
        return { success: false, error: 'Bereits beanstandet' };
      }

      const disputeId = `dispute_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const dispute: PriceDispute = {
        disputeId,
        reportId,
        reportedBy: user.uid,
        reportedAt: new Date().toISOString(),
        reason,
        comment,
        imageUrl,
        status: 'open'
      };

      await firestore().collection(this.priceDisputesCollection).doc(disputeId).set(dispute);

      const updatedDisputedByUsers = [...report.disputedByUsers, user.uid];
      const updatedTrustScore = this.calculateTrustScore(
        report.verifiedByUsers.length,
        updatedDisputedByUsers.length
      );

      await firestore().collection(this.priceReportsCollection).doc(reportId).update({
        disputedByUsers: updatedDisputedByUsers,
        trustScore: updatedTrustScore,
        status: updatedTrustScore < 30 ? 'disputed' : report.status
      });

      // Aktualisiere den Community Trust Score des Melders
      await this.updateUserTrustScore(report.reportedBy);

      return { success: true, data: disputeId };
    } catch (error) {
      console.error('Error disputing price report:', error);
      return {
        success: false,
        error: 'Fehler beim Beanstanden der Preismeldung',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Erstellt einen Preisalarm
   */
  public async createPriceAlert(
    productId: string,
    maxPrice: number,
    options?: {
      storeIds?: string[];
      minPrice?: number;
      radius?: number;
      location?: GeoPoint;
      notificationFrequency?: 'immediately' | 'daily' | 'weekly';
    }
  ): Promise<ServiceResponse<string>> {
    try {
      const user = this.getCurrentUser();
      
      const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      // Hole den Produktnamen aus der Firestore
      const productDoc = await firestore().collection('products').doc(productId).get();
      if (!productDoc.exists) {
        return { success: false, error: 'Produkt nicht gefunden' };
      }
      const productData = productDoc.data();
      
      const alert: PriceAlert = {
        alertId,
        userId: user.uid,
        productId,
        productName: productData?.name || 'Unbekanntes Produkt',
        maxPrice,
        storeIds: options?.storeIds,
        minPrice: options?.minPrice,
        radius: options?.radius,
        location: options?.location,
        isActive: true,
        createdAt: new Date().toISOString(),
        notificationFrequency: options?.notificationFrequency || 'immediately'
      };

      await firestore().collection(this.priceAlertsCollection).doc(alertId).set(alert);

      return { success: true, data: alertId };
    } catch (error) {
      console.error('Error creating price alert:', error);
      return {
        success: false,
        error: 'Fehler beim Erstellen des Preisalarms',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Lädt die Preishistorie eines Produkts
   */
  public async getPriceHistory(
    productId: string,
    storeId?: string,
    days: number = 30
  ): Promise<ServiceResponse<PriceHistory>> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let query = firestore()
        .collection(this.priceReportsCollection)
        .where('productId', '==', productId)
        .where('reportedAt', '>=', startDate.toISOString())
        .where('status', 'in', ['verified', 'pending']);

      if (storeId) {
        query = query.where('storeId', '==', storeId);
      }

      const snapshot = await query.get();
      const reports = snapshot.docs.map(doc => doc.data() as PriceReport);

      const prices = reports.map(report => ({
        price: report.price,
        date: report.reportedAt,
        reportId: report.reportId,
        isVerified: report.status === 'verified',
        isSpecialOffer: report.isSpecialOffer
      }));

      const validPrices = prices.filter(p => !p.isSpecialOffer);
      const priceValues = validPrices.map(p => p.price);

      const history: PriceHistory = {
        productId,
        storeId: storeId || '',
        prices: prices.sort((a, b) => a.date.localeCompare(b.date)),
        averagePrice: priceValues.reduce((a, b) => a + b, 0) / priceValues.length,
        minPrice: Math.min(...priceValues),
        maxPrice: Math.max(...priceValues),
        lastUpdate: new Date().toISOString(),
        reliability: this.calculateHistoryReliability(prices)
      };

      return { success: true, data: history };
    } catch (error) {
      console.error('Error getting price history:', error);
      return {
        success: false,
        error: 'Fehler beim Laden der Preishistorie',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }

  /**
   * Aktualisiert den Community Trust Score eines Benutzers
   */
  private async updateUserTrustScore(userId: string): Promise<void> {
    const reportDocs = await firestore()
      .collection(this.priceReportsCollection)
      .where('reportedBy', '==', userId)
      .get();

    const reports = reportDocs.docs.map(doc => doc.data() as PriceReport);
    
    let totalVerifications = 0;
    let totalDisputes = 0;

    reports.forEach(report => {
      totalVerifications += report.verifiedByUsers.length;
      totalDisputes += report.disputedByUsers.length;
    });

    const trustScore = this.calculateUserTrustScore(
      reports.length,
      totalVerifications,
      totalDisputes
    );

    const communityTrust: CommunityTrust = {
      userId,
      trustScore,
      verifiedReports: reports.filter(r => r.status === 'verified').length,
      disputedReports: reports.filter(r => r.status === 'disputed').length,
      totalReports: reports.length,
      memberSince: reports[0]?.reportedAt || new Date().toISOString(),
      badges: this.calculateUserBadges(reports.length, trustScore),
      lastActivity: new Date().toISOString()
    };

    await firestore()
      .collection(this.userTrustCollection)
      .doc(userId)
      .set(communityTrust, { merge: true });
  }

  /**
   * Berechnet den Trust Score einer Preismeldung
   */
  private calculateTrustScore(verifications: number, disputes: number): number {
    const baseScore = 50;
    const verificationWeight = 10;
    const disputeWeight = 15;

    const score = baseScore +
      (verifications * verificationWeight) -
      (disputes * disputeWeight);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Berechnet den Community Trust Score eines Benutzers
   */
  private calculateUserTrustScore(
    totalReports: number,
    totalVerifications: number,
    totalDisputes: number
  ): number {
    const baseScore = 40;
    const reportWeight = 2;
    const verificationWeight = 5;
    const disputeWeight = 8;

    const score = baseScore +
      (totalReports * reportWeight) +
      (totalVerifications * verificationWeight) -
      (totalDisputes * disputeWeight);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Berechnet die Zuverlässigkeit einer Preishistorie
   */
  private calculateHistoryReliability(prices: PriceHistory['prices']): number {
    const verifiedPrices = prices.filter(p => p.isVerified).length;
    const totalPrices = prices.length;

    if (totalPrices === 0) return 0;

    const verificationRate = (verifiedPrices / totalPrices) * 100;
    return Math.round(verificationRate);
  }

  /**
   * Berechnet die Badges eines Benutzers
   */
  private calculateUserBadges(totalReports: number, trustScore: number): CommunityTrust['badges'] {
    const badges: CommunityTrust['badges'] = [];

    // Beispiel-Badges (können erweitert werden)
    if (totalReports >= 100) {
      badges.push({
        id: 'centurion',
        name: 'Centurion',
        description: '100 Preismeldungen erreicht',
        iconUrl: 'badges/centurion.png',
        earnedAt: new Date().toISOString(),
        level: 'gold'
      });
    } else if (totalReports >= 50) {
      badges.push({
        id: 'veteran',
        name: 'Veteran',
        description: '50 Preismeldungen erreicht',
        iconUrl: 'badges/veteran.png',
        earnedAt: new Date().toISOString(),
        level: 'silver'
      });
    } else if (totalReports >= 10) {
      badges.push({
        id: 'reporter',
        name: 'Reporter',
        description: '10 Preismeldungen erreicht',
        iconUrl: 'badges/reporter.png',
        earnedAt: new Date().toISOString(),
        level: 'bronze'
      });
    }

    if (trustScore >= 90) {
      badges.push({
        id: 'trusted',
        name: 'Vertrauenswürdig',
        description: 'Sehr hoher Trust Score erreicht',
        iconUrl: 'badges/trusted.png',
        earnedAt: new Date().toISOString(),
        level: 'platinum'
      });
    }

    return badges;
  }

  /**
   * Aktualisiert die Preishistorie
   */
  private async updatePriceHistory(
    productId: string,
    storeId: string,
    newReport: PriceReport
  ): Promise<void> {
    const historyDoc = await firestore()
      .collection('price_histories')
      .doc(`${productId}_${storeId}`)
      .get();

    const existingHistory = historyDoc.data() as PriceHistory | undefined;
    const newPrice = {
      price: newReport.price,
      date: newReport.reportedAt,
      reportId: newReport.reportId,
      isVerified: false,
      isSpecialOffer: newReport.isSpecialOffer
    };

    if (!existingHistory) {
      const newHistory: PriceHistory = {
        productId,
        storeId,
        prices: [newPrice],
        averagePrice: newReport.price,
        minPrice: newReport.price,
        maxPrice: newReport.price,
        lastUpdate: new Date().toISOString(),
        reliability: 0
      };

      await firestore()
        .collection('price_histories')
        .doc(`${productId}_${storeId}`)
        .set(newHistory);
    } else {
      const updatedPrices = [...existingHistory.prices, newPrice]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-100); // Behalte nur die letzten 100 Preise

      const validPrices = updatedPrices
        .filter(p => !p.isSpecialOffer)
        .map(p => p.price);

      const updatedHistory: PriceHistory = {
        ...existingHistory,
        prices: updatedPrices,
        averagePrice: validPrices.reduce((a, b) => a + b, 0) / validPrices.length,
        minPrice: Math.min(...validPrices),
        maxPrice: Math.max(...validPrices),
        lastUpdate: new Date().toISOString(),
        reliability: this.calculateHistoryReliability(updatedPrices)
      };

      await firestore()
        .collection('price_histories')
        .doc(`${productId}_${storeId}`)
        .set(updatedHistory);
    }
  }

  /**
   * Überprüft Preisalarme
   */
  private async checkPriceAlerts(
    productId: string,
    newPrice: number,
    location: GeoPoint
  ): Promise<void> {
    const alertsSnapshot = await firestore()
      .collection(this.priceAlertsCollection)
      .where('productId', '==', productId)
      .where('isActive', '==', true)
      .get();

    const alerts = alertsSnapshot.docs.map(doc => {
      const data = doc.data() as PriceAlert;
      return { ...data, alertId: doc.id };
    });

    const storesCache = new Map<string, Store>();

    for (const alert of alerts) {
      if (newPrice <= alert.maxPrice &&
          (!alert.minPrice || newPrice >= alert.minPrice)) {
        
        // Prüfe Standort, falls erforderlich
        if (alert.radius && alert.location) {
          const distance = this.calculateDistance(
            alert.location.latitude,
            alert.location.longitude,
            location.latitude,
            location.longitude
          );

          if (distance > alert.radius) continue;
        }

        // Hole Store-Informationen
        // Wenn storeIds definiert ist, prüfe nur die angegebenen Stores
        if (alert.storeIds && alert.storeIds.length > 0) {
          for (const storeId of alert.storeIds) {
            const storeDoc = await firestore()
              .collection(this.storesCollection)
              .doc(storeId)
              .get();
            if (!storeDoc.exists) continue;

            const store = storeDoc.data() as Store;
            storesCache.set(storeDoc.id, store);

            // Sende Benachrichtigung
            if (alert.notificationFrequency === 'immediately') {
              await notificationService.sendPriceFoundNotification(
                alert.alertId,
                alert.productName,
                newPrice,
                store.name,
                `${store.address.street}, ${store.address.postalCode} ${store.address.city}`
              );

              // Aktualisiere den Alarm
              await firestore()
                .collection(this.priceAlertsCollection)
                .doc(alert.alertId)
                .update({
                  lastPriceFound: newPrice,
                  lastPriceFoundAt: new Date().toISOString(),
                  lastPriceFoundStoreId: storeDoc.id,
                });
            }
          }
        } else {
          // Wenn keine spezifischen Stores angegeben sind, prüfe alle
          const storeDoc = await firestore()
            .collection(this.storesCollection)
            .where('location', '<=', newPrice)
            .get();

          for (const doc of storeDoc.docs) {
            const store = doc.data() as Store;
            storesCache.set(doc.id, store);

            // Sende Benachrichtigung
            if (alert.notificationFrequency === 'immediately') {
              await notificationService.sendPriceFoundNotification(
                alert.alertId,
                alert.productName,
                newPrice,
                store.name,
                `${store.address.street}, ${store.address.postalCode} ${store.address.city}`
              );

              // Aktualisiere den Alarm
              await firestore()
                .collection(this.priceAlertsCollection)
                .doc(alert.alertId)
                .update({
                  lastPriceFound: newPrice,
                  lastPriceFoundAt: new Date().toISOString(),
                  lastPriceFoundStoreId: doc.id,
                });
            }
          }
        }
      }
    }
  }

  /**
   * Berechnet die Entfernung zwischen zwei Koordinaten in km
   */
  public calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Erdradius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Sucht Preismeldungen mit den angegebenen Filtern
   */
  public async searchPriceReports(query: {
    productId: string;
    location: GeoPoint;
    radius: number;
    minPrice?: number;
    maxPrice?: number;
    onlyVerified?: boolean;
    includeSpecialOffers?: boolean;
    minTrustScore?: number;
    sortBy?: SortOption;
  }): Promise<ServiceResponse<{ reports: PriceReport[]; stores: { [key: string]: Store } }>> {
    try {
      // Hole alle relevanten Preismeldungen
      let reportsQuery = firestore()
        .collection(this.priceReportsCollection)
        .where('productId', '==', query.productId);

      if (query.onlyVerified) {
        reportsQuery = reportsQuery.where('status', '==', 'verified');
      } else {
        reportsQuery = reportsQuery.where('status', 'in', ['verified', 'pending']);
      }

      if (!query.includeSpecialOffers) {
        reportsQuery = reportsQuery.where('isSpecialOffer', '==', false);
      }

      if (query.minTrustScore) {
        reportsQuery = reportsQuery.where('trustScore', '>=', query.minTrustScore);
      }

      const snapshot = await reportsQuery.get();
      let reports = snapshot.docs.map(doc => doc.data() as PriceReport);

      // Filtere nach Preis
      if (query.minPrice !== undefined) {
        reports = reports.filter(report => report.price >= query.minPrice!);
      }
      if (query.maxPrice !== undefined) {
        reports = reports.filter(report => report.price <= query.maxPrice!);
      }

      // Lade Store-Informationen
      const storeIds = [...new Set(reports.map(r => r.storeId))];
      const storesSnapshot = await firestore()
        .collection(this.storesCollection)
        .where(firestore.FieldPath.documentId(), 'in', storeIds)
        .get();

      const stores: { [key: string]: Store } = {};
      storesSnapshot.docs.forEach(doc => {
        stores[doc.id] = {
          id: doc.id,
          ...doc.data(),
        } as Store;
      });

      // Filtere nach Entfernung
      reports = reports.filter(report => {
        const store = stores[report.storeId];
        if (!store) return false;

        const distance = this.calculateDistance(
          query.location.latitude,
          query.location.longitude,
          store.location.latitude,
          store.location.longitude
        );

        return distance <= query.radius;
      });

      // Sortiere die Ergebnisse
      switch (query.sortBy) {
        case 'price_asc':
          reports.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          reports.sort((a, b) => b.price - a.price);
          break;
        case 'distance':
          reports.sort((a, b) => {
            const storeA = stores[a.storeId];
            const storeB = stores[b.storeId];
            if (!storeA || !storeB) return 0;

            const distanceA = this.calculateDistance(
              query.location.latitude,
              query.location.longitude,
              storeA.location.latitude,
              storeA.location.longitude
            );
            const distanceB = this.calculateDistance(
              query.location.latitude,
              query.location.longitude,
              storeB.location.latitude,
              storeB.location.longitude
            );

            return distanceA - distanceB;
          });
          break;
        case 'trust':
          reports.sort((a, b) => b.trustScore - a.trustScore);
          break;
      }

      return { success: true, data: { reports, stores } };
    } catch (error) {
      console.error('Error searching price reports:', error);
      return {
        success: false,
        error: 'Fehler beim Suchen der Preismeldungen',
        details: error instanceof Error ? error.message : undefined
      };
    }
  }
}

export const priceComparisonService = PriceComparisonService.getInstance();