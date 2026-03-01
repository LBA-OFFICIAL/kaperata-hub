import React, { useState, useContext, useMemo } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';

// --- CORE LAYOUT ---
import Sidebar from './components/Sidebar.jsx';

// --- ALL 14 VIEW IMPORTS ---
import HomeView from './views/HomeView.jsx';
import EventView from './views/EventView.jsx';
import AboutView from './views/AboutView.jsx';
import TeamView from './views/TeamView.jsx';
import MemberCornerView from './views/MemberCornerView.jsx';
import SeriesView from './views/SeriesView.jsx';
import MasterclassView from './views/MasterclassView.jsx';
import MasteryView from './views/MasteryView.jsx';
import CommitteeHuntView from './views/CommitteeHuntView.jsx';
import AnnouncementsView from './views/AnnouncementsView.jsx';
import ProfileSettingsView from './views/ProfileSettingsView.jsx';
import RegistryView from './views/RegistryView.jsx';
import TerminalView from './views/TerminalView.jsx';
import TaskBarView from './views/TaskBarView.jsx';

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const context = useContext(HubContext);
  
  // Safety: If Context is failing, we provide empty objects so the app doesn't crash
  const { profile = {}, members = [], hubSettings = {}, committeeApps = [] } = context || {};

  // --- TIERED PERMISSIONS ---
  const isSuperAdmin = isSystemAdmin === true;
  
  // Access for Taskbar & Editing (System Admin, Officers, Committee Heads, Execomm)
  const isStaff = isSuperAdmin || 
                  ['officer', 'committee-head', 'execomm'].includes(profile?.role?.toLowerCase());

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
      {/* Sidebar is the anchor - it should always show */}
      <Sidebar view={view} setView={setView} logout={logout} isSystemAdmin={isSuperAdmin} />

      <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        
        {/* --- TIER 1: GENERAL CONTENT --- */}
        {view === 'home' && <HomeView />}
        {view === 'whats-brewing' && <EventView canEdit={isStaff} />}
        {view === 'about-us' && <AboutView />}
        {view === 'brew-crew' && <TeamView />}
        {view === 'members-corner' && <MemberCornerView />}
        {view === 'barista-diaries' && <SeriesView canEdit={isStaff} />}
        {view === 'masterclass' && <MasterclassView />}
        {view === 'mastery-program' && <MasteryView />}
        {view === 'committee-hunt' && <CommitteeHuntView />}
        {view === 'the-grind-report' && <AnnouncementsView canEdit={isStaff} />}
        {view === 'profile-settings' && <ProfileSettingsView />}

        {/* --- TIER 2: STAFF ACCESS (Task Bar) --- */}
        {view === 'task-bar' && (
          isStaff ? <TaskBarView /> : <div className="p-10 text-red-500 font-black text-[10px] uppercase">Restricted: Staff Only</div>
        )}

        {/* --- TIER 3: SYSTEM ADMIN ONLY (Registry & Terminal) --- */}
        {isSuperAdmin ? (
          <>
            {view === 'registry' && <RegistryView members={members} />}
            {view === 'terminal' && (
              <TerminalView 
                registry={members}
                hubSettings={hubSettings}
                committeeApps={committeeApps}
              />
            )}
          </>
        ) : (
          (view === 'registry' || view === 'terminal') && (
            <div className="p-10 text-red-500 font-black text-[10px] uppercase">Restricted: System Admin Only</div>
          )
        )}
      </main>
    </div>
  );
};

const Dashboard = (props) => (
  <HubProvider>
    <DashboardContent {...props} />
  </HubProvider>
);

export default Dashboard;
