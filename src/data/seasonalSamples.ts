import { SeasonalFood, SeasonalTip } from '../types/seasonal';

export const sampleSeasonalFoods: SeasonalFood[] = [
  {
    id: 'food_1',
    name: 'Kürbis',
    category: 'vegetable',
    season: {
      start: 9,  // September
      peak: [10, 11],  // Oktober, November
      end: 12,  // Dezember
    },
    nutritionalHighlights: [
      {
        nutrient: 'Vitamin A',
        quality: 'high',
        description: 'Reich an Beta-Carotin, gut für Augen und Immunsystem'
      },
      {
        nutrient: 'Ballaststoffe',
        quality: 'high',
        description: 'Unterstützt die Verdauung'
      },
      {
        nutrient: 'Kalium',
        quality: 'medium',
        description: 'Wichtig für Herz und Muskelfunktion'
      }
    ],
    storageInfo: {
      methods: ['room', 'refrigerator'],
      maxDuration: {
        value: 3,
        unit: 'months'
      },
      tips: [
        'Kühl, trocken und dunkel lagern',
        'Angeschnittene Stücke in Folie im Kühlschrank aufbewahren',
        'Auf Druckstellen prüfen vor der Lagerung'
      ]
    },
    preparation: {
      methods: [
        'Suppe',
        'Backen',
        'Dämpfen',
        'Braten'
      ],
      tips: [
        'Vor der Zubereitung Kerne entfernen',
        'Schale kann bei vielen Sorten mitgegessen werden',
        'In gleichmäßige Stücke schneiden für gleichmäßiges Garen'
      ]
    },
    alternatives: ['Süßkartoffel', 'Möhren'],
    image: 'https://example.com/pumpkin.jpg'
  },
  {
    id: 'food_2',
    name: 'Grünkohl',
    category: 'vegetable',
    season: {
      start: 11,  // November
      peak: [12, 1, 2],  // Dezember, Januar, Februar
      end: 3,  // März
    },
    nutritionalHighlights: [
      {
        nutrient: 'Vitamin C',
        quality: 'high',
        description: 'Stärkt das Immunsystem'
      },
      {
        nutrient: 'Eisen',
        quality: 'high',
        description: 'Wichtig für die Blutbildung'
      },
      {
        nutrient: 'Calcium',
        quality: 'medium',
        description: 'Gut für Knochen und Zähne'
      }
    ],
    storageInfo: {
      methods: ['refrigerator'],
      maxDuration: {
        value: 5,
        unit: 'days'
      },
      tips: [
        'In feuchtem Küchenpapier einwickeln',
        'Im Gemüsefach aufbewahren',
        'Nicht waschen vor der Lagerung'
      ]
    },
    preparation: {
      methods: [
        'Kochen',
        'Dämpfen',
        'Smoothie',
        'Chips'
      ],
      tips: [
        'Blätter von den Stielen entfernen',
        'Nach Frost ernten für besseren Geschmack',
        'Mit Olivenöl massieren für Salate'
      ]
    },
    alternatives: ['Wirsing', 'Spinat'],
    image: 'https://example.com/kale.jpg'
  },
  {
    id: 'food_3',
    name: 'Äpfel',
    category: 'fruit',
    season: {
      start: 8,  // August
      peak: [9, 10],  // September, Oktober
      end: 11,  // November
    },
    nutritionalHighlights: [
      {
        nutrient: 'Ballaststoffe',
        quality: 'high',
        description: 'Gut für die Verdauung'
      },
      {
        nutrient: 'Antioxidantien',
        quality: 'high',
        description: 'Schützen vor freien Radikalen'
      },
      {
        nutrient: 'Vitamin C',
        quality: 'medium',
        description: 'Unterstützt das Immunsystem'
      }
    ],
    storageInfo: {
      methods: ['refrigerator', 'room'],
      maxDuration: {
        value: 2,
        unit: 'months'
      },
      tips: [
        'Kühl und dunkel lagern',
        'Von anderen Früchten getrennt aufbewahren',
        'Regelmäßig auf faule Stellen prüfen'
      ]
    },
    preparation: {
      methods: [
        'Roh essen',
        'Backen',
        'Kompott',
        'Smoothie'
      ],
      tips: [
        'Vor dem Essen waschen',
        'Kerngehäuse entfernen',
        'Für Kuchen in gleichmäßige Scheiben schneiden'
      ]
    },
    alternatives: ['Birnen', 'Quitten'],
    image: 'https://example.com/apples.jpg'
  }
];

export const sampleSeasonalTips: SeasonalTip[] = [
  {
    id: 'tip_1',
    title: 'Wintergemüse richtig lagern',
    description: 'Kohl, Kürbis und Wurzelgemüse können bei richtiger Lagerung mehrere Monate frisch bleiben. Ein kühler, dunkler Keller oder die Garage sind ideal. Regelmäßige Kontrolle auf Fäulnis ist wichtig.',
    applicableMonths: [10, 11, 12, 1, 2],  // Oktober bis Februar
    category: 'storage',
    relatedFoods: ['food_1', 'food_2'],
    importance: 'high',
    metadata: {
      createdAt: '2025-10-06T10:00:00Z',
      lastModified: '2025-10-06T10:00:00Z'
    }
  },
  {
    id: 'tip_2',
    title: 'Saisonale Vitaminbooster',
    description: 'Grünkohl und andere Wintergemüse sind natürliche Vitaminbomben. Schonende Zubereitung und frische Verarbeitung maximieren den Nährwert. Kombinieren Sie verschiedene Gemüsesorten für optimale Nährstoffaufnahme.',
    applicableMonths: [11, 12, 1, 2],  // November bis Februar
    category: 'nutrition',
    relatedFoods: ['food_2'],
    importance: 'medium',
    metadata: {
      createdAt: '2025-10-06T10:00:00Z',
      lastModified: '2025-10-06T10:00:00Z'
    }
  },
  {
    id: 'tip_3',
    title: 'Herbstäpfel optimal verwerten',
    description: 'Herbstäpfel eignen sich hervorragend zum Einkochen und für Kompott. Leicht beschädigte Äpfel sollten zeitnah verarbeitet werden. Gesunde Früchte können bei kühler Lagerung mehrere Monate halten.',
    applicableMonths: [9, 10, 11],  // September bis November
    category: 'preparation',
    relatedFoods: ['food_3'],
    importance: 'medium',
    metadata: {
      createdAt: '2025-10-06T10:00:00Z',
      lastModified: '2025-10-06T10:00:00Z'
    }
  },
  {
    id: 'tip_4',
    title: 'Nachhaltiger Einkauf im Herbst',
    description: 'Kürbisse und Äpfel aus regionalem Anbau haben kurze Transportwege und unterstützen lokale Bauern. Achten Sie auf Bioqualität und kaufen Sie wenn möglich direkt vom Erzeuger.',
    applicableMonths: [9, 10, 11],  // September bis November
    category: 'shopping',
    relatedFoods: ['food_1', 'food_3'],
    importance: 'high',
    metadata: {
      createdAt: '2025-10-06T10:00:00Z',
      lastModified: '2025-10-06T10:00:00Z'
    }
  }
];