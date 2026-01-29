import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously, 
  signInWithCustomToken,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  getDocs,
  limit,
  deleteDoc,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { 
  Users, Calendar, Award, Bell, LogOut, UserCircle, CheckSquare, 
  BarChart3, Plus, ShieldCheck, RefreshCw, Menu, X, Sparkles, 
  Loader2, Coffee, ChevronDown, Fingerprint, AlertCircle, Zap, 
  Quote, Settings, Camera, Save, Trash2, History, QrCode, 
  DollarSign, FileText, PieChart, UserCheck, Star, Users2, 
  Upload, Download, Info, Lock, Key, ShieldAlert, BadgeCheck,
  MapPin, Clock, Layout, Edit3, Image as ImageIcon, Send, Megaphone,
  Ticket, ToggleLeft, ToggleRight, FileSpreadsheet, ClipboardCheck,
  MessageSquare, Inbox, Activity, TrendingUp, UserPlus, BrainCircuit,
  Mail, Trash, Trophy, Search, ArrowUpDown, CheckCircle2, DownloadCloud,
  Settings2, ChevronLeft, ChevronRight, Facebook, Instagram, ShieldQuestion,
  LockKeyhole, KeyRound, AlertTriangle, LifeBuoy, FileUp, Banknote
} from 'lucide-react';

// --- Global Configuration ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'lba-portal-v13';

// --- Constants ---
const ORG_LOGO_URL = "https://lh3.googleusercontent.com/d/1aYqARgJoEpHjqWJONprViSsEUAYHNqUL";
const OFFICER_TITLES = [
  "President", "Vice President", "Secretary", "Assistant Secretary", 
  "Treasurer", "Auditor", "Business Manager", "P.R.O.", "Overall Committee Head"
];
const COMMITTEE_TITLES = ["Committee Head", "Committee Member"];
const PROGRAMS = ["CAKO", "CLOCA", "CLOHS", "HRA", "ITM/ITTM"];
const POSITION_CATEGORIES = ["Member", "Officer", "Committee", "Execomm", "Blacklisted"];

const SEED_OFFICER_KEY = "KAPERATA_OFFICER_2024";
const SEED_HEAD_KEY = "KAPERATA_HEAD_2024";
const SEED_COMM_KEY = "KAPERATA_COMM_2024";

const SOCIAL_LINKS = {
  facebook: "https://fb.com/lpubaristas.official",
  instagram: "https://instagram.com/lpubaristas.official",
  tiktok: "https://tiktok.com/@lpubaristas.official",
  email: "lpubaristas.official@gmail.com"
};

