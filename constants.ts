import { Operatore, Commessa, FaseProduzione, Cliente } from './types';

// --- GOOGLE SHEETS CONFIGURATION ---
export const GOOGLE_CLIENT_ID = "13220693196-frp4d7ddr8r1tdj81i800noa0a0d9dnn.apps.googleusercontent.com";
export const GOOGLE_API_KEY = "AIzaSyBYbMzvqmJB3PejNfmPytSuSQlYbwSwGaw"; 
export const SPREADSHEET_ID = "1swwFOSqJknUzQdnVX8QHHpS34c0b7MP5_hqCe90l1qc";
export const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// --- MOCK DATA (Fallback) ---
export const OPERATORI_DATA: Operatore[] = [
  { ID: 1, Nome: 'Tirrito', Reparto: 'Officina', ColorePersonale: 'Verde', VisibileTempoStimato: 'No', Email: 'produzione@aleasistemi.com' },
  { ID: 2, Nome: 'Catalin', Reparto: 'Officina', ColorePersonale: 'VerdeChiaro', VisibileTempoStimato: 'No', Email: 'produzione@aleasistemi.com' },
  { ID: 3, Nome: 'Invernizzi', Reparto: 'Officina', ColorePersonale: 'Lime', VisibileTempoStimato: 'No', Email: 'produzione@aleasistemi.com' },
  { ID: 4, Nome: 'Merolla', Reparto: 'Admin', ColorePersonale: 'VerdeScuro', VisibileTempoStimato: 'No', Email: 'info@aleasistemi.com' },
  { ID: 5, Nome: 'Meridda', Reparto: 'Magazzino', ColorePersonale: 'Blu', VisibileTempoStimato: 'No', Email: 'magazzino@aleasistemi.com' },
  { ID: 6, Nome: 'Conterno', Reparto: 'Magazzino', ColorePersonale: 'Azzurro', VisibileTempoStimato: 'No', Email: 'magazzino@aleasistemi.com' },
  { ID: 7, Nome: 'Ciancitto', Reparto: 'Magazzino', ColorePersonale: 'Celeste', VisibileTempoStimato: 'No', Email: 'magazzino@aleasistemi.com' },
  { ID: 8, Nome: 'Giacomelli', Reparto: 'Magazzino', ColorePersonale: 'BluScuro', VisibileTempoStimato: 'No', Email: 'magazzino@aleasistemi.com' },
  { ID: 9, Nome: 'Cravero', Reparto: 'Tecnico', ColorePersonale: 'Viola', VisibileTempoStimato: 'Sì', Email: 'tecnico@aleasistemi.com' },
  { ID: 10, Nome: 'Libero', Reparto: 'Tecnico', ColorePersonale: 'Fucsia', VisibileTempoStimato: 'Sì', Email: 'tecnico@aleasistemi.com' },
  { ID: 11, Nome: 'Rigano', Reparto: 'Commerciale', ColorePersonale: 'Arancione', VisibileTempoStimato: 'Sì', Email: 'commerciale@aleasistemi.com' },
  { ID: 12, Nome: 'Capriati F', Reparto: 'Admin', ColorePersonale: 'ArancioChiaro', VisibileTempoStimato: 'Sì', Email: 'info@aleasistemi.com' },
  { ID: 13, Nome: 'Capriati G', Reparto: 'Admin', ColorePersonale: 'Giallo', VisibileTempoStimato: 'Sì', Email: 'info@aleasistemi.com' },
  { ID: 14, Nome: 'Geracitano', Reparto: 'Commerciale', ColorePersonale: 'Oro', VisibileTempoStimato: 'Sì', Email: 'commerciale@aleasistemi.com' },
  { ID: 15, Nome: 'Casini', Reparto: 'Commerciale', ColorePersonale: 'Ambra', VisibileTempoStimato: 'Sì', Email: 'commerciale@aleasistemi.com' },
];

export const MOCK_CLIENTI: Cliente[] = [
  { ID: 'CL01', Nome: 'Ferrari SpA' },
  { ID: 'CL02', Nome: 'Barilla' },
  { ID: 'CL03', Nome: 'Stellantis' },
  { ID: 'CL04', Nome: 'Luxottica' }
];

export const MOCK_COMMESSE: Commessa[] = [
  {
    CommessaID: 'C001',
    Codice: 'JOB-2024-001',
    Cliente: 'Ferrari SpA',
    Categoria: 'Automotive',
    Priorita: 5,
    DataStimataConsegna: '2025-11-20',
    OperatoreAssegnato: 'Tirrito',
    RepartoResponsabile: 'Officina',
    StatoAvanzamento: 'In Corso',
    DataInserimento: '2025-10-01',
    DataPresaInCarico: '2025-11-10',
    DataFinePrevista: '2025-11-25',
    MaterialiMancanti: '',
    NoteTecniche: 'Attenzione alle tolleranze sul telaio.',
    TempoStimatoOre: 40,
    StatoCompletamento: 'Aperta',
    ColoreCalcolato: '#ef4444', 
    Bloccata: false,
  }
];

export const MOCK_LOGS: FaseProduzione[] = [];