import React, { useState, useContext, useEffect, Suspense, lazy } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';
import Sidebar from './components/Sidebar.jsx';

// --- LAZY LOADING (The "Crash-Proof" way) ---
// This prevents a single broken view from turning the whole site white.
const HomeView = lazy(() => import('./views/HomeView.jsx'));
const EventView = lazy(() => import('./views/EventView.jsx'));
const AboutView = lazy(() => import('./views/AboutView.jsx'));
const TeamView = lazy(() => import('./views/TeamView.jsx'));
const MemberCornerView = lazy(() => import('./views/MemberCornerView.jsx'));
const SeriesView = lazy(() => import('./views/SeriesView.jsx'));
const MasterclassView = lazy(() => import('./views/MasterclassView.jsx'));
const MasteryView = lazy(() => import('./views/MasteryView.jsx'));
const CommitteeHuntView = lazy(() => import('./views/CommitteeHuntView.jsx'));
const AnnouncementsView = lazy(() => import('./views/AnnouncementsView.jsx'));
const ProfileSettingsView = lazy(() => import('./views/ProfileSettingsView.jsx'));
const RegistryView = lazy(() => import('./views/RegistryView.jsx'));
const TerminalView = lazy(() => import('./views/TerminalView.jsx'));
const TaskBarView = lazy(() => import('./views/TaskBarView.jsx'));

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const context = useContext(HubContext);
  const { profile, members, hubSettings, committeeApps } = context || {};

  // Permissions logic
  const isSuperAdmin = isSystemAdmin === true;
  const isStaff = isSuperAdmin || ['officer', 'committee-head', 'execomm'].includes(profile?.role?.toLowerCase());

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
        {/* Suspense catches the "loading" state of the individual views */}
        <Suspense fallback={<div className="text-[10px] font-black uppercase text-amber-600">Steeping...</div>}>
          
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

          {/* RESTRICTED VIEWS */}
          {view === 'daily_grind' && (isStaff ? <TaskBarView /> : <AccessDenied />)}
          
          {isSuperAdmin && (
            <>
              {view === 'members' && <RegistryView members={members} />}
              {view === 'reports' && <TerminalView registry={members} hubSettings={hubSettings} committeeApps={committeeApps} />}
            </>
          )}

          {/* Security Fallback for non-admins */}
          {!isSuperAdmin && (view === 'members' || view === 'reports') && <AccessDenied />}

        </Suspense>
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
