import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, query, where, onSnapshot, doc, setDoc, 
  updateDoc, addDoc, serverTimestamp, getDocs, limit, deleteDoc, 
  orderBy, writeBatch
} from 'firebase/firestore';
import { 
  Users, Calendar, Award, Bell, LogOut, UserCircle, BarChart3, Plus, 
  ShieldCheck, Menu, X, Sparkles, Loader2, Coffee, Star, Users2, 
  Download, Lock, ShieldAlert, BadgeCheck, MapPin, Edit3, Send, 
  Megaphone, Ticket, ToggleLeft, ToggleRight, MessageSquare, 
  TrendingUp, Mail, Trash2, Search, ArrowUpDown, CheckCircle2, 
  Settings2, ChevronLeft, ChevronRight, Facebook, Instagram, 
  LifeBuoy, FileUp, Banknote, AlertTriangle, AlertCircle, BrainCircuit, Quote
} from 'lucide-react';

// --- Safe Configuration Helper ---
const getFirebaseConfig = () => {
  if (typeof __firebase_config !== 'undefined') return JSON.parse(__firebase_config);
  
  // Production fallback for Vercel
  try {
    const metaEnv = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    if (metaEnv.VITE_FIREBASE_CONFIG) return JSON.parse(metaEnv.VITE_FIREBASE_CONFIG);
  } catch (e) {
    console.warn("Firebase config not found in environment variables.");
  }
  
  return { apiKey: "", authDomain: "", projectId: "", storageBucket: "", messagingSenderId: "", appId: "" };
};

const firebaseConfig = getFirebaseConfig();
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lba-portal-v13';

// --- Constants ---
const ORG_LOGO_URL = "https://lh3.googleusercontent.com/d/1aYqARgJoEpHjqWJONprViSsEUAYHNqUL";
const OFFICER_TITLES = ["President", "Vice President", "Secretary", "Assistant Secretary", "Treasurer", "Auditor", "Business Manager", "P.R.O.", "Overall Committee Head"];
const POSITION_CATEGORIES = ["Member", "Officer", "Committee", "Execomm", "Blacklisted"];
const SOCIAL_LINKS = { 
  facebook: "https://fb.com/lpubaristas.official", 
  instagram: "https://instagram.com/lpubaristas.official", 
  tiktok: "https://tiktok.com/@lpubaristas.official",
  email: "lpubaristas.official@gmail.com" 
};

