export interface SummaryData {
  potentiel: number;
  annote: number;
  confirme: number;
  fausse: number;
  
  // Aliases for chart components
  yellow: number;
  orange: number;
  red: number;
  gray: number;
}

export interface TableRow {
  _type: string;
  date: string;
  operateur: string;
  aref: string;
  ville: string;
  lycee: string;
  salle: string;
  matiere: string;
  verificateur_name: string;
  cne: string;
  status: string;
  [key: string]: any; // For any other properties
}

export interface CardConfigItem {
  key: string;
  label: string;
  color: string;
  glow: string;
  icon: string;
}
