
import { GOOGLE_CLIENT_ID, GOOGLE_API_KEY, SPREADSHEET_ID, SCOPES } from '../constants';
import { Commessa, Operatore, Cliente, FaseProduzione } from '../types';

// Global state for API clients
let tokenClient: any;
let accessToken: string | null = null;
let gapiInited = false;
let gisInited = false;

/**
 * Loads the Google Identity Services script dynamically
 */
const loadGisScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.accounts) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error("Failed to load GIS script"));
    document.body.appendChild(script);
  });
};

/**
 * Loads the Google API script dynamically
 */
const loadGapiScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).gapi) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = (e) => reject(new Error("Failed to load GAPI script"));
    document.body.appendChild(script);
  });
};

/**
 * Initialize both GAPI (for requests) and GIS (for auth)
 */
export const initGapi = async () => {
  if (gapiInited && gisInited) return true;

  try {
    // 1. Load Scripts
    await Promise.all([loadGapiScript(), loadGisScript()]);

    // 2. Initialize GAPI Client (Requests only, NO AUTH here)
    await new Promise<void>((resolve, reject) => {
      (window as any).gapi.load('client', async () => {
        try {
          await (window as any).gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
            // Adding plugin_name back as it sometimes fixes obscure init errors
            plugin_name: "AleaManager" 
          });
          gapiInited = true;
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });

    // 3. Initialize GIS Token Client (Auth only)
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        if (tokenResponse && tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
        }
      },
    });
    gisInited = true;
    
    // Check if we have a stored token in localStorage to restore session
    const storedToken = localStorage.getItem('google_access_token');
    if (storedToken) {
        // We can't validate it easily without a call, but we set it optimistically
        (window as any).gapi.client.setToken({ access_token: storedToken });
        accessToken = storedToken;
    }

    return true;
  } catch (error) {
    console.error("Initialization Error:", error);
    throw error;
  }
};

/**
 * Triggers the Google Login Popup using the new GIS library
 */
export const signIn = async (): Promise<void> => {
  if (!gisInited || !tokenClient) await initGapi();

  return new Promise((resolve, reject) => {
    try {
      tokenClient.callback = (resp: any) => {
        if (resp.error) {
          reject(resp);
          return;
        }
        accessToken = resp.access_token;
        localStorage.setItem('google_access_token', accessToken!);
        (window as any).gapi.client.setToken(resp);
        resolve();
      };
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (e) {
      reject(e);
    }
  });
};

export const signOut = async () => {
  const token = (window as any).gapi?.client?.getToken();
  if (token !== null) {
    (window as any).google.accounts.oauth2.revoke(token.access_token, () => {
      console.log('Revoked: ' + token.access_token);
      (window as any).gapi.client.setToken('');
      accessToken = null;
      localStorage.removeItem('google_access_token');
    });
  }
};

export const isSignedIn = () => {
  return !!accessToken;
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
    c.TempoStimatoOre, c.StatoCompletamento, c.ColoreCalcolato, c.Bloccata ? 'TRUE' : 'FALSE'
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
    if (!gapiInited) await initGapi();
    
    // Refresh token check
    if (accessToken && !(window as any).gapi.client.getToken()) {
        (window as any).gapi.client.setToken({ access_token: accessToken });
    }

    if (!accessToken) {
      console.warn("User not signed in, skipping fetch.");
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
    } catch (error: any) {
      if (error.result?.error?.code === 401 || error.result?.error?.status === 'UNAUTHENTICATED') {
          console.log("Token expired, clearing session.");
          localStorage.removeItem('google_access_token');
          accessToken = null;
          throw new Error("Sessione scaduta. Riconnetti Google Drive.");
      }
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
    if (!accessToken) throw new Error("Utente non connesso a Google");
    
    // Ensure we are using the correct token
    if (!(window as any).gapi.client.getToken()) {
         (window as any).gapi.client.setToken({ access_token: accessToken });
    }

    // 1. CLEAR existing data to avoid ghost rows
    const clearRanges = ['Commesse!A2:R', 'Operatori!A2:F', 'Clienti!A2:D', 'Logs!A2:H'];
    await (window as any).gapi.client.sheets.spreadsheets.values.batchClear({
        spreadsheetId: SPREADSHEET_ID,
        resource: { ranges: clearRanges }
    });

    // 2. WRITE new data
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
    if (!accessToken) throw new Error("Utente non connesso a Google");

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
