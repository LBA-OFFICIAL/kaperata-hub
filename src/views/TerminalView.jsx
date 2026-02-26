import React from 'react';
import { TrendingUp, Banknote, Lock, RefreshCcw, ClipboardList, Settings2, Trash2, Mail, FileText, Download } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const TerminalView = ({ 
  financialStats, committeeApps, currentDailyKey, logs, secureKeys, hubSettings,
  handleToggleMaintenance, handleToggleRegistration, handleToggleRenewalMode,
  handleRotateDailyKey, handleRotateSecurityKeys, handleDownloadReport, initiateAppAction, handleDeleteApp 
}) => {
  return (
    <div className="space-y-10 animate-fadeIn text-[#3E2723] pb-20">
      {/* 1. STATS SUMMARY */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-3xl border-2 border-amber-100 text-center">
          <p className="text-[10px] font-black uppercase text-gray-400">Total Registry</p>
          <p className="text-3xl font-black">{financialStats.totalPaid + financialStats.exemptCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-green-100 text-center">
          <p className="text-[10px] font-black uppercase text-green-400">Paid Members</p>
          <p className="text-3xl font-black text-green-600">{financialStats.totalPaid}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-blue-100 text-center">
          <p className="text-[10px] font-black uppercase text-blue-400">Exempted</p>
          <p className="text-3xl font-black text-blue-600">{financialStats.exemptCount}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border-2 border-purple-100 text-center">
          <p className="text-[10px] font-black uppercase text-purple-400">New Apps</p>
          <p className="text-3xl font-black text-purple-600">{committeeApps.length}</p>
        </div>
      </div>

      {/* 2. DAILY CASH KEY & REPORT DOWNLOADS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] flex items-center justify-between">
          <div className="flex items-center gap-4"><Banknote size={32} /> <h4 className="font-serif text-2xl font-black uppercase">Daily Key</h4></div>
          <div className="flex items-center gap-4">
            <span className="bg-white/40 px-6 py-3 rounded-2xl font-mono text-3xl font-black border-2 border-dashed border-[#3E2723]/20">{currentDailyKey}</span>
            <button onClick={handleRotateDailyKey} className="p-3 bg-[#3E2723] text-[#FDB813] rounded-xl hover:scale-110 transition-transform"><RefreshCcw size={20}/></button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border-4 border-[#3E2723] flex flex-col justify-center gap-3">
          <h4 className="font-black uppercase text-[10px] flex items-center gap-2 text-gray-400"><Download size={14}/> Export Financial Reports</h4>
          <div className="flex gap-2">
            <button onClick={() => handleDownloadReport('semester')} className="flex-1 bg-amber-50 text-[#3E2723] py-3 rounded-xl font-black uppercase text-[10px] border-2 border-[#3E2723] hover:bg-amber-100">Current Semester</button>
            <button onClick={() => handleDownloadReport('all')} className="flex-1 bg-[#3E2723] text-[#FDB813] py-3 rounded-xl font-black uppercase text-[10px] hover:bg-black">Full Registry</button>
          </div>
        </div>
      </div>

      {/* 3. SECURITY VAULT */}
      <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white">
        <div className="flex justify-between items-center mb-6"><h4 className="font-serif text-2xl font-black uppercase text-[#FDB813]">Security Vault</h4><Lock size={24} className="text-[#FDB813]"/></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/10 p-4 rounded-xl border border-white/5"><span className="text-[9px] uppercase text-white/50 block">Officer</span><span className="font-mono font-bold text-[#FDB813]">{secureKeys?.officerKey || '---'}</span></div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/5"><span className="text-[9px] uppercase text-white/50 block">Head</span><span className="font-mono font-bold text-[#FDB813]">{secureKeys?.headKey || '---'}</span></div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/5"><span className="text-[9px] uppercase text-white/50 block">Comm</span><span className="font-mono font-bold text-[#FDB813]">{secureKeys?.commKey || '---'}</span></div>
          <div className="bg-white/10 p-4 rounded-xl border border-white/5"><span className="text-[9px] uppercase text-white/50 block">Bypass</span><span className="font-mono font-bold text-[#FDB813]">{secureKeys?.bypassKey || '---'}</span></div>
        </div>
        <button onClick={handleRotateSecurityKeys} className="w-full bg-red-600 py-4 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-red-700 transition-colors"><RefreshCcw size={16}/> Rotate Master Keys</button>
      </div>

      {/* 4. SYSTEM CONTROLS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 space-y-4">
          <h4 className="font-black uppercase text-sm mb-2 flex items-center gap-2"><Settings2 size={18}/> System Controls</h4>
          <button onClick={handleToggleMaintenance} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] text-white ${hubSettings?.maintenanceMode ? 'bg-orange-500' : 'bg-gray-300'}`}>Maintenance: {hubSettings?.maintenanceMode ? "ACTIVE" : "OFF"}</button>
          <button onClick={handleToggleRegistration} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] text-white ${hubSettings?.registrationOpen ? 'bg-green-500' : 'bg-red-500'}`}>Registration: {hubSettings?.registrationOpen ? "OPEN" : "CLOSED"}</button>
          <button onClick={handleToggleRenewalMode} className={`w-full py-4 rounded-2xl font-black uppercase text-[10px] text-white ${hubSettings?.renewalMode ? 'bg-blue-500' : 'bg-gray-300'}`}>Renewal Season: {hubSettings?.renewalMode ? "ACTIVE" : "OFF"}</button>
        </div>

        <div className="bg-white p-8 rounded-[40px] border-2 border-gray-100 overflow-y-auto max-h-[300px]">
          <h4 className="font-black uppercase text-sm mb-4">Operations Log</h4>
          <div className="space-y-2">{logs.map(log => (<div key={log.id} className="text-[10px] p-3 bg-gray-50 rounded-xl border border-gray-100"><strong>{log.action}</strong>: {log.details}</div>))}</div>
        </div>
      </div>

      {/* 5. COMMITTEE HUNT */}
      <div className="bg-white p-10 rounded-[50px] border-2 border-amber-50">
        <h4 className="font-serif text-2xl font-black uppercase mb-6">Committee Applications</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {committeeApps.map(app => (
            <div key={app.id} className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100 flex justify-between items-center">
              <div><p className="font-black text-sm">{app.name}</p><p className="text-[9px] uppercase text-amber-700 font-bold">{app.committee} • {app.role}</p></div>
              <div className="flex gap-2">
                <button onClick={() => initiateAppAction(app, 'accepted')} className="px-4 py-2 bg-green-500 text-white rounded-xl font-black text-[9px]">ACCEPT</button>
                <button onClick={() => initiateAppAction(app, 'denied')} className="px-4 py-2 bg-red-500 text-white rounded-xl font-black text-[9px]">DENY</button>
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
