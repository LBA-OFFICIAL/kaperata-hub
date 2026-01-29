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
  LifeBuoy, FileUp, Banknote, AlertTriangle, AlertCircle,
  History, BrainCircuit, FileText
} from 'lucide-react';

// --- Configuration Helper ---
const firebaseConfig = typeof __firebase_config !== 'undefined' 
  ? JSON.parse(__firebase_config) 
  : {};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lba-portal-v13';

// --- Global Constants ---
const ORG_LOGO_URL = "https://lh3.googleusercontent.com/d/1aYqARgJoEpHjqWJONprViSsEUAYHNqUL";
const OFFICER_TITLES = ["President", "Vice President", "Secretary", "Assistant Secretary", "Treasurer", "Auditor", "Business Manager", "P.R.O.", "Overall Committee Head"];
const COMMITTEE_TITLES = ["Committee Head", "Committee Member"];
const PROGRAMS = ["CAKO", "CLOCA", "CLOHS", "HRA", "ITM/ITTM"];
const POSITION_CATEGORIES = ["Member", "Officer", "Committee", "Execomm", "Blacklisted"];
const SOCIAL_LINKS = { 
  facebook: "https://fb.com/lpubaristas.official", 
  instagram: "https://instagram.com/lpubaristas.official", 
  tiktok: "https://tiktok.com/@lpubaristas.official",
  email: "lpubaristas.official@gmail.com" 
};
const SEED_OFFICER_KEY = "KAPERATA_OFFICER_2024";
const SEED_HEAD_KEY = "KAPERATA_HEAD_2024";
const SEED_COMM_KEY = "KAPERATA_COMM_2024";

// --- Helper Logic ---
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

const generateLBAId = (category, currentCount = 0) => {
  const { sy, sem } = getMemberIdMeta();
  const padded = String(currentCount + 1).padStart(4, '0');
  const isLeader = ['Officer', 'Execomm', 'Committee'].includes(category);
  return `LBA${sy}-${sem}${padded}${isLeader ? "C" : ""}`;
};

