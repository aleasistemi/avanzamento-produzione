import React, { useState, useEffect } from 'react';
import { Operatore, Cliente } from '../types';
import { X, Plus, Trash2, Save, Settings, Users, Building, Pencil, Cloud, LogIn, Database, RefreshCw } from 'lucide-react';
import { signIn, signOut, isSignedIn, initializeSheetHeaders } from '../services/sheetsService';

interface AdminSettingsModalProps {
  onClose: () => void;
  operators: Operatore[];
  setOperators: React.Dispatch<React.SetStateAction<Operatore[]>>;
  clients: Cliente[];
  setClients: React.Dispatch<React.SetStateAction<Cliente[]>>;
  currentUser: Operatore;
  onManualSync: () => void;
  isSyncing: boolean;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({ 
  onClose, 
  operators, 
  setOperators, 
  clients, 
  setClients, 
  currentUser,
  onManualSync,
  isSyncing
}) => {
  const isAdmin = currentUser.Reparto === 'Admin';
  const [activeTab, setActiveTab] = useState<'operators' | 'clients' | 'cloud'>(isAdmin ? 'operators' : 'clients');
  const [googleUser, setGoogleUser] = useState<boolean>(false);
  
  // State Operatori
  const [newOpName, setNewOpName] = useState('');
  const [newOpReparto, setNewOpReparto] = useState('Officina');
  const [newOpEmail, setNewOpEmail] = useState('');

  // State Clienti
  const [clientForm, setClientForm] = useState<Partial<Cliente>>({ Nome: '', Email: '', Telefono: '' });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  useEffect(() => {
    // Check google auth status occasionally
    setGoogleUser(isSignedIn());
  }, []);

  const handleGoogleLogin = async () => {
      try {
          await signIn();
          setGoogleUser(true);
          // Auto sync after login
          onManualSync();
      } catch (e: any) {
          console.error("Login Error UI", e);
          let msg = "Errore sconosciuto.";
          if (e.error) msg = e.error;
          else if (e.message) msg = e.message;
          else if (typeof e === 'string') msg = e;
          
          alert(`Login fallito: ${msg}\n\nNota: Se vedi 'idpiframe_initialization_failed', verifica le Origini Autorizzate su Google Cloud Console.`);
      }
  };

  const handleGoogleLogout = async () => {
      await signOut();
      setGoogleUser(false);
  };

  const handleInitHeaders = async () => {
      if(window.confirm("Attenzione! Questo sovrascriverà le intestazioni (Riga 1) del tuo foglio Google. Continuare?")) {
          try {
            await initializeSheetHeaders();
            alert("Intestazioni create correttamente!");
          } catch(e) {
              alert("Errore inizializzazione intestazioni");
          }
      }
  }

  // --- Logic Operators ---
  const handleAddOperator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOpName) return;

    const newId = Math.max(...operators.map(o => o.ID), 0) + 1;
    const newOp: Operatore = {
        ID: newId,
        Nome: newOpName,
        Reparto: newOpReparto as any,
        Email: newOpEmail || `${newOpName.toLowerCase()}@aleasistemi.com`,
        ColorePersonale: 'Grigio',
        VisibileTempoStimato: ['Tecnico', 'Commerciale', 'Admin'].includes(newOpReparto) ? 'Sì' : 'No'
    };

