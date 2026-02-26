import React, { useState } from 'react';
import { 
  TrendingUp, Banknote, Lock, RefreshCcw, ClipboardList, 
  Trash2, Mail, FileText, Settings2, Download, CreditCard, ToggleRight
} from 'lucide-react';
import { formatDate, getDirectLink, ORG_LOGO_URL } from '../utils/helpers';

const TerminalView = ({ 
  committeeApps, 
  logs, 
  secureKeys, 
  hubSettings, 
  setHubSettings,
  currentDailyKey, // Passed from HubContext/Dashboard
  handleRotateSecurityKeys,
  initiateAppAction,
  handleDeleteApp,
  generateReport // Function to trigger CSV download
}) => {
  const [newGcash, setNewGcash] = useState(hubSettings?.gcashNumber || '');

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn text-[#3E2723] pb-20">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b-4 border-[#3E2723] pb-8">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-amber-100 rounded-3xl text-[#3E2723]">
            <TrendingUp size={40} strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-serif text-5xl font-black uppercase tracking-tight">Terminal</h3>
            <p className="text-amber-500 font-black uppercase text-xs tracking-[0.2em]">The Control Roaster</p>
          </div>
        </div>
        <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-16 h-16 object-contain" />
      </div>

      {/* 2. DAILY CASH KEY & FINANCIAL REPORTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-[8px_8px_0px_0px_rgba(62,39,35,1)] flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="bg-[#3E2723] p-4 rounded-2xl text-[#FDB813]">
              <Banknote size={32}/>
            </div>
            <div>
              <h4 className="font-serif text-2xl font-black uppercase leading-none">Daily Cash Key</h4>
              <p className="text-[10px] font-black uppercase opacity-70 mt-1">Verification Passkey</p>
            </div>
          </div>
          <div className="bg-white px-10 py-5 rounded-3xl border-4 border-[#3E2723] font-mono text-5xl font-black tracking-tighter">
            {currentDailyKey || "---"}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border-4 border-[#3E2723] flex flex-col justify-center">
          <h4 className="font-black uppercase text-xs mb-4 flex items-center gap-2"><FileText size={16}/> Financial Reports</h4>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => generateReport('all')} className="bg-[#3E2723] text-[#FDB813] py-3 rounded-xl font-black uppercase text-[9px] hover:bg-black transition-all flex items-center justify-center gap-2">
              <Download size={14}/> Full Audit
            </button>
            <button onClick={() => generateReport('semester')} className="border-2 border-[#3E2723] py-3 rounded-xl font-black uppercase text-[9px] hover:bg-amber-50 transition-all">
              Sem View
            </button>
          </div>
        </div>
      </div>

      {/* 3. SYSTEM CONTROLS & GCASH TURNOVER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[50px] border-2 border-amber-200 shadow-sm">
          <h4 className="font-black uppercase text-sm mb-6 flex items-center gap-2"><Settings2 size={18}/> System Controls</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl">
              <div>
                <p className="font-black uppercase text-xs">Renewal Season</p>
                <p className="text-[10px] text-gray-500">Enable member fee collection</p>
              </div>
              <input type="checkbox" checked={hubSettings?.renewalMode} onChange={(e) => setHubSettings({...hubSettings, renewalMode: e.target.checked})} className="w-6 h-6 accent-[#3E2723]" />
            </div>
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
              <div>
                <p className="font-black uppercase text-xs text-red-800">Maintenance Mode</p>
                <p className="text-[10px] text-red-600/60">Lock app for non-admins</p>
              </div>
              <input type="checkbox" checked={hubSettings?.maintenanceMode} onChange={(e) => setHubSettings({...hubSettings, maintenanceMode: e.target.checked})} className="w-6 h-6 accent-red-600" />
            </div>
            {/* GCASH UPDATE SECTION */}
            <div className="pt-4 border-t border-amber-100">
               <p className="font-black uppercase text-[10px] mb-2 text-gray-400">Officer Turnover: GCash Update</p>
               <div className="flex gap-2">
                 <input type="text" value={newGcash} onChange={(e) => setNewGcash(e.target.value)} placeholder="New Number" className="flex-1 p-3 bg-gray-50 border border-amber-200 rounded-xl font-mono text-sm" />
                 <button onClick={() => setHubSettings({...hubSettings, gcashNumber: newGcash})} className="bg-[#3E2723] text-white px-4 rounded-xl font-black uppercase text-[9px]">Update</button>
               </div>
            </div>
          </div>
        </div>

        {/* 4. SECURITY VAULT (Full Keys) */}
        <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-serif text-2xl font-black uppercase text-[#FDB813]">Security Vault</h4>
            <Lock size={24} className="text-[#FDB813]"/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { label: 'Officer', val: secureKeys?.officerKey },
              { label: 'Comm Head', val: secureKeys?.headKey },
              { label: 'Comm Member', val: secureKeys?.commKey },
              { label: 'Bypass Key', val: secureKeys?.bypassKey }
            ].map(k => (
              <div key={k.label} className="p-3 bg-white/10 rounded-xl border border-white/5">
                <p className="text-[8px] font-black uppercase text-amber-200 mb-1">{k.label}</p>
                <p className="font-mono text-xs font-bold tracking-widest">{k.val || '---'}</p>
              </div>
            ))}
          </div>
          <button onClick={handleRotateSecurityKeys} className="w-full mt-6 bg-red-600 py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-red-700 flex items-center justify-center gap-2">
            <RefreshCcw size={14}/> Rotate Security Keys
          </button>
        </div>
      </div>

      {/* 5. COMMITTEE HUNT SECTION */}
      <div className="bg-white p-10 rounded-[60px] border-2 border-amber-100 shadow-xl">
        <h4 className="font-serif text-3xl font-black uppercase text-[#3E2723] mb-8">Committee Hunt</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {committeeApps?.length > 0 ? (
            committeeApps.map(app => (
              <div key={app.id} className="p-6 bg-amber-50/50 rounded-[32px] border-2 border-amber-100">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="font-black text-lg text-[#3E2723]">{app.name}</p>
                    <p className="text-[10px] font-mono font-bold text-amber-700/60 uppercase">{app.memberId} | {app.committee}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => initiateAppAction(app, 'for_interview')} className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl font-black uppercase text-[10px]">Interview</button>
                  <button onClick={() => initiateAppAction(app, 'accepted')} className="flex-1 py-3 bg-[#3E2723] text-[#FDB813] rounded-xl font-black uppercase text-[10px]">Accept</button>
                  <button onClick={() => handleDeleteApp(app.id)} className="px-4 py-3 bg-red-100 text-red-600 rounded-xl"><Trash2 size={16}/></button>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full py-20 text-center text-xs font-black uppercase text-gray-400 tracking-widest">No candidates in the grinder</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TerminalView;
