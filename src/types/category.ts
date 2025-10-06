export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  parentCategory?: string;
  subCategories?: string[];
  path: string[];           // Vollständiger Pfad zur Kategorie
  level: number;           // Hierarchieebene
  tags: string[];          // Kategorie-Tags für bessere Organisierung
  metadata: {              // Erweiterte Metadaten
    description?: string;
    rules?: CategoryRule[];
    customFields?: Record<string, any>;
    translations?: {
      name: Record<string, string>;
      description?: Record<string, string>;
    };
    importedFrom?: {
      template: string;
      language: string;
      date: string;
    };
  };
  permissions: {           // Berechtigungssystem
    owner: string;
    sharedWith: string[];
    public: boolean;
    role: 'admin' | 'editor' | 'viewer';
  };
  status: 'active' | 'archived';  // Archivierungsstatus
  createdAt: string;
  lastModified: string;
  createdBy: string;
  modifiedBy: string;
}

export interface CategoryRule {
  id: string;
  name: string;
  condition: {
    field: string;
    operator: 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'regex';
    value: string;
  };
  priority: number;
  isActive: boolean;
  createdAt: string;
}