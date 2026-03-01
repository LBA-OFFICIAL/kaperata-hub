import React, { useState, useContext, useMemo } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';

// --- VIEW IMPORTS ---
import Sidebar from './components/Sidebar.jsx';
import HomeView from './views/HomeView.jsx';
import EventView from './views/EventView.jsx';                   // Label: What's Brewing
import AboutView from './views/AboutView.jsx';                   // Label: About Us
import TeamView from './views/TeamView.jsx';                     // Label: Brew Crew
import MemberCornerView from './views/MemberCornerView.jsx';     // Label: Member's Corner
import SeriesView from './views/SeriesView.jsx';                 // Label: Barista Diaries
import MasterclassView from './views/MasterclassView.jsx';       // Label: Masterclass
import MasteryView from './views/MasteryView.jsx';               // Label: Mastery Program
import CommitteeHuntView from './views/CommitteeHuntView.jsx';   // Label: Committee Hunt
import AnnouncementsView from './views/AnnouncementsView.jsx';   // Label: The Grind Report
import ProfileSettingsView from './views/ProfileSettingsView.jsx'; 

// Restricted Views
import RegistryView from './views/RegistryView.jsx';             
import TerminalView from './views/TerminalView.jsx';             
import TaskBarView from './views/TaskBarView.jsx';               

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const { profile, members, hubSettings, committeeApps } = useContext(HubContext) || {};

  // --- ACCESS TIERS ---
  
  // 1. Can Edit Content (Officers, Committee Heads, System Admin)
  const canEditContent = isSystemAdmin || 
                         profile?.role === 'officer' || 
                         profile?.role === 'committee-head';

  // 2. Can Access Task Bar (Officers, Committee Heads, System Admin)
  const canAccessTaskBar = canEditContent;

  // 3. Can Access Registry/Terminal (System Admin Only)
  const canAccessFullAdmin = isSystemAdmin === true;

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
      <Sidebar view={view} setView={setView} logout={logout} isSystemAdmin={isSystemAdmin} />

      <main className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar">
        
        {/* --- TIER 1: PUBLIC CONTENT --- */}
        {/* Note: We pass 'canEdit' to views where they can Create/Delete/Edit */}
        {view === 'home' && <HomeView />}
        {view === 'whats-brewing' && <EventView canEdit={canEditContent} />}
        {view === 'barista-diaries' && <SeriesView canEdit={canEditContent} />}
        {view === 'the-grind-report' && <AnnouncementsView canEdit={canEditContent} />}
        
        {/* Standard Views */}
        {view === 'about-us' && <AboutView />}
        {view === 'brew-crew' && <TeamView />}
        {view === 'members-corner' && <MemberCornerView />}
        {view === 'masterclass' && <MasterclassView />}
        {view === 'mastery-program' && <MasteryView />}
        {view === 'committee-hunt' && <CommitteeHuntView />}
        {view === 'profile-settings' && <ProfileSettingsView />}

        {/* --- TIER 2: TASK BAR (Officers & Heads) --- */}
        {view === 'task-bar' && (
          canAccessTaskBar ? <TaskBarView /> : <AccessDenied />
        )}

        {/* --- TIER 3: SYSTEM ADMIN ONLY --- */}
        {canAccessFullAdmin && (
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
        )}

        {/* Security Fallback for Registry/Terminal if non-admin clicks them */}
        {!canAccessFullAdmin && (view === 'registry' || view === 'terminal') && <AccessDenied />}
      </main>
    </div>
  );
};

// Simple reusable helper for denied access
const AccessDenied = () => (
  <div className="h-full flex items-center justify-center">
    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">
      Clearance Required: Restricted Access
    </p>
  </div>
);

const Dashboard = (props) => (
  <HubProvider>
    <DashboardContent {...props} />
  </HubProvider>
);

export default Dashboard;
