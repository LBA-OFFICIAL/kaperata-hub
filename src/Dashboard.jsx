import React, { useState, useContext, Suspense, lazy } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';
import Sidebar from './components/Sidebar.jsx';

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

// EMERGENCY ERROR BOUNDARY
class GlobalErrorGuard extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center">
          <p className="text-[10px] font-black uppercase text-red-500">View Loading Error</p>
          <button onClick={() => window.location.reload()} className="text-[10px] underline mt-2">Retry</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use a fallback empty object so useContext never returns null
  const context = useContext(HubContext) || {};
  const { profile = {}, members = [], hubSettings = {}, committeeApps = [] } = context;

  // ACCESS LOGIC
  const isSuperAdmin = isSystemAdmin === true;
  const userRole = profile?.role?.toLowerCase() || 'member';
  const isStaff = isSuperAdmin || ['officer', 'committee-head', 'execomm'].includes(userRole);

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
        <GlobalErrorGuard key={view}>
          <Suspense fallback={<div className="p-10 text-[10px] font-black uppercase animate-pulse text-amber-600">Loading View...</div>}>
            
            {/* PUBLIC/MEMBER VIEWS */}
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

            {/* STAFF/OFFICER VIEWS */}
            {view === 'daily_grind' && (isStaff ? <TaskBarView /> : <AccessDenied />)}
            
            {/* ADMIN ONLY VIEWS */}
            {view === 'members' && (isSuperAdmin ? <RegistryView members={members} /> : <AccessDenied />)}
            {view === 'reports' && (isSuperAdmin ? <TerminalView registry={members} hubSettings={hubSettings} committeeApps={committeeApps} /> : <AccessDenied />)}

          </Suspense>
        </GlobalErrorGuard>
      </main>
    </div>
  );
};

const AccessDenied = () => (
  <div className="h-full flex items-center justify-center text-red-500 text-[10px] font-black uppercase tracking-widest">
    Access Restricted
  </div>
);

const Dashboard = (props) => (
  <HubProvider>
    <DashboardContent {...props} />
  </HubProvider>
);

export default Dashboard;
