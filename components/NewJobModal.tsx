import React, { useState } from 'react';
import { Commessa, Cliente, Operatore } from '../types';
import { X, Save, Briefcase } from 'lucide-react';

interface NewJobModalProps {
  onClose: () => void;
  onSave: (job: Commessa) => void;
  clients: Cliente[];
  operators: Operatore[];
}

export const NewJobModal: React.FC<NewJobModalProps> = ({ onClose, onSave, clients, operators }) => {
  const [formData, setFormData] = useState<Partial<Commessa>>({
    Codice: `JOB-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
    Priorita: 3,
    StatoAvanzamento: 'Preventivo',
    StatoCompletamento: 'Aperta',
    Bloccata: false,
    TempoStimatoOre: 0,
    DataInserimento: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Codice || !formData.Cliente) return;

    // Logic to auto-assign color based on priority
    let color = '#3b82f6'; // Blue default
    if (formData.Priorita && formData.Priorita >= 4) color = '#ef4444'; // Red
    else if (formData.Priorita === 3) color = '#eab308'; // Yellow

    const newJob: Commessa = {
      ...formData as Commessa,
      CommessaID: `C${Math.floor(Math.random() * 10000)}`, // Mock ID generation
      ColoreCalcolato: color,
      DataPresaInCarico: '',
      DataFinePrevista: '',
      MaterialiMancanti: '',
      NoteTecniche: formData.NoteTecniche || '',
      OperatoreAssegnato: ''
    };

    onSave(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-4 bg-alea-900 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Briefcase size={20} /> Nuova Commessa
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Codice Commessa *</label>
              <input
                required
                type="text"
                value={formData.Codice}
                onChange={(e) => setFormData(prev => ({ ...prev, Codice: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
              <select
                required
                value={formData.Cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, Cliente: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none bg-white text-gray-900"
              >
                <option value="">Seleziona Cliente...</option>
                {clients.map(c => (
                  <option key={c.ID} value={c.Nome}>{c.Nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                type="text"
                value={formData.Categoria}
                onChange={(e) => setFormData(prev => ({ ...prev, Categoria: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none"
                placeholder="Es. Automotive, Impianti..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priorità (1-5)</label>
              <input
                type="number"
                min="1"
                max="5"
                value={formData.Priorita}
                onChange={(e) => setFormData(prev => ({ ...prev, Priorita: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Consegna Richiesta</label>
              <input
                type="date"
                value={formData.DataStimataConsegna}
                onChange={(e) => setFormData(prev => ({ ...prev, DataStimataConsegna: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reparto Responsabile</label>
              <select
                value={formData.RepartoResponsabile}
                onChange={(e) => setFormData(prev => ({ ...prev, RepartoResponsabile: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none bg-white text-gray-900"
              >
                <option value="">Seleziona Reparto...</option>
                <option value="Officina">Officina</option>
                <option value="Magazzino">Magazzino</option>
                <option value="Tecnico">Tecnico</option>
                <option value="Commerciale">Commerciale</option>
              </select>
            </div>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">Tempo Stimato (Ore)</label>
             <input
                type="number"
                value={formData.TempoStimatoOre}
                onChange={(e) => setFormData(prev => ({ ...prev, TempoStimatoOre: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none"
             />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Iniziali</label>
            <textarea
              rows={3}
              value={formData.NoteTecniche}
              onChange={(e) => setFormData(prev => ({ ...prev, NoteTecniche: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 outline-none"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
            <button type="submit" className="px-4 py-2 bg-alea-600 text-white rounded-lg hover:bg-alea-700 flex items-center gap-2">
              <Save size={18} /> Crea Commessa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};