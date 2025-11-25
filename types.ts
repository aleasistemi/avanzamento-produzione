export interface Operatore {
  ID: number;
  Nome: string;
  Reparto: 'Officina' | 'Admin' | 'Magazzino' | 'Tecnico' | 'Commerciale';
  ColorePersonale: string;
  VisibileTempoStimato: 'Sì' | 'No';
  Email: string;
}

export interface Cliente {
  ID: string;
  Nome: string;
  Email?: string;
  Telefono?: string;
}

export interface Commessa {
  CommessaID: string;
  Codice: string;
  Cliente: string;
  Categoria: string;
  Priorita: number; // 1-5
  DataStimataConsegna: string; // YYYY-MM-DD
  OperatoreAssegnato: string;
  RepartoResponsabile: string;
  StatoAvanzamento: 'Preventivo' | 'In Corso' | 'Materiali Mancanti' | 'Taglio' | 'Lavorazioni' | 'Montaggio' | 'Spedizione' | 'Ritiro' | 'Completata';
  DataInserimento: string;
  DataPresaInCarico: string;
  DataFinePrevista: string;
  MaterialiMancanti: string;
  NoteTecniche: string;
  TempoStimatoOre: number;
  StatoCompletamento: 'Aperta' | 'Completata';
  ColoreCalcolato: string;
  Bloccata: boolean;
}

export interface FaseProduzione {
  FaseID: string;
  CommessaID: string;
  Fase: string; // StatoAvanzamento
  DataInizio: string; // Timestamp ISO
  DataFine?: string;
  StatoFase?: string;
  OperatoreCheAggiorna: string;
  NoteFase?: string;
}

// AI Action Response Schema
export type ActionType = 'update_commessa' | 'create_fase' | 'list_commesse' | 'get_calendar' | 'prendi_in_carico' | 'add_note' | 'unknown';

export interface AIResponse {
  action: ActionType;
  status: 'ok' | 'error';
  message: string;
  payload?: any;
}