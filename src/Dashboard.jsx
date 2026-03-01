import React, { useState, useContext, useEffect } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';

// Core Layout
import Sidebar from './components/Sidebar.jsx';

// 1. IMPORT ALL 14 VIEW COMPONENTS
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timedOut, setTimedOut] = useState(false);

  // Get data from context
  const context = useContext(HubContext);
  const { profile, members, hubSettings, committeeApps } = context || {};

  // --- TIMEOUT PROTECTION ---
  // If data doesn't load in 6 seconds, we force the gate open so the user isn't stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!profile) setTimedOut(true);
    }, 6000);
    return () => clearTimeout(timer);
  }, [profile]);

  // --- ACCESS TIERS ---
  const isSuperAdmin = isSystemAdmin === true;
  // Flexible check for role (handles missing data gracefully)
  const userRole = profile?.role?.toLowerCase() || 'member';
  const isStaff = isSuperAdmin || ['officer', 'committee-head', 'execomm'].includes(userRole);

  // --- THE GATE ---
  // We only stay on the loader if there is NO profile AND we haven't timed out yet.
  if (!profile && !timedOut) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FDFBF7]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3E2723]">
            Grinding the beans...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
      <Sidebar 
        view={view} 
        setView={setView} 
        logout={logout} 
        isSystemAdmin={isSuperAdmin}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        
        {/* PUBLIC ACCESS */}
        {view === 'home' && <HomeView profile={profile} />}
        {view === 'about' && <AboutView />}
        {view === 'events' && <EventView canEdit={isStaff} />}
        {view === 'announcements' && <AnnouncementsView canEdit={isStaff} />}
        {view === 'members_corner' && <MemberCornerView profile={profile} />}
        {view === 'series' && <SeriesView canEdit={isStaff} />}
        {view === 'masterclass' && <MasterclassView />}
        {view === 'mastery' && <MasteryView />}
        {view === 'team' && <TeamView />}
        {view === 'committee_hunt' && <CommitteeHuntView />}
        {view === 'profile' && <ProfileSettingsView profile={profile} />}

        {/* STAFF ACCESS */}
        {view === 'daily_grind' && (
          isStaff ? <TaskBarView /> : <AccessDenied />
        )}

        {/* ADMIN ACCESS */}
        {isSuperAdmin ? (
          <>
            {view === 'members' && <RegistryView members={members} />}
            {view === 'reports' && (
              <TerminalView 
                registry={members} 
                hubSettings={hubSettings} 
                committeeApps={committeeApps} 
              />
            )}
          </>
        ) : (
          (view === 'members' || view === 'reports') && <AccessDenied />
        )}
      </main>
    </div>
  );
};

const AccessDenied = () => (
  <div className="h-full flex items-center justify-center">
    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Access Restricted</p>
  </div>
);

const Dashboard = (props) => (
  <HubProvider>
    <DashboardContent {...props} />
  </HubProvider>
);

export default Dashboard;
