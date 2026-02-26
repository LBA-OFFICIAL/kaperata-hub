import React from 'react';
import { 
  TrendingUp, Banknote, Lock, RefreshCcw, ClipboardList, 
  Settings2, Trash2, Mail, FileText 
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

// Note: I replaced StatIcon with a standard div if StatIcon is missing
const AdminTerminal = ({ 
  committeeApps, 
  currentDailyKey, 
  logs, 
  handleRotateSecurityKeys,
  initiateAppAction,
  handleDeleteApp
}) => {
  return (
    <div className="space-y-10 animate-fadeIn text-[#3E2723]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
        <div className="p-4 bg-amber-100 rounded-2xl text-amber-700">
          <TrendingUp size={32} />
        </div>
        <div>
          <h3 className="font-serif text-4xl font-black uppercase">Terminal</h3>
          <p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Pending Apps</p>
          <p className="text-2xl font-black text-purple-600">
            {committeeApps?.filter(a => !['accepted','denied'].includes(a.status)).length || 0}
          </p>
        </div>
      </div>

      {/* Daily Cash Key Vault */}
      <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Banknote size={32}/>
          <div className="leading-tight">
            <h4 className="font-serif text-2xl font-black uppercase">Daily Cash Key</h4>
            <p className="text-[10px] font-black uppercase opacity-60">Verification Code</p>
          </div>
        </div>
        <div className="bg-white/40 px-8 py-4 rounded-3xl border-2 border-dashed border-[#3E2723]/20 font-mono text-4xl font-black">
          {currentDailyKey}
        </div>
      </div>

      {/* Security Vault */}
      <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-serif text-2xl font-black uppercase text-[#FDB813]">Security Vault</h4>
          <Lock size={24} className="text-[#FDB813]"/>
        </div>
        <button 
          onClick={handleRotateSecurityKeys} 
          className="w-full mt-6 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCcw size={14}/> Rotate Security Keys
        </button>
      </div>

      {/* Operations Log */}
      <div className="bg-white p-8 rounded-[40px] border-2 border-gray-200 shadow-sm max-h-96 overflow-y-auto">
        <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2">
          <ClipboardList size={16}/> Operations Log
        </h4>
        <div className="space-y-2">
          {logs && logs.length > 0 ? (
            logs.map(log => (
              <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs">
                <div>
                  <span className="font-bold text-[#3E2723] block">{log.action}</span>
                  <span className="text-gray-500">{log.details}</span>
                </div>
                <div className="text-right">
                  <span className="block font-bold text-amber-700">{log.actor}</span>
                  <span className="text-[9px] text-gray-400">
                    {log.timestamp?.toDate ? formatDate(log.timestamp.toDate()) : 'Just now'}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 text-xs py-4">No recent activity recorded.</p>
          )}
        </div>
      </div>

      {/* Committee Applications */}
      <div className="bg-white p-10 rounded-[50px] border border-amber-100 shadow-xl">
        <h4 className="font-serif text-xl font-black uppercase mb-4 text-[#3E2723]">Committee Applications</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {committeeApps && committeeApps.length > 0 ? (
            committeeApps.map(app => (
              <div key={app.id} className="p-4 bg-amber-50 rounded-2xl text-xs border border-amber-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-black text-sm text-[#3E2723]">{app.name}</p>
                    <p className="text-[10px] font-mono text-gray-500">{app.memberId}</p>
                  </div>
                </div>
                <p className="text-amber-700 font-bold mb-3">{app.committee} • {app.role}</p>
                <div className="flex gap-2 pt-3 border-t border-amber-200/50">
                  <button onClick={() => initiateAppAction(app, 'for_interview')} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold">Interview</button>
                  <button onClick={() => initiateAppAction(app, 'accepted')} className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold">Accept</button>
                  <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-400"><Trash2 size={14}/></button>
                  <a href={`mailto:${app.email}`} className="p-2 text-blue-400"><Mail size={14}/></a>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-gray-500 italic">No applications found.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTerminal;
