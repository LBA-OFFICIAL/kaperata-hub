import React, { useState, useContext, useMemo } from 'react';
import { doc, updateDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './firebase'; 
import { HubContext } from './contexts/HubContext.jsx';
import { generateLBAId, getDailyCashPasskey } from './utils/helpers';

// Components
import Sidebar from './components/Sidebar.jsx';
import TerminalView from './views/TerminalView.jsx';
import RegistryView from './views/RegistryView.jsx';

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const { hubSettings, profile, members, committeeApps, secureKeys } = useContext(HubContext);

  // 1. DYNAMIC STATS (Updates instantly as members are verified)
  const financialStats = useMemo(() => ({
    totalPaid: members?.filter(m => m.paymentStatus === 'paid').length || 0,
    pending: members?.filter(m => m.paymentStatus === 'unpaid').length || 0,
    exempt: members?.filter(m => m.paymentStatus === 'exempt').length || 0
  }), [members]);

  // 2. THE ATOMIC VERIFIER (The core of the "Smooth Flow")
  // This turns an 'unpaid' registration into an 'Official LBA Member'
  const handleVerifyMember = async (memberDocId) => {
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
        const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberDocId);
        
        const counterSnap = await transaction.get(counterRef);
        const memberSnap = await transaction.get(memberRef);

        if (!memberSnap.exists()) throw "Member record missing.";

        // Calculate next ID based on your existing counter
        const currentCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0;
        const officialId = generateLBAId(memberSnap.data().positionCategory, currentCount);

        // Update Member & Increment Counter in one atomic "Breath"
        transaction.update(memberRef, {
          memberId: officialId, // Replaces the temp ID with the permanent LBA ID
          paymentStatus: 'paid',
          verifiedAt: serverTimestamp(),
          verifiedBy: profile?.name || 'Admin'
        });

        transaction.set(counterRef, { memberCount: currentCount + 1 }, { merge: true });
      });
      console.log("Member successfully verified and ID assigned.");
    } catch (err) {
      console.error("Verification Transaction Failed:", err);
      alert("System busy. Please try verifying again.");
    }
  };

  // 3. SYSTEM TOGGLES (Maintenance, Registration, Keys)
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

      <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        {/* VIEW: MEMBER REGISTRY */}
        {view === 'members' && <RegistryView members={members} />}

        {/* VIEW: ADMIN TERMINAL */}
        {view === 'reports' && isSystemAdmin && (
          <TerminalView 
            registry={members}
            financialStats={financialStats}
            committeeApps={committeeApps}
            hubSettings={hubSettings}
            currentDailyKey={getDailyCashPasskey()}
            handleVerifyMember={handleVerifyMember}
            handleRotateKey={handleRotateKey}
            handleToggleMaintenance={() => handleUpdateSetting('maintenanceMode', !hubSettings.maintenanceMode)}
            handleToggleRegistration={() => handleUpdateSetting('registrationOpen', !hubSettings.registrationOpen)}
            initiateAppAction={async (app, status) => {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id), { 
                status, 
                statusUpdatedAt: serverTimestamp() 
              });
            }}
          />
        )}
        
        {/* Render other views (home, about, etc.) similarly */}
      </main>
    </div>
  );
};
