import React, { useState, useContext, useMemo } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from './firebase';
import { HubProvider, HubContext } from './contexts/HubContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import MaintenanceBanner from './components/MaintenanceBanner.jsx';
import DataPrivacyFooter from './components/DataPrivacyFooter.jsx';
import HomeView from './views/HomeView.jsx';
import TerminalView from './views/TerminalView.jsx';
// ... import other views here ...

const DashboardContent = ({ logout, isSystemAdmin }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hubSettings, profile, secureKeys, committeeApps, logs, members } = useContext(HubContext);

  // --- 1. FINANCIAL STATS (Case-Insensitive Count) ---
  const financialStats = useMemo(() => ({
    totalPaid: members?.filter(m => String(m.status || '').toLowerCase() === 'paid').length || 0,
    exemptCount: members?.filter(m => String(m.status || '').toLowerCase() === 'exempt').length || 0
  }), [members]);

  // --- 2. SEMESTER & REPORT LOGIC ---
  const handleDownloadReport = (type) => {
    if (!members || members.length === 0) return alert("No registry data found.");
    
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const isFirstSem = currentMonth >= 7 && currentMonth <= 12;

    let exportData = members;
    if (type === 'semester') {
      exportData = members.filter(m => {
        const joinDate = m.joinedDate?.toDate ? m.joinedDate.toDate() : new Date(m.joinedDate || 0);
        const mMonth = joinDate.getMonth() + 1;
        const mYear = joinDate.getFullYear();
        const sameYear = mYear === now.getFullYear();
        return isFirstSem ? (mMonth >= 7 && mMonth <= 12 && sameYear) : (mMonth >= 1 && mMonth <= 6 && sameYear);
      });
    }

    const headers = ["Name", "MemberID", "Status", "JoinedDate"].join(",");
    const rows = exportData.map(m => [m.name, m.memberId, m.status, m.joinedDate?.toDate ? m.joinedDate.toDate().toLocaleDateString() : m.joinedDate].join(","));
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `LBA_Report_${type}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 3. DATABASE ACTION HANDLERS ---
  const handleUpdateSetting = async (field, val) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { [field]: !val }, { merge: true });
  };

  const handleRotateKeys = async (keyType) => {
    const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    const target = keyType === 'daily' ? 'ops' : 'keys';
    const field = keyType === 'daily' ? 'dailyKey' : keyType;
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', target), { [field]: newKey }, { merge: true });
  };

  const initiateAppAction = async (app, status) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id), { status, statusUpdatedAt: new Date() }, { merge: true });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col relative overflow-hidden">
      {hubSettings?.maintenanceMode && <MaintenanceBanner isSuperAdmin={isSystemAdmin} />}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <Sidebar view={view} setView={setView} logout={logout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isSystemAdmin={isSystemAdmin} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <header className="flex justify-between items-center mb-10">
            <h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2>
          </header>
          {view === 'home' && <HomeView />}
          {view === 'reports' && isSystemAdmin && (
            <TerminalView 
              financialStats={financialStats} committeeApps={committeeApps} logs={logs} secureKeys={secureKeys} hubSettings={hubSettings} currentDailyKey={hubSettings?.dailyKey || "---"}
              handleToggleMaintenance={() => handleUpdateSetting('maintenanceMode', hubSettings.maintenanceMode)}
              handleToggleRegistration={() => handleUpdateSetting('registrationOpen', hubSettings.registrationOpen)}
              handleToggleRenewalMode={() => handleUpdateSetting('renewalMode', hubSettings.renewalMode)}
              handleRotateDailyKey={() => handleRotateKeys('daily')}
              handleRotateSecurityKeys={() => handleRotateKeys('officerKey')} // Example: rotates officer key
              handleDownloadReport={handleDownloadReport}
              initiateAppAction={initiateAppAction}
              handleDeleteApp={async (id) => await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id))}
            />
          )}
          <DataPrivacyFooter />
        </main>
      </div>
    </div>
  );
};

export default function Dashboard(props) {
  return <HubProvider profile={props.profile}><DashboardContent {...props} /></HubProvider>;
}
