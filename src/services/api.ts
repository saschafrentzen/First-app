import { ShoppingList, ShoppingItem, OfflineChange } from '../types/storage';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface SyncResponse {
  changes: OfflineChange[];
}

interface ServerChangesResponse {
  changes: OfflineChange[];
}

export class ApiService {
  private static instance: ApiService;
  private baseUrl: string;
  
  private constructor() {
    // TODO: Ersetzen Sie dies durch Ihre tatsächliche API-URL
    this.baseUrl = 'https://ihre-api.de/api';
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getAuthToken();
    return fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  }

  private async getAuthToken(): Promise<string> {
    // TODO: Implementieren Sie hier Ihre Auth-Token-Logik
    return 'ihr-auth-token';
  }

  async syncChanges(changes: OfflineChange[]): Promise<ApiResponse<OfflineChange[]>> {
    try {
      const response = await this.fetchWithAuth('/sync', {
        method: 'POST',
        body: JSON.stringify({ changes }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as SyncResponse;
      return {
        success: true,
        data: result.changes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler bei der Synchronisation',
      };
    }
  }

  async getServerChanges(lastSyncTimestamp: string): Promise<ApiResponse<OfflineChange[]>> {
    try {
      const response = await this.fetchWithAuth(
        `/changes?since=${encodeURIComponent(lastSyncTimestamp)}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as ServerChangesResponse;
      return {
        success: true,
        data: result.changes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Abrufen der Änderungen',
      };
    }
  }

  async createShoppingList(list: ShoppingList): Promise<ApiResponse<ShoppingList>> {
    try {
      const response = await this.fetchWithAuth('/lists', {
        method: 'POST',
        body: JSON.stringify(list),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as ShoppingList;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Erstellen der Liste',
      };
    }
  }

  async updateShoppingList(list: ShoppingList): Promise<ApiResponse<ShoppingList>> {
    try {
      const response = await this.fetchWithAuth(`/lists/${list.id}`, {
        method: 'PUT',
        body: JSON.stringify(list),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json() as ShoppingList;
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Aktualisieren der Liste',
      };
    }
  }

  async deleteShoppingList(listId: string): Promise<ApiResponse<void>> {
    try {
      const response = await this.fetchWithAuth(`/lists/${listId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unbekannter Fehler beim Löschen der Liste',
      };
    }
  }
}