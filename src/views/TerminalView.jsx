import React, { useState } from 'react';
import { 
  Banknote, Lock, RefreshCcw, ClipboardList, Settings2, 
  Trash2, Mail, Download, ChevronDown, CreditCard, 
  CheckCircle2, AlertCircle, Search, UserCheck 
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

const TerminalView = ({ 
  financialStats, committeeApps, currentDailyKey, logs, secureKeys, hubSettings, 
  availableSemesters, registry, // Added registry to props to show current members
  handleToggleMaintenance, handleToggleRegistration, handleToggleRenewalMode, 
  handleTogglePayment, handleRotateKey, handleDownloadReport, 
  initiateAppAction, handleVerifyMember // Added handleVerifyMember
}) => {
  const [selectedSem, setSelectedSem] = useState('all');
  const [memberSearch, setMemberSearch] = useState('');

  // Filter for members needing verification (Unpaid/Pending)
  const pendingVerification = registry?.filter(m => m.paymentStatus !== 'paid') || [];

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* SUMMARY STATS */}
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

      {/* VERIFICATION QUEUE (The New Section for "Unpaid" Members) */}
      <div className="bg-white rounded-[50px] border-4 border-amber-400 shadow-xl overflow-hidden">
        <div className="bg-amber-400 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3 text-[#3E2723]">
            <UserCheck size={24} />
            <h4 className="font-serif text-xl font-black uppercase">Verification Queue</h4>
          </div>
          <span className="bg-[#3E2723] text-[#FDB813] px-4 py-1 rounded-full text-[10px] font-black uppercase">
            {pendingVerification.length} Pending
          </span>
        </div>
        
        <div className="p-8">
          {pendingVerification.length === 0 ? (
            <div className="text-center py-10 opacity-30">
              <CheckCircle2 size={48} className="mx-auto mb-2" />
              <p className="font-black uppercase text-xs tracking-widest">All Baristas Cleared</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
              {pendingVerification.map(m => (
                <div key={m.id} className="flex flex-col md:flex-row md:items-center justify-between p-5 bg-amber-50 rounded-3xl border border-amber-100 gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-black text-sm uppercase">{m.name}</p>
                      <span className="text-[9px] bg-white px-2 py-0.5 rounded border border-amber-200 font-bold">{m.memberId}</span>
                    </div>
                    <div className="flex gap-4 text-[9px] font-bold text-amber-800/60 uppercase">
                      <span>{m.program}</span>
                      <span>Method: <b className="text-[#3E2723]">{m.paymentMethod}</b></span>
                      {m.paymentRef && <span>Ref: <b className="text-blue-600">{m.paymentRef}</b></span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => handleVerifyMember(m.id)}
                    className="bg-[#3E2723] text-[#FDB813] px-8 py-3 rounded-2xl font-black text-[10px] uppercase hover:scale-105 transition-transform shadow-md flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={14}/> Verify Payment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* DAILY KEY & REPORTS */}
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
            <button onClick={() => handleDownloadReport?.(selectedSem)} className="bg-[#3E2723] text-[#FDB813] px-6 rounded-xl font-black uppercase text-[10px]">Export</button>
          </div>
        </div>
      </div>

      {/* SECURITY VAULT */}
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

      {/* SYSTEM CONTROLS & LOGS */}
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

      {/* COMMITTEE APPLICATIONS */}
      <div className="bg-white p-10 rounded-[50px] border-2 border-amber-50 shadow-sm">
        <h4 className="font-serif text-2xl font-black uppercase mb-6 text-[#3E2723]">Committee Applications</h4>
        {committeeApps.length === 0 ? (
          <p className="text-center py-6 text-[10px] font-black text-gray-300 uppercase italic">No Active Hunt</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {committeeApps.map(app => (
              <div key={app.id} className="p-5 bg-amber-50/50 rounded-3xl border border-amber-100">
                <div className="flex justify-between items-start mb-4">
                  <div><p className="font-black text-sm">{app.name}</p><p className="text-[9px] uppercase text-amber-700 font-bold">{app.committee} • {app.role}</p></div>
                  <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${app.status === 'for_interview' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{app.status === 'for_interview' ? 'Interview' : app.status}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => initiateAppAction(app, 'for_interview')} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold text-[9px]">INTERVIEW</button>
                  <button onClick={() => initiateAppAction(app, 'accepted')} className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold text-[9px]">ACCEPT</button>
                  <button onClick={() => initiateAppAction(app, 'denied')} className="flex-1 py-2 bg-red-500 text-white rounded-lg font-black text-[9px]">DENY</button>
                  <a href={`mailto:${app.email}`} className="p-2 bg-amber-100 text-[#3E2723] rounded-lg hover:bg-amber-200"><Mail size={16}/></a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalView;
