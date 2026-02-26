import React, { useContext, useState, useMemo } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { 
  getDirectLink, ORG_LOGO_URL, getEventDateParts, formatDate, 
  DEFAULT_MASTERCLASS_MODULES, getMemberIdMeta, getDailyCashPasskey
} from '../utils/helpers';
import { 
  Coffee, CheckCircle2, AlertCircle, RefreshCcw, Cake, 
  Sparkles, Bell, Calendar, MapPin, Clock, Trophy, Award, Lock, BadgeCheck 
} from 'lucide-react';

const HomeView = () => {
  const { 
    profile, setProfile, hubSettings, isExpired, isExemptFromRenewal, 
    announcements, events, masterclassData, setView 
  } = useContext(HubContext);

  // Local State for Renewal
  const [renewalMethod, setRenewalMethod] = useState('gcash');
  const [renewalRef, setRenewalRef] = useState('');
  const [renewalCashKey, setRenewalCashKey] = useState('');

  // Computations
  const isBirthday = useMemo(() => { 
    if (!profile.birthMonth || !profile.birthDay) return false; 
    const today = new Date(); 
    return parseInt(profile.birthMonth) === (today.getMonth() + 1) && parseInt(profile.birthDay) === today.getDate(); 
  }, [profile]);

  const volunteerCount = useMemo(() => { 
    if (!events || !profile.memberId) return 0; 
    return events.reduce((acc, ev) => { 
      if (!ev.isVolunteer || !ev.shifts) return acc; 
      const shiftCount = ev.shifts.filter(s => s.volunteers?.includes(profile.memberId)).length; 
      return acc + shiftCount; 
    }, 0); 
  }, [events, profile.memberId]);

  const calculateEligibleCertificate = (masteryData) => {
    if (!masteryData || !masteryData.paths || masteryData.paths.length === 0) return null;
    const m = masteryData.milestones;
    const checkTrack = (t) => m[t]?.Q1 && m[t]?.Q2 && m[t]?.Q3 && m[t]?.Q4;
    const hasBrewer = checkTrack('Brewer');
    const hasArtist = checkTrack('Artist');
    const hasAlchemist = checkTrack('Alchemist');
    
    if (hasBrewer && hasArtist && hasAlchemist) return { type: 'TYPE_D_MASTER', title: 'Master of the Craft', color: 'Gold' };
    if (hasBrewer) return { type: 'TYPE_A_BREWER', title: 'Certified Craft Brewer', color: 'Bronze' };
    if (hasArtist) return { type: 'TYPE_B_ARTIST', title: 'Certified Latte Artist', color: 'Silver' };
    if (hasAlchemist) return { type: 'TYPE_C_ALCHEMIST', title: 'Certified Beverage Alchemist', color: 'Copper' };
    return null;
  };

  // Actions
  const handleRenewalPayment = async (e) => { 
    e.preventDefault(); 
    if (renewalMethod === 'gcash' && !renewalRef) return; 
    if (renewalMethod === 'cash' && !renewalCashKey) return; 
    if (renewalMethod === 'cash' && renewalCashKey.trim().toUpperCase() !== getDailyCashPasskey().toUpperCase()) { 
      return alert("Invalid Cash Key."); 
    } 
    try { 
      const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId); 
      const meta = getMemberIdMeta(); 
      await updateDoc(memberRef, { 
        status: 'active', paymentStatus: 'paid', lastRenewedSY: meta.sy, 
        lastRenewedSem: meta.sem, membershipType: 'renewal', 
        paymentDetails: { method: renewalMethod, refNo: renewalMethod === 'gcash' ? renewalRef : 'CASH', date: new Date().toISOString() } 
      }); 
      setRenewalRef(''); setRenewalCashKey(''); 
      alert("Membership renewed successfully! Welcome back."); 
    } catch (err) { 
      alert("Renewal failed. Please try again."); 
    } 
  };

  return (
    <div className="space-y-10 animate-fadeIn">
      {/* 1. Welcome Banner */}
      <div className="text-center mb-8">
        <h2 className="font-serif text-3xl md:text-4xl font-black uppercase text-[#3E2723] mb-2 tracking-wide">WELCOME TO THE KAPERATA HUB!</h2>
        <p className="text-amber-700/80 font-bold uppercase text-xs md:text-sm tracking-widest max-w-xl mx-auto">Your go-to space for updates, announcements, and everything brewing in the KAPErata community. ☕✨</p>
      </div>

      {/* 2. Digital ID Card */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#3E2723] text-[#FDB813] p-8 shadow-2xl border-4 border-[#FDB813] max-w-md mx-auto transform transition-all hover:scale-[1.02] mb-12">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
              <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA Logo" className="w-24 h-24 object-contain mb-4 drop-shadow-md" />
              <h2 className="font-serif text-3xl font-black uppercase tracking-widest mb-1">LPU Baristas</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80 mb-6">Official Membership ID</p>
              <div className="w-full bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-6 shadow-inner">
                  <h3 className="font-black text-2xl uppercase text-white mb-1">{profile.name}</h3>
                  <p className="font-mono text-lg text-[#FDB813] tracking-wider">{profile.memberId}</p>
                  <p className="text-[10px] font-bold uppercase text-white/60 mt-2">{profile.specificTitle}</p>
              </div>
              <div className="flex items-center gap-4 w-full">
                  <div className={`flex-1 py-3 rounded-xl font-black uppercase text-xs border-2 flex items-center justify-center gap-2 ${profile.status === 'active' ? 'bg-green-500/20 border-green-500 text-green-400' : profile.status === 'expired' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-gray-500/20 border-gray-500 text-gray-400'}`}>
                      {profile.status === 'active' ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>}
                      {profile.status === 'active' ? 'Active Status' : profile.status}
                  </div>
                  {profile.status === 'active' && (<div className="flex-1 py-3 rounded-xl font-black uppercase text-xs bg-[#FDB813] text-[#3E2723] flex items-center justify-center gap-2 shadow-lg"><Coffee size={14}/> 10% Off B'Cafe</div>)}
              </div>
              <p className="text-[8px] font-bold uppercase text-white/40 mt-6">Valid for AY {profile.lastRenewedSY || new Date().getFullYear()} • Non-Transferable</p>
          </div>
      </div>

      {/* 3. Expired & Renewal Blocks */}
      {profile.status === 'expired' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl mb-6 shadow-md">
              <div className="flex items-start justify-between"><div><h3 className="text-xl font-black uppercase text-red-700 flex items-center gap-2"><AlertCircle size={24}/> Membership Expired</h3><p className="text-sm text-red-800 mt-2 font-medium">Your membership access is currently limited. Please settle your full membership fee to reactivate your account.</p></div><div className="text-right"><span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">Status: Expired</span></div></div>
              <div className="mt-6 bg-white p-6 rounded-2xl border border-red-100">
                  <h4 className="text-sm font-black uppercase text-gray-700 mb-4">Renewal Payment</h4>
                  <p className="text-xs text-gray-500 mb-4">Please send the full membership fee via GCash to the number below, then enter your Reference Number to verify.</p>
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="bg-blue-50 p-4 rounded-xl text-center w-full md:w-auto"><p className="text-[10px] font-black uppercase text-blue-800">GCash Only</p><p className="text-lg font-black text-blue-900">+63{hubSettings.gcashNumber || '9063751402'}</p></div>
                      <form onSubmit={e => { setRenewalMethod('gcash'); handleRenewalPayment(e); }} className="flex-1 w-full flex gap-3"><input type="text" required placeholder="Enter Reference No." className="flex-1 p-3 border border-gray-300 rounded-xl text-xs uppercase focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" value={renewalRef} onChange={(e) => setRenewalRef(e.target.value)} /><button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-red-700 transition-colors shadow-lg">Reactivate</button></form>
                  </div>
              </div>
          </div>
      )}
      
      {!isExpired && hubSettings.renewalMode && !isExemptFromRenewal && (
          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl mb-6 shadow-md animate-slideIn">
              <div className="flex items-start justify-between"><div><h3 className="text-xl font-black uppercase text-orange-700 flex items-center gap-2"><RefreshCcw size={24}/> Renewal Period Open</h3><p className="text-sm text-orange-800 mt-2 font-medium">Please renew your membership within the 15-day period to avoid expiration.</p></div><div className="text-right"><span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">Action Required</span></div></div>
              <div className="mt-6 bg-white p-6 rounded-2xl border border-orange-100">
                  <h4 className="text-sm font-black uppercase text-gray-700 mb-4">Renew Membership</h4>
                  <div className="flex flex-col gap-4">
                      {hubSettings.allowedPayment === 'both' && (<div className="flex gap-2"><button type="button" onClick={() => setRenewalMethod('gcash')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${renewalMethod === 'gcash' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-200 text-gray-500'}`}>GCash</button><button type="button" onClick={() => setRenewalMethod('cash')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${renewalMethod === 'cash' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}>Cash</button></div>)}
                      <form onSubmit={handleRenewalPayment} className="flex flex-col gap-3">
                          {renewalMethod === 'gcash' ? (<div className="space-y-3"><div className="text-xs bg-blue-50 p-3 rounded-lg text-blue-900"><strong>Send to:</strong> 0{hubSettings.gcashNumber || '9063751402'} (GCash)</div><input type="text" required placeholder="Enter GCash Reference No." className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase outline-none focus:border-orange-500" value={renewalRef} onChange={(e) => setRenewalRef(e.target.value)} /></div>) : (<div className="space-y-3"><div className="text-xs bg-green-50 p-3 rounded-lg text-green-900">Pay to an officer to get the Daily Cash Key.</div><input type="text" required placeholder="Enter Daily Cash Key" className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase outline-none focus:border-orange-500" value={renewalCashKey} onChange={(e) => setRenewalCashKey(e.target.value.toUpperCase())} /></div>)}
                          <button type="submit" className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-orange-700 transition-colors shadow-lg">Confirm Renewal</button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* 4. Celebrations */}
      <div className="space-y-4">
          {isBirthday && (<div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 rounded-[40px] shadow-xl flex items-center gap-6 relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><Cake size={120} /></div><div className="bg-white/20 p-4 rounded-full text-white"><Cake size={40} /></div><div className="text-white z-10"><h3 className="font-serif text-3xl font-black uppercase">Happy Birthday!</h3><p className="font-medium text-white/90">Wishing you the happiest of days, {profile.nickname || profile.name.split(' ')[0]}! 🎂</p></div></div>)}
      </div>

      {/* 5. Main Content Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
              
              {/* Notices */}
              <div>
                  <h3 className="font-serif text-xl font-black uppercase text-[#3E2723] mb-4 flex items-center gap-2"><Bell size={20} className="text-amber-600"/> Latest Notices</h3>
                  <div className="space-y-4">
                  {announcements.length === 0 ? 
                      <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center"><p className="text-xs font-bold text-gray-400 uppercase">All caught up!</p><p className="text-[10px] text-gray-300">No new notices to display.</p></div>
                  : announcements.slice(0, 2).map(ann => (
                      <div key={ann.id} className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2"><h4 className="font-black text-sm uppercase text-[#3E2723] pr-16">{ann.title}</h4><span className="text-[8px] font-bold text-gray-400 uppercase">{formatDate(ann.date)}</span></div>
                          <p className="text-xs text-gray-600 line-clamp-2">{ann.content}</p>
                      </div>
                  ))}
                  </div>
              </div>

              {/* Events */}
              <div>
                  <h3 className="font-serif text-xl font-black uppercase text-[#3E2723] mb-4 flex items-center gap-2"><Calendar size={20} className="text-amber-600"/> Upcoming Events</h3>
                  <div className="space-y-4">
                  {events.length === 0 ? 
                      <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center"><Calendar size={24} className="mx-auto text-gray-300 mb-2"/><p className="text-xs font-bold text-gray-400 uppercase">No upcoming events</p><p className="text-[10px] text-gray-300">Stay tuned for future updates!</p></div>
                  : events.slice(0, 3).map(ev => {
                      const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                      return (
                          <div key={ev.id} className="bg-white p-4 rounded-3xl border border-amber-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                              <div className="bg-[#3E2723] text-[#FDB813] w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-tight shrink-0"><span className="text-xs font-black">{day}</span><span className="text-[8px] uppercase">{month}</span></div>
                              <div className="min-w-0 pr-12"><h4 className="font-black text-xs uppercase truncate">{ev.name}</h4><p className="text-[10px] text-gray-500 truncate">{ev.venue} • {ev.startTime}</p></div>
                          </div>
                      );
                  })}
                  </div>
              </div>
          </div>

          {/* 6. Trophy Case */}
          <div className="bg-white p-6 rounded-[32px] border border-amber-100 h-full">
              <h3 className="font-black text-sm uppercase text-[#3E2723] mb-4 flex items-center gap-2"><Trophy size={16} className="text-amber-500"/> Trophy Case</h3>
              <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col items-center gap-1"><div title="Member" className="w-full aspect-square bg-amber-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2"><div className="text-2xl md:text-3xl mb-1">☕</div><span className="text-[8px] md:text-[10px] font-black uppercase text-amber-900/60 leading-none">Member</span></div></div>
                  {['Officer'].includes(profile.positionCategory) && (<div className="flex flex-col items-center gap-1"><div title="Officer" className="w-full aspect-square bg-indigo-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2"><div className="text-2xl md:text-3xl mb-1">🛡️</div><span className="text-[8px] md:text-[10px] font-black uppercase text-indigo-900/60 leading-none">Officer</span></div></div>)}
                  {profile.positionCategory === 'Committee' && (<div className="flex flex-col items-center gap-1"><div title="Committee" className="w-full aspect-square bg-pink-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2"><div className="text-2xl md:text-3xl mb-1">🎗️</div><span className="text-[8px] md:text-[10px] font-black uppercase text-pink-900/60 leading-none">Comm.</span></div></div>)}
                  {profile.positionCategory === 'Execomm' && (<div className="flex flex-col items-center gap-1"><div title="Execomm" className="w-full aspect-square bg-blue-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2"><div className="text-2xl md:text-3xl mb-1">💼</div><span className="text-[8px] md:text-[10px] font-black uppercase text-blue-900/60 leading-none">Execomm</span></div></div>)}
                  {profile.positionCategory === 'Alumni' && (<div className="flex flex-col items-center gap-1"><div title="Alumni" className="w-full aspect-square bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2"><div className="text-2xl md:text-3xl mb-1">🎓</div><span className="text-[8px] md:text-[10px] font-black uppercase text-slate-900/60 leading-none">Alumni</span></div></div>)}
                  {profile.memberId && (new Date().getFullYear() - 2000 - parseInt(profile.memberId.substring(3,5))) >= 1 && (<div className="flex flex-col items-center gap-1"><div title="Veteran" className="w-full aspect-square bg-yellow-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2"><div className="text-2xl md:text-3xl mb-1">🏅</div><span className="text-[8px] md:text-[10px] font-black uppercase text-yellow-900/60 leading-none">Veteran</span></div></div>)}
                  {volunteerCount > 0 && (<div className="flex flex-col items-center gap-1">{(() => { let tier = { icon: '🤚', label: 'Volunteer', color: 'bg-teal-50 text-teal-900/60' }; if (volunteerCount >= 15) tier = { icon: '👑', label: 'Super Vol.', color: 'bg-rose-100 text-rose-900/60' }; else if (volunteerCount >= 9) tier = { icon: '🚀', label: 'Adv. Vol.', color: 'bg-purple-100 text-purple-900/60' }; else if (volunteerCount >= 4) tier = { icon: '🔥', label: 'Inter. Vol.', color: 'bg-orange-100 text-orange-900/60' }; const textColor = tier.color.split(' ')[1] || 'text-gray-500'; const bgColor = tier.color.split(' ')[0] || 'bg-gray-100'; return (<div title={`Volunteered for ${volunteerCount} shifts`} className={`w-full aspect-square ${bgColor} rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2`}><div className="text-2xl md:text-3xl mb-1">{tier.icon}</div><span className={`text-[8px] md:text-[10px] font-black uppercase ${textColor} leading-none tracking-tight`}>{tier.label}</span></div>); })()}</div>)}
                  {(() => {
                      const myBadges = [];
                      
                      // Mastery Certifications
                      const mCert = calculateEligibleCertificate(profile.mastery);
                      if (mCert) {
                          const certStyles = {
                              'Gold': 'from-yellow-300 to-yellow-50 text-yellow-900',
                              'Silver': 'from-slate-300 to-slate-50 text-slate-800',
                              'Bronze': 'from-amber-400 to-amber-100 text-amber-900',
                              'Copper': 'from-orange-400 to-orange-100 text-orange-900'
                          };
                          myBadges.push(<div key="mastery-cert" className="flex flex-col items-center gap-1"><div title={mCert.title} className={`w-full aspect-square bg-gradient-to-br ${certStyles[mCert.color] || certStyles['Gold']} rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2 shadow-sm`}><div className="text-2xl md:text-3xl mb-1">🏅</div><span className="text-[8px] md:text-[10px] font-black uppercase leading-none tracking-tight line-clamp-2">{mCert.title.split(' ').pop()}</span></div></div>);
                      }

                      // Masterclass Modules
                      DEFAULT_MASTERCLASS_MODULES.forEach(mod => {
                          if (masterclassData.moduleAttendees?.[mod.id]?.includes(profile.memberId)) {
                              const details = masterclassData.moduleDetails?.[mod.id] || {}; const defaultIcons = ["🌱", "⚙️", "💧", "☕", "🍹"]; const iconToUse = details.icon || defaultIcons[mod.id-1]; const displayTitle = details.title || mod.short; 
                              myBadges.push(<div key={`mc-${mod.id}`} className="flex flex-col items-center gap-1"><div title={`Completed: ${displayTitle}`} className="w-full aspect-square bg-green-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2 border border-green-100"><div className="text-2xl md:text-3xl mb-1">{iconToUse}</div><span className="text-[8px] md:text-[10px] font-black uppercase text-green-800 text-center leading-none tracking-tighter line-clamp-2">{displayTitle}</span></div></div>);
                          }
                      });
                      
                      const has1 = masterclassData.moduleAttendees?.[1]?.includes(profile.memberId);
                      const has2 = masterclassData.moduleAttendees?.[2]?.includes(profile.memberId);
                      const optMods = [3, 4, 5].filter(id => masterclassData.moduleAttendees?.[id]?.includes(profile.memberId)).length;
                      if (has1 && has2 && optMods >= 2) { 
                          myBadges.unshift(<div key="mc-master" className="flex flex-col items-center gap-1"><div title="Certified Masterclass Graduate" className="w-full aspect-square bg-gradient-to-br from-amber-300 to-amber-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2 shadow-lg border-2 border-white"><div className="text-2xl md:text-3xl mb-1">🎓</div><span className="text-[8px] md:text-[10px] font-black uppercase text-amber-900 leading-none">Graduate</span></div></div>); 
                      }
                      return myBadges;
                  })()}
                  {Array.isArray(profile.accolades) && profile.accolades.map((acc, i) => (<div key={i} className="flex flex-col items-center gap-1"><div title={acc} className="w-full aspect-square bg-purple-50 rounded-2xl flex flex-col items-center justify-center text-center p-1 md:p-2"><div className="text-2xl md:text-3xl mb-1">🏆</div><span className="text-[8px] md:text-[10px] font-black uppercase text-purple-900/60 leading-none line-clamp-2 tracking-tight">{acc}</span></div></div>))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default HomeView;
