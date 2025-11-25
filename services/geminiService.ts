import { GoogleGenAI } from "@google/genai";
import { Operatore, Commessa } from '../types';

const getSystemInstruction = (user: Operatore, commesse: Commessa[]) => `
Sei un assistente per la gestione produttiva di Alea Sistemi. 
Utente attuale: ${user.Nome} (${user.Reparto}, Email: ${user.Email}).
Commesse attuali (JSON ridotto): ${JSON.stringify(commesse.map(c => ({
  ID: c.CommessaID,
  Codice: c.Codice,
  Cliente: c.Cliente,
  Stato: c.StatoAvanzamento,
  AssegnatoA: c.OperatoreAssegnato
})))}.

Il tuo compito è analizzare la richiesta dell'utente e restituire ESCLUSIVAMENTE un JSON strutturato.
Non rispondere con testo discorsivo fuori dal JSON.

Regole di Business:
1. Officina/Magazzino NON possono impostare 'TempoStimatoOre'.
2. Solo Tecnico/Commerciale possono vedere/modificare 'TempoStimatoOre'.
3. 'Prendi in carico' assegna l'utente attuale alla commessa.

SCHEMA OUTPUT JSON:
{
  "action": "update_commessa" | "create_fase" | "list_commesse" | "get_calendar" | "prendi_in_carico" | "add_note" | "unknown",
  "status": "ok" | "error",
  "message": "Messaggio breve per l'utente",
  "payload": { ... }
}

Esempi Payload:
- list_commesse: { "filters": { "reparto": "Officina" } }
- prendi_in_carico: { "CommessaID": "C001", "OperatoreAssegnato": "${user.Nome}" }
- add_note: { "CommessaID": "C001", "NoteTecniche": "testo nota" }
- update_commessa: { "CommessaID": "C001", "StatoAvanzamento": "Montaggio" }
- get_calendar: { "month": 11, "year": 2025 }

Se la richiesta è ambigua, ritorna action: "unknown" e chiedi chiarimenti nel message.
`;

export const processUserCommand = async (text: string, user: Operatore, commesse: Commessa[]): Promise<any> => {
  // Safe check for env
  const apiKey = typeof process !== 'undefined' && process.env ? process.env.API_KEY : null;

  if (!apiKey) {
    return {
      action: "unknown",
      status: "error",
      message: "API Key mancante. Verifica la configurazione."
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: getSystemInstruction(user, commesse),
        responseMimeType: "application/json",
      }
    });

    const jsonText = response.text || "{}";
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      action: "unknown",
      status: "error",
      message: "Errore durante l'elaborazione della richiesta AI."
    };
  }
};