import React from 'react';
import { 
  TrendingUp, Banknote, Lock, RefreshCcw, ClipboardList, 
  Settings2, Trash2, Mail, AlertOctagon, Database, LifeBuoy 
} from 'lucide-react';
import { formatDate } from '../utils/helpers';

// Inline StatIcon to prevent "Component not defined" crashes
const StatIcon = ({ icon: Icon, variant }) => (
  <div className={`p-4 rounded-2xl ${variant === 'amber' ? 'bg-amber-100 text-[#3E2723]' : 'bg-gray-100 text-gray-500'}`}>
    <Icon size={32} />
  </div>
);

const TerminalView = ({ 
  financialStats = { totalPaid: 0, exemptCount: 0 },
  committeeApps = [], 
  currentDailyKey = "---",
  logs = [],
  secureKeys = {},
  hubSettings = {},
  handleRotateSecurityKeys,
  handleToggleMaintenance,
  handleToggleRegistration,
  handleToggleRenewalMode,
  handleToggleAllowedPayment,
  handleSanitizeDatabase,
  handleMigrateToRenewal,
  handleRecoverLostData,
  initiateAppAction,
  handleDeleteApp
}) => {
  return (
    <div className="space-y-10 animate-fadeIn text-[#3E2723] pb-20">
      
      {/* HEADER */}
      <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
        <StatIcon icon={TrendingUp} variant="amber" />
        <div>
          <h3 className="font-serif text-4xl font-black uppercase tracking-tight">Terminal</h3>
          <p className="text-amber-500 font-black uppercase text-[10px] tracking-widest">The Control Roaster</p>
        </div>
      </div>

      {/* FINANCIAL OVERVIEW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
          <p className="text-2xl font-black text-[#3E2723]">{financialStats.totalPaid + financialStats.exemptCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Paid</p>
          <p className="text-2xl font-black text-green-600">{financialStats.totalPaid}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Exempt</p>
          <p className="text-2xl font-black text-blue-600">{financialStats.exemptCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-amber-50 text-center">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Apps</p>
          <p className="text-2xl font-black text-purple-600">
            {committeeApps.filter(a => !['accepted','denied'].includes(a.status)).length}
          </p>
        </div>
      </div>

      {/* DAILY CASH KEY */}
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

      {/* SECURITY VAULT */}
      <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white shadow-xl">
        <div className="flex justify-between items-center mb-6">
          <h4 className="font-serif text-2xl font-black uppercase text-[#FDB813]">Security Vault</h4>
          <Lock size={24} className="text-[#FDB813]"/>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-white/60 block mb-1">Officer Key</span>
            <span className="font-mono text-xl font-black text-[#FDB813] tracking-wider">{secureKeys?.officerKey || "N/A"}</span>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-white/60 block mb-1">Head Key</span>
            <span className="font-mono text-xl font-black text-[#FDB813] tracking-wider">{secureKeys?.headKey || "N/A"}</span>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
            <span className="text-[10px] font-black uppercase text-white/60 block mb-1">Comm Key</span>
            <span className="font-mono text-xl font-black text-[#FDB813] tracking-wider">{secureKeys?.commKey || "N/A"}</span>
          </div>
          <div className="bg-white/10 p-4 rounded-2xl border border-white/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#FDB813] text-[#3E2723] text-[8px] font-black px-2 py-0.5 rounded-bl-lg">PAYMENT BYPASS</div>
            <span className="text-[10px] font-black uppercase text-white/60 block mb-1">Bypass Key</span>
            <span className="font-mono text-xl font-black text-[#FDB813] tracking-wider">{secureKeys?.bypassKey || "N/A"}</span>
          </div>
        </div>
        <button onClick={handleRotateSecurityKeys} className="w-full mt-6 bg-red-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
          <RefreshCcw size={14}/> Rotate Security Keys
        </button>
      </div>

      {/* OPERATIONS LOG */}
      <div className="bg-white p-8 rounded-[40px] border-2 border-gray-200 shadow-sm max-h-96 overflow-y-auto custom-scrollbar">
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

      {/* SYSTEM CONTROLS & DANGER ZONE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border-2 border-amber-200 shadow-sm">
          <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2"><Settings2 size={16}/> System Controls</h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold text-gray-600">Maintenance Mode</span>
              <button onClick={handleToggleMaintenance} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white transition-colors ${hubSettings?.maintenanceMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 hover:bg-gray-500'}`}>
                {hubSettings?.maintenanceMode ? "ACTIVE" : "OFF"}
              </button>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold text-gray-600">Registration</span>
              <button onClick={handleToggleRegistration} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white transition-colors ${hubSettings?.registrationOpen ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>
                {hubSettings?.registrationOpen ? "OPEN" : "CLOSED"}
              </button>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold text-gray-600">Renewal Season</span>
              <button onClick={handleToggleRenewalMode} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white transition-colors ${hubSettings?.renewalMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'}`}>
                {hubSettings?.renewalMode ? "ACTIVE" : "OFF"}
              </button>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
              <span className="text-xs font-bold text-gray-600">Payment Methods</span>
              <button onClick={handleToggleAllowedPayment} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-200">
                {hubSettings?.allowedPayment === 'gcash_only' ? 'GCash Only' : 'Cash & GCash'}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] border-2 border-red-100 shadow-sm">
          <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2 text-red-700"><AlertOctagon size={16}/> Danger Zone</h4>
          <div className="space-y-3">
            <button onClick={handleSanitizeDatabase} className="w-full bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-red-100">
              <Database size={14}/> Sanitize Database
            </button>
            <button onClick={handleMigrateToRenewal} className="w-full bg-orange-50 text-orange-600 border border-orange-100 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-orange-100">
              <RefreshCcw size={14}/> Migrate: Set All to Renewal
            </button>
            <button onClick={handleRecoverLostData} className="w-full bg-blue-50 text-blue-600 border border-blue-100 py-3 rounded-xl font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-blue-100">
              <LifeBuoy size={14}/> Recover Lost Data
            </button>
          </div>
        </div>
      </div>

      {/* COMMITTEE APPLICATIONS */}
      <div className="bg-white p-10 rounded-[50px] border border-amber-100 shadow-xl">
        <h4 className="font-serif text-xl font-black uppercase mb-4 text-[#3E2723]">Committee Applications</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {committeeApps?.length > 0 ? (
            committeeApps.map(app => (
              <div key={app.id} className="p-4 bg-amber-50 rounded-2xl text-xs border border-amber-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-black text-sm text-[#3E2723]">{app.name}</p>
                    <p className="text-[10px] font-mono text-gray-500">{app.memberId}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[8px] font-black uppercase ${app.status === 'for_interview' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {app.status === 'for_interview' ? 'Interview' : app.status}
                  </span>
                </div>
                <p className="text-amber-700 font-bold mb-3 uppercase tracking-tighter">{app.committee} • {app.role}</p>
                <div className="flex gap-2 pt-3 border-t border-amber-200/50">
                  <button onClick={() => initiateAppAction(app, 'for_interview')} className="flex-1 py-2 bg-blue-100 text-blue-700 rounded-lg font-bold hover:bg-blue-200">Interview</button>
                  <button onClick={() => initiateAppAction(app, 'accepted')} className="flex-1 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600">Accept</button>
                  <button onClick={() => handleDeleteApp(app.id)} className="p-2 text-red-400 hover:text-red-600"><Trash2 size={14}/></button>
                  <a href={`mailto:${app.email}`} className="p-2 text-blue-400" title="Email Applicant"><Mail size={14}/></a>
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

export default TerminalView;
