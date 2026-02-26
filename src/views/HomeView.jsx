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
              <div className="mt-6 bg-white p-6 rounded-2xl border border-orange-
