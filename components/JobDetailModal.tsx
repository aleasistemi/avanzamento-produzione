import React, { useState, useEffect } from 'react';
import { Commessa, Operatore, FaseProduzione } from '../types';
import { OPERATORI_DATA } from '../constants';
import { X, UserCheck, AlertTriangle, Save, Clock, Target, RotateCcw, Calendar, History, Check, Lock } from 'lucide-react';

interface JobDetailModalProps {
  job: Commessa | null;
  user: Operatore;
  logs: FaseProduzione[];
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Commessa>) => void;
  allOperators: Operatore[]; // Added prop for dynamic operators
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({ job, user, logs, onClose, onUpdate, allOperators = OPERATORI_DATA }) => {
  const [missingMatInput, setMissingMatInput] = useState('');

  useEffect(() => {
    if (job) {
      setMissingMatInput(job.MaterialiMancanti || '');
    }
  }, [job]);

  if (!job) return null;

  const isAdmin = user.Reparto === 'Admin';
  const isCommerciale = user.Reparto === 'Commerciale';
  const canEditPriority = isAdmin || isCommerciale;
  const canSeeTime = user.VisibileTempoStimato === 'Sì';
  const isMissingMaterialsState = job.StatoAvanzamento === 'Materiali Mancanti';
  
  const jobLogs = logs.filter(l => l.CommessaID === job.CommessaID).sort((a,b) => new Date(b.DataInizio).getTime() - new Date(a.DataInizio).getTime());

  const handleTakeCharge = () => {
    onUpdate(job.CommessaID, { 
      OperatoreAssegnato: user.Nome,
      DataPresaInCarico: new Date().toISOString().split('T')[0],
      StatoAvanzamento: 'In Corso'
    });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate(job.CommessaID, { StatoAvanzamento: e.target.value as any });
  };

  const handleAdminAssign = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOp = allOperators.find(op => op.Nome === e.target.value);
    if (selectedOp) {
        onUpdate(job.CommessaID, {
            OperatoreAssegnato: selectedOp.Nome,
            DataPresaInCarico: job.DataPresaInCarico || new Date().toISOString().split('T')[0]
        });
    } else {
        onUpdate(job.CommessaID, { OperatoreAssegnato: '', DataPresaInCarico: '' });
    }
  };

  const handleResetJob = () => {
    if(window.confirm("Sei sicuro di voler resettare questa commessa?")) {
        onUpdate(job.CommessaID, {
            OperatoreAssegnato: '',
            StatoAvanzamento: 'Preventivo',
            DataPresaInCarico: '',
            StatoCompletamento: 'Aperta',
            MaterialiMancanti: ''
        });
        setMissingMatInput('');
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate(job.CommessaID, { DataStimataConsegna: e.target.value });
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onUpdate(job.CommessaID, { Priorita: parseInt(e.target.value) });
  };

  const handleMissingMaterialsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setMissingMatInput(e.target.value);
  };

  const saveMissingMaterials = () => {
      // Only save if in the correct state
      if (isMissingMaterialsState) {
          onUpdate(job.CommessaID, { MaterialiMancanti: missingMatInput });
      }
  };

  const handleMaterialArrived = () => {
      setMissingMatInput('');
      onUpdate(job.CommessaID, { MaterialiMancanti: '' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start" style={{ borderTop: `6px solid ${job.ColoreCalcolato}`}}>
          <div>
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
              {job.CommessaID}
              {job.Bloccata && <AlertTriangle className="text-red-500" size={24} />}
            </h2>
            <p className="text-gray-500 font-medium">{job.Cliente} - {job.Codice}</p>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
                <button 
                    onClick={handleResetJob}
                    className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors" 
                    title="Resetta Commessa"
                >
                    <RotateCcw size={20} />
                </button>
            )}
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X size={24} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
            
          {/* Status Bar */}
          <div className="flex flex-wrap gap-4 items-center p-4 bg-blue-50/50 rounded-xl border border-blue-100">
             <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-blue-800 uppercase tracking-wide mb-1 flex items-center gap-1">
                    <Target size={14} /> Fase di Lavoro Attuale
                </label>
                <select 
                    value={job.StatoAvanzamento} 
                    onChange={handleStatusChange}
                    className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-alea-500 outline-none shadow-sm"
                >
                    <option value="Preventivo">1. Preventivo</option>
                    <option value="Materiali Mancanti">2. Materiali Mancanti</option>
                    <option value="In Corso">3. In Corso (Generico)</option>
                    <option value="Taglio">4. Taglio</option>
                    <option value="Lavorazioni">5. Lavorazioni</option>
                    <option value="Montaggio">6. Montaggio</option>
                    <option value="Spedizione">7. Spedizione</option>
                    <option value="Ritiro">8. Ritiro</option>
                    <option value="Completata">9. Completata</option>
                </select>
             </div>

             <div className="flex-1 min-w-[200px]">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Operatore Responsabile</label>
                <div className="flex items-center gap-2">
                    {isAdmin ? (
                         <select 
                             value={job.OperatoreAssegnato} 
                             onChange={handleAdminAssign}
                             className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-alea-500"
                         >
                             <option value="">-- Non Assegnato --</option>
                             {allOperators.map(op => (
                                 <option key={op.ID} value={op.Nome}>{op.Nome} ({op.Reparto})</option>
                             ))}
                         </select>
                    ) : (
                        job.OperatoreAssegnato ? (
                             <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-gray-200 text-sm font-medium w-full">
                                <div className="w-5 h-5 rounded-full bg-alea-100 text-alea-600 flex items-center justify-center text-xs font-bold">
                                    {job.OperatoreAssegnato.charAt(0)}
                                </div>
                                {job.OperatoreAssegnato}
                             </div>
                        ) : (
                            <button 
                                onClick={handleTakeCharge}
                                className="flex items-center justify-center gap-2 px-4 py-2 bg-alea-600 text-white rounded-lg text-sm font-medium hover:bg-alea-700 transition-colors shadow-sm w-full"
                            >
                                <UserCheck size={16} /> Prendi in Carico
                            </button>
                        )
                    )}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Info Column */}
            <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Dettagli Commessa</h3>
                
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-gray-400 block">Categoria</span>
                        <span className="text-sm font-medium text-gray-700">{job.Categoria}</span>
                    </div>
                    <div>
                        <span className="text-xs text-gray-400 block">Priorità</span>
                        {canEditPriority ? (
                            <select
                                value={job.Priorita}
                                onChange={handlePriorityChange}
                                className="w-full mt-1 bg-white border border-gray-300 rounded px-2 py-1 text-sm font-medium text-gray-700 outline-none"
                            >
                                <option value={1}>1 - Bassa</option>
                                <option value={2}>2 - Medio-Bassa</option>
                                <option value={3}>3 - Normale</option>
                                <option value={4}>4 - Alta</option>
                                <option value={5}>5 - Urgente</option>
                            </select>
                        ) : (
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1 mt-1">
                                {Array.from({length: job.Priorita}).map((_, i) => (
                                    <div key={i} className="w-2 h-2 rounded-full bg-red-400"></div>
                                ))}
                            </span>
                        )}
                    </div>
                    <div className="col-span-2">
                        <span className="text-xs text-gray-400 block">Consegna Prevista</span>
                        {isAdmin ? (
                             <input 
                                type="date" 
                                value={job.DataStimataConsegna} 
                                onChange={handleDateChange}
                                className="mt-1 w-full px-2 py-1 border border-gray-300 rounded text-sm text-gray-800"
                             />
                        ) : (
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1 mt-1">
                                <Calendar size={14} className="text-gray-400" /> {job.DataStimataConsegna}
                            </span>
                        )}
                    </div>
                    {canSeeTime && (
                        <div className="col-span-2">
                            <span className="text-xs text-gray-400 block">Tempo Stimato</span>
                            <span className="text-sm font-medium text-gray-700 flex items-center gap-1">
                                <Clock size={14} /> {job.TempoStimatoOre} ore
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Notes & Materials Column */}
            <div className="space-y-4">
                 <h3 className="font-semibold text-gray-800 border-b border-gray-100 pb-2">Materiali & Note</h3>
                 
                 <div className={`p-4 rounded-xl border transition-colors ${
                     isMissingMaterialsState 
                        ? (missingMatInput ? 'bg-red-50 border-red-200' : 'bg-white border-red-200')
                        : 'bg-gray-100 border-gray-200'
                 }`}>
                    <div className="flex justify-between items-center mb-2">
                        <label className={`text-xs font-bold block flex items-center gap-1 ${missingMatInput && isMissingMaterialsState ? 'text-red-700' : 'text-gray-500'}`}>
                            {isMissingMaterialsState ? <AlertTriangle size={14} /> : <Lock size={14} />}
                            MATERIALI MANCANTI
                        </label>
                        {missingMatInput && isMissingMaterialsState && (
                            <button 
                                onClick={handleMaterialArrived}
                                className="text-[10px] bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-100 flex items-center gap-1"
                            >
                                <Check size={12} /> Segna come Arrivato
                            </button>
                        )}
                    </div>
                    <textarea 
                        value={missingMatInput}
                        onChange={handleMissingMaterialsChange}
                        onBlur={saveMissingMaterials}
                        readOnly={!isMissingMaterialsState}
                        placeholder={isMissingMaterialsState ? "Scrivi qui cosa manca..." : "Modificabile solo se lo stato è 'Materiali Mancanti'"}
                        className={`w-full text-sm p-2 rounded border focus:outline-none focus:ring-2 resize-none ${
                            isMissingMaterialsState
                                ? (missingMatInput ? 'bg-white border-red-300 focus:ring-red-200 text-red-800' : 'bg-white border-gray-300 focus:ring-alea-500')
                                : 'bg-gray-200 text-gray-500 cursor-not-allowed border-transparent'
                        }`}
                        rows={2}
                    />
                 </div>

                 <div>
                    <span className="text-xs text-gray-400 block mb-1">Note Tecniche</span>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        {job.NoteTecniche || 'Nessuna nota tecnica.'}
                    </p>
                 </div>
            </div>
          </div>

          {/* History Timeline */}
          <div className="mt-6 pt-6 border-t border-gray-100">
             <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <History size={18} /> Cronologia Lavori
             </h3>
             <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
                {jobLogs.length > 0 ? (
                    jobLogs.map((log, idx) => (
                        <div key={idx} className="flex gap-3 text-sm">
                            <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-alea-400 mt-1.5"></div>
                                {idx < jobLogs.length - 1 && <div className="w-0.5 h-full bg-gray-200 my-1"></div>}
                            </div>
                            <div>
                                <p className="text-gray-800 font-medium">
                                    {log.OperatoreCheAggiorna} <span className="text-gray-500 font-normal">ha impostato</span> {log.Fase}
                                </p>
                                <span className="text-xs text-gray-400">
                                    {new Date(log.DataInizio).toLocaleString('it-IT')}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-gray-400 italic">Nessuna attività recente registrata.</p>
                )}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};