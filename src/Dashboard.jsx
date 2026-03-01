import React, { useState, useContext, Suspense, lazy } from 'react';
import { HubContext, HubProvider } from './contexts/HubContext.jsx';
import Sidebar from './components/Sidebar.jsx';

// --- LAZY LOADING ---
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

// --- ERROR BOUNDARY COMPONENT ---
class ViewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) { return { hasError: true, errorMsg: error.toString() }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 border-2 border-dashed border-red-200 rounded-3xl bg-red-50">
          <p className="text-red-500 font-black text-[10px] uppercase tracking-widest">Component Crash Detected</p>
          <p className="text-red-400 text-[11px] mt-2 font-mono">{this.state.errorMsg}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-[10px] font-bold underline text-red-600 uppercase">Reload Hub</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const DashboardContent = ({ isSystemAdmin, logout }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, members = [], hubSettings = {}, committeeApps = [] } = useContext(HubContext) || {};

  const isSuperAdmin = isSystemAdmin === true;
  const isStaff = isSuperAdmin || ['officer', 'committee-head', 'execomm'].includes(profile?.role?.toLowerCase());

  // Safety: If profile isn't loaded yet, keep the loader visible
  if (!profile) return <div className="h-screen w-full flex items-center justify-center bg-[#FDFBF7] text-[10px] font-black uppercase text-amber-900 tracking-widest">Grinding Beans...</div>;

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
        <ViewErrorBoundary key={view}> {/* Key ensures boundary resets on tab change */}
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
            {view === 'members' && (isSuperAdmin ? <RegistryView members={members} /> : <AccessDenied />)}
            {view === 'reports' && (isSuperAdmin ? <TerminalView registry={members} hubSettings={hubSettings} committeeApps={committeeApps} /> : <AccessDenied />)}

          </Suspense>
        </ViewErrorBoundary>
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
