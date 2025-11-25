import React, { useState } from 'react';
import { Commessa, Operatore } from '../types';
import { Search, Download, Trash2, Eye } from 'lucide-react';

interface JobTableViewProps {
  commesse: Commessa[];
  onSelectCommessa: (c: Commessa) => void;
  onDeleteCommessa: (id: string) => void;
}

export const JobTableView: React.FC<JobTableViewProps> = ({ commesse, onSelectCommessa, onDeleteCommessa }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCommesse = commesse.filter(c => 
    c.CommessaID.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.Codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.OperatoreAssegnato.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExport = () => {
    // Simple CSV export
    const headers = ["ID", "Codice", "Cliente", "Stato", "Operatore", "Consegna", "Priorità"];
    const rows = filteredCommesse.map(c => [
        c.CommessaID, 
        c.Codice, 
        c.Cliente, 
        c.StatoAvanzamento, 
        c.OperatoreAssegnato, 
        c.DataStimataConsegna, 
        c.Priorita
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "commesse_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string) => {
      if(window.confirm(`Sei sicuro di voler eliminare definitivamente la commessa ${id}?`)) {
          onDeleteCommessa(id);
      }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800">Elenco Completo Commesse</h2>
        <div className="flex gap-4">
            <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cerca commessa..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-alea-500 text-sm w-64"
                />
            </div>
            <button 
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
                <Download size={18} /> Export Excel
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
        <table className="w-full text-sm text-left text-gray-600">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 sticky top-0">
                <tr>
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Codice</th>
                    <th className="px-6 py-3">Cliente</th>
                    <th className="px-6 py-3">Stato</th>
                    <th className="px-6 py-3">Operatore</th>
                    <th className="px-6 py-3">Consegna</th>
                    <th className="px-6 py-3 text-center">Azioni</th>
                </tr>
            </thead>
            <tbody>
                {filteredCommesse.map((job) => (
                    <tr key={job.CommessaID} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{job.CommessaID}</td>
                        <td className="px-6 py-4">{job.Codice}</td>
                        <td className="px-6 py-4">{job.Cliente}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                job.StatoAvanzamento === 'Materiali Mancanti' ? 'bg-red-100 text-red-800' :
                                job.StatoAvanzamento === 'Completata' ? 'bg-green-100 text-green-800' :
                                'bg-blue-100 text-blue-800'
                            }`}>
                                {job.StatoAvanzamento}
                            </span>
                        </td>
                        <td className="px-6 py-4">{job.OperatoreAssegnato || '-'}</td>
                        <td className="px-6 py-4">{job.DataStimataConsegna}</td>
                        <td className="px-6 py-4 text-center flex justify-center gap-2">
                            <button 
                                onClick={() => onSelectCommessa(job)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Vedi Dettagli"
                            >
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => handleDelete(job.CommessaID)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Elimina"
                            >
                                <Trash2 size={18} />
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>
    </div>
  );
};