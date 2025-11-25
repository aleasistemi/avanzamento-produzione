import React from 'react';
import { Commessa, Operatore } from '../types';
import { ChevronLeft, ChevronRight, AlertTriangle, CheckCheck } from 'lucide-react';

interface CalendarViewProps {
  commesse: Commessa[];
  currentDate: Date;
  onMonthChange: (delta: number) => void;
  onSelectCommessa: (c: Commessa) => void;
  user: Operatore;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ commesse, currentDate, onMonthChange, onSelectCommessa, user }) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = firstDayOfMonth.getDay() === 0 ? 6 : firstDayOfMonth.getDay() - 1; // Mon=0, Sun=6

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const monthName = firstDayOfMonth.toLocaleString('it-IT', { month: 'long', year: 'numeric' });

  // Helper to find jobs active on a specific day
  const getJobsForDay = (date: Date) => {
    return commesse.filter(c => {
        // VISIBILITY RULES
        const isProduction = ['Officina', 'Magazzino'].includes(user.Reparto);
        
        // Hide Preventivo for Production
        if (isProduction && c.StatoAvanzamento === 'Preventivo') return false;
        
        // Hide Completed for Production
        if (isProduction && (c.StatoCompletamento === 'Completata' || c.StatoAvanzamento === 'Completata')) return false;

        // Date Logic
        const start = c.DataPresaInCarico ? new Date(c.DataPresaInCarico) : new Date(c.DataStimataConsegna); 
        const end = c.DataFinePrevista ? new Date(c.DataFinePrevista) : new Date(start.getTime() + (86400000 * 2));
        
        const d = new Date(date); d.setHours(0,0,0,0);
        const s = new Date(start); s.setHours(0,0,0,0);
        const e = new Date(end); e.setHours(23,59,59,999);

        return d >= s && d <= e;
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 capitalize">{monthName}</h2>
        <div className="flex gap-2">
          <button onClick={() => onMonthChange(-1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
          <button onClick={() => onMonthChange(1)} className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50">
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(day => (
          <div key={day} className="py-2 text-center text-sm font-semibold text-gray-500">{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr flex-1">
        {days.map((date, idx) => (
          <div key={idx} className={`min-h-[100px] border-b border-r border-gray-100 p-1 relative ${!date ? 'bg-gray-50/50' : ''}`}>
            {date && (
              <>
                <span className={`text-xs font-medium p-1 rounded-full ${
                  date.toDateString() === new Date().toDateString() ? 'bg-alea-500 text-white' : 'text-gray-500'
                }`}>
                  {date.getDate()}
                </span>
                <div className="flex flex-col gap-1 mt-1 overflow-y-auto max-h-[80px] scrollbar-hide">
                  {getJobsForDay(date).map(job => {
                    const isCompleted = job.StatoCompletamento === 'Completata' || job.StatoAvanzamento === 'Completata';
                    const hasMissingMaterials = job.MaterialiMancanti && job.MaterialiMancanti.length > 0;
                    
                    return (
                      <button
                        key={job.CommessaID}
                        onClick={() => onSelectCommessa(job)}
                        className={`text-[10px] text-left px-2 py-1 rounded truncate shadow-sm hover:opacity-80 transition-opacity flex items-center justify-between group ${
                            isCompleted ? 'opacity-60' : ''
                        }`}
                        style={{ 
                          backgroundColor: isCompleted ? '#e5e7eb' : (job.ColoreCalcolato || '#e5e7eb'),
                          color: isCompleted ? '#6b7280' : (['#FFFFF0', '#ffffff', '#eab308'].includes(job.ColoreCalcolato) ? '#000' : '#fff')
                        }}
                        title={`${job.CommessaID} - ${job.Cliente}`}
                      >
                        <span className="truncate flex-1">{job.CommessaID}</span>
                        <div className="flex gap-1">
                            {hasMissingMaterials && !isCompleted && (
                                <AlertTriangle size={10} className="text-red-600 bg-white rounded-full p-[1px]" />
                            )}
                            {isCompleted && (
                                <CheckCheck size={10} />
                            )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};