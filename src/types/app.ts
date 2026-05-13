// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export interface Eintraege {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    titel?: string;
    beschreibung?: string;
    datum?: string; // Format: YYYY-MM-DD oder ISO String
  };
}

export interface Verknuepfungen {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    eintrag_referenz?: string; // applookup -> URL zu 'Eintraege' Record
    notizen?: string;
    status?: LookupValue;
  };
}

export const APP_IDS = {
  EINTRAEGE: '6a0452bf70744be84f3f782c',
  VERKNUEPFUNGEN: '6a0452c3153123bae8fd8592',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'verknuepfungen': {
    status: [{ key: "offen", label: "Offen" }, { key: "in_bearbeitung", label: "In Bearbeitung" }, { key: "abgeschlossen", label: "Abgeschlossen" }],
  },
};

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'eintraege': {
    'titel': 'string/text',
    'beschreibung': 'string/textarea',
    'datum': 'date/date',
  },
  'verknuepfungen': {
    'eintrag_referenz': 'applookup/select',
    'notizen': 'string/textarea',
    'status': 'lookup/select',
  },
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateEintraege = StripLookup<Eintraege['fields']>;
export type CreateVerknuepfungen = StripLookup<Verknuepfungen['fields']>;