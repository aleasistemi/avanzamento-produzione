import React from 'react';
import { Commessa, Operatore } from '../types';
import { Package, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface JobSidebarProps {
  commesse: Commessa[];
  user: Operatore;
  onSelectCommessa: (c: Commessa) => void;
}

export const JobSidebar: React.FC<JobSidebarProps> = ({ commesse, user, onSelectCommessa }) => {
  // Logica di visualizzazione rigida
  const filteredCommesse = commesse.filter(c => {
    // Admin, Tecnico e Commerciale vedono tutto
    if (['Admin', 'Tecnico', 'Commerciale'].includes(user.Reparto)) return true;

    // Officina e Magazzino NON vedono Preventivi
    if (c.StatoAvanzamento === 'Preventivo') return false;

    // Officina e Magazzino NON vedono Commesse Completate (StatoCompletamento = Completata o StatoAvanzamento = Completata)
    if (c.StatoCompletamento === 'Completata' || c.StatoAvanzamento === 'Completata') return false;

    // Per il resto, vedono le commesse del loro reparto o se sono assegnati
    if (c.RepartoResponsabile === user.Reparto) return true;
    if (c.OperatoreAssegnato === user.Nome) return true;
    
    // Vedono anche le commesse "In Corso" generiche o in fasi operative
    if (['In Corso', 'Taglio', 'Lavorazioni', 'Montaggio', 'Spedizione', 'Ritiro', 'Materiali Mancanti'].includes(c.StatoAvanzamento)) return true;

    return false;
  });

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-lg z-10">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2">
          <Package size={18} />
          Code {user.Reparto}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{filteredCommesse.length} commesse visibili</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredCommesse.map(job => (
          <div 
            key={job.CommessaID}
            onClick={() => onSelectCommessa(job)}
            className="group bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md hover:border-alea-200 transition-all cursor-pointer relative"
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg`} style={{ backgroundColor: job.ColoreCalcolato }}></div>
            
            <div className="flex justify-between items-start mb-1 pl-2">
              <span className="font-bold text-gray-800 text-sm">{job.CommessaID}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${
                job.StatoAvanzamento === 'In Corso' || job.StatoAvanzamento === 'Lavorazioni' ? 'bg-green-50 text-green-600 border-green-200' :
                job.StatoAvanzamento === 'Materiali Mancanti' ? 'bg-red-50 text-red-600 border-red-200' :
                'bg-gray-50 text-gray-600 border-gray-200'
              }`}>
                {job.StatoAvanzamento}
              </span>
            </div>
            
            <div className="pl-2">
              <p className="text-sm text-gray-600 font-medium truncate">{job.Cliente}</p>
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                <Clock size={12} />
                <span>{job.DataStimataConsegna}</span>
              </div>
              
              {job.OperatoreAssegnato && (
                <div className="mt-2 flex items-center gap-1.5">
                   <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600">
                     {job.OperatoreAssegnato.substring(0,2).toUpperCase()}
                   </div>
                   <span className="text-xs text-gray-500">Assegnato</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {filteredCommesse.length === 0 && (
            <div className="text-center py-10 text-gray-400">
                <CheckCircle2 size={32} className="mx-auto mb-2 opacity-50"/>
                <p className="text-sm">Nessuna commessa attiva visibile</p>
            </div>
        )}
      </div>
    </div>
  );
};