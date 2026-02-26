import React, { useState } from 'react';
import { TrendingUp, Banknote, Lock, RefreshCcw, ClipboardList, Settings2, Trash2, Mail, AlertOctagon, Database, LifeBuoy } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const StatIcon = ({ icon: Icon, variant }) => (
  <div className={`p-4 rounded-2xl ${variant === 'amber' ? 'bg-amber-100 text-[#3E2723]' : 'bg-gray-100 text-gray-500'}`}><Icon size={32} /></div>
);

const TerminalView = ({ 
  financialStats, committeeApps, currentDailyKey, logs, secureKeys, hubSettings,
  handleToggleMaintenance, handleToggleRegistration, handleToggleRenewalMode, handleToggleAllowedPayment,
  handleRotateDailyKey, handleUpdateGcash, initiateAppAction, handleDeleteApp 
}) => {
  const [gcashInput, setGcashInput] = useState(hubSettings?.gcashNumber || '');

  return (
    <div className="space-y-10 animate-fadeIn text-[#3E2723] pb-20">
      <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
        <StatIcon icon={TrendingUp} variant="amber" />
        <div><h3 className="font-serif text-4xl font-black uppercase">Terminal</h3><p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p></div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Total</p><p className="text-2xl font-black">{financialStats.totalPaid + financialStats.exemptCount}</p></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Paid</p><p className="text-2xl font-black text-green-600">{financialStats.totalPaid}</p></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Exempt</p><p className="text-2xl font-black text-blue-600">{financialStats.exemptCount}</p></div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center"><p className="text-[10px] font-bold text-gray-400 uppercase">Apps</p><p className="text-2xl font-black text-purple-600">{committeeApps.length}</p></div>
      </div>

      <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-6"><Banknote size={32}/><h4 className="font-serif text-2xl font-black uppercase">Daily Cash Key</h4></div>
        <div className="flex items-center gap-4">
          <div className="bg-white/40 px-8 py-4 rounded-3xl border-2 border-dashed border-[#3E2723]/20 font-mono text-4xl font-black">{currentDailyKey}</div>
          <button onClick={handleRotateDailyKey} className="p-4 bg-[#3E2723] text-[#FDB813] rounded-2xl hover:scale-105 transition-transform"><RefreshCcw size={24} /></button>
        </div>
      </div>

      <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white shadow-xl">
        <h4 className="font-serif text-2xl font-black uppercase text-[#FDB813] mb-6">Security Vault</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10"><span className="text-[10px] uppercase text-white/60 block mb-1">Officer Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.officerKey || "N/A"}</span></div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10"><span className="text-[10px] uppercase text-white/60 block mb-1">Head Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.headKey || "N/A"}</span></div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10"><span className="text-[10px] uppercase text-white/60 block mb-1">Comm Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.commKey || "N/A"}</span></div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10"><span className="text-[10px] uppercase text-white/60 block mb-1">Bypass Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{secureKeys?.bypassKey || "N/A"}</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border-2 border-amber-200">
          <h4 className="font-black uppercase text-sm mb-4">System Controls</h4>
          <div className="space-y-3">
            <button onClick={handleToggleMaintenance} className={`w-full p-3 rounded-xl font-bold uppercase text-[10px] text-white ${hubSettings?.maintenanceMode ? 'bg-orange-500' : 'bg-gray-400'}`}>Maintenance: {hubSettings?.maintenanceMode ? "ON" : "OFF"}</button>
            <button onClick={handleToggleRegistration} className={`w-full p-3 rounded-xl font-bold uppercase text-[10px] text-white ${hubSettings?.registrationOpen ? 'bg-green-500' : 'bg-red-500'}`}>Registration: {hubSettings?.registrationOpen ? "OPEN" : "CLOSED"}</button>
            <div className="flex gap-2">
              <input type="text" value={gcashInput} onChange={(e) => setGcashInput(e.target.value)} className="flex-1 p-2 bg-gray-50 border rounded-lg text-xs" />
              <button onClick={() => handleUpdateGcash(gcashInput)} className="bg-[#3E2723] text-white px-4 rounded-lg text-[10px] font-bold">UPDATE GCASH</button>
            </div>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[40px] border-2 border-gray-200 overflow-y-auto max-h-60">
          <h4 className="font-black uppercase text-sm mb-4">Operations Log</h4>
          <div className="space-y-2">{logs.map(log => (<div key={log.id} className="text-[10px] p-2 bg-gray-50 rounded-lg"><strong>{log.action}</strong>: {log.details}</div>))}</div>
        </div>
      </div>

      <div className="bg-white p-10 rounded-[50px] border border-amber-100">
        <h4 className="font-serif text-xl font-black uppercase mb-4">Committee Applications</h4>
        <div className="space-y-4">
          {committeeApps.map(app => (
            <div key={app.id} className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex justify-between items-center">
              <div><p className="font-black text-sm">{app.name}</p><p className="text-[10px] uppercase text-amber-700">{app.committee} • {app.role}</p></div>
              <div className="flex gap-2">
                <button onClick={() => initiateAppAction(app, 'accepted')} className="px-4 py-2 bg-green-500 text-white rounded-lg font-bold text-[10px]">ACCEPT</button>
                <button onClick={() => initiateAppAction(app, 'denied')} className="px-4 py-2 bg-red-500 text-white rounded-lg font-bold text-[10px]">DENY</button>
                <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-400"><Trash2 size={16}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TerminalView;
