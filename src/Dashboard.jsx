import React, { useState, useContext, useMemo } from 'react';
import { doc, setDoc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, appId } from './firebase';
import { HubProvider, HubContext } from './contexts/HubContext.jsx';

// Components & Views
import Sidebar from './components/Sidebar.jsx';
import MaintenanceBanner from './components/MaintenanceBanner.jsx';
import DataPrivacyFooter from './components/DataPrivacyFooter.jsx';
import HomeView from './views/HomeView.jsx';
import MasteryView from './views/MasteryView.jsx';
import AboutView from './views/AboutView.jsx';
import MasterclassView from './views/MasterclassView.jsx';
import TeamView from './views/TeamView.jsx';
import EventView from './views/EventView.jsx';
import AnnouncementsView from './views/AnnouncementsView.jsx';
import MemberCornerView from './views/MemberCornerView.jsx';
import SeriesView from './views/SeriesView.jsx';
import CommitteeHuntView from './views/CommitteeHuntView.jsx';
import TaskBarView from './views/TaskBarView.jsx';
import RegistryView from './views/RegistryView.jsx';
import TerminalView from './views/TerminalView.jsx';

const DashboardContent = ({ logout, isSystemAdmin }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { hubSettings, profile, secureKeys, committeeApps, logs, members } = useContext(HubContext);

  // --- 1. DYNAMIC SEMESTER & STATS LOGIC ---
  const getAcademicPeriod = (date) => {
    const d = date?.toDate ? date.toDate() : new Date(date || 0);
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    const isFirstSem = month >= 7 && month <= 12;
    return isFirstSem ? `1st Sem AY ${year}-${year + 1}` : `2nd Sem AY ${year - 1}-${year}`;
  };

  const availableSemesters = useMemo(() => {
    if (!members) return [];
    const sems = members.map(m => getAcademicPeriod(m.joinedDate));
    return [...new Set(sems)].sort().reverse(); 
  }, [members]);

  const financialStats = useMemo(() => {
    const registry = members || [];
    return {
      totalPaid: registry.filter(m => String(m.status || '').toLowerCase() === 'paid').length,
      exemptCount: registry.filter(m => String(m.status || '').toLowerCase() === 'exempt').length
    };
  }, [members]);

  // --- 2. ACTION HANDLERS ---
  const handleUpdateSetting = async (field, val) => {
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { [field]: val }, { merge: true });
  };

  const handleRotateKey = async (keyType) => {
    const newKey = Math.random().toString(36).substring(2, 8).toUpperCase();
    const isDaily = keyType === 'daily';
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'settings', isDaily ? 'ops' : 'keys');
    await updateDoc(ref, { [isDaily ? 'dailyKey' : keyType]: newKey });
  };

  const handleDownloadReport = (semLabel) => {
    const data = semLabel === 'all' ? members : members.filter(m => getAcademicPeriod(m.joinedDate) === semLabel);
    const headers = "Name,MemberID,Status,Period\n";
    const rows = data.map(m => `${m.name},${m.memberId},${m.status},${getAcademicPeriod(m.joinedDate)}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `LBA_Report_${semLabel.replace(/ /g, '_')}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col relative overflow-hidden text-[#3E2723]">
      {hubSettings?.maintenanceMode && <MaintenanceBanner isSuperAdmin={isSystemAdmin} />}
      
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        <Sidebar view={view} setView={setView} logout={logout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isSystemAdmin={isSystemAdmin} />

        <main className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
          <header className="flex justify-between items-center mb-10">
             <button onClick={() => setMobileMenuOpen(true)} className="md:hidden"><Settings2 /></button>
             <h2 className="font-serif text-3xl font-black uppercase">KAPErata Hub</h2>
          </header>

          <div className="pb-20">
            {view === 'home' && <HomeView />}
            {view === 'about' && <AboutView />}
            {view === 'masterclass' && <MasterclassView />}
            {view === 'mastery' && <MasteryView />}
            {view === 'team' && <TeamView />}
            {view === 'events' && <EventView />}
            {view === 'announcements' && <AnnouncementsView />}
            {view === 'members_corner' && <MemberCornerView />}
            {view === 'series' && <SeriesView />}
            {view === 'committee_hunt' && <CommitteeHuntView />}
            {view === 'daily_grind' && <TaskBarView />}
            {view === 'members' && <RegistryView />}
            
            {view === 'reports' && isSystemAdmin && (
              <TerminalView 
                financialStats={financialStats}
                committeeApps={committeeApps}
                logs={logs}
                secureKeys={secureKeys}
                hubSettings={hubSettings}
                availableSemesters={availableSemesters}
                currentDailyKey={hubSettings?.dailyKey || "---"}
                handleToggleMaintenance={() => handleUpdateSetting('maintenanceMode', !hubSettings.maintenanceMode)}
                handleToggleRegistration={() => handleUpdateSetting('registrationOpen', !hubSettings.registrationOpen)}
                handleToggleRenewalMode={() => handleUpdateSetting('renewalMode', !hubSettings.renewalMode)}
                handleTogglePayment={() => handleUpdateSetting('allowedPayment', hubSettings.allowedPayment === 'gcash_only' ? 'cash_gcash' : 'gcash_only')}
                handleRotateKey={handleRotateKey}
                handleDownloadReport={handleDownloadReport}
                initiateAppAction={async (app, status) => await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id), { status, statusUpdatedAt: serverTimestamp() })}
                handleDeleteApp={async (id) => window.confirm("Delete?") && await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id))}
              />
            )}
          </div>
          <DataPrivacyFooter />
        </main>
      </div>
    </div>
  );
};

export default function Dashboard(props) {
  return <HubProvider profile={props.profile}><DashboardContent {...props} /></HubProvider>;
}