// --- Helpers ---
const getDirectLink = (url) => {
  if (!url) return "";
  if (url.includes('drive.google.com')) {
    const idMatch = url.match(/[-\w]{25,}/);
    if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[0]}`;
  }
  return url;
};

const getMemberIdMeta = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  let syStart = year % 100;
  let syEnd = (year + 1) % 100;
  if (month < 8) { syStart = (year - 1) % 100; syEnd = year % 100; }
  return { sy: `${syStart}${syEnd}`, sem: (month >= 8 || month <= 12) && month >= 8 ? "1" : "2" };
};

const getDailyCashPasskey = () => {
  const now = new Date();
  return `KBA-${now.getDate()}-${(now.getMonth() + 1) + (now.getFullYear() % 100)}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const StatIcon = ({ icon: Icon, color }) => {
  if (!Icon) return null;
  return (
    <div className={`p-3 rounded-2xl bg-amber-50 ${color} flex items-center justify-center shrink-0`}>
      <Icon size={20} />
    </div>
  );
};

// --- View: Login ---
const Login = ({ onLoginSuccess }) => {
  const [authMode, setAuthMode] = useState('login'); 
  const [memberIdInput, setMemberIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(''); 
  const [refNo, setRefNo] = useState('');
  const [cashOfficerKey, setCashOfficerKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingProfile, setPendingProfile] = useState(null);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true });
  const [secureKeys, setSecureKeys] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    let unsubOps, unsubKeys;
    const init = async () => {
      if (!auth.currentUser) await signInAnonymously(auth).catch(() => {});
      unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (snap) => snap.exists() && setHubSettings(snap.data()));
      unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (snap) => snap.exists() && setSecureKeys(snap.data()));
    };
    init();
    return () => { unsubOps?.(); unsubKeys?.(); };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (authMode === 'register') {
        if (!hubSettings.registrationOpen) throw new Error("Registration is closed.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        let pc = 'Member', st = 'Member', role = 'member', pay = 'unpaid';
        if (inputKey) {
          const uk = inputKey.trim().toUpperCase();
          const offK = (secureKeys?.officerKey || "KAPERATA_OFFICER_2024").toUpperCase();
          const headK = (secureKeys?.headKey || "KAPERATA_HEAD_2024").toUpperCase();
          const commK = (secureKeys?.commKey || "KAPERATA_COMM_2024").toUpperCase();
          if (uk === offK) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
          else if (uk === headK) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
          else if (uk === commK) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
          else throw new Error("Invalid leader verification key.");
        }
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'registry'));
        const meta = getMemberIdMeta();
        const assignedId = `LBA${meta.sy}-${meta.sem}${String(snap.size + 1).padStart(4, '0')}${['Officer', 'Committee'].includes(pc) ? 'C' : ''}`;
        const profileData = { uid: auth.currentUser.uid, name: `${firstName} ${middleInitial ? middleInitial + '. ' : ''}${lastName}`.toUpperCase(), firstName: firstName.toUpperCase(), middleInitial: middleInitial.toUpperCase(), lastName: lastName.toUpperCase(), email: email.toLowerCase(), password, program, positionCategory: pc, specificTitle: st, memberId: assignedId, role, status: 'active', paymentStatus: pay, lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, joinedDate: new Date().toISOString() };
        if (pc !== 'Member') {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', assignedId), profileData);
          onLoginSuccess(profileData);
        } else { setPendingProfile(profileData); setAuthMode('payment'); }
      } else if (authMode === 'payment') {
        if (paymentMethod === 'cash' && cashOfficerKey.trim().toUpperCase() !== getDailyCashPasskey().toUpperCase()) throw new Error("Invalid Daily Cash Key.");
        const final = { ...pendingProfile, paymentStatus: 'paid', paymentDetails: { method: paymentMethod, refNo } };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', final.memberId), final);
        onLoginSuccess(final);
      } else {
        const snap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1)));
        if (snap.empty) throw new Error("ID not found.");
        const userData = snap.docs[0].data();
        if (userData.password !== password) throw new Error("Incorrect password.");
        onLoginSuccess(userData);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-[#3E2723] font-sans">
      {showForgotModal && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-sm w-full p-10 shadow-2xl border-t-[12px] border-[#FDB813] text-center">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><LifeBuoy size={32}/></div>
               <h4 className="font-serif text-2xl font-black uppercase">Account Recovery</h4>
               <p className="text-sm font-medium text-amber-950 mt-4 leading-relaxed">To reset your Hub password, contact an authorized Officer or email us at:</p>
               <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-[#3E2723] font-black underline block mt-2">{SOCIAL_LINKS.email}</a>
               <button onClick={() => setShowForgotModal(false)} className="w-full mt-8 bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-[10px]">Close</button>
            </div>
         </div>
      )}
      <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-t-[12px] border-[#3E2723]">
        <div className="flex flex-col items-center mb-10 text-center">
          <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-32 h-32 object-contain mb-4" />
          <h1 className="font-serif text-xl font-black uppercase">LPU Baristas' Association</h1>
          <p className="text-[#FDB813] font-black tracking-[0.3em] text-[10px] bg-[#3E2723] px-4 py-1 rounded-full mt-2 uppercase">KAPERATA HUB</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' && (
            <div className="space-y-3">
               <input type="text" required placeholder="Member ID" className="w-full p-4 border border-amber-200 rounded-2xl font-bold uppercase outline-none" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())} />
               <input type="password" required placeholder="Password" className="w-full p-4 border border-amber-200 rounded-2xl outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
               <div className="flex justify-end pr-2"><button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-800">Forgot Password?</button></div>
            </div>
          )}
          {authMode === 'register' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                <input type="text" required placeholder="FIRST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none text-[10px] font-bold uppercase" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} />
                <input type="text" placeholder="MI" maxLength="1" className="p-3 border border-amber-200 rounded-xl outline-none text-[10px] text-center font-bold uppercase" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())} />
                <input type="text" required placeholder="LAST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-[10px] font-bold uppercase" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} />
              </div>
              <input type="email" required placeholder="LPU Email" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold outline-none" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select required className="w-full p-3 border border-amber-200 rounded-xl text-xs font-black uppercase outline-none" value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="">Select Program</option>
                {["CAKO", "CLOCA", "CLOHS", "HRA", "ITM/ITTM"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="password" required placeholder="Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input type="text" placeholder="Leader Key (Optional)" className="w-full p-3 border border-amber-200 rounded-xl text-[10px] font-bold uppercase outline-none" value={inputKey} onChange={(e) => setInputKey(e.target.value.toUpperCase())} />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-2xl hover:bg-black transition-all font-black uppercase flex justify-center items-center gap-2 shadow-xl">
            {loading ? <Loader2 className="animate-spin" size={20}/> : 'Enter Hub'}
          </button>
        </form>
        <p className="text-center mt-6 text-[10px] text-amber-800 uppercase font-black">
          {authMode === 'login' ? (
            <button onClick={() => setAuthMode('register')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Brew With Us</button>
          ) : <button onClick={() => setAuthMode('login')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Back to Login</button>}
        </p>
      </div>
    </div>
  );
};

// --- Dashboard View ---
const Dashboard = ({ profile, setProfile, logout }) => {
  const [view, setView] = useState('home');
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, renewalOpen: true });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "Established in 2012..." });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedBaristas, setSelectedBaristas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [brewMasterQuery, setBrewMasterQuery] = useState("");
  const [brewMasterResponse, setBrewMasterResponse] = useState("");
  const [isBrewMasterLoading, setIsBrewMasterLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', action: null });
  const [suggestionNote, setSuggestionNote] = useState("");
  
  const fileInputRef = useRef(null);
  const itemsPerPage = 10;
  const isOfficer = useMemo(() => ['Officer', 'Execomm'].includes(profile.positionCategory), [profile.positionCategory]);

  const menuItems = [
    { id: 'home', label: 'Dashboard', icon: BarChart3 },
    { id: 'about', label: 'Legacy Story', icon: History },
    { id: 'team', label: 'Brew Crew', icon: Users2 },
    { id: 'brew_master', label: '✨ AI Master', icon: BrainCircuit },
    { id: 'events', label: "What's Brewing?", icon: Calendar },
    { id: 'announcements', label: 'Grind Report', icon: Bell },
    { id: 'suggestions', label: 'Suggestion Box', icon: MessageSquare },
    ...(isOfficer ? [{ id: 'members', label: 'Registry', icon: Users }, { id: 'reports', label: 'Terminal', icon: FileText }] : [])
  ];

  const getMemberStatus = (m) => {
    if (['Officer', 'Execomm', 'Committee'].includes(m.positionCategory)) return { label: 'Active (Staff)', color: 'bg-indigo-500' };
    const meta = getMemberIdMeta();
    if (m.lastRenewedSem === meta.sem && m.lastRenewedSY === meta.sy) return { label: 'Active', color: 'bg-green-500' };
    return { label: 'For Renewal', color: 'bg-amber-500' };
  };

  const triggerConfirm = (title, message, action) => setConfirmModal({ open: true, title, message, action });

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubReg = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubAnn = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubSug = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), orderBy('createdAt', 'desc')), (s) => setSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (snap) => snap.exists() && setHubSettings(snap.data()));
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (snap) => snap.exists() && setSecureKeys(snap.data()));
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (snap) => {
      if (snap.exists()) setLegacyContent(snap.data());
    });
    return () => { unsubReg(); unsubEvents(); unsubAnn(); unsubSug(); unsubOps(); unsubKeys(); unsubLegacy(); };
  }, [profile?.uid]);

  const paginatedRegistry = members.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.memberId.toLowerCase().includes(searchQuery.toLowerCase())).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleUpdatePosition = async (mid, cat, spec) => {
    const target = members.find(m => m.memberId === mid);
    const updates = { positionCategory: cat, specificTitle: spec || cat, memberId: mid.replace(/C$/, '') + (['Officer', 'Committee'].includes(cat) ? 'C' : '') };
    if (updates.memberId !== mid) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid));
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', updates.memberId), { ...target, ...updates });
  };

  const handleAskBrewMaster = async () => {
    if (!brewMasterQuery.trim()) return;
    setIsBrewMasterLoading(true);
    setBrewMasterResponse("Consulting expert advisors...");
    setTimeout(() => {
       setBrewMasterResponse("Brew Tip: Consistency is key. Aim for a 1:16 brew ratio for manual pour-overs to balance clarity and body.");
       setIsBrewMasterLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row text-[#3E2723] font-sans">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#3E2723] transform transition-transform md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-amber-900/30 text-center leading-none">
           <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-16 h-16 object-contain mb-4 mx-auto" />
           <h1 className="font-serif font-black text-[10px] text-white uppercase tracking-widest px-2">LPU Baristas' Association</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto leading-none pt-4">
          {menuItems.map(item => (<button key={item.id} onClick={() => { setView(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-[#FDB813] text-[#3E2723] shadow-lg font-black' : 'text-amber-200/40 hover:bg-white/5'} leading-none`}><item.icon size={18}/><span className="uppercase text-[10px] font-black">{item.label}</span></button>))}
        </nav>
        <div className="p-6 border-t border-amber-900/30"><button onClick={logout} className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase tracking-widest hover:text-red-300">Exit Hub</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto bg-[#FDFBF7] text-[#3E2723]">
        <header className="flex justify-between items-center mb-10 pt-1 leading-none"><div className="md:hidden" onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-[#3E2723]" /></div><h2 className="font-serif text-3xl font-black uppercase">KAPErata Hub</h2><div className="bg-white p-2 pr-6 rounded-full border border-amber-100 flex items-center gap-3"><img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover" /><div className="hidden sm:block"><p className="text-[10px] font-black uppercase mb-1">{profile.nickname || "Barista"}</p><p className="text-[8px] font-black text-amber-500 uppercase">{profile.specificTitle}</p></div></div></header>

        {view === 'home' && (
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4 leading-none animate-fadeIn">
              <div className="lg:col-span-2 space-y-10 pt-4">
                <div className="bg-[#3E2723] rounded-[48px] p-10 text-white border-4 border-[#FDB813] relative overflow-hidden shadow-2xl">
                   <div className="absolute top-32 right-10 rotate-12"><div className="bg-[#FDB813] text-[#3E2723] p-4 rounded-full shadow-2xl border-4 border-[#3E2723] animate-pulse"><Ticket size={24}/></div></div>
                   <h3 className="font-serif text-3xl font-black uppercase mb-2">{profile.name}</h3>
                   <div className="mt-6 flex gap-2">
                      <div className="bg-[#FDB813] text-[#3E2723] px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-widest">{profile.specificTitle}</div>
                      <div className="bg-green-500 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">Active</div>
                   </div>
                </div>
              </div>
           </div>
        )}

        {view === 'brew_master' && (
           <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pt-4">
              <div className="border-b-4 border-[#3E2723] pb-4 pt-1 leading-none"><h3 className="font-serif text-5xl font-black uppercase pt-1">AI Brew Master</h3><p className="text-amber-50 font-black uppercase text-[10px] mt-2 tracking-widest text-amber-500">Expert advisor</p></div>
              <div className="bg-white p-10 rounded-[48px] border border-amber-100 shadow-xl space-y-8 pt-4 leading-none"><div className="flex gap-2 pt-1"><input type="text" placeholder="Brew query..." className="flex-1 p-5 bg-amber-50 rounded-[28px] outline-none font-bold text-sm pt-1 text-[#3E2723]" value={brewMasterQuery} onChange={e => setBrewMasterQuery(e.target.value)} /><button onClick={handleAskBrewMaster} className="bg-[#3E2723] text-[#FDB813] p-5 rounded-[28px] transition-all hover:bg-black">{isBrewMasterLoading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24}/>}</button></div>{brewMasterResponse && (<div className="p-8 bg-amber-50 rounded-[40px] border-l-8 border-[#FDB813] pt-1 leading-none animate-fadeIn text-sm font-medium leading-relaxed whitespace-pre-wrap">{brewMasterResponse}</div>)}</div>
           </div>
        )}

        {view === 'suggestions' && (
           <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pt-4 text-[#3E2723]">
              <div className="border-b-4 border-[#3E2723] pb-4 pt-1 leading-none"><h3 className="font-serif text-5xl font-black uppercase pt-1">Suggestion Box</h3><p className="text-amber-50 font-black uppercase text-[10px] mt-2 tracking-widest text-amber-500">Grounds for improvement</p></div>
              <div className="bg-white p-10 rounded-[50px] border-4 border-dashed border-amber-200 pt-1 leading-none"><form onSubmit={(e) => { e.preventDefault(); addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), { content: suggestionNote, createdAt: serverTimestamp() }); setSuggestionNote(""); }} className="flex gap-4 pt-1"><textarea required placeholder="Hub feedback..." className="flex-1 bg-amber-50 rounded-3xl p-6 outline-none font-bold text-sm resize-none pt-1 leading-relaxed text-[#3E2723]" rows="3" value={suggestionNote} onChange={e => setSuggestionNote(e.target.value)}></textarea><button type="submit" className="bg-[#3E2723] text-[#FDB813] px-8 rounded-3xl font-black uppercase text-xs pt-1">Drop</button></form></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 leading-none">{suggestions.length > 0 ? suggestions.map(sug => (<div key={sug.id} className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-sm relative pt-1 leading-none"><div className="absolute top-6 right-8 opacity-10"><Quote size={40}/></div><p className="text-xs font-medium text-amber-900/80 pt-1 italic">"{sug.content}"</p><div className="mt-4 pt-4 border-t border-amber-50 flex justify-between items-center text-[8px] font-black uppercase text-amber-400">{formatDate(sug.createdAt?.toDate?.())}</div></div>)) : <p className="col-span-full text-center opacity-20 py-10">No notes in the box</p>}</div>
           </div>
        )}

        {view === 'reports' && isOfficer && (
           <div className="space-y-10 animate-fadeIn text-[#3E2723] pt-4">
              <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6 leading-none pt-1">
                 <StatIcon icon={TrendingUp} color="text-amber-600" />
                 <div><h3 className="font-serif text-4xl font-black uppercase">Terminal</h3><p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p></div>
              </div>
              <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] flex items-center justify-between shadow-xl">
                 <div className="flex items-center gap-6 pt-1"><Banknote size={32}/><div className="leading-tight pt-1"><h4 className="font-serif text-2xl font-black uppercase pt-1">Daily Cash Key</h4><p className="text-[10px] font-black uppercase opacity-60">Verification Code</p></div></div>
                 <div className="bg-white/40 px-8 py-4 rounded-3xl border-2 border-dashed border-[#3E2723]/20 font-mono text-4xl font-black leading-none pt-1">{getDailyCashPasskey()}</div>
              </div>
           </div>
        )}

        {view === 'members' && isOfficer && (
           <div className="space-y-6 animate-fadeIn pt-4 leading-none text-[#3E2723]">
              <div className="bg-white p-6 rounded-[40px] border border-amber-100 flex justify-between items-center shadow-sm">
                 <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl"><Search size={16}/><input type="text" placeholder="Search registry..." className="bg-transparent outline-none text-[10px] font-black uppercase" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/></div>
                 <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkImportCSV} />
                    <button onClick={()=>fileInputRef.current.click()} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase shadow-md">Import CSV</button>
                 </div>
              </div>
              <div className="bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-hidden">
                 <table className="w-full text-left uppercase leading-none">
                    <thead className="bg-[#3E2723] text-white font-serif"><tr className="text-[10px]"><th className="p-8 w-12 text-center pt-1">#</th><th>Barista</th><th className="text-center">ID</th><th className="text-center">Designation</th><th className="text-right pr-8">Actions</th></tr></thead>
                    <tbody className="divide-y divide-amber-50">
                       {paginatedRegistry.length > 0 ? paginatedRegistry.map(m => (
                            <tr key={m.memberId} className="hover:bg-amber-50/50 leading-none pt-1">
                               <td className="p-8 text-center pt-1 leading-none"><div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto pt-1"></div></td>
                               <td className="flex items-center gap-4 py-8"><div><p className="font-black text-xs">{m.name}</p><p className="text-[8px] opacity-60">"{m.nickname || m.program}"</p></div></td>
                               <td className="text-center font-mono font-black">{m.memberId}</td>
                               <td className="text-center">
                                  <select className="bg-amber-50 text-[8px] font-black p-2 rounded-lg outline-none mb-1 w-32 block mx-auto text-[#3E2723]" value={m.positionCategory} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                  <select className="bg-white border border-amber-100 text-[8px] font-black p-2 rounded-lg outline-none w-32 block mx-auto text-[#3E2723]" value={m.specificTitle} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)}><option value="Member">Member</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                               </td>
                               <td className="text-right pr-8"><button onClick={() => { if(confirm(`Remove ${m.name}?`)) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', m.memberId)) }} className="text-red-500 p-2"><Trash2 size={16}/></button></td>
                            </tr>
                       )) : <tr><td colSpan="5" className="p-20 text-center opacity-20">Registry is empty</td></tr>}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

const App = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const start = async () => {
      try { if (!auth.currentUser) await signInAnonymously(auth); } catch(e) {}
      setLoading(false);
    };
    start();
  }, []);
  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-black uppercase animate-pulse">Syncing Hub...</div>;
  return profile ? <Dashboard profile={profile} setProfile={setProfile} logout={() => { setProfile(null); signOut(auth); }} /> : <Login onLoginSuccess={setProfile} />;
};

export default App;
