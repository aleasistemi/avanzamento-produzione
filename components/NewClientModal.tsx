import React, { useState } from 'react';
import { Cliente } from '../types';
import { X, Save, Building } from 'lucide-react';

interface NewClientModalProps {
  onClose: () => void;
  onSave: (client: Cliente) => void;
}

export const NewClientModal: React.FC<NewClientModalProps> = ({ onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Cliente>>({
    Nome: '',
    Email: '',
    Telefono: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.Nome) return;

    onSave({
      ID: `CL${Math.floor(Math.random() * 1000)}`,
      Nome: formData.Nome,
      Email: formData.Email,
      Telefono: formData.Telefono
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-4 bg-alea-900 text-white flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Building size={20} /> Nuovo Cliente
          </h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ragione Sociale *</label>
            <input
              required
              type="text"
              value={formData.Nome}
              onChange={(e) => setFormData(prev => ({ ...prev, Nome: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 focus:outline-none"
              placeholder="Es. Alea Sistemi Srl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Contatto</label>
            <input
              type="email"
              value={formData.Email}
              onChange={(e) => setFormData(prev => ({ ...prev, Email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
            <input
              type="tel"
              value={formData.Telefono}
              onChange={(e) => setFormData(prev => ({ ...prev, Telefono: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-alea-500 focus:outline-none"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Annulla</button>
            <button type="submit" className="px-4 py-2 bg-alea-600 text-white rounded-lg hover:bg-alea-700 flex items-center gap-2">
              <Save size={18} /> Salva Cliente
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};