const getDailyCashPasskey = () => {
  const now = new Date();
  return `KBA-${now.getDate()}-${(now.getMonth() + 1) + (now.getFullYear() % 100)}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- Components ---

const StatIcon = ({ icon: Icon, color }) => {
  // Explicit mapping to avoid dynamic class issues and ensure JIT safety
  const bgColors = {
    'text-amber-600': 'bg-amber-100',
    'text-indigo-600': 'bg-indigo-100',
    'text-green-600': 'bg-green-100',
    'text-blue-600': 'bg-blue-100',
    'text-red-600': 'bg-red-100',
  };
  
  return (
    <div className={`p-3 rounded-2xl ${bgColors[color] || 'bg-gray-100'} ${color}`}>
      <Icon size={24} />
    </div>
  );
};

const Login = ({ user, onLoginSuccess }) => {
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
    if (!user) return;
    
    // Add error handling to snapshots
    const unsubOps = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), 
      (snap) => snap.exists() && setHubSettings(snap.data()),
      (err) => console.log("Settings fetch error:", err)
    );
    
    const unsubKeys = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), 
      (snap) => snap.exists() && setSecureKeys(snap.data()),
      (err) => console.log("Keys fetch error:", err)
    );
    
    return () => { unsubOps(); unsubKeys(); };
  }, [user]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    if (!user) {
        setError("System initializing... please wait.");
        setLoading(false);
        return;
    }

    try {
      if (authMode === 'register') {
        if (!hubSettings.registrationOpen) throw new Error("Registration is closed.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        let pc = 'Member', st = 'Member', role = 'member', pay = 'unpaid';
        if (inputKey) {
          const uk = inputKey.trim().toUpperCase();
          if (uk === (secureKeys?.officerKey || "KAPERATA_OFFICER_2024").toUpperCase()) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
          else if (uk === (secureKeys?.headKey || "KAPERATA_HEAD_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
          else if (uk === (secureKeys?.commKey || "KAPERATA_COMM_2024").toUpperCase()) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
          else throw new Error("Invalid verification key.");
        }
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'registry'));
        const assignedId = generateLBAId(pc, snap.size);
        const meta = getMemberIdMeta();
        const profileData = { uid: user.uid, name: `${firstName} ${middleInitial ? middleInitial + '. ' : ''}${lastName}`.toUpperCase(), firstName: firstName.toUpperCase(), middleInitial: middleInitial.toUpperCase(), lastName: lastName.toUpperCase(), email: email.toLowerCase(), password, program, positionCategory: pc, specificTitle: st, memberId: assignedId, role, status: 'active', paymentStatus: pay, lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, joinedDate: new Date().toISOString() };
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-[#3E2723]">
      {showForgotModal && (
         <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-sm w-full p-10 shadow-2xl border-t-[12px] border-[#FDB813] text-center">
               <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><LifeBuoy size={32}/></div>
               <h4 className="font-serif text-2xl font-black uppercase">Account Recovery</h4>
               <p className="text-sm font-medium text-amber-950 mt-4 leading-relaxed">To reset your Hub password, contact an authorized LBA Officer or email us at:</p>
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
        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-center text-xs font-bold">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' && (
            <div className="space-y-3">
               <input type="text" required placeholder="Member ID" className="w-full p-4 border border-amber-200 rounded-2xl font-bold uppercase" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())} />
               <input type="password" required placeholder="Password" className="w-full p-4 border border-amber-200 rounded-2xl" value={password} onChange={(e) => setPassword(e.target.value)} />
               <div className="flex justify-end pr-2"><button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-800 transition-colors">Forgot Password?</button></div>
            </div>
          )}
          {authMode === 'register' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                <input type="text" required placeholder="FIRST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none text-[10px] font-bold uppercase" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} />
                <input type="text" placeholder="MI" maxLength="1" className="p-3 border border-amber-200 rounded-xl outline-none text-[10px] text-center font-bold uppercase" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())} />
                <input type="text" required placeholder="LAST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none text-[10px] font-bold uppercase" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} />
              </div>
              <input type="email" required placeholder="LPU Email" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select required className="w-full p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="">Select Program</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="password" required placeholder="Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input type="text" placeholder="Leader Key (Optional)" className="w-full p-3 border border-amber-200 rounded-xl text-[10px] font-bold uppercase" value={inputKey} onChange={(e) => setInputKey(e.target.value.toUpperCase())} />
            </div>
          )}
          {authMode === 'payment' && (
            <div className="space-y-4">
               <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod('gcash')} className={`flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] ${paymentMethod === 'gcash' ? 'bg-[#3E2723] text-[#FDB813]' : 'bg-amber-50 text-amber-900'}`}>GCash</button>
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={`flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] ${paymentMethod === 'cash' ? 'bg-[#3E2723] text-[#FDB813]' : 'bg-amber-50 text-amber-900'}`}>Cash</button>
               </div>
               <div className="p-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-900 text-center uppercase">
                  {paymentMethod === 'gcash' ? "GCash: 09XX XXX XXXX (Treasurer)" : "Provide the Daily Cash Key"}
               </div>
               <input type="text" required placeholder={paymentMethod === 'gcash' ? "Reference No." : "Daily Cash Key"} className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs uppercase" value={paymentMethod === 'gcash' ? refNo : cashOfficerKey} onChange={e => paymentMethod === 'gcash' ? setRefNo(e.target.value) : setCashOfficerKey(e.target.value.toUpperCase())} />
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-2xl hover:bg-black transition-all font-black uppercase flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20}/> : (authMode === 'payment' ? 'Complete' : authMode === 'register' ? 'Register' : 'Enter Hub')}
          </button>
        </form>
        {authMode !== 'payment' && (
          <p className="text-center mt-6 text-[10px] text-amber-800 uppercase font-black">
            {authMode === 'login' ? (
              <button onClick={() => setAuthMode('register')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Brew With Us</button>
            ) : <button onClick={() => setAuthMode('login')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Back to Login</button>}
          </p>
        )}
      </div>
    </div>
  );
};

// --- Dashboard Component ---

const Dashboard = ({ user, profile, setProfile, logout }) => {
  const [view, setView] = useState('home');
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, renewalOpen: true });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "Loading association history..." });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedBaristas, setSelectedBaristas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef(null);
  const currentDailyKey = getDailyCashPasskey();

  const isOfficer = useMemo(() => ['Officer', 'Execomm'].includes(profile.positionCategory), [profile.positionCategory]);

  useEffect(() => {
    if (!user) return;
    
    // Add error handlers to all snapshots
    const unsubReg = onSnapshot(
        collection(db, 'artifacts', appId, 'public', 'data', 'registry'), 
        (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))),
        (e) => console.log("Registry fetch error:", e)
    );
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => {});
    const unsubAnn = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => {});
    const unsubSug = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), orderBy('createdAt', 'desc')), (s) => setSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => {});
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (snap) => snap.exists() && setHubSettings(snap.data()), (e) => {});
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (snap) => snap.exists() && setSecureKeys(snap.data()), (e) => {});
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (snap) => snap.exists() && setLegacyContent(snap.data()), (e) => {});
    
    return () => { unsubReg(); unsubEvents(); unsubAnn(); unsubSug(); unsubOps(); unsubKeys(); unsubLegacy(); };
  }, [user]);

  const filteredRegistry = useMemo(() => {
    let res = [...members];
    if (searchQuery) res = res.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.memberId.toLowerCase().includes(searchQuery.toLowerCase()));
    res.sort((a, b) => (a[sortConfig.key] || "").localeCompare(b[sortConfig.key] || "") * (sortConfig.direction === 'asc' ? 1 : -1));
    return res;
  }, [members, searchQuery, sortConfig]);

  const paginatedRegistry = filteredRegistry.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => setSelectedBaristas(selectedBaristas.length === paginatedRegistry.length ? [] : paginatedRegistry.map(m => m.memberId));
  const toggleSelectBarista = (mid) => setSelectedBaristas(prev => prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid]);

  const handleUpdatePosition = async (targetId, cat, specific = "") => {
    if (!isOfficer) return;
    const target = members.find(m => m.memberId === targetId);
    let newId = target.memberId;
    const isL = ['Officer', 'Execomm', 'Committee'].includes(cat);
    const baseId = newId.endsWith('C') ? newId.slice(0, -1) : newId;
    newId = baseId + (isL ? 'C' : '');
    const updates = { positionCategory: cat, specificTitle: specific || cat, memberId: newId, role: ['Officer', 'Execomm'].includes(cat) ? 'admin' : 'member', paymentStatus: isL ? 'exempt' : target.paymentStatus };
    if (newId !== targetId) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', targetId));
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', newId), { ...target, ...updates });
  };

  const handleRemoveMember = async (mid, name) => {
    if (!confirm(`Are you sure you want to remove ${name}?`)) return;
    await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid));
  };

  const handleRotateSecurityKeys = async () => {
    const newKeys = {
        officerKey: "OFF" + Math.random().toString(36).slice(-6).toUpperCase(),
        headKey: "HEAD" + Math.random().toString(36).slice(-6).toUpperCase(),
        commKey: "COMM" + Math.random().toString(36).slice(-6).toUpperCase()
    };
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), newKeys);
  };

  const downloadImportTemplate = () => {
    const headers = "Name,Email,Program,PositionCategory,SpecificTitle";
    const sample = "JUAN DELA CRUZ,juan@lpu.edu.ph,BSIT,Member,Member";
    const blob = new Blob([headers + "\n" + sample], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "LBA_Import_Template.csv";
    a.click();
  };

  const handleBulkImportCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
       try {
          const text = evt.target.result;
          const rows = text.split('\n').filter(r => r.trim().length > 0);
          const batch = writeBatch(db);
          let count = members.length;
          for (let i = 1; i < rows.length; i++) {
             const [name, email, prog, pos, title] = rows[i].split(',').map(s => s.trim());
             if (!name || !email) continue;
             const mid = generateLBAId(pos, count++);
             const meta = getMemberIdMeta();
             const data = { name: name.toUpperCase(), email: email.toLowerCase(), program: prog || "UNSET", positionCategory: pos || "Member", specificTitle: title || pos || "Member", memberId: mid, role: pos === 'Officer' ? 'admin' : 'member', status: 'active', paymentStatus: pos !== 'Member' ? 'exempt' : 'unpaid', lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, password: "LBA" + mid.slice(-5), joinedDate: new Date().toISOString() };
             batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid), data);
          }
          await batch.commit();
       } catch (err) {} finally { setIsImporting(false); e.target.value = ""; }
    };
    reader.readAsText(file);
  };

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

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row text-[#3E2723] font-sans">
      <aside className="w-64 bg-[#3E2723] text-amber-50 md:flex flex-col hidden">
        <div className="p-8 border-b border-amber-900/30 text-center">
           <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-20 h-20 object-contain mx-auto mb-4" />
           <h1 className="font-serif font-black text-[10px] uppercase">LPU Baristas' Association</h1>
        </div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
          {menuItems.map(item => (
            <button key={item.id} onClick={() => setView(item.id)} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-[#FDB813] text-[#3E2723] shadow-lg font-black' : 'text-amber-200/40 hover:bg-white/5'}`}>
              <item.icon size={18}/><span className="uppercase text-[10px] font-black">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-amber-900/30"><button onClick={logout} className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase hover:text-red-300"><LogOut size={16} /> Exit Hub</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto">
        <header className="flex justify-between items-center mb-10">
          <h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2>
          <div className="bg-white p-2 pr-6 rounded-full border border-amber-100 flex items-center gap-3 shadow-sm">
            <img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full" />
            <div className="hidden sm:block"><p className="text-[10px] font-black uppercase text-[#3E2723]">{profile.nickname || "Barista"}</p><p className="text-[8px] font-black text-amber-500 uppercase">{profile.specificTitle}</p></div>
          </div>
        </header>

        {view === 'home' && (
           <div className="space-y-10 animate-fadeIn">
              <div className="bg-[#3E2723] rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-[#FDB813]">
                <h3 className="font-serif text-3xl font-black uppercase mb-2">{profile.name}</h3>
                <p className="text-[#FDB813] font-black text-lg">"{profile.nickname || 'Senior Barista'}"</p>
                <div className="mt-6 flex gap-2">
                   <div className="bg-[#FDB813] text-[#3E2723] px-5 py-2 rounded-full font-black text-[9px] uppercase">{profile.specificTitle}</div>
                   <div className="bg-green-500 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase">Active</div>
                </div>
              </div>
           </div>
        )}

        {view === 'reports' && isOfficer && (
           <div className="space-y-10 animate-fadeIn text-[#3E2723]">
              <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
                 <StatIcon icon={TrendingUp} color="text-amber-600" />
                 <div><h3 className="font-serif text-4xl font-black uppercase">Terminal</h3><p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p></div>
              </div>
              <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-xl flex items-center justify-between">
                 <div className="flex items-center gap-6"><Banknote size={32}/><div className="leading-tight"><h4 className="font-serif text-2xl font-black uppercase">Daily Cash Key</h4><p className="text-[10px] font-black uppercase opacity-60">Verification Code</p></div></div>
                 <div className="bg-white/40 px-8 py-4 rounded-3xl border-2 border-dashed border-[#3E2723]/20 font-mono text-4xl font-black">{currentDailyKey}</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] text-white">
                    <h4 className="font-serif text-2xl font-black uppercase mb-6 text-[#FDB813]">Security Vault</h4>
                    {[{l:'Officer', v:secureKeys?.officerKey||SEED_OFFICER_KEY}, {l:'Head', v:secureKeys?.headKey||SEED_HEAD_KEY}, {l:'Comm', v:secureKeys?.commKey||SEED_COMM_KEY}].map((k,i)=>(<div key={i} className="flex justify-between p-4 bg-white/5 rounded-2xl mb-2"><span className="text-[10px] font-black uppercase">{k.l} Key</span><span className="font-mono text-xl font-black text-[#FDB813]">{k.v}</span></div>))}
                    <button onClick={handleRotateSecurityKeys} className="w-full mt-4 bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Rotate Keys</button>
                 </div>
              </div>
           </div>
        )}

        {view === 'members' && isOfficer && (
           <div className="space-y-6 animate-fadeIn text-[#3E2723]">
              <div className="bg-white p-6 rounded-[40px] border border-amber-100 flex justify-between items-center">
                 <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl"><Search size={16}/><input type="text" placeholder="Search..." className="bg-transparent outline-none text-[10px] font-black uppercase" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/></div>
                 <div className="flex gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkImportCSV} />
                    <button onClick={()=>fileInputRef.current.click()} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Import</button>
                    <button onClick={downloadImportTemplate} className="bg-amber-100 px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Template</button>
                 </div>
              </div>
              <div className="bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-hidden">
                 <table className="w-full text-left uppercase">
                    <thead className="bg-[#3E2723] text-white font-serif tracking-widest"><tr className="text-[10px]"><th className="p-8 w-12"><button onClick={toggleSelectAll}>{selectedBaristas.length === paginatedRegistry.length ? <CheckCircle2 size={16} className="text-[#FDB813]"/> : <Plus size={16}/>}</button></th><th>Barista</th><th className="text-center">ID</th><th className="text-center">Designation</th><th className="text-right">Manage</th></tr></thead>
                    <tbody className="text-[#3E2723] divide-y divide-amber-50">
                       {paginatedRegistry.map(m => (
                          <tr key={m.memberId} className="hover:bg-amber-50/50">
                             <td className="p-8 text-center"><button onClick={()=>toggleSelectBarista(m.memberId)}>{selectedBaristas.includes(m.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813]"/> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto"></div>}</button></td>
                             <td className="flex items-center gap-4 py-8"><div><p className="font-black text-xs">{m.name}</p><p className="text-[8px] opacity-60">"{m.nickname || m.program}"</p></div></td>
                             <td className="text-center font-mono font-black">{m.memberId}</td>
                             <td className="text-center">
                                <select className="bg-amber-50 text-[8px] font-black p-2 rounded-lg outline-none mb-1 block mx-auto" value={m.positionCategory} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                <select className="bg-white border border-amber-100 text-[8px] font-black p-2 rounded-lg outline-none block mx-auto" value={m.specificTitle} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)}><option value="Member">Member</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                             </td>
                             <td className="text-right pr-8"><button onClick={()=>handleRemoveMember(m.memberId, m.name)} className="text-red-500 p-2"><Trash2 size={16}/></button></td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        )}
      </main>
    </div>
  );
};

// --- Main Root ---
const App = () => {
  const [profile, setProfile] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth exactly once
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
           await signInWithCustomToken(auth, __initial_auth_token);
        } else {
           await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center text-[#3E2723]">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-black uppercase tracking-widest text-xs animate-pulse">Establishing Secure Connection...</p>
      </div>
    );
  }

  return profile ? (
    <Dashboard user={user} profile={profile} setProfile={setProfile} logout={() => { setProfile(null); signOut(auth); }} />
  ) : (
    <Login user={user} onLoginSuccess={setProfile} />
  );
};

export default App;
