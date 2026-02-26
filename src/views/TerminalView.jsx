import React from 'react';
import { 
  TrendingUp, Banknote, Lock, RefreshCcw, ClipboardList, 
  Settings2, Trash2, Mail, FileText, ChevronRight
} from 'lucide-react';
// Note the double dots '../' because we are inside the 'views' folder
import { formatDate, getDirectLink, ORG_LOGO_URL } from '../utils/helpers';

const TerminalView = ({ 
  committeeApps, 
  currentDailyKey, 
  logs, 
  handleRotateSecurityKeys,
  initiateAppAction,
  handleDeleteApp,
  secureKeys,
  hubSettings,
  setHubSettings
}) => {
  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-fadeIn text-[#3E2723] pb-20">
      
      {/* HEADER SECTION */}
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
        
        {/* Quick Stats Row */}
        <div className="flex gap-3">
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-amber-100 text-center">
            <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Queue</p>
            <p className="text-xl font-black text-[#3E2723]">
              {committeeApps?.filter(a => !['accepted','denied'].includes(a.status)).length || 0}
            </p>
          </div>
          <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-16 h-16 object-contain" />
        </div>
      </div>

      {/* DAILY CASH KEY VAULT */}
      <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-[8px_8px_0px_0px_rgba(62,39,35,1)] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <div className="bg-[#3E2723] p-4 rounded-2xl text-[#FDB813]">
            <Banknote size={32}/>
          </div>
          <div className="leading-tight">
            <h4 className="font-serif text-3xl font-black uppercase">Daily Cash Key</h4>
            <p className="text-xs font-black uppercase opacity-70">Station Verification Code</p>
          </div>
        </div>
        <div className="bg-white px-10 py-5 rounded-3xl border-4 border-[#3E2723] font-mono text-5xl font-black tracking-tighter shadow-inner">
          {currentDailyKey || "---"}
        </div>
      </div>

      {/* SECURITY VAULT & SYSTEM CONTROLS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Security Keys */}
        <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-8">
              <h4 className="font-serif text-3xl font-black uppercase text-[#FDB813]">Security Vault</h4>
              <Lock size={28} className="text-[#FDB813]"/>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between p-3 bg-white/10 rounded-xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-amber-200">Officer Key</span>
                <span className="font-mono font-bold">{secureKeys?.officerKey || '••••••'}</span>
              </div>
              <div className="flex justify-between p-3 bg-white/10 rounded-xl border border-white/5">
                <span className="text-[10px] font-black uppercase text-amber-200">Bypass Key</span>
                <span className="font-mono font-bold">{secureKeys?.bypassKey || '••••••'}</span>
              </div>
            </div>

            <button 
              onClick={handleRotateSecurityKeys} 
              className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs hover:bg-red-700 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg"
            >
              <RefreshCcw size={18}/> Rotate Security Keys
            </button>
          </div>
        </div>

        {/* Ops Log */}
        <div className="bg-white p-8 rounded-[50px] border-2 border-gray-200 shadow-
