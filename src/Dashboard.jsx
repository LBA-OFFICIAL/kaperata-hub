import React, { useState, useContext } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';

// Core Layout
import Sidebar from './components/Sidebar.jsx';

// 1. IMPORT ALL 14 VIEW COMPONENTS
import HomeView from './views/HomeView.jsx';
import EventView from './views/EventView.jsx';                   // What's Brewing?
import AboutView from './views/AboutView.jsx';                   // About Us
import TeamView from './views/TeamView.jsx';                     // Brew Crew
import MemberCornerView from './views/MemberCornerView.jsx';     // Member's Corner
import SeriesView from './views/SeriesView.jsx';                 // Barista Diaries
import MasterclassView from './views/MasterclassView.jsx';       // Masterclass
import MasteryView from './views/MasteryView.jsx';               // Mastery Program
import CommitteeHuntView from './views/CommitteeHuntView.jsx';   // Committee Hunt
import AnnouncementsView from './views/AnnouncementsView.jsx';   // The Grind Report
import ProfileSettingsView from './views/ProfileSettingsView.jsx'; 
import RegistryView from './views/RegistryView.jsx';             // Registry
import TerminalView from './views/TerminalView.jsx';             // Terminal
import TaskBarView from './views/TaskBarView.jsx';               // The Task Bar

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { profile, members, hubSettings, committeeApps } = useContext(HubContext) || {};

  // --- ACCESS TIERS ---
  const isSuperAdmin = isSystemAdmin === true;
  const isStaff = isSuperAdmin || 
                  ['officer', 'committee-head', 'execomm'].includes(profile?.role?.toLowerCase());

  // --- LOADING GATE ---
  // If profile is missing, we show a loader instead of crashing on 'birthMonth'
  if (!profile || !profile.uid) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#FDFBF7]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#3E2723] animate-pulse">
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
        
        {/* TIER 1: PUBLIC ACCESS (Everyone) */}
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

        {/* TIER 2: STAFF ACCESS (Task Bar) */}
        {view === 'daily_grind' && (
          isStaff ? <TaskBarView /> : <AccessDenied />
        )}

        {/* TIER 3: ADMIN ACCESS (Registry & Terminal) */}
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
