import type { Verknuepfungen } from './app';

export type EnrichedVerknuepfungen = Verknuepfungen & {
  eintrag_referenzName: string;
};