// --- Custom Components ---
const TikTokIcon = ({ size = 18, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const StatIcon = ({ icon: Icon, color }) => {
  if (!Icon) return null;
  return (
    <div className={`p-3 rounded-2xl bg-amber-50 ${color} leading-none flex items-center justify-center shrink-0`}>
      <Icon size={20} />
    </div>
  );
};

// --- Logic Helpers ---

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

const generateRandomKey = (length = 8) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

const generateLBAId = (category, currentCount = 0) => {
  const { sy, sem } = getMemberIdMeta();
  const sequence = currentCount + 1;
  const paddedSequence = String(sequence).padStart(4, '0');
  const isLeader = ['Officer', 'Execomm', 'Committee'].includes(category);
  return `LBA${sy}-${sem}${paddedSequence}${isLeader ? "C" : ""}`;
};

const getDailyCashPasskey = () => {
  const now = new Date();
  return `KBA-${now.getDate()}-${(now.getMonth() + 1) + (now.getFullYear() % 100)}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- Login Component ---

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
    let unsubOps;
    let unsubKeys;
    const initPublicAccess = async () => {
      try {
        if (!auth.currentUser) await signInAnonymously(auth);
        unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (snap) => snap.exists() && setHubSettings(snap.data()));
        unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (snap) => snap.exists() && setSecureKeys(snap.data()));
      } catch (err) { console.error(err); }
    };
    initPublicAccess();
    return () => { unsubOps?.(); unsubKeys?.(); };
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (!auth.currentUser) await signInAnonymously(auth);
      if (authMode === 'register') {
        if (!hubSettings.registrationOpen) throw new Error("Registration is closed.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        let pc = 'Member'; let st = 'Member'; let role = 'member'; let pay = 'unpaid';
        if (inputKey) {
          const offK = secureKeys?.officerKey || SEED_OFFICER_KEY;
          const headK = secureKeys?.headKey || SEED_HEAD_KEY;
          const commK = secureKeys?.commKey || SEED_COMM_KEY;
          const userKey = inputKey.trim().toUpperCase();
          if (userKey === offK.toUpperCase()) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
          else if (userKey === headK.toUpperCase()) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
          else if (userKey === commK.toUpperCase()) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
          else throw new Error("Invalid leader verification key.");
        }
        const snap = await getDocs(collection(db, 'artifacts', appId, 'public', 'data', 'registry'));
        const assignedId = generateLBAId(pc, snap.size);
        const meta = getMemberIdMeta();
        const profileData = { uid: auth.currentUser.uid, name: `${firstName} ${middleInitial ? middleInitial + '. ' : ''}${lastName}`.toUpperCase(), nickname: "", firstName: firstName.toUpperCase(), middleInitial: middleInitial.toUpperCase(), lastName: lastName.toUpperCase(), email: email.toLowerCase(), password, program, positionCategory: pc, specificTitle: st, memberId: assignedId, role, status: 'active', paymentStatus: pay, lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, joinedDate: new Date().toISOString() };
        if (pc !== 'Member') {
          await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', assignedId), profileData);
          await setDoc(doc(db, 'artifacts', appId, 'users', profileData.uid, 'profile', 'member_data'), profileData);
          onLoginSuccess(profileData);
        } else {
          setPendingProfile(profileData);
          setAuthMode('payment');
        }
      } else if (authMode === 'payment') {
        const todayKey = getDailyCashPasskey();
        if (paymentMethod === 'cash' && cashOfficerKey.trim().toUpperCase() !== todayKey.toUpperCase()) throw new Error("Invalid Daily Cash Key.");
        const finalProfile = { ...pendingProfile, paymentStatus: 'paid', paymentDetails: { method: paymentMethod, refNo, verifiedAt: new Date().toISOString() } };
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', finalProfile.memberId), finalProfile);
        await setDoc(doc(db, 'artifacts', appId, 'users', finalProfile.uid, 'profile', 'member_data'), finalProfile);
        onLoginSuccess(finalProfile);
      } else if (authMode === 'login') {
        const snap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1)));
        if (snap.empty) throw new Error("ID records not found.");
        const userData = snap.docs[0].data();
        if (userData.password !== password) throw new Error("Incorrect credentials.");
        onLoginSuccess(userData);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 font-sans text-[#3E2723]">
      {showForgotModal && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
           <div className="bg-white rounded-[40px] max-w-sm w-full p-10 shadow-2xl border-t-[12px] border-[#FDB813] text-center">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6"><LifeBuoy size={32}/></div>
              <h4 className="font-serif text-2xl font-black uppercase">Account Help</h4>
              <p className="text-sm font-medium text-amber-950 mt-4 leading-relaxed">To reset your Hub password, please contact an authorized LBA Officer or email us at:</p>
              <a href={`mailto:${SOCIAL_LINKS.email}`} className="text-[#3E2723] font-black underline block mt-2">{SOCIAL_LINKS.email}</a>
              <button onClick={() => setShowForgotModal(false)} className="w-full mt-8 bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-[10px]">Return to Login</button>
           </div>
        </div>
      )}
      <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-t-[12px] border-[#3E2723]">
        <div className="flex flex-col items-center mb-10 leading-tight">
          <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA Logo" className="w-36 h-36 object-contain mb-4" referrerPolicy="no-referrer" />
          <h1 className="text-center font-serif text-xl font-black uppercase text-[#3E2723]">LPU Baristas' Association</h1>
          <p className="text-[#FDB813] font-black tracking-[0.3em] text-[10px] bg-[#3E2723] px-4 py-1 rounded-full mt-2 uppercase leading-none pt-1">KAPERATA HUB</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl mb-6 text-xs font-bold text-center border border-red-100">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' && (
            <div className="space-y-3">
               <input type="text" required placeholder="Member ID (LBA...)" className="w-full p-4 border border-amber-200 rounded-2xl font-bold bg-[#FDFBF7] outline-none uppercase text-[#3E2723]" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())} />
               <input type="password" required placeholder="Password" autoCapitalize="none" autoCorrect="off" spellCheck="false" className="w-full p-4 border border-amber-200 rounded-2xl bg-[#FDFBF7] outline-none text-[#3E2723]" value={password} onChange={(e) => setPassword(e.target.value)} />
               <div className="flex justify-end pr-2"><button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black uppercase text-amber-600">Forgot Password?</button></div>
            </div>
          )}
          {authMode === 'register' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                <input type="text" required placeholder="FIRST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-[10px] font-bold uppercase" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} />
                <input type="text" placeholder="MI" maxLength="1" className="p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-[10px] text-center font-bold uppercase" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())} />
                <input type="text" required placeholder="LAST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-[10px] font-bold uppercase" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} />
              </div>
              <input type="email" required placeholder="LPU Email Address" className="w-full p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-xs font-bold text-[#3E2723]" value={email} onChange={(e) => setEmail(e.target.value)} />
              <select required className="w-full p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-xs font-black uppercase text-[#3E2723]" value={program} onChange={(e) => setProgram(e.target.value)}>
                <option value="">Select Program</option>
                {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <input type="password" required placeholder="Password" className="w-full p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-xs text-[#3E2723]" value={password} onChange={(e) => setPassword(e.target.value)} />
              <input type="password" required placeholder="Confirm" className="w-full p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-xs text-[#3E2723]" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <input type="text" placeholder="Leader Verification Key" className="w-full p-3 border border-amber-200 rounded-xl outline-none bg-[#FDFBF7] text-[10px] font-bold uppercase text-[#3E2723]" value={inputKey} onChange={(e) => setInputKey(e.target.value.toUpperCase())} />
            </div>
          )}
          {authMode === 'payment' && (
            <div className="space-y-4 animate-fadeIn">
               <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentMethod('gcash')} className={`flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${paymentMethod === 'gcash' ? 'bg-[#3E2723] text-[#FDB813]' : 'bg-amber-50 text-amber-900'}`}>GCash</button>
                  <button type="button" onClick={() => setPaymentMethod('cash')} className={`flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] transition-all ${paymentMethod === 'cash' ? 'bg-[#3E2723] text-[#FDB813]' : 'bg-amber-50 text-amber-900'}`}>Cash</button>
               </div>
               {paymentMethod === 'gcash' ? (
                  <div className="space-y-3 pt-2 text-[#3E2723]">
                     <div className="p-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-900 text-center uppercase tracking-widest leading-relaxed">GCash: 09XX XXX XXXX <br/>(LBA Treasurer)</div>
                     <input type="text" required placeholder="Reference No." className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs text-[#3E2723]" value={refNo} onChange={e => setRefNo(e.target.value)} />
                  </div>
               ) : (
                  <div className="space-y-3 pt-2 text-[#3E2723]">
                     <div className="p-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-900 text-center uppercase tracking-widest leading-relaxed">Provide the Daily Key from <br/>an LBA Officer</div>
                     <input type="text" required placeholder="Daily Cash Key" className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs uppercase font-bold text-[#3E2723]" value={cashOfficerKey} onChange={e => setCashOfficerKey(e.target.value.toUpperCase())} />
                  </div>
               )}
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-2xl hover:bg-black transition-all font-black uppercase shadow-xl flex justify-center items-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={20}/> : (authMode === 'payment' ? 'Finish Brewing' : authMode === 'register' ? 'Brew With Us' : 'Enter Hub')}
          </button>
        </form>
        {authMode !== 'payment' && (
          <p className="text-center mt-6 text-[10px] text-amber-800 uppercase font-black tracking-widest leading-none">
            {authMode === 'login' ? (
              hubSettings.registrationOpen ? (
                <button onClick={() => setAuthMode('register')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Brew With Us</button>
              ) : <span className="opacity-50 italic text-[#3E2723]">Registration currently closed</span>
            ) : <button onClick={() => setAuthMode('login')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Back to Login</button>}
          </p>
        )}
      </div>
    </div>
  );
};

// --- Dashboard Component ---

const Dashboard = ({ profile, setProfile, logout }) => {
  // 1. Initial State standardized at top
  const [view, setView] = useState('home');
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, renewalOpen: true });
  const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' });
  const [legacyContent, setLegacyContent] = useState({ body: "Established in 2012...", highlights: [] });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  const [selectedBaristas, setSelectedBaristas] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', action: null });
  const [milestoneBarista, setMilestoneBarista] = useState(null);
  const [milestoneText, setMilestoneText] = useState("");
  const [isSavingMilestone, setIsSavingMilestone] = useState(false);

  const [editName, setEditName] = useState(profile.name || "");
  const [editNickname, setEditNickname] = useState(profile.nickname || "");
  const [editEmail, setEditEmail] = useState(profile.email || "");
  const [editProgram, setEditProgram] = useState(profile.program || "");
  const [editPassword, setEditPassword] = useState(profile.password || "");
  const [editBio, setEditBio] = useState(profile.bio || "");
  const [editPhotoUrl, setEditPhotoUrl] = useState(profile.photoUrl || "");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [brewMasterQuery, setBrewMasterQuery] = useState("");
  const [brewMasterResponse, setBrewMasterResponse] = useState("");
  const [isBrewMasterLoading, setIsBrewMasterLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [showEventForm, setShowEventForm] = useState(false);
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [currentEventId, setCurrentEventId] = useState(null);
  const [eventForm, setEventForm] = useState({ name: '', type: 'Workshop', date: '', time: '', venue: '', description: '' });
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [evalForm, setEvalForm] = useState({ rating: 5, feedback: '', eventId: '' });
  const [suggestionNote, setSuggestionNote] = useState("");
  const [showNoticeForm, setShowNoticeForm] = useState(false);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });
  const [isEditingLegacy, setIsEditingLegacy] = useState(false);
  const [editLegacyBody, setEditLegacyBody] = useState("");

  const fileInputRef = useRef(null);

  // 2. Logic Helpers
  const isOfficer = useMemo(() => ['Officer', 'Execomm'].includes(profile.positionCategory), [profile.positionCategory]);
  const isCommittee = useMemo(() => profile.positionCategory === 'Committee', [profile.positionCategory]);
  const isStaff = useMemo(() => isOfficer || isCommittee, [isOfficer, isCommittee]);
  const currentMeta = getMemberIdMeta();
  const currentDailyKey = useMemo(() => getDailyCashPasskey(), []);

  const getMemberStatus = (m) => {
    if (['Officer', 'Execomm', 'Committee'].includes(m.positionCategory)) return { label: 'Active (Staff)', color: 'bg-indigo-500' };
    const meta = getMemberIdMeta();
    if (m.lastRenewedSem === meta.sem && m.lastRenewedSY === meta.sy) return { label: 'Active', color: 'bg-green-500' };
    if (hubSettings.renewalOpen) return { label: 'For Renewal', color: 'bg-amber-500' };
    return { label: 'Expired', color: 'bg-gray-400' };
  };

  const closeConfirm = () => setConfirmModal({ open: false, title: '', message: '', action: null });
  const triggerConfirm = (title, message, action) => setConfirmModal({ open: true, title, message, action });

  // 3. Real-time Listeners - Guarded by Auth
  useEffect(() => {
    if (!profile?.memberId || !auth.currentUser) return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), (snap) => {
      if (snap.exists()) {
        const fresh = snap.data();
        if (JSON.stringify(fresh) !== JSON.stringify(profile)) setProfile(prev => ({ ...prev, ...fresh }));
      }
    }, (err) => console.error(err));
    return () => unsub();
  }, [profile?.memberId]);

  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error(err));
    const unsubAnn = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error(err));
    const unsubReg = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (s) => setMembers(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error(err));
    const unsubEval = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'evaluations'), (s) => setEvaluations(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error(err));
    const unsubSug = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), orderBy('createdAt', 'desc')), (s) => setSuggestions(s.docs.map(d => ({ id: d.id, ...d.data() }))), (err) => console.error(err));
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (snap) => snap.exists() && setHubSettings(snap.data()), (err) => console.error(err));
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (snap) => snap.exists() && setSecureKeys(snap.data()), (err) => console.error(err));
    const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (snap) => {
      if (snap.exists()) { setLegacyContent(snap.data()); setEditLegacyBody(snap.data().body || ""); }
    }, (err) => console.error(err));
    
    return () => {
      unsubEvents(); unsubAnn(); unsubReg(); unsubEval(); unsubSug(); unsubOps(); unsubKeys(); unsubLegacy();
    };
  }, [profile?.uid]);

  // 4. Memoized UI data
  const teamOrgChart = useMemo(() => {
    const officers = members.filter(m => ['Officer', 'Execomm'].includes(m.positionCategory));
    const committees = members.filter(m => m.positionCategory === 'Committee');
    return {
      exec: {
        tier1: officers.filter(m => ["President", "Vice President"].includes(m.specificTitle)),
        tier2: officers.filter(m => (m.specificTitle || "").includes("Secretary")),
        tier3: officers.filter(m => !["President", "Vice President", "Secretary", "Assistant Secretary"].includes(m.specificTitle))
      },
      comm: {
        heads: committees.filter(m => m.specificTitle === "Committee Head"),
        members: committees.filter(m => m.specificTitle !== "Committee Head").sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      }
    };
  }, [members]);

  const financialData = useMemo(() => {
    const segments = {};
    members.filter(m => m.paymentStatus === 'paid').forEach(m => {
      const key = `SY${m.lastRenewedSY || '??'}-SEM${m.lastRenewedSem || '?'}`;
      if (!segments[key]) segments[key] = { count: 0, revenue: 0 };
      segments[key].count += 1; segments[key].revenue += 100;
    });
    return Object.entries(segments).sort((a, b) => b[0].localeCompare(a[0]));
  }, [members]);

  const filteredRegistry = useMemo(() => {
    let res = [...members];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      res = res.filter(m => (m.name || "").toLowerCase().includes(q) || (m.nickname || "").toLowerCase().includes(q) || (m.memberId || "").toLowerCase().includes(q));
    }
    res.sort((a, b) => {
      const valA = (a[sortConfig.key] || "").toString().toLowerCase();
      const valB = (b[sortConfig.key] || "").toString().toLowerCase();
      return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
    return res;
  }, [members, searchQuery, sortConfig]);

  const totalPages = Math.ceil(filteredRegistry.length / itemsPerPage);
  const paginatedRegistry = useMemo(() => filteredRegistry.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredRegistry, currentPage]);

  const toggleSelectAll = () => {
    if (selectedBaristas.length === paginatedRegistry.length && paginatedRegistry.length > 0) setSelectedBaristas([]);
    else setSelectedBaristas(paginatedRegistry.map(m => m.memberId));
  };
  const toggleSelectBarista = (mid) => setSelectedBaristas(prev => prev.includes(mid) ? prev.filter(id => id !== mid) : [...prev, mid]);

  // 5. Handlers
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
             const isL = ['Officer', 'Execomm', 'Committee'].includes(pos);
             const mid = generateLBAId(pos, count++);
             const meta = getMemberIdMeta();
             const profileData = { name: name.toUpperCase(), email: email.toLowerCase(), program: prog || "UNSET", positionCategory: pos || "Member", specificTitle: title || pos || "Member", memberId: mid, role: ['Officer', 'Execomm'].includes(pos) ? 'admin' : 'member', status: 'active', paymentStatus: isL ? 'exempt' : 'unpaid', lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, password: "LBA" + mid.slice(-5), joinedDate: new Date().toISOString() };
             batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid), profileData);
          }
          await batch.commit();
       } catch (err) {} finally { setIsImporting(false); e.target.value = ""; }
    };
    reader.readAsText(file);
  };

  const downloadImportTemplate = () => {
    const csv = "Official Name,Email,Program,Position Category,Specific Title\nJUAN DELA CRUZ,juan.delacruz@lpu.edu.ph,CAKO,Member,Member";
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = "LBA_Template.csv"; a.click();
  };

  const handleUpdateProfile = async () => {
    setIsSavingProfile(true);
    try {
      const up = { name: editName.toUpperCase(), nickname: editNickname, email: editEmail.toLowerCase(), program: editProgram, password: editPassword, bio: editBio, photoUrl: editPhotoUrl };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), up, { merge: true });
      await setDoc(doc(db, 'artifacts', appId, 'users', profile.uid, 'profile', 'member_data'), up, { merge: true });
      setProfile(prev => ({ ...prev, ...up }));
    } catch(e) {} finally { setIsSavingProfile(false); }
  };

  const handleAskBrewMaster = async () => {
    if (!brewMasterQuery.trim()) return;
    setIsBrewMasterLoading(true);
    setBrewMasterResponse("Brewing technical advice...");
    setTimeout(() => {
       setBrewMasterResponse("Technical Tip: Ensure your espresso machine is backflushed daily to maintain flavour clarity and consistency.");
       setIsBrewMasterLoading(false);
    }, 1200);
  };

  const handlePostSuggestion = async (e) => {
    e.preventDefault();
    if (!suggestionNote.trim()) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), { content: suggestionNote, createdAt: serverTimestamp() });
    setSuggestionNote("");
  };

  const handleRegisterEvent = async (eventId) => {
    const regs = events.find(e => e.id === eventId).registrations || [];
    if (regs.includes(profile.uid)) return;
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', eventId), { registrations: [...regs, profile.uid] });
  };

  const handleCreateOrUpdateEvent = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { ...eventForm, registrations: [], attendance: [], createdAt: serverTimestamp() });
    setShowEventForm(false);
  };

  const handleCreateNotice = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), { ...noticeForm, authorName: profile.name, authorTitle: profile.specificTitle, createdAt: serverTimestamp() });
    setShowNoticeForm(false); setNoticeForm({ title: '', content: '' });
  };

  const handleRemoveMember = (memberId, name) => {
    if (!isOfficer) return;
    triggerConfirm("Delete Record", `Permanently remove ${name}?`, async () => {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId));
      closeConfirm();
    });
  };

  const handleRenewal = () => {
    if (!hubSettings.renewalOpen) return;
    triggerConfirm("Confirm Renewal", "Restore status for current semester?", async () => {
      const up = { lastRenewedSem: currentMeta.sem, lastRenewedSY: currentMeta.sy, status: 'active', paymentStatus: 'paid' };
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), up, { merge: true });
      await setDoc(doc(db, 'artifacts', appId, 'users', profile.uid, 'profile', 'member_data'), up, { merge: true });
      closeConfirm();
    });
  };

  const handleExportRegistrySegmented = (type) => {
    let targets = [...members];
    if (type === 'current_sem') targets = members.filter(m => m.lastRenewedSem === currentMeta.sem && m.lastRenewedSY === currentMeta.sy);
    else if (type === 'selected') targets = members.filter(m => selectedBaristas.includes(m.memberId));
    let csv = "Name,Nickname,Hub ID,Program,Position,Email,Status\n";
    targets.forEach(m => csv += `${m.name},${m.nickname || ""},${m.memberId},${m.program},${m.specificTitle},${m.email},${getMemberStatus(m).label}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `LBA_Export_${type}.csv`; a.click();
  };

  const handleExportFinancials = () => {
    let csv = "Term,Paid Count,Revenue\n";
    financialData.forEach(([term, d]) => csv += `${term},${d.count},₱${d.revenue}\n`);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = "LBA_Financials.csv"; a.click();
  };

  const handleBulkEmail = () => {
    const emails = members.filter(m => selectedBaristas.includes(m.memberId)).map(m => m.email).filter(e => !!e).join(',');
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&bcc=${emails}&su=${encodeURIComponent("Association Notice")}`, '_blank');
  };

  // 6. Sidebar/UI Configuration
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

  const statsList = [
    { label: 'Registry Size', value: members.length, icon: Users, color: 'text-amber-600' },
    { label: 'Staff Pool', value: members.filter(m => m.paymentStatus === 'exempt').length, icon: BadgeCheck, color: 'text-orange-500' },
    { label: 'Revenue Pool', value: `₱${members.filter(m => m.paymentStatus === 'paid').length * 100}`, icon: DollarSign, color: 'text-green-600' },
    { label: 'Feedback notes', value: suggestions.length, icon: MessageSquare, color: 'text-indigo-600' }
  ];

  const dashboardUpcomingEvents = useMemo(() => events.filter(ev => ev.date >= new Date().toISOString().split('T')[0]).sort((a,b) => a.date.localeCompare(b.date)), [events]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col md:flex-row text-[#3E2723] font-sans overflow-x-hidden">
      
      {/* Global Modals */}
      {confirmModal.open && (
         <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-sm w-full p-8 shadow-2xl border-t-[12px] border-red-500 text-center">
               <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 leading-none pt-1"><AlertTriangle size={32}/></div>
               <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] leading-none pt-1">{confirmModal.title}</h4>
               <p className="text-sm font-medium text-amber-900 mt-4 leading-relaxed pt-1">{confirmModal.message}</p>
               <div className="grid grid-cols-2 gap-4 mt-8 pt-1">
                  <button onClick={closeConfirm} className="bg-amber-50 text-amber-800 py-4 rounded-2xl font-black uppercase text-[10px] pt-1 leading-none">Cancel</button>
                  <button onClick={confirmModal.action} className="bg-red-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] shadow-lg pt-1 leading-none">Confirm</button>
               </div>
            </div>
         </div>
      )}

      {milestoneBarista && (
         <div className="fixed inset-0 z-[120] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white rounded-[40px] max-w-md w-full p-8 shadow-2xl border-t-[12px] border-[#FDB813] pt-4 leading-none text-[#3E2723]">
               <div className="flex justify-between items-center mb-6 leading-none pt-1"><h4 className="font-serif text-2xl font-black uppercase pt-1">Assign Accolade</h4><button onClick={() => setMilestoneBarista(null)} className="text-amber-200 hover:text-red-500"><X size={24}/></button></div>
               <textarea rows="4" className="w-full p-5 bg-amber-50 rounded-[32px] outline-none font-bold text-sm border-2 border-transparent focus:border-[#FDB813] leading-relaxed pt-1" value={milestoneText} onChange={e => setMilestoneText(e.target.value)}></textarea>
               <button onClick={async () => {
                  setIsSavingMilestone(true);
                  await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', milestoneBarista.memberId), { milestones: milestoneText }, { merge: true });
                  setIsSavingMilestone(false); setMilestoneBarista(null);
               }} disabled={isSavingMilestone} className="w-full mt-6 bg-[#3E2723] text-[#FDB813] py-5 rounded-[28px] font-black uppercase shadow-xl flex items-center justify-center gap-2 pt-1 leading-none">{isSavingMilestone ? <Loader2 className="animate-spin" size={18}/> : "Update Record"}</button>
            </div>
         </div>
      )}

      {showEventForm && (
         <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm leading-none pt-4 text-[#3E2723]">
            <div className="bg-white rounded-[40px] max-w-lg w-full shadow-2xl p-8 border-t-[12px] border-[#3E2723] overflow-y-auto max-h-[90vh] pt-4">
               <div className="flex justify-between items-center mb-6 leading-none pt-1"><h4 className="font-serif text-2xl font-black uppercase pt-1">Craft Event</h4><button onClick={() => setShowEventForm(false)} className="text-amber-300 hover:text-red-500"><X size={24}/></button></div>
               <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4 pt-1">
                  <input type="text" required placeholder="Event Name" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold pt-1 text-xs" value={eventForm.name} onChange={e => setEventForm({...eventForm, name: e.target.value})} />
                  <input type="text" placeholder="Venue" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-[10px] pt-1" value={eventForm.venue} onChange={e => setEventForm({...eventForm, venue: e.target.value})} />
                  <textarea rows="4" placeholder="Event description..." className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-medium text-[10px] pt-1 leading-relaxed" value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})}></textarea>
                  <button type="submit" className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-3xl font-black uppercase shadow-xl hover:bg-black leading-none pt-1">Save Event</button>
               </form>
            </div>
         </div>
      )}

      {showNoticeForm && (
         <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm pt-4 leading-none text-[#3E2723]">
            <div className="bg-white rounded-[40px] max-w-lg w-full shadow-2xl p-8 border-t-[12px] border-[#3E2723] pt-4">
               <div className="flex justify-between items-center mb-6 leading-none pt-1"><h4 className="font-serif text-2xl font-black uppercase pt-1">Bulletin</h4><button onClick={() => setShowNoticeForm(false)} className="text-amber-300 hover:text-red-500"><X size={24}/></button></div>
               <form onSubmit={handleCreateNotice} className="space-y-4 pt-1">
                  <input type="text" required placeholder="Subject" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-xs pt-1" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} />
                  <textarea rows="6" placeholder="Updates..." className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-medium text-xs pt-1 leading-relaxed" value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})}></textarea>
                  <button type="submit" className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-3xl font-black uppercase shadow-xl hover:bg-black pt-1">Publish</button>
               </form>
            </div>
         </div>
      )}

      {/* Main UI */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#3E2723] text-amber-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-amber-900/30 flex flex-col items-center text-center leading-none pt-1"><img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-20 h-20 object-contain mb-4 leading-none pt-1" referrerPolicy="no-referrer" /><h1 className="font-serif font-black text-[10px] leading-tight text-white uppercase tracking-widest px-2 tracking-tight leading-none pt-1">LPU Baristas' Association</h1></div>
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto leading-none pt-4">{menuItems.map(item => (<button key={item.id} onClick={() => { setView(item.id); setIsMobileMenuOpen(false); }} className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${view === item.id ? 'bg-[#FDB813] text-[#3E2723] shadow-lg font-black' : 'text-amber-200/40 hover:bg-white/5'} leading-none pt-1`}><item.icon size={18}/><span className="uppercase text-[10px] tracking-widest font-black tracking-tight leading-none pt-1">{item.label}</span></button>))}</nav>
        <div className="px-6 pb-4 pt-2 border-t border-amber-900/30 text-center flex justify-center gap-4 text-amber-100/40"><a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="hover:text-[#FDB813] transition-colors leading-none pt-1"><Facebook size={18}/></a><a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="hover:text-[#FDB813] transition-colors leading-none pt-1"><Instagram size={18}/></a><a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="hover:text-[#FDB813] transition-colors leading-none pt-1"><TikTokIcon size={18}/></a></div>
        <div className="p-6 border-t border-amber-900/30 leading-none pt-4"><button onClick={logout} className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase tracking-widest hover:text-red-300 transition-colors leading-none pt-1"><LogOut size={16} /> Exit Hub</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-10 overflow-y-auto bg-[#FDFBF7] pt-4 leading-none text-[#3E2723]">
        <header className="flex justify-between items-center mb-10 pt-1 leading-none"><div className="md:hidden pt-1" onClick={() => setIsMobileMenuOpen(true)}><Menu className="text-[#3E2723] pt-1" /></div><h2 className="font-serif text-3xl font-black uppercase tracking-tighter leading-tight pt-1">KAPErata Hub</h2><div className="bg-white p-2 pr-6 rounded-full border border-amber-100 flex items-center gap-3 shadow-sm leading-none pt-1"><img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover leading-none pt-1" /><div className="hidden sm:block pt-1 leading-none"><p className="text-[10px] font-black uppercase mb-1 leading-none pt-1 text-[#3E2723]">{profile.nickname || profile.name.split(' ')[0]}</p><p className="text-[8px] font-black text-amber-500 uppercase leading-none pt-1 leading-none">{profile.specificTitle}</p></div></div></header>

        {needsRenewal && (
           <div className="mb-10 bg-red-500 text-white p-8 rounded-[40px] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 animate-pulse leading-none pt-4"><div className="flex items-center gap-5 pt-1"><AlertCircle size={32} /><div className="leading-tight pt-1"><h4 className="font-serif text-2xl font-black uppercase pt-1">Semester Renewal Active</h4><p className="text-xs font-bold pt-1 opacity-90">Restore status for the current term.</p></div></div><button onClick={handleRenewal} disabled={!hubSettings.renewalOpen} className="bg-white text-red-600 px-10 py-4 rounded-3xl font-black uppercase text-xs shadow-xl pt-1 leading-none">{hubSettings.renewalOpen ? 'Renew Now' : 'Closed'}</button></div>
        )}

        {view === 'home' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-4 leading-none animate-fadeIn">
            <div className="lg:col-span-2 space-y-10 pt-4 leading-none">
              <div className="bg-[#3E2723] rounded-[48px] p-10 text-white relative overflow-hidden shadow-2xl border-4 border-[#FDB813] leading-none pt-4">
                <div className="absolute top-32 right-10 rotate-12 leading-none pt-1"><div className="bg-[#FDB813] text-[#3E2723] p-4 rounded-full shadow-2xl border-4 border-[#3E2723] animate-pulse leading-none pt-1"><Ticket size={24} className="leading-none pt-1"/><p className="text-[8px] font-black uppercase leading-none pt-1">10% OFF</p><p className="text-[7px] font-black leading-none pt-1">B'CAFE</p></div></div>
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center pt-4 leading-none"><img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-32 h-32 rounded-[40px] object-cover border-4 border-white/20 shadow-xl bg-amber-50 leading-none pt-1"/><div className="flex-1 text-center md:text-left pt-1 leading-none"><h3 className="font-serif text-3xl font-black uppercase pt-1 leading-none">{profile.name}</h3>{profile.nickname && <p className="text-[#FDB813] font-black text-lg pt-1 leading-none">"{profile.nickname}"</p>}<p className="text-amber-100/60 font-mono text-[11px] uppercase pt-1 leading-none pt-1">{profile.memberId}</p><div className="flex gap-2 justify-center md:justify-start pt-4 leading-none"><div className="bg-[#FDB813] text-[#3E2723] px-5 py-2 rounded-full font-black text-[9px] uppercase pt-1 leading-none">{profile.specificTitle}</div><div className={`px-4 py-2 rounded-full font-black text-[9px] uppercase pt-1 leading-none ${needsRenewal ? 'bg-red-500' : 'bg-green-500'}`}>{needsRenewal ? 'EXPIRED' : 'ACTIVE'}</div></div></div></div>
              </div>
              <div className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-sm space-y-8 pt-4 leading-none"><h4 className="font-serif text-2xl font-black uppercase pt-1 leading-none text-[#3E2723]">Hub Profile</h4><div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-1 leading-none"><div className="space-y-4 pt-1 leading-none"><div><label className="text-[9px] font-black uppercase text-amber-600 block mb-1 pt-1 leading-none">Full Name</label><input type="text" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-xs uppercase pt-1 leading-none text-[#3E2723]" value={editName} onChange={e => setEditName(e.target.value.toUpperCase())} /></div><div><label className="text-[9px] font-black uppercase text-amber-600 block mb-1 pt-1 leading-none">Nickname</label><input type="text" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-xs uppercase pt-1 leading-none text-[#3E2723]" value={editNickname} onChange={e => setEditNickname(e.target.value)} /></div><div><label className="text-[9px] font-black uppercase text-amber-600 block mb-1 pt-1 leading-none">Email Address</label><input type="email" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-xs pt-1 leading-none text-[#3E2723]" value={editEmail} onChange={e => setEditEmail(e.target.value.toLowerCase())} /></div></div><div className="space-y-4 pt-1 leading-none"><div><label className="text-[9px] font-black uppercase text-amber-600 block mb-1 pt-1 leading-none">Avatar Link</label><input type="text" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-[10px] pt-1 leading-none text-[#3E2723]" value={editPhotoUrl} onChange={e => setEditPhotoUrl(e.target.value)} /></div><div><label className="text-[9px] font-black uppercase text-red-600 block mb-1 pt-1 leading-none">Password</label><input type="password" placeholder="••••••••" className="w-full p-4 bg-amber-50 rounded-2xl outline-none font-bold text-xs pt-1 leading-none text-[#3E2723]" value={editPassword} onChange={e => setEditPassword(e.target.value)} /></div><button onClick={handleUpdateProfile} className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-3xl font-black uppercase shadow-xl hover:bg-black transition-all leading-none pt-1">Sync Profile</button></div></div></div>
            </div>
            <div className="space-y-8 leading-none pt-4"><div className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-sm space-y-6 leading-none pt-4"><h4 className="font-serif text-xl font-black uppercase tracking-tighter pt-1 leading-none text-[#3E2723]">Fresh Batches</h4><div className="space-y-4 max-h-[300px] overflow-y-auto pt-2 leading-none">{dashboardUpcomingEvents.length > 0 ? dashboardUpcomingEvents.map(ev => (<div key={ev.id} className="flex items-center gap-3 p-4 bg-amber-50/50 rounded-3xl border border-amber-100 animate-slideIn pt-1 leading-none"><div className="w-10 h-10 bg-[#3E2723] text-[#FDB813] rounded-xl flex items-center justify-center font-black shrink-0 text-[10px] pt-1 leading-none">{new Date(ev.date).getDate()}</div><div className="flex-1 leading-tight pt-1 leading-none"><p className="font-black text-[10px] uppercase mb-1 pt-1 leading-none">{ev.name}</p><p className="text-[8px] text-amber-600 font-bold uppercase pt-1 leading-none">{ev.venue}</p></div>{ev.registrations?.includes(profile.uid) && <UserCheck size={14} className="text-green-600 pt-1"/>}</div>)) : <p className="text-[10px] font-black uppercase opacity-20 text-center py-4">No sessions simmering</p>}</div></div></div>
          </div>
        )}

        {view === 'brew_master' && (
           <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-20 pt-4 text-[#3E2723]">
              <div className="border-b-4 border-[#3E2723] pb-4 pt-1 leading-none"><h3 className="font-serif text-5xl font-black uppercase pt-1 leading-none text-[#3E2723]">AI Brew Master</h3><p className="text-amber-50 font-black uppercase text-[10px] mt-2 tracking-widest leading-none pt-1 text-amber-500">Technical coffee consultant</p></div>
              <div className="bg-white p-10 rounded-[48px] border border-amber-100 shadow-xl space-y-8 pt-4 leading-none"><div className="flex gap-2 pt-1"><input type="text" placeholder="Brew guide query..." className="flex-1 p-5 bg-amber-50 rounded-[28px] outline-none font-bold text-sm pt-1 leading-none text-[#3E2723]" value={brewMasterQuery} onChange={e => setBrewMasterQuery(e.target.value)} /><button onClick={handleAskBrewMaster} className="bg-[#3E2723] text-[#FDB813] p-5 rounded-[28px] pt-1 leading-none transition-all hover:bg-black">{isBrewMasterLoading ? <Loader2 className="animate-spin" size={24}/> : <Send size={24}/>}</button></div>{brewMasterResponse && (<div className="p-8 bg-amber-50 rounded-[40px] border-l-8 border-[#FDB813] pt-1 leading-none animate-fadeIn"><p className="text-sm font-medium leading-relaxed whitespace-pre-wrap pt-1 text-amber-950">{brewMasterResponse}</p></div>)}</div>
           </div>
        )}

        {view === 'suggestions' && (
           <div className="max-w-4xl mx-auto space-y-10 animate-fadeIn pb-20 pt-4 text-[#3E2723]">
              <div className="border-b-4 border-[#3E2723] pb-4 pt-1 leading-none"><h3 className="font-serif text-5xl font-black uppercase pt-1 text-[#3E2723]">Suggestion Box</h3><p className="text-amber-50 font-black uppercase text-[10px] mt-2 tracking-widest leading-none pt-1 text-amber-500">Grounds for improvement</p></div>
              <div className="bg-white p-10 rounded-[50px] border-4 border-dashed border-amber-200 pt-1 leading-none"><form onSubmit={handlePostSuggestion} className="flex gap-4 pt-1"><textarea required placeholder="Hub feedback..." className="flex-1 bg-amber-50 rounded-3xl p-6 outline-none font-bold text-sm resize-none pt-1 leading-relaxed text-[#3E2723]" rows="3" value={suggestionNote} onChange={e => setSuggestionNote(e.target.value)}></textarea><button type="submit" className="bg-[#3E2723] text-[#FDB813] px-8 rounded-3xl font-black uppercase text-xs pt-1 leading-none">Drop</button></form></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 leading-none">{suggestions.length > 0 ? suggestions.map(sug => (<div key={sug.id} className="bg-white p-8 rounded-[40px] border border-amber-100 shadow-sm relative pt-1 leading-none"><div className="absolute top-6 right-8 opacity-10 pt-1 leading-none"><Quote size={40}/></div><p className="text-xs font-medium text-amber-900/80 pt-1 leading-relaxed italic">"{sug.content}"</p><div className="mt-4 pt-4 border-t border-amber-50 flex justify-between items-center pt-1 leading-none"><span className="text-[8px] font-black uppercase text-amber-400 pt-1 leading-none">{formatDate(sug.createdAt?.toDate?.())}</span></div></div>)) : <p className="col-span-full text-[10px] font-black uppercase opacity-20 text-center py-10">No notes in the box</p>}</div>
           </div>
        )}

        {view === 'members' && isOfficer && (
          <div className="space-y-6 animate-fadeIn pt-4 leading-none text-[#3E2723]">
             <div className="bg-white p-6 rounded-[40px] border border-amber-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4 pt-4 leading-none">
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl w-full md:w-80 leading-none pt-1"><Search size={16} /><input type="text" placeholder="Search registry..." className="bg-transparent outline-none text-[10px] font-black uppercase w-full pt-1 text-[#3E2723]" value={searchQuery} onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }} /></div>
                <div className="flex flex-wrap items-center gap-2 pt-1 leading-none">
                   {selectedBaristas.length > 0 && <button onClick={handleBulkEmail} className="bg-[#3E2723] text-[#FDB813] px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase shadow-md pt-1 leading-none hover:bg-black">Bulk Email</button>}
                   <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkImportCSV} />
                   <button onClick={() => fileInputRef.current?.click()} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase shadow-md flex items-center gap-2 pt-1 leading-none">{isImporting ? <Loader2 className="animate-spin" size={14}/> : <FileUp size={14}/>} Import</button>
                   <button onClick={downloadImportTemplate} className="bg-amber-100 text-[#3E2723] px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase shadow-md flex items-center gap-2 pt-1 leading-none"><Download size={14}/> Template</button>
                   <button onClick={() => handleExportRegistrySegmented('current_sem')} className="bg-[#FDB813] text-[#3E2723] px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase shadow-md pt-1 leading-none">Term CSV</button>
                </div>
             </div>
             <div className="bg-white rounded-[40px] border border-amber-100 shadow-2xl overflow-hidden pt-1 leading-none">
                <table className="w-full text-left text-sm font-bold uppercase pt-1 leading-none">
                   <thead className="bg-[#3E2723] text-white font-serif tracking-widest pt-1 leading-none">
                      <tr>
                         <th className="p-8 text-[10px] w-12 text-center pt-1 leading-none">
                            <button onClick={toggleSelectAll}>
                              {selectedBaristas.length === paginatedRegistry.length && paginatedRegistry.length > 0 ? (
                                <CheckCircle2 size={16} className="text-[#FDB813] pt-1" />
                              ) : (
                                <Plus size={16} className="pt-1" />
                              )}
                            </button>
                         </th>
                         <th className="p-8 text-[10px] w-1/4 pt-1 leading-none cursor-pointer" onClick={() => setSortConfig({ key: 'name', direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' })}>Barista Profile <ArrowUpDown size={10} className="inline ml-1 opacity-50 pt-1"/></th>
                         <th className="p-8 text-[10px] text-center pt-1 leading-none">Hub ID / Status</th>
                         <th className="p-8 text-[10px] pt-1 leading-none text-center">Positions</th>
                         <th className="p-8 text-[10px] text-right pt-1 leading-none">Actions</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-amber-50 pt-1 leading-none text-[#3E2723]">
                      {paginatedRegistry.length > 0 ? paginatedRegistry.map(m => {
                         const s = getMemberStatus(m);
                         return (
                            <tr key={m.memberId} className={`hover:bg-amber-50/50 leading-none pt-1 ${selectedBaristas.includes(m.memberId) ? 'bg-amber-50' : ''}`}>
                               <td className="p-8 text-center pt-1 leading-none">
                                  <button onClick={() => toggleSelectBarista(m.memberId)}>
                                    {selectedBaristas.includes(m.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813] pt-1" /> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto pt-1"></div>}
                                  </button>
                               </td>
                               <td className="p-8 flex items-center gap-4 pt-4 leading-none">
                                  <img src={getDirectLink(m.photoUrl) || `https://ui-avatars.com/api/?name=${m.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-xl object-cover leading-none pt-1" />
                                  <div className="leading-tight pt-1">
                                     <p className="font-black uppercase text-xs pt-1 leading-none text-[#3E2723]">{m.name}</p>
                                     <p className="text-[8px] font-black uppercase text-amber-500 tracking-tighter pt-1 leading-none">{m.nickname ? `"${m.nickname}"` : m.program}</p>
                                  </div>
                               </td>
                               <td className="p-8 text-center leading-none pt-1">
                                  <p className="font-mono text-lg font-black text-amber-700 leading-none">{m.memberId}</p>
                                  <div className={`mt-1 inline-block px-3 py-1 rounded-full text-[7px] font-black text-white uppercase leading-none ${s.color}`}>{s.label}</div>
                               </td>
                               <td className="p-8 pt-1 leading-none">
                                  <div className="flex flex-col gap-1 pt-1 leading-none items-center text-[#3E2723]">
                                     <select className="bg-amber-50 border-none text-[8px] font-black uppercase p-2 rounded-lg outline-none w-32" value={m.positionCategory} onChange={(e) => handleUpdatePosition(m.memberId, e.target.value, m.specificTitle)}>{POSITION_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                     <select className="bg-white border border-amber-100 text-[8px] font-black uppercase p-2 rounded-lg outline-none w-32" value={m.specificTitle} onChange={(e) => handleUpdatePosition(m.memberId, m.positionCategory, e.target.value)}><option value="Member">Member</option>{OFFICER_TITLES.map(t => <option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t => <option key={t} value={t}>{t}</option>)}</select>
                                  </div>
                               </td>
                               <td className="p-8 text-right space-y-2 pt-1 leading-none">
                                  <div className="flex gap-2 justify-end pt-1">
                                     <button onClick={() => { setMilestoneBarista(m); setMilestoneText(m.milestones || ""); }} className="bg-amber-50 text-orange-500 p-2 rounded-xl pt-1 leading-none shadow-sm transition-all hover:bg-orange-500 hover:text-white"><Trophy size={16}/></button>
                                     <button onClick={() => handleContactBarista(m)} className="bg-amber-50 text-[#3E2723] p-2 rounded-xl pt-1 shadow-sm leading-none transition-all hover:bg-[#FDB813]"><Mail size={16}/></button>
                                     <button onClick={() => handleRemoveMember(m.memberId, m.name)} className="bg-red-50 text-red-500 p-2 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm leading-none pt-1 leading-none"><Trash2 size={16}/></button>
                                  </div>
                               </td>
                            </tr>
                         )
                      }) : <tr><td colSpan="5" className="p-20 text-center text-[10px] font-black uppercase opacity-20">The Registry is empty</td></tr>}
                   </tbody>
                </table>
                <div className="p-6 bg-[#3E2723] text-white flex justify-between items-center pt-4 leading-none">
                   <p className="text-[10px] font-black uppercase tracking-widest pt-1 leading-none">Page {currentPage} of {totalPages || 1}</p>
                   <div className="flex gap-2 pt-1 leading-none">
                      <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white/10 rounded-xl pt-1 leading-none transition-all hover:bg-white/20"><ChevronLeft size={18}/></button>
                      <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white/10 rounded-xl pt-1 leading-none transition-all hover:bg-white/20"><ChevronRight size={18}/></button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {view === 'reports' && isOfficer && (
           <div className="space-y-10 animate-fadeIn pb-20 pt-4 leading-none text-[#3E2723]">
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b-4 border-[#3E2723] pb-6 pt-1 leading-none"><div className="flex items-center gap-4 pt-1"><div className="w-16 h-16 bg-[#3E2723] text-[#FDB813] rounded-3xl flex items-center justify-center shadow-xl rotate-3 pt-1 leading-none"><TrendingUp size={28}/></div><div><h3 className="font-serif text-4xl font-black uppercase leading-none pt-1 text-[#3E2723]">Admin Terminal</h3><p className="text-amber-50 font-black uppercase text-[10px] tracking-[0.4em] mt-1 pt-1 leading-none pt-1 leading-none text-amber-500">The Control Roaster</p></div></div><div className="flex flex-col gap-3 pt-1 text-[#3E2723]"><div className="flex items-center gap-3 bg-white p-3 rounded-[32px] border border-amber-100 shadow-sm leading-none pt-1"><div className="flex items-center gap-2 px-3 pt-1 leading-none"><Settings2 size={14} /><span className="text-[9px] font-black uppercase leading-none pt-1">Hub Ops</span></div><button onClick={() => handleToggleSetting('registrationOpen')} className={`px-4 py-2 rounded-2xl text-[8px] font-black uppercase ${hubSettings.registrationOpen ? 'bg-green-500 text-white shadow-md' : 'bg-red-100 text-red-600'} leading-none pt-1`}>{hubSettings.registrationOpen ? 'Reg: Open' : 'Reg: Locked'}</button><button onClick={() => handleToggleSetting('renewalOpen')} className={`px-4 py-2 rounded-2xl text-[8px] font-black uppercase ${hubSettings.renewalOpen ? 'bg-green-500 text-white shadow-md' : 'bg-red-100 text-red-600'} leading-none pt-1`}>{hubSettings.renewalOpen ? 'Renewal: Open' : 'Renewal: Locked'}</button></div><button onClick={handleRotateSecurityKeys} className="bg-[#3E2723] text-red-400 border border-red-900/30 px-5 py-3 rounded-2xl font-black text-[9px] uppercase leading-none flex items-center justify-center gap-2 hover:bg-red-900/10 transition-all leading-none pt-1"><LockKeyhole size={14} /> Rotate Leader Keys</button></div></div>
              
              <div className="bg-[#FDB813] p-8 rounded-[40px] border-4 border-[#3E2723] shadow-xl flex items-center justify-between animate-slideIn">
                 <div className="flex items-center gap-6 pt-1">
                    <div className="w-16 h-16 bg-[#3E2723] rounded-3xl flex items-center justify-center text-[#FDB813] shadow-lg pt-1 leading-none"><Banknote size={32}/></div>
                    <div className="leading-tight pt-1 text-[#3E2723]">
                       <h4 className="font-serif text-2xl font-black uppercase pt-1 leading-none text-[#3E2723]">Daily Cash Key</h4>
                       <p className="text-[10px] font-black uppercase opacity-60 mt-1 pt-1">For verifying in-person member payments</p>
                    </div>
                 </div>
                 <div className="bg-white/40 px-8 py-4 rounded-3xl border-2 border-dashed border-[#3E2723]/20 pt-1 leading-none">
                    <span className="font-mono text-4xl font-black tracking-tighter text-[#3E2723] leading-none">{currentDailyKey}</span>
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4 leading-none pt-4 text-white">
                <div className="bg-[#3E2723] p-10 rounded-[50px] border-4 border-[#FDB813] shadow-2xl leading-none pt-4"><div className="flex justify-between items-start mb-8 leading-none pt-1"><div><h4 className="font-serif text-3xl font-black text-[#FDB813] uppercase pt-1 leading-none">Security Vault</h4><p className="text-[9px] font-black uppercase text-white/40 mt-1 leading-none pt-1 leading-none pt-1">Leader Keys SY {currentMeta.sy}</p></div><ShieldCheck size={40} className="text-green-500 leading-none pt-1"/></div><div className="grid grid-cols-1 gap-4 leading-none pt-1 leading-none pt-1">{[{ label: 'Officer Key', value: secureKeys?.officerKey || SEED_OFFICER_KEY, icon: ShieldAlert }, { label: 'Comm Head Key', value: secureKeys?.headKey || SEED_HEAD_KEY, icon: Trophy }, { label: 'Comm Member Key', value: secureKeys?.commKey || SEED_COMM_KEY, icon: Users2 }].map((k, i) => (<div key={i} className="flex justify-between items-center p-5 bg-white/5 rounded-3xl border border-white/10 leading-none pt-1"><div className="flex items-center gap-4 pt-1"><StatIcon icon={k.icon} color="text-amber-400"/><span className="text-[10px] font-black uppercase text-white/80 pt-1 leading-none">{k.label}</span></div><span className="font-mono text-xl font-black text-[#FDB813] leading-none pt-1">{k.value}</span></div>))}</div></div>
                <div className="bg-white p-10 rounded-[50px] border border-amber-100 shadow-sm leading-none pt-4 overflow-hidden leading-none pt-4 text-[#3E2723]"><div className="flex justify-between items-center border-b-2 border-amber-50 pb-4 mb-6 pt-1 leading-none pt-1 text-[#3E2723]"><h4 className="font-serif text-2xl font-black uppercase pt-1 leading-none">Financials</h4><button onClick={handleExportFinancials} className="bg-[#3E2723] text-[#FDB813] px-4 py-2 rounded-full font-black text-[9px] uppercase transition-all hover:scale-105 pt-1 leading-none pt-1">Export CSV</button></div><div className="space-y-4 pt-2 leading-none pt-1"><table className="w-full text-[10px] font-black uppercase leading-none pt-1 text-[#3E2723]"><thead className="bg-amber-50 text-amber-800 pt-1 leading-none"><tr><th className="p-3 text-left pt-1 leading-none">Term</th><th className="p-3 text-center pt-1 leading-none">Paid</th><th className="p-3 text-right pt-1 leading-none">Revenue</th></tr></thead><tbody className="divide-y divide-amber-50 leading-none pt-1">{financialData.length > 0 ? financialData.map(([term, data]) => (<tr key={term} className="leading-none pt-1 text-[#3E2723]"><td className="p-3 text-left pt-1 leading-none">{term}</td><td className="p-3 text-center text-amber-600 pt-1 leading-none">{data.count}</td><td className="p-3 text-right text-green-600 pt-1 leading-none">₱{data.revenue}.00</td></tr>)) : <tr><td colSpan="3" className="p-10 text-center opacity-20">No data brewed yet</td></tr>}</tbody></table></div></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4 leading-none pt-4 text-[#3E2723]">{statsList.map((stat, i) => (<div key={i} className="bg-white p-6 rounded-[35px] border border-amber-100 shadow-sm pt-4 leading-none text-[#3E2723]"><div className="flex justify-between items-start mb-4 pt-1 leading-none"><StatIcon icon={stat.icon} color={stat.color}/></div><p className="text-[9px] font-black uppercase text-amber-500 tracking-widest pt-2 leading-none">{stat.label}</p><p className="text-3xl font-black mt-1 pt-1 leading-none">{stat.value}</p></div>))}</div>
           </div>
        )}
      </main>
    </div>
  );
};

// --- App Root ---
const App = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token).catch(() => signInAnonymously(auth));
        else await signInAnonymously(auth).catch(() => {});
      } catch(e) {}
      setLoading(false);
    };
    initAuth();
  }, []);
  if (loading) return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center font-serif font-black text-[#3E2723] uppercase tracking-widest animate-pulse">
      <img src={getDirectLink(ORG_LOGO_URL)} className="w-32 h-32 object-contain mb-8 animate-bounce" referrerPolicy="no-referrer" />
      Syncing Hub...
    </div>
  );
  return profile ? <Dashboard profile={profile} setProfile={setProfile} logout={() => { setProfile(null); signOut(auth); }} /> : <Login onLoginSuccess={setProfile} />;
};

export default App;
