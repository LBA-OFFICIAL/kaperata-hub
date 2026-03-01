import React, { useState, useContext, useMemo } from 'react';
import { doc, updateDoc, deleteDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './firebase'; 
import { HubContext } from './contexts/HubContext.jsx';
import { generateLBAId, getDailyCashPasskey, getDirectLink } from './utils/helpers';

// Views
import TerminalView from './views/TerminalView.jsx';
import RegistryView from './views/RegistryView.jsx';
// ... import your other views here

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const { hubSettings, profile, members, committeeApps, secureKeys, logs } = useContext(HubContext);

  // --- 1. THE FINANCIAL ENGINE (Stats) ---
  const financialStats = useMemo(() => ({
    totalPaid: members?.filter(m => m.paymentStatus === 'paid').length || 0,
    pending: members?.filter(m => m.paymentStatus === 'unpaid').length || 0,
    exempt: members?.filter(m => m.paymentStatus === 'exempt').length || 0
  }), [members]);

  // --- 2. THE ID FACTORY (Safe Registration/Verification) ---
  // This handles the "Smooth Flow" from Unpaid -> Paid + ID Assignment
  const handleVerifyMember = async (memberDocId) => {
    try {
      await runTransaction(db, async (transaction) => {
        const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
        const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberDocId);
        
        const counterSnap = await transaction.get(counterRef);
        const memberSnap = await transaction.get(memberRef);

        if (!memberSnap.exists()) throw "Member not found";

        // Increment Global Counter
        const currentCount = counterSnap.exists() ? counterSnap.data().memberCount || 0 : 0;
        const nextCount = currentCount + 1;

        // Generate the Official LBA ID
        const officialId = generateLBAId(memberSnap.data().positionCategory, currentCount);

        // Atomic Update: Mark as Paid and Assign ID simultaneously
        transaction.update(memberRef, {
          memberId: officialId,
          paymentStatus: 'paid',
          verifiedAt: serverTimestamp(),
          verifiedBy: profile?.name || 'Admin'
        });

        transaction.set(counterRef, { memberCount: nextCount }, { merge: true });
      });
      alert("Barista Verified & ID Assigned!");
    } catch (err) {
      console.error("Transaction failed: ", err);
      alert("Flow interrupted. Try again.");
    }
  };

  // --- 3. THE CONTROL CENTER HANDLERS ---
  const handleUpdateSetting = async (field, val) => {
    const opsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops');
    await updateDoc(opsRef, { [field]: val });
  };

  const handleRotateKey = async (type) => {
    const path = type === 'daily' ? ['settings', 'ops'] : ['settings', 'keys'];
    const key = Math.random().toString(36).substring(2, 8).toUpperCase();
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', ...path), { 
      [type === 'daily' ? 'dailyKey' : type]: key 
    });
  };

  // --- 4. THE VIEW RENDERER ---
  return (
    <div className="flex h-screen bg-[#FDFBF7]">
      {/* Sidebar logic would go here */}
      
      <main className="flex-1 overflow-y-auto p-8">
        {view === 'members' && <RegistryView registry={members} />}

        {view === 'reports' && isSystemAdmin && (
          <TerminalView 
            // Data Crumbs
            registry={members}
            financialStats={financialStats}
            committeeApps={committeeApps}
            hubSettings={hubSettings}
            currentDailyKey={getDailyCashPasskey()}
            
            // Action Crumbs
            handleVerifyMember={handleVerifyMember}
            handleRotateKey={handleRotateKey}
            handleToggleMaintenance={() => handleUpdateSetting('maintenanceMode', !hubSettings.maintenanceMode)}
            handleToggleRegistration={() => handleUpdateSetting('registrationOpen', !hubSettings.registrationOpen)}
            
            // Recruitment Crumbs
            initiateAppAction={async (app, status) => {
              const appRef = doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id);
              await updateDoc(appRef, { status, statusUpdatedAt: serverTimestamp() });
            }}
          />
        )}
      </main>
    </div>
  );
};
