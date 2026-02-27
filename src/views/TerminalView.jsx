import React, { useState } from 'react';
import { Banknote, Lock, RefreshCcw, ClipboardList, Settings2, Trash2, Mail, Download, ChevronDown, CreditCard } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const TerminalView = ({ 
  financialStats, committeeApps, currentDailyKey, logs, secureKeys, hubSettings, availableSemesters,
  handleToggleMaintenance, handleToggleRegistration, handleToggleRenewalMode, handleTogglePayment,
  handleRotateKey, handleDownloadReport, initiateAppAction, handleDeleteApp 
}) => {
  const [selectedSem, setSelectedSem] = useState('all');

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* 1. SUMMARY CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border-2 border-amber-100 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase text-gray-400">Total Registry</p>
          <p className="text-3xl font-black">{financialStats.totalPaid + financialStats.exemptCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-green-100 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase text-green-400">Paid</p>
          <p className="text-3xl font-black text-green-600">{financialStats.totalPaid}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase text-blue-400">Exempt</p>
          <p className="text-3xl font-black text-blue-600">{financialStats.exemptCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-purple-100 text-center shadow-sm">
          <p className="text-[10px] font-black uppercase text-purple-400">Apps</p>
          <p className="text-3xl font-black text-purple-600">{committeeApps.length}</p>
        </div>
      </div>

      {/* 2. DAILY KEY & DYNAMIC DROPDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4 text-[#3E2723]"><Banknote size={32}/><h4 className="font-serif text-2xl font-black uppercase">Daily Key</h4></div>
          <div className="flex items-center gap-4">
            <span className="bg-white/40 px-6 py-3 rounded-2xl font-mono text-3xl font-black border-2 border-[#3E2723]/20">{currentDailyKey}</span>
            <button onClick={() => handleRotateKey('daily')} className="p-3 bg-[#3E2723] text-[#FDB813] rounded-xl hover:rotate-180 transition-transform duration-500"><RefreshCcw size={20}/></button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border-4 border-[#3E2723] space-y-4">
          <h4 className="font-black uppercase text-[10px] text-gray-400 flex items-center gap-2"><Download size={14}/> Academic Reports</h4>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select value={selectedSem} onChange={(e) => setSelectedSem(e.target.value)} className="w-full appearance-none bg-amber-50 border-2 border-[#3E2723] p-3 rounded-xl font-black uppercase text-[10px] pr-10">
                <option value="all">All-Time Registry</option>
                {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-3" size={16} />
            </div>
            <button onClick={() => handleDownloadReport(selectedSem)} className="bg-[#3E2723] text-[#FDB813] px-6 rounded-xl font-black uppercase text-[10px]">Export</button>
          </div>
        </div>
      </div>

      {/* 3. SECURITY VAULT (INDIVIDUAL RESET) */}
      <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white">
        <h4 className="font-serif text-2xl font-black uppercase text-[#FDB813] mb-6">Security Vault</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { id: 'officerKey', label: 'Officer' },
            { id: 'headKey', label: 'Comm Head' },
            { id: 'commKey', label: 'Comm Member' },
            { id: 'bypassKey', label: 'Bypass' }
          ].map(k => (
            <div key={k.id} className="bg-white/10 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div><span className="text-[9px] uppercase text-white/50 block mb-1">{k.label}</span><span className="font-mono text-xl font-black text-[#FDB813] tracking-widest">{secureKeys?.[k.id] || '---'}</span></div>
              <button onClick={() => handleRotateKey(k.id)} className="mt-3 text-[8px] font-black uppercase text-[#FDB813] flex items-center gap-1 hover:opacity-70"><RefreshCcw size={10}/> Rotate</button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SYSTEM CONTROLS (RESTORED GCASH TOGGLE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border-2 border-amber-200 space-y-4 shadow-sm">
          <h4 className="font-black uppercase text-sm mb-2 flex items-center gap-2"><Settings2 size={18}/> System Controls</h4>
          <button onClick={handleToggleMaintenance} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] text-white transition-all ${hubSettings?.maintenanceMode ? 'bg-orange-500 shadow-lg' : 'bg-gray-300'}`}>Maintenance: {hubSettings?.maintenanceMode ? "ACTIVE" : "OFF"}</button>
          <button onClick={handleToggleRegistration} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] text-white transition-all ${hubSettings?.registrationOpen ? 'bg-green-500 shadow-lg' : 'bg-red-500'}`}>Registration: {hubSettings?.registrationOpen ? "OPEN" : "CLOSED"}</button>
          <button onClick={handleToggleRenewalMode} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] text-white transition-all ${hubSettings?.renewalMode ? 'bg-blue-500 shadow-lg' : 'bg-gray-300'}`}>Renewal Season: {hubSettings?.renewalMode ? "ACTIVE" : "OFF"}</button>
          <button onClick={handleTogglePayment} className="w-full py-4 rounded-2xl font-black uppercase text-[10px] bg-amber-100 text-[#3E2723] flex items-center justify-center gap-2 border-2 border-[#3E2723]">
             <CreditCard size={14}/> {hubSettings?.allowedPayment === 'gcash_only' ? "GCASH ONLY" : "CASH & GCASH"}
          </button>
        </div>

        <div className="bg-white p-8 rounded-[40px] border-2 border-gray-100 overflow-y-auto max-h-[350px]">
          <h4 className="font-black uppercase text-sm mb-4">Operations Log</h4>
          <div className="space-y-2">{logs.map(log => (<div key={log.id} className="text-[10px] p-3 bg-gray-50 rounded-xl border border-gray-100"><strong>{log.action}</strong>: {log.details}</div>))}</div>
        </div>
      </div>
    </div>
  );
};

export default TerminalView;
