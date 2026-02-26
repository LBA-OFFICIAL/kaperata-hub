import React, { useState, useContext } from 'react';

// Context & State
import { HubProvider, HubContext } from './contexts/HubContext.jsx';

// Components
import Sidebar from './components/Sidebar.jsx';
import MaintenanceBanner from './components/MaintenanceBanner.jsx';
import DataPrivacyFooter from './components/DataPrivacyFooter.jsx';

// Views
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
import TerminalView from './views/TerminalView.jsx'; // Added TerminalView

// --- INTERNAL DASHBOARD WRAPPER ---
const DashboardContent = ({ logout, isSystemAdmin }) => {
  const [view, setView] = useState('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { hubSettings, profile, secureKeys, committeeApps, logs } = useContext(HubContext);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-[#3E2723] font-sans relative overflow-hidden">
      
      {/* Maintenance Banner Logic */}
      {hubSettings?.maintenanceMode && <MaintenanceBanner isSuperAdmin={isSystemAdmin} />}
      
      <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden relative">
        
        {/* Sidebar Navigation */}
        <Sidebar 
          view={view} 
          setView={setView} 
          logout={logout} 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          isSystemAdmin={isSystemAdmin} // Passed prop to Sidebar
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-10 relative custom-scrollbar">
          
          <header className="flex justify-between items-center mb-10">
            <div className="flex items-center gap-4">
              <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-[#3E2723]">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="12" x2="21" y2="12"></line>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              <h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2>
            </div>
            
            <div onClick={() => setView('settings')} className="bg-white p-2 pr-6 rounded-full border border-amber-100 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-amber-50 transition-colors">
              <img 
                src={profile?.photoUrl || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=FDB813&color=3E2723`} 
                className="w-10 h-10 rounded-full object-cover" 
                alt="Profile"
              />
              <div className="hidden sm:block">
                <p className="text-[10px] font-black uppercase text-[#3E2723]">{profile?.nickname || profile?.name?.split(' ')[0]}</p>
                <p className="text-[8px] font-black text-amber-500 uppercase">{profile?.specificTitle}</p>
              </div>
            </div>
          </header>

          {/* View Switcher Container */}
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
            
            {/* Terminal / Admin View */}
            {view === 'reports' && isSystemAdmin && (
              <TerminalView 
                committeeApps={committeeApps}
                logs={logs}
                secureKeys={secureKeys}
                currentDailyKey={hubSettings?.dailyKey || "---"}
                handleRotateSecurityKeys={() => console.log("Feature coming soon")}
              />
            )}

            {view === 'settings' && (
                <div className="p-10 text-center bg-white rounded-[40px] border-2 border-dashed border-amber-200">
                    <p className="font-black uppercase text-amber-900">Settings View Coming Soon</p>
                </div>
            )}
          </div>

          <DataPrivacyFooter />
        </main>
      </div>
    </div>
  );
};

// --- EXPORTED ROOT COMPONENT ---
export default function Dashboard({ user, profile, setProfile, logout, isSystemAdmin }) {
  return (
    <HubProvider profile={profile}>
      <DashboardContent logout={logout} isSystemAdmin={isSystemAdmin} />
    </HubProvider>
  );
}
