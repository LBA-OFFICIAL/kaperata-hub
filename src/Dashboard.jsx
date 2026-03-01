import React, { useState, useContext, useMemo } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';

// Core Components (Must exist in /components)
import Sidebar from './components/Sidebar.jsx';

// View Components (Must exist in /views)
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
  const { profile, members, hubSettings, committeeApps } = useContext(HubContext) || {};

  // --- PERMISSION CHECKS ---
  // 1. Full Admin (Super Admin UID)
  const isSuperAdmin = isSystemAdmin === true;
  
  // 2. Staff/Officer (Can see Taskbar & Edit Content)
  const isStaff = isSuperAdmin || 
                  profile?.role === 'officer' || 
                  profile?.role === 'committee-head' || 
                  profile?.role === 'execomm';

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
      <Sidebar view={view} setView={setView} logout={logout} isSystemAdmin={isSuperAdmin} />

      <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        
        {/* --- PUBLIC TIERS --- */}
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

        {/* --- STAFF TIER (Task Bar) --- */}
        {view === 'task-bar' && (
          isStaff ? <TaskBarView /> : <div className="text-red-500 text-[10px] font-black uppercase">Clearance Required</div>
        )}

        {/* --- ADMIN TIER (Registry & Terminal) --- */}
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
            <div className="text-red-500 text-[10px] font-black uppercase text-center mt-20">
              Restricted to System Admin
            </div>
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
