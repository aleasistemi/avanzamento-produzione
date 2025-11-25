
import React, { useState, useEffect } from 'react';
import { OPERATORI_DATA, MOCK_COMMESSE, MOCK_CLIENTI, MOCK_LOGS } from './constants';
import { Operatore, Commessa, AIResponse, Cliente, FaseProduzione } from './types';
import { CalendarView } from './components/CalendarView';
import { JobSidebar } from './components/JobSidebar';
import { ChatInterface } from './components/ChatInterface';
import { JobDetailModal } from './components/JobDetailModal';
import { NewJobModal } from './components/NewJobModal';
import { NewClientModal } from './components/NewClientModal';
import { JobTableView } from './components/JobTableView';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { LayoutGrid, LogOut, UserCircle, Briefcase, Building, Lock, Table as TableIcon, Calendar as CalendarIcon, Settings, Cloud, Loader2 } from 'lucide-react';
import { initGapi, fetchAllData, saveAllData, isSignedIn } from './services/sheetsService';

const App = () => {
  // Auth State
  const [currentUser, setCurrentUser] = useState<Operatore | null>(null);
  const [loginSelection, setLoginSelection] = useState<string>("");
  const [passwordInput, setPasswordInput] = useState<string>("");
  const [loginError, setLoginError] = useState<boolean>(false);

  // App State - Defaults to Mock, but overwrites with Cloud data
  const [operators, setOperators] = useState<Operatore[]>(OPERATORI_DATA);
  const [commesse, setCommesse] = useState<Commessa[]>(MOCK_COMMESSE);
  const [clienti, setClienti] = useState<Cliente[]>(MOCK_CLIENTI);
  const [logs, setLogs] = useState<FaseProduzione[]>(MOCK_LOGS);
  
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedJob, setSelectedJob] = useState<Commessa | null>(null);

  // Sync State
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);

  // Modal State
  const [isNewJobModalOpen, setIsNewJobModalOpen] = useState(false);
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [isAdminSettingsOpen, setIsAdminSettingsOpen] = useState(false);

  const isAdmin = currentUser?.Reparto === 'Admin';
  const canManageData = currentUser && ['Admin', 'Tecnico', 'Commerciale'].includes(currentUser.Reparto);

  // --- GOOGLE SYNC & INITIALIZATION ---
  
  // 1. Init Google API on Mount
  useEffect(() => {
    initGapi()
      .then(() => {
         const connected = isSignedIn();
         setIsGoogleConnected(connected);
         if (connected) {
             handleFetchData();
         }
      })
      .catch(err => console.error("GAPI Init Error", err));
  }, []);

  // 2. Polling for updates (Every 30s)
  useEffect(() => {
    if (!isGoogleConnected) return;
    const interval = setInterval(() => {
       handleFetchData(true); // Silent update
    }, 30000); 
    return () => clearInterval(interval);
  }, [isGoogleConnected]);

  // 3. Central Fetch Function
  const handleFetchData = async (silent = false) => {
      if (!silent) setIsSyncing(true);
      try {
          const data = await fetchAllData();
          if (data.commesse.length > 0) setCommesse(data.commesse);
          if (data.operatori.length > 0) setOperators(data.operatori);
          if (data.clienti.length > 0) setClienti(data.clienti);
          if (data.logs.length > 0) setLogs(data.logs);
      } catch (error) {
          console.error("Sync Error", error);
      } finally {
          if (!silent) setIsSyncing(false);
      }
  };

  // 4. Central Save Function (Triggers Cloud Save)
  const persistData = async (newCommesse: Commessa[], newOps: Operatore[], newClients: Cliente[], newLogs: FaseProduzione[]) => {
      // Optimistic UI Update first
      setCommesse(newCommesse);
      setOperators(newOps);
      setClienti(newClients);
      setLogs(newLogs);

      // We rely on the service check directly for better reliability than state
      if (isSignedIn()) {
          setIsSyncing(true);
          try {
              await saveAllData(newCommesse, newOps, newClients, newLogs);
          } catch(e) {
              console.error("Save Error", e);
              // alert("Errore salvataggio Cloud. Controlla la connessione.");
          } finally {
              setIsSyncing(false);
          }
      }
  };

  // --- ACTIONS ---

  const handleUpdateJob = (id: string, updates: Partial<Commessa>) => {
    const oldJob = commesse.find(c => c.CommessaID === id);
    if (!oldJob || !currentUser) return;

    // Logic: Color update
    if (updates.Priorita) {
        let newColor = '#3b82f6';
        if (updates.Priorita >= 4) newColor = '#ef4444';
        else if (updates.Priorita === 3) newColor = '#eab308';
        updates.ColoreCalcolato = newColor;
    }

    // Logic: New Log
    const newLogs = [...logs];
    if (updates.StatoAvanzamento && updates.StatoAvanzamento !== oldJob.StatoAvanzamento) {
        newLogs.push({
            FaseID: `L${Date.now()}`,
            CommessaID: id,
            Fase: updates.StatoAvanzamento,
            DataInizio: new Date().toISOString(),
            OperatoreCheAggiorna: currentUser.Nome,
            StatoFase: 'In corso'
        } as any);
    }
    
    if (updates.OperatoreAssegnato && updates.OperatoreAssegnato !== oldJob.OperatoreAssegnato) {
          newLogs.push({
            FaseID: `L${Date.now() + 1}`,
            CommessaID: id,
            Fase: `Assegnazione a ${updates.OperatoreAssegnato}`,
            DataInizio: new Date().toISOString(),
            OperatoreCheAggiorna: currentUser.Nome,
            StatoFase: 'In corso'
        } as any);
    }

    const updatedCommesse = commesse.map(c => c.CommessaID === id ? { ...c, ...updates } : c);
    
    // Update selected job view if open
    if (selectedJob && selectedJob.CommessaID === id) {
        setSelectedJob({ ...selectedJob, ...updates });
    }

    persistData(updatedCommesse, operators, clienti, newLogs);
  };

  const handleCreateJob = (newJob: Commessa) => {
    const newLogs = [...logs];
    if(currentUser) {
        newLogs.push({
            FaseID: `L${Date.now()}`,
            CommessaID: newJob.CommessaID,
            Fase: 'Creazione Commessa',
            DataInizio: new Date().toISOString(),
            OperatoreCheAggiorna: currentUser.Nome,
            StatoFase: 'In corso'
        } as any);
    }
    persistData([...commesse, newJob], operators, clienti, newLogs);
  };

  const handleDeleteJob = (id: string) => {
    const filtered = commesse.filter(c => c.CommessaID !== id);
    persistData(filtered, operators, clienti, logs);
  };

  const handleCreateClient = (newClient: Cliente) => {
    persistData(commesse, operators, [...clienti, newClient], logs);
  };

  // Wrapper for settings modal updates
  const handleSettingsSave = (newOps: Operatore[], newClients: Cliente[]) => {
      persistData(commesse, newOps, newClients, logs);
  }

  // --- AI Actions ---
  const handleAIAction = (response: AIResponse) => {
    if (response.status === 'error') {
      alert(`Errore: ${response.message}`);
      return;
    }
    switch (response.action) {
      case 'prendi_in_carico':
        if (response.payload?.CommessaID) {
          handleUpdateJob(response.payload.CommessaID, {
            OperatoreAssegnato: response.payload.OperatoreAssegnato || currentUser?.Nome,
            DataPresaInCarico: response.payload.DataPresaInCarico || new Date().toISOString().split('T')[0],
            StatoAvanzamento: 'In Corso'
          });
        }
        break;
      case 'update_commessa':
        if (response.payload?.CommessaID) {
           const { CommessaID, ...updates } = response.payload;
           handleUpdateJob(CommessaID, updates);
        }
        break;
      case 'get_calendar':
        if (response.payload?.month && response.payload?.year) {
             const newDate = new Date(response.payload.year, response.payload.month - 1, 1);
             setSelectedDate(newDate);
             setViewMode('calendar');
        }
        break;
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginSelection || !passwordInput) {
        setLoginError(true);
        return;
    }
    
    // Simple mock password check logic (demo purpose)
    const isAdminUser = loginSelection === "4" || loginSelection === "12" || loginSelection === "13"; // IDs for admins
    const correctPass = isAdminUser ? "14091111" : "1409";

    if (passwordInput !== correctPass) {
        setLoginError(true);
        return;
    }

    const user = operators.find(op => op.ID.toString() === loginSelection);
    if (user) {
        setCurrentUser(user);
        setLoginError(false);
        setPasswordInput("");
    } else {
        setLoginError(true);
    }
  };

  // --- Auth Screen ---
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm relative overflow-hidden">
          {isSyncing && (
               <div className="absolute top-0 left-0 right-0 h-1 bg-alea-200 overflow-hidden">
                   <div className="h-full bg-alea-600 animate-pulse w-1/2 mx-auto"></div>
               </div>
          )}
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-alea-900 mb-2">Alea Sistemi</h1>
            <p className="text-gray-500">Portale Gestione Produzione</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleziona Operatore</label>
                <select 
                    className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-alea-500 outline-none"
                    value={loginSelection}
                    onChange={(e) => {
                      setLoginSelection(e.target.value);
                      setLoginError(false);
                    }}
                >
                    <option value="">-- Chi sei? --</option>
                    {operators.map(op => (
                        <option key={op.ID} value={op.ID}>{op.Nome} ({op.Reparto})</option>
                    ))}
                </select>
            </div>

            {loginSelection && (
                <div className="animate-fade-in">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input 
                            type="password"
                            autoFocus
                            className={`w-full pl-10 pr-3 py-3 border rounded-lg outline-none focus:ring-2 ${loginError ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-alea-500'}`}
                            placeholder="Inserisci password"
                            value={passwordInput}
                            onChange={(e) => setPasswordInput(e.target.value)}
                        />
                    </div>
                    {loginError && <p className="text-xs text-red-500 mt-1">Password non corretta. (1409 o 14091111 per Admin)</p>}
                </div>
            )}

            <button 
                type="submit" 
                disabled={!loginSelection || !passwordInput}
                className="w-full py-3 bg-alea-600 text-white rounded-lg font-semibold hover:bg-alea-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
                Accedi al Portale
            </button>
          </form>

          {/* Sync Status for login screen */}
          <div className="mt-6 flex justify-center">
             {isGoogleConnected ? (
                 <span className="text-xs text-green-600 flex items-center gap-1"><Cloud size={12}/> Cloud Connesso</span>
             ) : (
                 <button onClick={() => setIsAdminSettingsOpen(true)} className="text-xs text-gray-400 hover:text-alea-600 flex items-center gap-1">
                     <Settings size={12}/> Configura Cloud
                 </button>
             )}
          </div>
        </div>

        {/* Allow opening settings from login screen to set up cloud */}
        {isAdminSettingsOpen && (
            <AdminSettingsModal
                onClose={() => setIsAdminSettingsOpen(false)}
                operators={operators}
                setOperators={(val) => {
                     // Special case for login screen settings: only update local state temporarily or trigger save
                     if(typeof val === 'function') setOperators(val(operators));
                     else setOperators(val);
                }}
                clients={clienti}
                setClients={setClienti}
                currentUser={{ Reparto: 'Admin' } as any} // Mock admin for settings access
                onManualSync={() => handleFetchData()}
                isSyncing={isSyncing}
            />
        )}
      </div>
    );
  }

  // --- Main Layout ---
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      
      {/* Sidebar Navigation (Desktop) */}
      <div className="hidden md:flex flex-col w-20 bg-alea-900 text-white items-center py-6 gap-6 z-30">
        <div className="font-bold text-2xl tracking-tighter">AL</div>
        <div className="w-10 h-1 bg-white/20 rounded-full"></div>
        <button 
            onClick={() => setViewMode('calendar')}
            className={`p-3 rounded-xl transition-colors ${viewMode === 'calendar' ? 'bg-white/20 text-white' : 'text-alea-100 hover:bg-white/10'}`} 
            title="Calendario"
        >
            <CalendarIcon size={24} />
        </button>

        {canManageData && (
             <button 
                onClick={() => setViewMode('table')}
                className={`p-3 rounded-xl transition-colors ${viewMode === 'table' ? 'bg-white/20 text-white' : 'text-alea-100 hover:bg-white/10'}`} 
                title="Elenco Completo"
            >
                <TableIcon size={24} />
            </button>
        )}
        
        {/* Admin Tools */}
        {canManageData && (
          <>
             <div className="w-10 h-[1px] bg-white/10 my-1"></div>
             <button onClick={() => setIsNewJobModalOpen(true)} className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Nuova Commessa">
                 <Briefcase size={22} />
             </button>
             <button onClick={() => setIsNewClientModalOpen(true)} className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors" title="Nuovo Cliente">
                 <Building size={22} />
             </button>
          </>
        )}

        {/* Settings button - Visible to all Managers now */}
        {canManageData && (
             <button onClick={() => setIsAdminSettingsOpen(true)} className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors mt-auto mb-2" title="Impostazioni">
                 <Settings size={22} />
             </button>
        )}

        {!canManageData && <div className="mt-auto"></div>}
        
        <button onClick={() => setCurrentUser(null)} className="p-3 text-red-300 hover:bg-white/10 rounded-xl transition-colors" title="Esci">
            <LogOut size={24} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6 shadow-sm z-20">
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-gray-800 hidden sm:block">
                    {viewMode === 'calendar' ? 'Dashboard Calendario' : 'Gestione Commesse'}
                </h1>
                
                {isSyncing && (
                    <span className="flex items-center gap-2 text-xs text-alea-600 bg-alea-50 px-2 py-1 rounded-full">
                        <Loader2 size={12} className="animate-spin" /> Sincronizzazione...
                    </span>
                )}

                {viewMode === 'calendar' && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                        {selectedDate.toLocaleString('it-IT', { month: 'long', year: 'numeric' })}
                    </span>
                )}
                
                {/* Mobile Controls */}
                <div className="flex md:hidden gap-2 ml-2">
                     <button onClick={() => setViewMode('calendar')} className={`p-2 rounded-lg ${viewMode==='calendar' ? 'bg-alea-100 text-alea-600': 'text-gray-500'}`}><CalendarIcon size={18}/></button>
                     {canManageData && <button onClick={() => setViewMode('table')} className={`p-2 rounded-lg ${viewMode==='table' ? 'bg-alea-100 text-alea-600': 'text-gray-500'}`}><TableIcon size={18}/></button>}
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-gray-900">{currentUser.Nome}</div>
                    <div className="text-xs text-gray-500">{currentUser.Reparto}</div>
                </div>
                <div className="w-10 h-10 rounded-full bg-alea-100 border-2 border-white shadow-sm flex items-center justify-center text-alea-700 font-bold relative group cursor-pointer">
                    <UserCircle size={24} />
                </div>
            </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 flex overflow-hidden relative">
            <main className="flex-1 p-6 overflow-hidden relative z-0 flex flex-col">
                {viewMode === 'calendar' ? (
                    <CalendarView 
                        commesse={commesse} 
                        currentDate={selectedDate}
                        onMonthChange={(delta) => setSelectedDate(new Date(selectedDate.setMonth(selectedDate.getMonth() + delta)))}
                        onSelectCommessa={setSelectedJob}
                        user={currentUser}
                    />
                ) : (
                    <JobTableView 
                        commesse={commesse}
                        onSelectCommessa={setSelectedJob}
                        onDeleteCommessa={handleDeleteJob}
                    />
                )}
            </main>

            {viewMode === 'calendar' && (
                <JobSidebar 
                    commesse={commesse} 
                    user={currentUser} 
                    onSelectCommessa={setSelectedJob}
                />
            )}
        </div>
      </div>

      <ChatInterface 
        user={currentUser} 
        commesse={commesse} 
        onAction={handleAIAction} 
      />

      {selectedJob && (
          <JobDetailModal 
            job={selectedJob} 
            user={currentUser} 
            logs={logs}
            onClose={() => setSelectedJob(null)}
            onUpdate={handleUpdateJob}
            allOperators={operators}
          />
      )}

      {isNewJobModalOpen && (
        <NewJobModal 
          onClose={() => setIsNewJobModalOpen(false)}
          onSave={handleCreateJob}
          clients={clienti}
          operators={operators}
        />
      )}

      {isNewClientModalOpen && (
        <NewClientModal
          onClose={() => setIsNewClientModalOpen(false)}
          onSave={handleCreateClient}
        />
      )}

      {isAdminSettingsOpen && (
        <AdminSettingsModal
          onClose={() => setIsAdminSettingsOpen(false)}
          operators={operators}
          setOperators={(val) => {
              if (typeof val === 'function') {
                  const newOps = val(operators);
                  handleSettingsSave(newOps, clienti);
              } else {
                  handleSettingsSave(val, clienti);
              }
          }}
          clients={clienti}
          setClients={(val) => {
              if (typeof val === 'function') {
                  const newClients = val(clienti);
                  handleSettingsSave(operators, newClients);
              } else {
                  handleSettingsSave(operators, val);
              }
          }}
          currentUser={currentUser || { Reparto: 'Admin' } as any}
          onManualSync={() => handleFetchData()}
          isSyncing={isSyncing}
        />
      )}

    </div>
  );
};

export default App;
