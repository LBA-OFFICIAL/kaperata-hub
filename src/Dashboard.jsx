import React, { useState, useContext, Suspense, lazy } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';
import Sidebar from './components/Sidebar.jsx';
import { Menu, X } from 'lucide-react'; // Added icons for the mobile toggle

// LAZY LOADING
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

  const context = useContext(HubContext) || {};
  const { profile = {}, members = [], hubSettings = {}, committeeApps = [] } = context;

  const isSuperAdmin = isSystemAdmin === true;
  const userRole = profile?.role?.toLowerCase() || 'member';
  const isStaff = isSuperAdmin || ['officer', 'committee-head', 'execomm'].includes(userRole);

  return (
    <div className="flex h-screen bg-[#FDFBF7] overflow-hidden">
      
      {/* 1. SIDEBAR (Handles its own desktop/mobile visibility) */}
      <Sidebar 
        view={view} 
        setView={setView} 
        logout={logout} 
        isSystemAdmin={isSuperAdmin}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        
        {/* 2. MOBILE HEADER (Only visible on screens smaller than 'md') */}
        <header className="md:hidden flex items-center justify-between px-6 h-16 bg-white border-b border-amber-100 z-40">
          <div className="flex flex-col">
            <h1 className="font-serif text-lg font-black uppercase text-[#3E2723] leading-none">KAPERata</h1>
            <p className="text-[8px] font-bold text-amber-500 uppercase tracking-widest">Membership Hub</p>
          </div>
          
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-xl bg-amber-50 text-[#3E2723] hover:bg-amber-100 transition-colors"
          >
            <Menu size={20} />
          </button>
        </header>

        {/* 3. MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Padding Logic:
              - Mobile: p-6 and pt-8 (already has header above)
              - Desktop: p-12
          */}
          <div className="p-6 pt-8 md:p-12 max-w-7xl mx-auto w-full">
            <Suspense fallback={
              <div className="flex items-center justify-center h-64">
                <div className="w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              </div>
            }>
              
              {/* VIEW RENDERING */}
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

              {/* RESTRICTED AREAS */}
              {view === 'daily_grind' && (isStaff ? <TaskBarView /> : <AccessDenied />)}
              {view === 'members' && (isSuperAdmin ? <RegistryView members={members} /> : <AccessDenied />)}
              {view === 'reports' && (isSuperAdmin ? <TerminalView registry={members} hubSettings={hubSettings} committeeApps={committeeApps} /> : <AccessDenied />)}

            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

const AccessDenied = () => (
  <div className="py-20 text-center">
    <p className="text-[10px] font-black uppercase text-red-500 tracking-widest">Access Restricted</p>
    <p className="text-gray-400 text-xs mt-2 italic">Please contact the System Admin for clearance.</p>
  </div>
);

const Dashboard = (props) => (
  <HubProvider>
    <DashboardContent {...props} />
  </HubProvider>
);

export default Dashboard;
