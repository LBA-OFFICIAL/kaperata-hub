import React, { useState, useContext, useMemo } from 'react';
import { doc, updateDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './firebase'; 
import { HubContext, HubProvider } from './contexts/HubContext.jsx'; // Added HubProvider
import { generateLBAId, getDailyCashPasskey } from './utils/helpers';

// Components
import Sidebar from './components/Sidebar.jsx';
import TerminalView from './views/TerminalView.jsx';
import RegistryView from './views/RegistryView.jsx';

// 1. Rename to match the App.jsx import or export as default
const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  // These values come from HubContext. If HubContext is null, the app crashes.
  const { hubSettings, profile, members, committeeApps } = useContext(HubContext) || {};

  const financialStats = useMemo(() => ({
    totalPaid: members?.filter(m => m.paymentStatus === 'paid').length || 0,
    pending: members?.filter(m => m.paymentStatus === 'unpaid').length || 0,
    exempt: members?.filter(m => m.paymentStatus === 'exempt').length || 0
  }), [members]);

  const handleVerifyMember = async (memberDocId) => {
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
        const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberDocId);
        
        const counterSnap = await transaction.get(counterRef);
        const memberSnap = await transaction.get(memberRef);

        if (!memberSnap.exists()) throw "Member record missing.";

        const currentCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0;
        const officialId = generateLBAId(memberSnap.data().positionCategory, currentCount);

        transaction.update(memberRef, {
          memberId: officialId,
          paymentStatus: 'paid',
          verifiedAt: serverTimestamp(),
          verifiedBy: profile?.name || 'Admin'
        });

        transaction.set(counterRef, { memberCount: currentCount + 1 }, { merge: true });
      });
    } catch (err) {
      console.error("Verification Failed:", err);
    }
  };

  const handleUpdateSetting = async (field, val) => {
    try {
      const opsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops');
      await updateDoc(opsRef, { [field]: val });
    } catch (e) { console.error("Setting update failed", e); }
  };

  const handleRotateKey = async (type) => {
    try {
      const path = type === 'daily' ? ['settings', 'ops'] : ['settings', 'keys'];
      const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', ...path), { 
        [type === 'daily' ? 'dailyKey' : type]: newKey 
      });
    } catch (e) { console.error("Key rotation failed", e); }
  };

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
      <Sidebar view={view} setView={setView} logout={logout} isSystemAdmin={isSystemAdmin} />

     <main className="flex-1 overflow-y-auto p-6 md:p-12">
  
  {/* 1. THE HOME CHANNEL (What shows up first) */}
  {view === 'home' && (
    <div className="animate-in fade-in duration-500">
      <h1 className="font-serif text-3xl font-black text-[#3E2723]">
        Welcome to the Hub! ☕
      </h1>
      <p className="mt-2 text-amber-600 font-bold uppercase text-[10px] tracking-widest">
        Select a tab from the sidebar to begin.
      </p>
      
      {/* A simple status card so you know it's working */}
      <div className="mt-8 p-6 bg-white rounded-[30px] border-b-4 border-amber-400 shadow-sm max-w-sm">
        <p className="text-[10px] font-black text-gray-400 uppercase">System Status</p>
        <p className="text-lg font-black text-[#3E2723]">Connected to Kaperata DB</p>
      </div>
    </div>
  )}

  {/* 2. THE MEMBERS CHANNEL */}
  {view === 'members' && <RegistryView members={members} />}

  {/* 3. THE REPORTS CHANNEL (Only for Admins) */}
  {view === 'reports' && isSystemAdmin && (
    <TerminalView 
      registry={members}
      financialStats={financialStats}
      hubSettings={hubSettings}
      handleVerifyMember={handleVerifyMember}
      handleRotateKey={handleRotateKey}
      // ... keep the rest of your existing props here
    />
  )}

</main>
    </div>
  );
};

// 2. THE EXPORT WRAPPER
// This provides the context data that DashboardContent needs to run.
const Dashboard = (props) => (
  <HubProvider>
    <DashboardContent {...props} />
  </HubProvider>
);

export default Dashboard;
