import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, SPREADSHEET_ID, SCOPES } from '../constants';
import { Commessa, Operatore, Cliente, FaseProduzione } from '../types';

let gapiInited = false;
let gapiInstance: any = null;

export const initGapi = async () => {
  if (gapiInited && (window as any).gapi) return true;

  return new Promise((resolve, reject) => {
    const initializeClient = () => {
      (window as any).gapi.load('client:auth2', async () => {
        try {
          await (window as any).gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            scope: SCOPES,
          });
          gapiInstance = (window as any).gapi.auth2.getAuthInstance();
          gapiInited = true;
          resolve(true);
        } catch (error) {
          console.error("Error initializing GAPI Client", error);
          reject(error);
        }
      });
    };

    if ((window as any).gapi) {
      initializeClient();
    } else {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = initializeClient;
      script.onerror = (e) => {
        console.error("Failed to load GAPI script", e);
        reject(new Error("Failed to load Google API script"));
      };
      document.body.appendChild(script);
    }
  });
};

export const signIn = async () => {
  if (!gapiInstance) await initGapi();
  return gapiInstance.signIn();
};

export const signOut = async () => {
  if (!gapiInstance) await initGapi();
  return gapiInstance.signOut();
};

export const isSignedIn = () => {
  return gapiInstance && gapiInstance.isSignedIn.get();
};

// --- DATA MAPPING HELPERS ---

const rowToCommessa = (row: any[]): Commessa => ({
    CommessaID: row[0],
    Codice: row[1],
    Cliente: row[2],
    Categoria: row[3],
    Priorita: parseInt(row[4] || '1'),
    DataStimataConsegna: row[5],
    OperatoreAssegnato: row[6],
    RepartoResponsabile: row[7],
    StatoAvanzamento: row[8],
    DataInserimento: row[9],
    DataPresaInCarico: row[10],
    DataFinePrevista: row[11],
    MaterialiMancanti: row[12],
    NoteTecniche: row[13],
    TempoStimatoOre: parseInt(row[14] || '0'),
    StatoCompletamento: row[15],
    ColoreCalcolato: row[16],
    Bloccata: row[17] === 'TRUE'
});

const commessaToRow = (c: Commessa) => [
    c.CommessaID, c.Codice, c.Cliente, c.Categoria, c.Priorita, c.DataStimataConsegna,
    c.OperatoreAssegnato, c.RepartoResponsabile, c.StatoAvanzamento, c.DataInserimento,
    c.DataPresaInCarico, c.DataFinePrevista, c.MaterialiMancanti, c.NoteTecniche,
    c.TempoStimatoOre, c.StatoCompletamento, c.ColoreCalcolato, c.Bloccata
];

const rowToOperatore = (row: any[]): Operatore => ({
    ID: parseInt(row[0]),
    Nome: row[1],
    Reparto: row[2] as any,
    Email: row[3],
    ColorePersonale: row[4],
    VisibileTempoStimato: row[5] as any
});

const operatoreToRow = (o: Operatore) => [o.ID, o.Nome, o.Reparto, o.Email, o.ColorePersonale, o.VisibileTempoStimato];

const rowToCliente = (row: any[]): Cliente => ({
    ID: row[0],
    Nome: row[1],
    Email: row[2],
    Telefono: row[3]
});

const clienteToRow = (c: Cliente) => [c.ID, c.Nome, c.Email, c.Telefono];

const rowToLog = (row: any[]): FaseProduzione => ({
    FaseID: row[0],
    CommessaID: row[1],
    Fase: row[2],
    DataInizio: row[3],
    DataFine: row[4],
    StatoFase: row[5],
    OperatoreCheAggiorna: row[6],
    NoteFase: row[7]
});

const logToRow = (l: FaseProduzione) => [
    l.FaseID, l.CommessaID, l.Fase, l.DataInizio, l.DataFine, l.StatoFase, l.OperatoreCheAggiorna, l.NoteFase
];

// --- API ACTIONS ---

export const fetchAllData = async () => {
    if (!isSignedIn()) {
      console.warn("Attempted to fetch data while not signed in.");
      return { commesse: [], operatori: [], clienti: [], logs: [] };
    }
    
    try {
      const ranges = ['Commesse!A2:R', 'Operatori!A2:F', 'Clienti!A2:D', 'Logs!A2:H'];
      const response = await (window as any).gapi.client.sheets.spreadsheets.values.batchGet({
          spreadsheetId: SPREADSHEET_ID,
          ranges: ranges
      });

      const valueRanges = response.result.valueRanges;

      return {
          commesse: (valueRanges[0].values || []).map(rowToCommessa),
          operatori: (valueRanges[1].values || []).map(rowToOperatore),
          clienti: (valueRanges[2].values || []).map(rowToCliente),
          logs: (valueRanges[3].values || []).map(rowToLog),
      };
    } catch (error) {
      console.error("Error fetching data from Sheets:", error);
      throw error;
    }
};

export const saveAllData = async (
    commesse: Commessa[], 
    operatori: Operatore[], 
    clienti: Cliente[], 
    logs: FaseProduzione[]
) => {
    if (!isSignedIn()) throw new Error("Utente non connesso a Google");

    const data = [
        { range: 'Commesse!A2:R', values: commesse.map(commessaToRow) },
        { range: 'Operatori!A2:F', values: operatori.map(operatoreToRow) },
        { range: 'Clienti!A2:D', values: clienti.map(clienteToRow) },
        { range: 'Logs!A2:H', values: logs.map(logToRow) },
    ];

    await (window as any).gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            valueInputOption: 'USER_ENTERED',
            data: data
        }
    });
};

export const initializeSheetHeaders = async () => {
    if (!isSignedIn()) throw new Error("Utente non connesso a Google");

    const headers = [
        { range: 'Commesse!A1:R1', values: [["CommessaID", "Codice", "Cliente", "Categoria", "Priorita", "DataStimataConsegna", "OperatoreAssegnato", "RepartoResponsabile", "StatoAvanzamento", "DataInserimento", "DataPresaInCarico", "DataFinePrevista", "MaterialiMancanti", "NoteTecniche", "TempoStimatoOre", "StatoCompletamento", "ColoreCalcolato", "Bloccata"]] },
        { range: 'Operatori!A1:F1', values: [["ID", "Nome", "Reparto", "Email", "ColorePersonale", "VisibileTempoStimato"]] },
        { range: 'Clienti!A1:D1', values: [["ID", "Nome", "Email", "Telefono"]] },
        { range: 'Logs!A1:H1', values: [["FaseID", "CommessaID", "Fase", "DataInizio", "DataFine", "StatoFase", "OperatoreCheAggiorna", "NoteFase"]] }
    ];

    await (window as any).gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        resource: {
            valueInputOption: 'USER_ENTERED',
            data: headers
        }
    });
}