    setOperators(prev => [...prev, newOp]);
    setNewOpName('');
    setNewOpEmail('');
  };

  const handleDeleteOperator = (id: number) => {
      if (window.confirm('Eliminare questo operatore?')) {
          setOperators(prev => prev.filter(op => op.ID !== id));
      }
  };

  // --- Logic Clients ---
  const handleSaveClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.Nome) return;

    if (editingClientId) {
      // Edit Mode
      setClients(prev => prev.map(c => c.ID === editingClientId ? { ...c, ...clientForm } as Cliente : c));
      setEditingClientId(null);
    } else {
      // Add Mode
      const newClient: Cliente = {
        ID: `CL${Date.now()}`, // Simple unique ID
        Nome: clientForm.Nome!,
        Email: clientForm.Email,
        Telefono: clientForm.Telefono
      };
      setClients(prev => [...prev, newClient]);
    }
    setClientForm({ Nome: '', Email: '', Telefono: '' });
  };

  const handleEditClient = (client: Cliente) => {
    setClientForm(client);
    setEditingClientId(client.ID);
  };

  const handleCancelEditClient = () => {
    setClientForm({ Nome: '', Email: '', Telefono: '' });
    setEditingClientId(null);
  };

  const handleDeleteClient = (id: string) => {
    if (window.confirm('Eliminare questo cliente?')) {
      setClients(prev => prev.filter(c => c.ID !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden h-[600px] flex flex-col">
        <div className="p-4 bg-alea-900 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Settings size={20} /> Impostazioni & Dati
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
            {isAdmin && (
              <button 
                  onClick={() => setActiveTab('operators')}
                  className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'operators' ? 'text-alea-600 border-b-2 border-alea-600 bg-gray-50' : 'text-gray-500 text-gray-900 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                  <Users size={16} /> Operatori
              </button>
            )}
            <button 
                onClick={() => setActiveTab('clients')}
                className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'clients' ? 'text-alea-600 border-b-2 border-alea-600 bg-gray-50' : 'text-gray-500 text-gray-900 hover:text-gray-900 hover:bg-gray-50'}`}
            >
                <Building size={16} /> Clienti
            </button>
            <button 
                onClick={() => setActiveTab('cloud')}
                className={`flex-1 py-3 font-medium text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === 'cloud' ? 'text-alea-600 border-b-2 border-alea-600 bg-gray-50' : 'text-gray-500 text-gray-900 hover:text-gray-900 hover:bg-gray-50'}`}
            >
                <Cloud size={16} /> Cloud Sync
            </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-white">
            {/* --- OPERATORS TAB --- */}
            {activeTab === 'operators' && isAdmin && (
                <div className="space-y-6">
                    {/* Add New */}
                    <form onSubmit={handleAddOperator} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2"><Plus size={16}/> Aggiungi Operatore</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input 
                                placeholder="Nome" 
                                value={newOpName}
                                onChange={e => setNewOpName(e.target.value)}
                                className="p-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-alea-500 outline-none"
                                required
                            />
                             <input 
                                placeholder="Email (opzionale)" 
                                value={newOpEmail}
                                onChange={e => setNewOpEmail(e.target.value)}
                                className="p-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-alea-500 outline-none"
                            />
                            <select 
                                value={newOpReparto}
                                onChange={e => setNewOpReparto(e.target.value)}
                                className="p-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-alea-500 outline-none"
                            >
                                <option value="Officina">Officina</option>
                                <option value="Magazzino">Magazzino</option>
                                <option value="Tecnico">Tecnico</option>
                                <option value="Commerciale">Commerciale</option>
                                <option value="Admin">Admin</option>
                            </select>
                            <button type="submit" className="bg-alea-600 text-white rounded px-4 py-2 text-sm font-medium hover:bg-alea-700 transition-colors">Aggiungi</button>
                        </div>
                    </form>

                    {/* List */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2"><Users size={16}/> Elenco Operatori</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="p-3 border-b border-gray-200 text-gray-900">ID</th>
                                        <th className="p-3 border-b border-gray-200 text-gray-900">Nome</th>
                                        <th className="p-3 border-b border-gray-200 text-gray-900">Reparto</th>
                                        <th className="p-3 border-b border-gray-200 text-gray-900">Email</th>
                                        <th className="p-3 border-b border-gray-200 text-gray-900 text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {operators.map(op => (
                                        <tr key={op.ID} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                            <td className="p-3 text-gray-900">{op.ID}</td>
                                            <td className="p-3 font-medium text-gray-900">{op.Nome}</td>
                                            <td className="p-3 text-gray-900">
                                                <span className={`px-2 py-1 rounded-full text-xs border ${
                                                    op.Reparto === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                    op.Reparto === 'Officina' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    'bg-gray-50 text-gray-700 border-gray-200'
                                                }`}>
                                                    {op.Reparto}
                                                </span>
                                            </td>
                                            <td className="p-3 text-gray-600">{op.Email}</td>
                                            <td className="p-3 text-right">
                                                <button onClick={() => handleDeleteOperator(op.ID)} className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" title="Elimina">
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CLIENTS TAB --- */}
            {activeTab === 'clients' && (
                <div className="space-y-6">
                    {/* Add/Edit Form */}
                    <form onSubmit={handleSaveClient} className={`p-4 rounded-lg border shadow-sm ${editingClientId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
                        <h3 className={`font-semibold mb-3 text-sm flex items-center gap-2 ${editingClientId ? 'text-blue-800' : 'text-gray-800'}`}>
                            {editingClientId ? <Pencil size={16}/> : <Plus size={16}/>} 
                            {editingClientId ? 'Modifica Cliente' : 'Aggiungi Nuovo Cliente'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                            <input 
                                placeholder="Ragione Sociale *" 
                                value={clientForm.Nome}
                                onChange={e => setClientForm(prev => ({...prev, Nome: e.target.value}))}
                                className="p-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-alea-500 outline-none"
                                required
                            />
                            <input 
                                placeholder="Email" 
                                value={clientForm.Email || ''}
                                onChange={e => setClientForm(prev => ({...prev, Email: e.target.value}))}
                                className="p-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-alea-500 outline-none"
                            />
                            <input 
                                placeholder="Telefono" 
                                value={clientForm.Telefono || ''}
                                onChange={e => setClientForm(prev => ({...prev, Telefono: e.target.value}))}
                                className="p-2 border border-gray-300 rounded text-sm text-gray-900 focus:ring-2 focus:ring-alea-500 outline-none"
                            />
                            <div className="flex gap-2">
                                <button type="submit" className={`flex-1 text-white rounded px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${editingClientId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-alea-600 hover:bg-alea-700'}`}>
                                    {editingClientId ? <Save size={16}/> : <Plus size={16}/>}
                                    {editingClientId ? 'Aggiorna' : 'Aggiungi'}
                                </button>
                                {editingClientId && (
                                    <button type="button" onClick={handleCancelEditClient} className="px-3 py-2 bg-white border border-gray-300 text-gray-600 rounded hover:bg-gray-100">
                                        <X size={16}/>
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>

                    {/* List */}
                    <div>
                        <h3 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2"><Building size={16}/> Anagrafica Clienti</h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-700 font-semibold uppercase text-xs">
                                    <tr>
                                        <th className="p-3 border-b border-gray-200 text-gray-900">Nome / Ragione Sociale</th>
                                        <th className="p-3 border-b border-gray-200 text-gray-900">Email</th>
                                        <th className="p-3 border-b border-gray-200 text-gray-900">Telefono</th>
                                        <th className="p-3 border-b border-gray-200 text-gray-900 text-right">Azioni</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white">
                                    {clients.map(client => (
                                        <tr key={client.ID} className={`border-b border-gray-100 last:border-0 transition-colors ${editingClientId === client.ID ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                                            <td className="p-3 font-medium text-gray-900">
                                                {client.Nome}
                                                {editingClientId === client.ID && <span className="ml-2 text-[10px] text-blue-600 font-bold uppercase">(In modifica)</span>}
                                            </td>
                                            <td className="p-3 text-gray-900">{client.Email || '-'}</td>
                                            <td className="p-3 text-gray-900">{client.Telefono || '-'}</td>
                                            <td className="p-3 text-right flex justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEditClient(client)} 
                                                    className="text-blue-600 hover:bg-blue-100 p-2 rounded transition-colors" 
                                                    title="Modifica"
                                                    disabled={!!editingClientId && editingClientId !== client.ID}
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteClient(client.ID)} 
                                                    className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors" 
                                                    title="Elimina"
                                                    disabled={!!editingClientId}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CLOUD SYNC TAB --- */}
            {activeTab === 'cloud' && (
                <div className="space-y-6 flex flex-col items-center justify-center h-full">
                    <div className="text-center space-y-2">
                        <div className="bg-blue-50 p-4 rounded-full inline-block mb-2">
                            <Cloud size={48} className="text-alea-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-800">Sincronizzazione Google Sheets</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Collega l'app al tuo account Google per salvare commesse, operatori e clienti direttamente sul foglio di calcolo.
                        </p>
                    </div>

                    <div className="flex flex-col gap-4 w-full max-w-xs">
                        {!googleUser ? (
                            <button onClick={handleGoogleLogin} className="flex items-center justify-center gap-2 bg-alea-600 text-white p-3 rounded-lg hover:bg-alea-700 transition-colors shadow-sm">
                                <LogIn size={20} /> Connetti Google Drive
                            </button>
                        ) : (
                            <>
                                <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
                                    <Cloud size={16} /> Connesso a Google
                                </div>
                                
                                <button onClick={onManualSync} disabled={isSyncing} className="flex items-center justify-center gap-2 bg-alea-600 text-white p-3 rounded-lg hover:bg-alea-700 transition-colors shadow-sm disabled:opacity-50">
                                    <RefreshCw size={20} className={isSyncing ? "animate-spin" : ""} /> 
                                    {isSyncing ? "Sincronizzazione..." : "Scarica Dati da Cloud"}
                                </button>
                                
                                <button onClick={handleInitHeaders} className="flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 p-3 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm">
                                    <Database size={16} /> Inizializza Fogli (Formatta)
                                </button>
                                
                                <button onClick={handleGoogleLogout} className="flex items-center justify-center gap-2 text-red-500 p-3 rounded-lg hover:bg-red-50 transition-colors text-sm">
                                    Disconnetti
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};