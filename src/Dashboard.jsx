import React, { useState, useContext, useMemo } from 'react';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, appId } from './firebase';
import { HubProvider, HubContext } from './contexts/HubContext.jsx';
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

  // 1. CALCULATE FINANCIAL STATS
  const financialStats = useMemo(() => ({
    totalPaid: members?.filter(m => m.status?.toLowerCase() === 'paid').length || 0,
    exemptCount: members?.filter(m => m.status?.toLowerCase() === 'exempt').length || 0
  }), [members]);

  // 2. TERMINAL ACTION HANDLERS
  const handleUpdateSetting = async (field, currentValue) => {
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops');
    await setDoc(settingsRef, { [field]: !currentValue }, { merge: true });
  };

  const handleUpdateGcash = async (newNumber) => {
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops');
    await setDoc(settingsRef, { gcashNumber: newNumber }, { merge: true });
  };

  const handleRotateDailyKey = async () => {
    const newKey = Math.floor(100000 + Math.random() * 900000).toString();
    const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops');
    await setDoc(settingsRef, { dailyKey: newKey }, { merge: true });
  };

  const initiateAppAction = async (app, status) => {
    const appRef = doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id);
    await setDoc(appRef, { status, statusUpdatedAt: new Date() }, { merge: true });
  };

  const handleDeleteApp = async (id) => {
    if (window.confirm("Delete this application?")) {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id));
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-[#3E2723] font-sans relative overflow-hidden">
      {hubSettings?.maintenanceMode && <MaintenanceBanner isSuperAdmin={isSystemAdmin} />}
      <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden relative">
        <Sidebar view={view} setView={setView} logout={logout} mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={setMobileMenuOpen} isSystemAdmin={isSystemAdmin} />
        <main className="flex-1 overflow-y-auto p-4 md:p-10 relative custom-scrollbar">
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-[#3E2723]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
              </button>
              <h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2>
            </div>
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
                financialStats={financialStats} committeeApps={committeeApps} logs={logs} secureKeys={secureKeys} hubSettings={hubSettings} currentDailyKey={hubSettings?.dailyKey || "---"}
                handleToggleMaintenance={() => handleUpdateSetting('maintenanceMode', hubSettings.maintenanceMode)}
                handleToggleRegistration={() => handleUpdateSetting('registrationOpen', hubSettings.registrationOpen)}
                handleToggleRenewalMode={() => handleUpdateSetting('renewalMode', hubSettings.renewalMode)}
                handleToggleAllowedPayment={() => handleUpdateSetting('allowedPayment', hubSettings.allowedPayment === 'gcash_only')}
                handleUpdateGcash={handleUpdateGcash}
                handleRotateDailyKey={handleRotateDailyKey}
                initiateAppAction={initiateAppAction}
                handleDeleteApp={handleDeleteApp}
              />
            )}
          </div>
          <DataPrivacyFooter />
        </main>
      </div>
    </div>
  );
};

export default function Dashboard({ user, profile, setProfile, logout, isSystemAdmin }) {
  return (
    <HubProvider profile={profile}>
      <DashboardContent logout={logout} isSystemAdmin={isSystemAdmin} />
    </HubProvider>
  );
}
