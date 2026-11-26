import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, linkWithCredential, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { getFirestore, getDoc, deleteField, collection, query, where, onSnapshot, doc, setDoc, updateDoc, addDoc, serverTimestamp, getDocs, limit, deleteDoc, orderBy, writeBatch, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore'; 
import { Heart, ChevronDown, Play, Gift, ChevronLeft, BookOpen, Package, Users, Calendar, Award, Bell, LogOut, Home, Plus, ShieldCheck, Menu, X, Sparkles, Loader2, Coffee, Download, Lock, BadgeCheck, MapPin, Pen, Send, MessageSquare, TrendingUp, Mail, Trash2, Search, CheckCircle2, Settings2, ChevronRight, Facebook, Instagram, LifeBuoy, Banknote, AlertTriangle, AlertCircle, History, Cake, User, Trophy, Clock, Briefcase, Music, Database, Image as ImageIcon, RefreshCcw, GraduationCap, AlertOctagon, FileText, FileBarChart, ClipboardList, CheckSquare2, ExternalLink as Link2, BarChart2, Smile, UserCheck, Printer } from 'lucide-react';

let firebaseConfig;
if (typeof __firebase_config !== 'undefined') { try { firebaseConfig = JSON.parse(__firebase_config); } catch (e) { firebaseConfig = {}; } } 
else { firebaseConfig = { apiKey: "AIzaSyByPoN0xDIfomiNHLQh2q4OS0tvhY9a_5w", authDomain: "kaperata-hub.firebaseapp.com", projectId: "kaperata-hub", storageBucket: "kaperata-hub.firebasestorage.app", messagingSenderId: "760060001621", appId: "1:760060001621:web:1d0439eff2fb2d2e1143dc", measurementId: "G-D2YNL39DSF" }; }
const app = initializeApp(firebaseConfig); const auth = getAuth(app); const db = getFirestore(app);
const AUTH_SUFFIX = '@lba-hub.app';
const authEmail = (mid, v = 0) => String(mid).trim().toLowerCase() + (Number(v) > 0 ? '.' + Number(v) : '') + AUTH_SUFFIX;
const authPw = (p) => { const x = String(p); return x.length >= 6 ? x : x + '~LBA26'; };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const getSecondaryAuth = () => { const a = getApps().find(x => x.name === 'secondary') || initializeApp(firebaseConfig, 'secondary'); return getAuth(a); };
const createAuthAccount = async (mid, pw, v = 0) => { const sec = getSecondaryAuth(); let uid; try { const c = await createUserWithEmailAndPassword(sec, authEmail(mid, v), authPw(pw)); uid = c.user.uid; } catch (e) { if (e && e.code === 'auth/email-already-in-use') { const c = await signInWithEmailAndPassword(sec, authEmail(mid, v), authPw(pw)); uid = c.user.uid; } else throw e; } try { await signOut(sec); } catch (e) {} return uid; };
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'lba-portal-v13'; const appId = rawAppId.replace(/[\/.]/g, '_'); 

const ORG_LOGO_URL = "https://lh3.googleusercontent.com/d/1aYqARgJoEpHjqWJONprViSsEUAYHNqUL";
const APP_ICON_URL = "https://lh3.googleusercontent.com/d/1_MAy5RIPYHLuof-DoKcMPvN_dIM3fIwY";
const OFFICER_TITLES = ["President", "Vice President", "Secretary", "Assistant Secretary", "Treasurer", "Auditor", "Business Manager", "P.R.O.", "Public Relations Officer", "Overall Committee Head"];
const COMMITTEE_TITLES = ["Committee Head", "Committee Member"];
const PROGRAMS = ["CAKO", "CLOCA", "CLOHS", "HRA", "ITM/ITTM"];
const POSITION_CATEGORIES = ["Member", "Officer", "Committee", "Execomm", "Alumni", "Org Adviser", "Blacklisted"];
const MONTHS = [{ value: 1, label: "January" }, { value: 2, label: "February" }, { value: 3, label: "March" }, { value: 4, label: "April" }, { value: 5, label: "May" }, { value: 6, label: "June" }, { value: 7, label: "July" }, { value: 8, label: "August" }, { value: 9, label: "September" }, { value: 10, label: "October" }, { value: 11, label: "November" }, { value: 12, label: "December" }];
const DEFAULT_MASTERCLASS_MODULES = [{ id: 1, title: "Basic Coffee Knowledge & History", short: "Basics" }, { id: 2, title: "Equipment Familiarization", short: "Equipment" }, { id: 3, title: "Manual Brewing", short: "Brewing" }, { id: 4, title: "Espresso Machine", short: "Espresso" }, { id: 5, title: "Signature Beverage (Advanced)", short: "Sig Bev" }];
const BADGE_KINDS = [
  { id: 'always', label: 'Everyone (automatic)', hint: '' },
  { id: 'category', label: 'Position category (automatic)', hint: 'Member, Officer, Committee, Execomm or Alumni' },
  { id: 'years', label: 'Years in LBA (automatic)', hint: 'Number of school years since joining' },
  { id: 'volunteer', label: 'Volunteer shifts (automatic)', hint: 'Number of volunteer shifts joined' },
  { id: 'modules', label: 'Legacy Masterclass modules (automatic)', hint: 'Number of old Masterclass modules attended' },
  { id: 'master', label: 'Legacy Masterclass certification (automatic)', hint: '' },
  { id: 'manual', label: 'Awarded by an officer (manual)', hint: 'Give it with "Give Accolade" using the exact badge name' },
];
const DEFAULT_BADGES = [
  { id: 'member', name: 'Member', icon: '☕', desc: 'Join the LPU Baristas\' Association.', kind: 'always', value: '' },
  { id: 'officer', name: 'Officer', icon: '🛡️', desc: 'Serve as an officer of the association.', kind: 'category', value: 'Officer' },
  { id: 'committee', name: 'Committee', icon: '🎗️', desc: 'Serve in one of the committees.', kind: 'category', value: 'Committee' },
  { id: 'execomm', name: 'Execomm', icon: '💼', desc: 'Serve on the executive committee.', kind: 'category', value: 'Execomm' },
  { id: 'alumni', name: 'Alumni', icon: '🎓', desc: 'Be recognised as an LBA alumnus.', kind: 'category', value: 'Alumni' },
  { id: 'veteran', name: 'Veteran', icon: '🏅', desc: 'Stay with LBA for one school year or more.', kind: 'years', value: 1 },
  { id: 'vol1', name: 'Volunteer', icon: '🤚', desc: 'Join your first volunteer shift at an event.', kind: 'volunteer', value: 1 },
  { id: 'vol4', name: 'Inter. Volunteer', icon: '🔥', desc: 'Join 4 volunteer shifts.', kind: 'volunteer', value: 4 },
  { id: 'vol9', name: 'Adv. Volunteer', icon: '🚀', desc: 'Join 9 volunteer shifts.', kind: 'volunteer', value: 9 },
  { id: 'vol15', name: 'Super Volunteer', icon: '👑', desc: 'Join 15 volunteer shifts.', kind: 'volunteer', value: 15 },
  { id: 'mc1', name: 'Masterclass Attendee', icon: '🌱', desc: 'Attended at least one of the old Masterclass modules.', kind: 'modules', value: 1 },
  { id: 'mcmaster', name: 'Certified Master Barista', icon: '🏆', desc: 'Completed the legacy Masterclass: Modules 1 and 2 plus two of Modules 3 to 5.', kind: 'master', value: '' },
];
const COMMITTEES_INFO = [
  { id: "Arts", title: "Arts & Creatives", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80", description: "The creative soul of LBA. We handle all visual assets, stage decorations, and artistic direction.", roles: ["Pubmats & Posters", "Merch Design", "Venue Styling"] },
  { id: "Events", title: "Events & Logistics", image: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=800&q=80", description: "The backbone of operations. We plan flows, manage logistics, and ensure smooth gatherings.", roles: ["Program Flow", "Logistics", "Crowd Control"] },
  { id: "Marketing", title: "Marketing & PR", image: "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=800&q=80", description: "The voice of the association. Social media, public relations, photo & video documentation, and external partnerships.", roles: ["Social Media", "Photo & Video", "Copywriting", "Partnerships"] },
  { id: "Care", title: "Member\u2019s Care & Ethics", image: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80", description: "Looking after our members. We track member progress, issue ID laces, handle renewals, monitor member count and keep engagement high.", roles: ["Progress Tracking", "ID Lace Issuance", "Renewals", "Member Count", "Engagement"] }
];
const normCommittee = (c) => (c === 'Media' || c === 'PR') ? 'Marketing' : (c || '');
const committeeTitle = (id) => (COMMITTEES_INFO.find(c => c.id === id) || {}).title || id || '';
const EMAIL_RULE_MSG = "Please use your LPU network email (for example name@lpu.edu.ph) or a Gmail address (name@gmail.com).";
const isAllowedEmail = (v) => { const e = String(v || '').trim().toLowerCase(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return false; const d = e.split('@')[1]; return d === 'gmail.com' || /(^|\.)lpu[a-z]*\.edu\.ph$/.test(d); };
const isValidStudentId = (v) => /^[0-9A-Za-z-]{5,20}$/.test(String(v || '').trim());
const EXEC_ROLES = [
  { position: "President", duties: [
    "Serve as the Chief Executive Officer of LBA and preside over all Executive Board meetings and General Assemblies.",
    "Represent LBA in all university assemblies, Student Affairs Office (SAO) briefings, CITHM council meetings, and external industry partnerships.",
    "Co-sign all official correspondence, financial requisition vouchers, activity proposals, and contracts, subject to the endorsement of the Faculty Adviser.",
    "Ensure strict enforcement of this Constitution, the LBA Master Manual, and LPU regulations." ] },
  { position: "Vice President", duties: [
    "Assume the duties and powers of the President in the event of the latter\u2019s temporary absence, incapacity, resignation, or removal.",
    "Directly supervise all Functional Committee Heads and Supplementary Officers.",
    "Chair the Member\u2019s Care & Ethics Committee and oversee internal officer discipline, demerit tracking, and performance evaluations." ] },
  { position: "Secretary", duties: [
    "Serve as official custodian of all physical and digital organizational records, minutes of meetings, membership rosters, and official correspondence.",
    "Manage the Three-Tier Archiving System (Physical Campus Locker, Cloud Repository, and SAO Annual Bid Book) in accordance with the Master Manual.",
    "Ensure the SAO Annual Bid Book is updated within seven (7) business days following every completed event." ] },
  { position: "Assistant Secretary", duties: [
    "Assist the Secretary in taking accurate minutes during Executive Board meetings and General Assemblies.",
    "Monitor and record member attendance and tardiness across all assemblies, workshops, and meetings.",
    "Assist in filing physical receipts, maintaining the Campus Locker inventory log, and uploading scanned documents to the Cloud Repository.",
    "Co-compile documentation for the SAO Annual Bid Book under the supervision of the Secretary." ] },
  { position: "Treasurer", duties: [
    "Serve as official custodian of all organizational funds, fee collections, bank/digital accounts, and petty cash boxes.",
    "Issue Official Receipts (ORs) for all funds received and maintain an accurate, real-time master ledger.",
    "Disburse funds strictly through approved Requisition Vouchers bearing dual signatures (Treasurer + Auditor + President/Adviser)." ] },
  { position: "Auditor", duties: [
    "Conduct independent monthly audits of all financial records, bank balances, petty cash boxes, and B\u2019Cafe inventory logs.",
    "Verify all pre-event budget proposals and audit all post-event liquidations and Official Receipts.",
    "Certify and co-sign all semesterly and annual financial statements prior to presentation to the General Assembly, Adviser, and SAO." ] },
  { position: "Public Relations Officer", duties: [
    "Direct LBA\u2019s branding, public relations, publicity campaigns, and official social media platforms.",
    "Supervise media documentation, graphic production, and external promotional communications." ] },
  { position: "Business Manager", duties: [
    "Solicit corporate sponsorships, brand partnerships, and external funding for LBA events and competitions, subject to Adviser and SAO approval.",
    "Manage approved income-generating projects, merchandise design, production, and sales tracking.",
    "Draft sponsorship packages, Memoranda of Agreement (MOAs), and external partnership proposals for review by the President and Adviser.",
    "Turn over all collected revenues and sales logs immediately to the Treasurer and Auditor for verification and receipting." ] },
  { position: "Overall Committee Head", duties: [
    "Act as the primary operational coordinator and direct link between the Vice President and all four (4) Functional Committee Heads.",
    "Synchronize task delegations, event timelines, and workforce allocation across Arts & Creatives, Events & Logistics, Marketing & PR, and Member\u2019s Care & Ethics.",
    "Conduct regular check-ins with Committee Heads to monitor deliverable progress, resolve cross-committee bottlenecks, and track attendance/tardiness compliance.",
    "Consolidate committee post-event evaluation reports and submit performance summaries to the Vice President." ] }
];
const EXEC_POSITIONS = EXEC_ROLES.map(r => r.position);
const EXEC_QUESTIONS = [
  "Describe a time you led a team or project through a real challenge. What was the situation, what did you do, and what was the result?",
  "Tell us about a disagreement with a teammate or fellow officer. How did you handle it, and what happened afterwards?",
  "Share a time you made a mistake or missed a deadline in a group. What did you do to fix it, and what did you learn?",
  "A member who used to be active has stopped showing up. What would you do to bring them back?",
  "Describe a time you had to make an unpopular decision for the good of the group. How did you communicate it?"
];
const EMPTY_OFFICER_FORM = { role: '', intro: '', whyFit: '', resumeLink: '', plan: '', answers: ['', '', '', '', ''] };
// Newest-first ordering that also works for a post that is still being saved (createdAt not set yet) and for old posts without createdAt.
const postTime = (x) => { if (x && x.createdAt && x.createdAt.toMillis) return x.createdAt.toMillis(); if (x && x.createdAt) { const t = new Date(x.createdAt).getTime(); if (!isNaN(t)) return t; } if (x && x.date) { const t = new Date(x.date).getTime(); if (!isNaN(t)) return t; } return Date.now(); };
const isRecentPost = (x) => Date.now() - postTime(x) < 3 * 24 * 60 * 60 * 1000;
const cleanRef = (v) => String(v || '').replace(/\D/g, '');
const PENDING_MSG = "Your GCash payment is still waiting for an officer to confirm it. This unlocks as soon as it is confirmed.";
const isRefUsed = async (ref) => { try { const r = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payrefs', String(ref))); return r.exists(); } catch (e) { return false; } };
const EMPTY_ITEM = { name: '', category: '', quantity: '0', unit: 'pcs', reorderLevel: '5', notes: '' };
const MANUAL_SECTIONS = [
  { title: "Signing up and logging in", level: 'all', items: [
    "Open the Hub and tap Sign Up. Fill in your name, LPU Student ID number, email (your LPU network email or a Gmail address both work), program, birthday and a password.",
    "When you finish, the Hub gives you a Member ID that looks like LBA2627-10001. Write it down: you log in with the Member ID and your password, not with your email.",
    "Have a Leader Key from an officer? Type it in the optional Leader Key box when signing up so your role is set right away.",
    "Forgot your password or Member ID? Tap the help link on the login page and message any officer through Messenger."
  ] },
  { title: "Your dashboard and account", level: 'all', items: [
    "The Dashboard shows your membership status, Member ID, achievements and volunteer shifts.",
    "Open Settings (your profile) to update your name, nickname, email, Student ID, photo link and birthday. Emails must be an LPU network address or Gmail.",
    "Settings also shows whether your ID lace has been issued yet."
  ] },
  { title: "Orientation videos", level: 'all', items: [
    "When videos are required you will see them the first time you open the Hub: a short introduction to LBA and the app, then a membership orientation about roles, responsibilities, infractions and misconduct, and opportunities.",
    "Watch each video to the end (YouTube videos need at least 90% watched; skipping ahead does not count), tick the boxes, and for the orientation type your full name to confirm that you understood.",
    "You can rewatch both videos any time from Orientation Videos in the menu."
  ] },
  { title: "Renewing your membership", level: 'all', items: [
    "When Renewal Season is open and your membership shows Expired, a Renew option appears on your dashboard.",
    "Pay by GCash and enter the 13-digit reference number, the name of the GCash sender and the date you paid, or pay in cash to an officer, who gives you the Daily Cash Key to type in.",
    "GCash payments are checked by an officer against the GCash records. Until it is confirmed your access is limited (you can browse, but cannot join events, vote, post or apply). If a payment is rejected you will see the reason and can try again.",
    "Officers, committee members, execomm, alumni and advisers do not pay renewal fees."
  ] },
  { title: "Events, volunteering and attendance", level: 'all', items: [
    "What's Brewing? lists upcoming events. Some events run on several dates and times.",
    "If an event needs volunteers, tap a shift to sign up. You can leave a shift before it starts.",
    "Attendance is checked by officers on the event day. Past events stay in the list for reference."
  ] },
  { title: "Training Academy, Barista Diaries and the Brew Crew", level: 'all', items: [
    "The Barista Training Academy is coming soon. Your past Masterclass attendance is kept safe for when it opens.",
    "Barista Diaries is the photo journal of the organisation. Brew Crew shows the current officers and committees.",
    "Legacy Story tells the history of LBA."
  ] },
  { title: "Join the Team (committees and executive board)", level: 'all', items: [
    "Committees: choose Arts & Creatives, Events & Logistics, Marketing & PR or Member\u2019s Care & Ethics and tap Apply Now.",
    "Executive Board: read the Executive Board Positions list for each role\u2019s responsibilities, choose a position, paste a link to your resume, write a short self-introduction, explain why you fit, and answer the leadership questions.",
    "You can have one application in progress at a time. Your status shows on the same page: Pending, For Interview, Accepted or Closed. Watch your email for interview details.",
    "Your membership must be active to apply."
  ] },
  { title: "Announcements, polls and suggestions", level: 'all', items: [
    "Grind Report holds announcements. Member's Corner has polls and a suggestion box for ideas and concerns."
  ] },
  { title: "Birthdays (officers and Member's Care)", level: 'officer', items: [
    "Open Birthdays for a month calendar. Tap a day to see who is celebrating, use the arrows to change month, and check Coming up for the next 30 days.",
    "A dot shows on the menu on the day someone has a birthday. Birthdays come from the date members entered when they signed up."
  ] },
  { title: "Registry (officers)", level: 'officer', items: [
    "Search by name, Member ID, Student ID or email. Use the filter to see active, inactive, officers, committee members, ID laces issued or ID laces pending.",
    "CSV exports the whole registry (including Student ID and ID lace status). Email opens a message to the members you ticked.",
    "ID Lace: tap the Pending/Issued button on a member to record that their lace was handed over. If your Inventory has an item called ID Lace, its stock goes down by one automatically (and back up if you undo).",
    "Only a System Admin can change a member's category, title, committee or status. Changing someone back to Member automatically sets their title to Member."
  ] },
  { title: "Verifying payments (officers)", level: 'officer', items: [
    "Open Payments. Each waiting payment shows the reference number, amount, sender name and date. Find the same reference in the GCash app under Transactions.",
    "Tap Confirm if it matches: the member gets full access and your name is recorded. Tap Reject if it is not found and give a reason; the member can then pay again.",
    "Reference numbers that were already used by someone else are blocked automatically. Any officer can verify, and payments waiting 7 days or more are flagged in red."
  ] },
  { title: "Inventory (officers)", level: 'officer', items: [
    "Open Inventory and tap Add Item. Give it a name, category, current quantity, unit and a reorder level.",
    "Use the minus and plus buttons for quick changes, or Adjust to enter an amount and a reason (for example Received from supplier). Every change is saved in the item's history.",
    "Items at or below their reorder level are flagged Low Stock and counted at the top of the page.",
    "To track ID laces, add an item named ID Lace with the number you have on hand."
  ] },
  { title: "Terminal (System Admins)", level: 'admin', items: [
    "Daily Cash Key: the code members need when paying cash. Rotate it any time; the new key works immediately.",
    "Security Vault: the leader keys for officers, committee heads and committee members. Rotate them after every recruitment.",
    "Applications: review applications from Join the Team. Use the mail icon to invite for interview, the check to accept (the member's role updates automatically) and the X to decline. Your email app opens with a ready message.",
    "Importing members: Registry > Import accepts a CSV with a Name column; Email, Program, Category, Title, Committee, Status, Joined, Student ID and ID Lace are optional. Rows whose Member ID already exists are skipped.",
    "System controls: maintenance mode, open/close registration, renewal season and payment methods."
  ] },
  { title: "If something looks wrong", level: 'all', items: [
    "Refresh the page first. If a page shows a red error box, send a screenshot of it to lbaofficial.pr@gmail.com.",
    "Questions about membership, ID laces or renewals go to the Member’s Care & Ethics Committee or any officer."
  ] }
];
const parseVideo = (url) => {
  const u = String(url || '').trim(); if (!u) return null; let m;
  m = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/); if (m) return { kind: 'youtube', id: m[1] };
  m = u.match(/drive\.google\.com\/file\/d\/([\w-]+)/); if (m) return { kind: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` };
  if (/facebook\.com|fb\.watch/i.test(u)) return { kind: 'iframe', src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(u)}&show_text=false` };
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(u)) return { kind: 'file', src: u };
  if (/^https:\/\//i.test(u)) return { kind: 'iframe', src: u };
  return null;
};
const loadYT = () => new Promise((resolve) => {
  if (window.YT && window.YT.Player) return resolve(window.YT);
  const prev = window.onYouTubeIframeAPIReady; window.onYouTubeIframeAPIReady = () => { if (prev) prev(); resolve(window.YT); };
  if (!document.getElementById('yt-iframe-api')) { const t = document.createElement('script'); t.id = 'yt-iframe-api'; t.src = 'https://www.youtube.com/iframe_api'; document.head.appendChild(t); }
});
// Plays a video. When gated, it reports back (onUnlocked) only after the member has really watched it:
// YouTube = at least 90% of the video played (skipping ahead does not count); video files = played to the end without seeking ahead;
// other embeds (Google Drive, Facebook) cannot be tracked, so they unlock after the minimum watch time set by the admin.
const VideoPlayer = ({ url, minSeconds = 60, gated = false, onUnlocked }) => {
  const info = useMemo(() => parseVideo(url), [url]);
  const hostRef = useRef(null); const doneRef = useRef(false); const maxRef = useRef(0);
  const [pct, setPct] = useState(0); const [done, setDone] = useState(false); const [mode, setMode] = useState('yt'); const [left, setLeft] = useState(Number(minSeconds) || 60);
  const unlock = () => { if (doneRef.current) return; doneRef.current = true; setDone(true); if (onUnlocked) onUnlocked(); };
  useEffect(() => {
    if (!gated || !info || info.kind !== 'youtube' || mode !== 'yt') return;
    let player = null, timer = null, cancelled = false, played = 0, last = null;
    const fallback = setTimeout(() => { if (!cancelled && !player) setMode('timer'); }, 10000);
    loadYT().then((YT) => {
      if (cancelled || !hostRef.current) return;
      const el = document.createElement('div'); hostRef.current.appendChild(el);
      player = new YT.Player(el, { videoId: info.id, width: '100%', height: '100%', playerVars: { rel: 0, modestbranding: 1, playsinline: 1 }, events: { onReady: () => clearTimeout(fallback) } });
      timer = setInterval(() => { try {
        if (!player || !player.getPlayerState) return;
        const st = player.getPlayerState(); const cur = player.getCurrentTime(); const dur = player.getDuration();
        if (st === 1 && last != null) { const d = cur - last; const rate = player.getPlaybackRate ? player.getPlaybackRate() : 1; if (d > 0 && d <= 2.5 * rate) played += d; }
        last = cur;
        if (dur > 0) { setPct(Math.min(100, Math.round(played / dur * 100))); if (played >= 0.9 * dur) unlock(); }
      } catch (e) {} }, 1000);
    });
    return () => { cancelled = true; clearTimeout(fallback); if (timer) clearInterval(timer); try { if (player && player.destroy) player.destroy(); } catch (e) {} if (hostRef.current) hostRef.current.innerHTML = ''; };
  }, [gated, info, mode]);
  useEffect(() => {
    if (!gated || !info) return;
    if (!(info.kind === 'iframe' || (info.kind === 'youtube' && mode === 'timer'))) return;
    const t = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(t); unlock(); return 0; } return l - 1; }), 1000);
    return () => clearInterval(t);
  }, [gated, info, mode]);
  if (!info) return <p className="text-xs font-bold text-red-600">The video link is missing or not valid.</p>;
  const frame = "aspect-video w-full rounded-xl overflow-hidden bg-black";
  let body;
  if (info.kind === 'youtube' && gated && mode === 'yt') body = <div ref={hostRef} className={frame}></div>;
  else if (info.kind === 'youtube') body = <iframe className={frame} src={`https://www.youtube.com/embed/${info.id}?rel=0`} title="Video" allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen></iframe>;
  else if (info.kind === 'file') body = <video className={frame} src={info.src} controls playsInline controlsList="nodownload" onTimeUpdate={(e) => { const v = e.currentTarget; if (v.currentTime > maxRef.current + 1.5) v.currentTime = maxRef.current; else maxRef.current = Math.max(maxRef.current, v.currentTime); if (gated && v.duration) setPct(Math.min(100, Math.round(maxRef.current / v.duration * 100))); }} onEnded={() => { if (gated) unlock(); }}></video>;
  else body = <iframe className={frame} src={info.src} title="Video" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen></iframe>;
  return (<div>{body}{gated && (<p className={`text-[11px] font-black uppercase mt-2 ${done ? 'text-green-600' : 'text-gray-500'}`}>{done ? 'Video completed ✓' : ((info.kind === 'iframe' || mode === 'timer') ? `You can continue in ${left}s` : `Watched ${pct}% · watch at least 90% to continue`)}</p>)}</div>);
};
const VideoGate = ({ cfg, profile, step, stepNo, stepTotal, onAck, canSkip, onSkip }) => {
  const v = (cfg && cfg[step]) || {}; const [ready, setReady] = useState(false); const [checks, setChecks] = useState([false, false, false, false]); const [name, setName] = useState(''); const [busy, setBusy] = useState(false);
  useEffect(() => { setReady(false); setChecks([false, false, false, false]); setName(''); setBusy(false); }, [step]);
  const items = step === 'intro' ? ['I have watched the introduction video.'] : ['I understand the roles and responsibilities of members and officers.', 'I understand what counts as an infraction or misconduct, and the consequences.', 'I know the opportunities available to me in LBA.', 'I agree to follow the LBA rules and Master Manual.'];
  const allChecked = items.every((_, i) => checks[i]); const nameOk = step === 'intro' || name.trim().length >= 5;
  return (
    <div className="fixed inset-0 z-[300] overflow-y-auto bg-[#FFF8E7] text-[#3E2723]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">
        <div><p className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Step {stepNo} of {stepTotal} · Required before you enter the Hub</p><h2 className="font-serif text-3xl font-black uppercase mt-1">{v.title || (step === 'intro' ? 'Welcome to the Kaperata Hub' : 'Membership Orientation')}</h2><p className="text-xs font-bold text-gray-600 mt-2">{step === 'intro' ? 'A short video about LBA, this app and what you can do as a member.' : 'This video covers roles, responsibilities, infractions and misconduct, and the opportunities in LBA.'} Hi {String(profile.name || '').split(' ')[0]}, please watch it fully.</p></div>
        <VideoPlayer key={step + (v.url || '')} url={v.url} minSeconds={v.minSeconds} gated onUnlocked={() => setReady(true)} />
        <div className={`space-y-3 ${ready ? '' : 'opacity-40 pointer-events-none'}`}>
          {items.map((t, i) => (<label key={i} className="flex items-start gap-3 text-xs font-bold cursor-pointer"><input type="checkbox" className="mt-0.5 w-4 h-4" checked={!!checks[i]} onChange={(e) => setChecks(checks.map((c, k) => k === i ? e.target.checked : c))} /><span>{t}</span></label>))}
          {step === 'orientation' && (<div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Type your full name to confirm</label><input type="text" className="w-full p-3 border border-amber-200 rounded-xl text-sm font-bold uppercase bg-white" value={name} onChange={(e) => setName(e.target.value)} placeholder="YOUR FULL NAME" /></div>)}
          <button disabled={!ready || !allChecked || !nameOk || busy} onClick={async () => { setBusy(true); await onAck(step, step === 'orientation' ? { signedName: name.trim() } : {}); setBusy(false); }} className="w-full py-4 rounded-xl font-black uppercase text-xs bg-[#3E2723] text-[#FDB813] disabled:opacity-40">{busy ? 'Saving...' : (step === 'intro' && stepTotal > stepNo ? 'I understand · Next video' : 'I have watched and understood · Continue')}</button>
        </div>
        {!ready && <p className="text-[10px] font-bold text-gray-400 uppercase">The confirmation unlocks when the video is done.</p>}
        {canSkip && <button onClick={onSkip} className="text-[10px] font-black uppercase text-gray-400 underline">Admin: skip for now</button>}
        <p className="text-[10px] text-gray-400 font-bold">Video not playing? Contact an officer at lbaofficial.pr@gmail.com.</p>
      </div>
    </div>);
};
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error) { console.error('Page error:', error); }
  componentDidUpdate(prev) { if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null }); }
  render() {
    if (this.state.error) return (<div className="bg-red-50 border-2 border-red-200 rounded-[32px] p-8 text-red-900 max-w-2xl mx-auto mt-10"><h3 className="font-black uppercase text-lg mb-2">This page hit a problem</h3><p className="text-xs font-bold mb-4">Please refresh. If it keeps happening, send a screenshot of this box to lbaofficial.pr@gmail.com.</p><pre className="text-[10px] whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-red-100">{String((this.state.error && this.state.error.message) || this.state.error)}</pre></div>);
    return this.props.children;
  }
}
const gmailUrl = ({ to = '', bcc = '', subject = '', body = '' }) => 'https://mail.google.com/mail/?view=cm&fs=1' + (to ? '&to=' + encodeURIComponent(to) : '') + (bcc ? '&bcc=' + encodeURIComponent(bcc) : '') + (subject ? '&su=' + encodeURIComponent(subject) : '') + (body ? '&body=' + encodeURIComponent(body) : '');
const openGmail = (opts) => { const url = gmailUrl(opts); const w = window.open(url, '_blank', 'noopener'); if (!w) window.location.href = url; };
const SOCIAL_LINKS = { facebook: "https://fb.com/lpubaristas.official", instagram: "https://instagram.com/lpubaristas.official", tiktok: "https://tiktok.com/@lpubaristas.official", email: "lbaofficial.pr@gmail.com", pr_email: "lbaofficial.pr@gmail.com" };

const getDirectLink = (url) => { if (!url || typeof url !== 'string') return ""; if (url.includes('drive.google.com')) { const idMatch = url.match(/[-\w]{25,}/); if (idMatch) return `https://lh3.googleusercontent.com/d/${idMatch[0]}`; } return url; };
const generateCSV = (headers, rows, filename) => { const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))].join('\n'); const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); const link = document.createElement("a"); if (link.download !== undefined) { const url = URL.createObjectURL(blob); link.setAttribute("href", url); link.setAttribute("download", filename); link.style.visibility = 'hidden'; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(url); } };
const getMemberIdMeta = () => { const now = new Date(); const month = now.getMonth() + 1; const year = now.getFullYear(); let syStart = year % 100; let syEnd = (year + 1) % 100; if (month < 8) { syStart = (year - 1) % 100; syEnd = year % 100; } return { sy: `${syStart}${syEnd}`, sem: (month >= 8 || month <= 12) && month >= 8 ? "1" : "2" }; };
const generateLBAId = (category, currentCount = 0) => { const { sy, sem } = getMemberIdMeta(); const padded = String(Number(currentCount) + 1).padStart(4, '0'); const isLeader = ['Officer', 'Committee'].includes(category); return `LBA${sy}-${sem}${padded}${isLeader ? "C" : ""}`; };
const EMPTY_TASK = { title: '', description: '', deadline: '', link: '', status: 'pending', notes: '', projectId: '', committee: '', assigneeId: '', assigneeName: '' };
const randomKey = (len = 6) => { const charset = "23456789ABCDEFGHJKMNPQRSTUVWXYZ"; const u = new Uint32Array(len); window.crypto.getRandomValues(u); return Array.from(u, n => charset[n % charset.length]).join(''); };
const getDailyCashPasskey = () => { const now = new Date(); return `KBA-${now.getDate()}-${(now.getMonth() + 1) + (now.getFullYear() % 100)}`; };
// One source of truth for the cash key: the rotated key stored by an officer, or the date-based fallback.
const getActiveCashKey = (keys) => (keys && keys.dailyKey) ? keys.dailyKey : getDailyCashPasskey();
const formatDate = (dateStr) => { if (!dateStr) return ""; const d = new Date(dateStr); if (isNaN(d.getTime())) return ""; return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };
const getEventDay = (dateStr) => { if (!dateStr) return "?"; const d = new Date(dateStr); return isNaN(d.getTime()) ? "?" : d.getDate(); };
const getEventMonth = (dateStr) => { if (!dateStr) return "???"; const d = new Date(dateStr); return isNaN(d.getTime()) ? "???" : d.toLocaleString('default', { month: 'short' }).toUpperCase(); };
const getEventDateParts = (startStr, endStr) => { if (!startStr) return { day: '?', month: '?' }; const start = new Date(startStr); const startMonth = start.toLocaleString('default', { month: 'short' }).toUpperCase(); const startDay = start.getDate(); if (!endStr || startStr === endStr) return { day: `${startDay}`, month: startMonth }; const end = new Date(endStr); const endMonth = end.toLocaleString('default', { month: 'short' }).toUpperCase(); const endDay = end.getDate(); return startMonth === endMonth ? { day: `${startDay}-${endDay}`, month: startMonth } : { day: `${startDay}-${endDay}`, month: `${startMonth}/${endMonth}` }; };

const MaintenanceBanner = () => (<div className="w-full bg-[#3E2723] text-[#FDB813] text-center py-2 px-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase animate-pulse border-b-2 border-[#FDB813]"><Coffee size={14} /><span>Machine Calibration in Progress • Some Features Unavailable</span></div>);
const StatIcon = ({ icon: Icon, variant = 'default' }) => { const colors = { amber: 'bg-amber-100 text-amber-600', indigo: 'bg-indigo-100 text-indigo-600', green: 'bg-green-100 text-green-600', blue: 'bg-blue-100 text-blue-600', red: 'bg-red-100 text-red-600', default: 'bg-gray-100 text-gray-600' }; return <div className={`p-3 rounded-2xl ${colors[variant] || colors.default}`}><Icon size={24} /></div>; };
const MemberCard = ({ m }) => (<div key={m?.memberId || m?.name} className="bg-white p-6 rounded-[32px] border border-amber-100 flex flex-col items-center text-center shadow-sm w-full sm:w-64"><img src={getDirectLink(m?.photoUrl) || `https://ui-avatars.com/api/?name=${m?.name}&background=FDB813&color=3E2723`} className="w-20 h-20 rounded-full border-4 border-[#3E2723] mb-4 object-cover"/><h4 className="font-black text-xs uppercase mb-1">{m?.name}</h4>{m?.nickname && <p className="text-[10px] text-gray-500 mb-2">"{m.nickname}"</p>}<span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-[8px] font-black uppercase">{m?.specificTitle}</span></div>);
const DataPrivacyFooter = () => (<div className="w-full py-8 mt-12 border-t border-amber-900/10 text-[#3E2723]/40 text-center"><div className="flex items-center justify-center gap-2 mb-2 font-black uppercase text-[10px] tracking-widest"><ShieldCheck size={12} /> Data Privacy Statement</div><p className="text-[9px] leading-relaxed max-w-lg mx-auto px-4">LPU Baristas' Association (LBA) is committed to protecting your personal data strictly for membership management.</p><div className="mt-4 flex justify-center gap-4 text-[9px] font-bold uppercase tracking-wider"><span>© {new Date().getFullYear()} LBA</span></div></div>);

const Login = ({ user, onLoginSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState('login'); const [memberIdInput, setMemberIdInput] = useState(''); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [firstName, setFirstName] = useState(''); const [middleInitial, setMiddleInitial] = useState(''); const [lastName, setLastName] = useState(''); const [email, setEmail] = useState(''); const [studentId, setStudentId] = useState(''); const [payerName, setPayerName] = useState(''); const [payDate, setPayDate] = useState(() => new Date().toISOString().slice(0, 10)); const [program, setProgram] = useState(''); const [birthMonth, setBirthMonth] = useState(''); const [birthDay, setBirthDay] = useState(''); const [inputKey, setInputKey] = useState(''); const [registerCommittee, setRegisterCommittee] = useState(''); const [paymentMethod, setPaymentMethod] = useState(''); const [refNo, setRefNo] = useState(''); const [cashOfficerKey, setCashOfficerKey] = useState(''); const [membershipType, setMembershipType] = useState('new'); const [error, setError] = useState(initialError || ''); const [loading, setLoading] = useState(false); const [statusMessage, setStatusMessage] = useState(''); const [pendingProfile, setPendingProfile] = useState(null); const [hubSettings, setHubSettings] = useState({ registrationOpen: true, maintenanceMode: false, gcashNumber: '09953510850' }); const [secureKeys, setSecureKeys] = useState(null); const [showForgotModal, setShowForgotModal] = useState(false);
  useEffect(() => { if(initialError) setError(initialError); }, [initialError]);
  useEffect(() => { const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()), (e) => {}); return () => unsubOps(); }, [user]);
  useEffect(() => { if (hubSettings.registrationOpen !== true && authMode === 'register') setAuthMode('login'); }, [hubSettings.registrationOpen, authMode]);
  useEffect(() => { if (hubSettings.allowedPayment === 'gcash_only' && paymentMethod !== 'gcash') setPaymentMethod('gcash'); }, [hubSettings.allowedPayment, paymentMethod]);
  const finishSignup = async (mid, pw, hadKey) => { const cu = auth.currentUser; await linkWithCredential(cu, EmailAuthProvider.credential(authEmail(mid), authPw(pw))); await cu.getIdToken(true); const regDoc = doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid); if (hadKey) { try { await updateDoc(regDoc, { regKey: deleteField() }); } catch (e) {} } const snap = await getDoc(regDoc); return snap.data(); };
  const handleAuth = async (e) => { e.preventDefault(); if (loading) return; setError(''); setLoading(true); setStatusMessage('Authenticating...'); const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("Request timed out.")), 60000)); try { await Promise.race([ (async () => { let currentUser = user || auth.currentUser; if (!currentUser && authMode !== 'login') { const result = await signInAnonymously(auth); currentUser = result.user; } let liveOps = hubSettings; if (authMode !== 'login') { try { const os = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops')); if (os.exists()) { liveOps = os.data(); setHubSettings(liveOps); } } catch (oe) {} } if (authMode !== 'login' && liveOps.registrationOpen !== true) throw new Error("Registration is currently closed. Please contact an officer."); if (authMode === 'register') { if (password !== confirmPassword) throw new Error("Passwords mismatch."); if (password.length < 6) throw new Error("Please use a password of at least 6 characters."); if (!birthMonth || !birthDay) throw new Error("Birthday required."); if (!isValidStudentId(studentId)) throw new Error("Please enter your LPU Student ID number (letters, numbers and dashes only)."); if (!isAllowedEmail(email)) throw new Error(EMAIL_RULE_MSG); try { const dup = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'studentIds', studentId.trim().toUpperCase())); if (dup.exists()) throw new Error("This Student ID is already registered. Use your Member ID to log in, or contact an officer."); } catch (dupErr) { if (dupErr && /already registered/.test(dupErr.message || '')) throw dupErr; } setStatusMessage('Verifying details...'); let pc = 'Member', st = 'Member', role = 'member', pay = 'unpaid', finalMembershipType = membershipType; const applyKind = (kind) => { pc = 'Member'; st = 'Member'; role = 'member'; pay = 'unpaid'; finalMembershipType = membershipType; if (kind === 'officer') { pc = 'Officer'; role = 'admin'; pay = 'exempt'; } else if (kind === 'head') { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; } else if (kind === 'comm') { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; } else if (kind === 'bypass') { pay = 'exempt'; } if (pc !== 'Member') finalMembershipType = 'renewal'; }; setStatusMessage('Finalizing registration...'); const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry'); const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters'); let fallbackCount = 0; try { const allDocs = await getDocs(registryRef); if (!allDocs.empty) { let maxIdNum = 0; allDocs.forEach(d => { const mId = d.data().memberId; const match = mId?.match(/-(\d)(\d{4,})C?$/); if (match && match[2]) { const num = parseInt(match[2], 10); if (num > maxIdNum) maxIdNum = num; } }); fallbackCount = maxIdNum; } } catch(e) {} const runReg = async () => await runTransaction(db, async (transaction) => { const counterSnap = await transaction.get(counterRef); let nextCount; const storedCount = counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0; nextCount = Math.max(storedCount, fallbackCount) + 1; let assignedId = generateLBAId(pc, nextCount - 1); let memberRef = doc(registryRef, assignedId); let memberSnap = await transaction.get(memberRef); let attempts = 0; while(memberSnap.exists() && attempts < 20) { nextCount++; assignedId = generateLBAId(pc, nextCount - 1); memberRef = doc(registryRef, assignedId); memberSnap = await transaction.get(memberRef); attempts++; } if(memberSnap.exists()) throw new Error("System busy."); const meta = getMemberIdMeta(); const profileData = { uid: currentUser.uid, name: `${firstName} ${middleInitial ? middleInitial + '. ' : ''}${lastName}`.toUpperCase(), firstName: firstName.toUpperCase(), middleInitial: middleInitial.toUpperCase(), lastName: lastName.toUpperCase(), email: email.trim().toLowerCase(), studentId: studentId.trim().toUpperCase(), program, birthMonth: parseInt(birthMonth), birthDay: parseInt(birthDay), positionCategory: pc, specificTitle: st, committee: registerCommittee, memberId: assignedId, role, status: 'active', paymentStatus: pay, lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, membershipType: finalMembershipType, joinedDate: new Date().toISOString(), ...(inputKey ? { regKey: inputKey.trim().toUpperCase() } : {}) }; if (pc !== 'Member' || pay === 'exempt') { transaction.set(memberRef, profileData); transaction.set(doc(db, 'artifacts', appId, 'public', 'data', 'studentIds', profileData.studentId), { memberId: assignedId, at: new Date().toISOString() }); transaction.set(counterRef, { memberCount: nextCount }, { merge: true }); return profileData; } else { return profileData; } }); let newProfile = null; for (const kind of (inputKey ? ['officer', 'head', 'comm', 'bypass'] : [null])) { applyKind(kind); try { newProfile = await runReg(); break; } catch (kerr) { if (!kind || !/permission|insufficient/i.test(String((kerr && kerr.message) || ''))) throw kerr; } } if (!newProfile) throw new Error("Invalid key. Please check it with an officer."); if (pc !== 'Member' || newProfile.paymentStatus === 'exempt') { const fin = await finishSignup(newProfile.memberId, password, !!inputKey); localStorage.setItem('lba_profile', JSON.stringify(fin)); onLoginSuccess(fin); } else { setPendingProfile(newProfile); setAuthMode('payment'); } } else if (authMode === 'payment') { setStatusMessage('Processing...'); if (paymentMethod === 'cash' && liveOps.allowedPayment === 'gcash_only') throw new Error("Cash payments are not being accepted right now. Please pay through GCash."); if (paymentMethod === 'cash' && !cashOfficerKey.trim()) throw new Error("Please enter the cash key from an officer."); const payFee = pendingProfile?.membershipType === 'renewal' ? 50 : 100; let payRecord; if (paymentMethod === 'gcash') { const ref = cleanRef(refNo); if (ref.length !== 13) throw new Error("A GCash reference number has 13 digits. Please copy it exactly from your GCash receipt."); if (!payerName.trim()) throw new Error("Please enter the name of the GCash sender."); if (!payDate) throw new Error("Please enter the date you paid."); if (await isRefUsed(ref)) throw new Error("This reference number has already been used. Please check your receipt or contact an officer."); payRecord = { paymentStatus: 'pending', paymentDetails: { method: 'gcash', refNo: ref, payerName: payerName.trim().toUpperCase(), paidDate: payDate, amount: payFee, purpose: 'new', submittedAt: new Date().toISOString() }, refHistory: [ref] }; } else { payRecord = { paymentStatus: 'paid', cashKey: cashOfficerKey.trim().toUpperCase(), paymentDetails: { method: 'cash', refNo: 'CASH', amount: payFee, purpose: 'new', submittedAt: new Date().toISOString() } }; } const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry'); const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters'); let fallbackCount = 0; try { const allDocs = await getDocs(registryRef); if (!allDocs.empty) { allDocs.forEach(d => { const mId = d.data().memberId; const match = mId?.match(/-(\d)(\d{4,})C?$/); if (match && match[2]) { const num = parseInt(match[2], 10); if (num > fallbackCount) fallbackCount = num; } }); } } catch(e) {} const finalProfile = await runTransaction(db, async (transaction) => { const counterSnap = await transaction.get(counterRef); let nextCount = Math.max(counterSnap.exists() ? (counterSnap.data().memberCount || 0) : 0, fallbackCount) + 1; let assignedId = generateLBAId(pendingProfile.positionCategory, nextCount - 1); let memberRef = doc(registryRef, assignedId); let memberSnap = await transaction.get(memberRef); let attempts = 0; while(memberSnap.exists() && attempts < 20) { nextCount++; assignedId = generateLBAId(pendingProfile.positionCategory, nextCount - 1); memberRef = doc(registryRef, assignedId); memberSnap = await transaction.get(memberRef); attempts++; } if(memberSnap.exists()) throw new Error("System busy."); const finalData = { ...pendingProfile, uid: auth.currentUser.uid, memberId: assignedId, ...payRecord }; transaction.set(memberRef, finalData); transaction.set(doc(db, 'artifacts', appId, 'public', 'data', 'studentIds', String(finalData.studentId).toUpperCase()), { memberId: assignedId, at: new Date().toISOString() }); if (payRecord.paymentDetails.method === 'gcash') transaction.set(doc(db, 'artifacts', appId, 'public', 'data', 'payrefs', payRecord.paymentDetails.refNo), { memberId: assignedId, at: new Date().toISOString() }); transaction.set(counterRef, { memberCount: nextCount }, { merge: true }); return finalData; }); const finP = await finishSignup(finalProfile.memberId, password, false); localStorage.setItem('lba_profile', JSON.stringify(finP)); onLoginSuccess(finP); } else { setStatusMessage('Logging in...'); const mid = memberIdInput.trim().toUpperCase(); if (!mid) throw new Error("Please enter your Member ID."); const regDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid); let ver = 0; try { const inf = await getDoc(doc(db, 'artifacts', appId, 'public', 'data', 'authinfo', mid)); if (inf.exists()) ver = Number(inf.data().v) || 0; } catch (ie) {} let signedIn = false; try { await signInWithEmailAndPassword(auth, authEmail(mid, ver), authPw(password)); signedIn = true; } catch (se) { const code = (se && se.code) || ''; if (code === 'auth/too-many-requests') throw new Error("Too many attempts. Please wait a few minutes and try again."); if (code === 'auth/network-request-failed') throw new Error("Network problem. Please check your connection."); if (code === 'auth/operation-not-allowed') throw new Error("Secure login is not switched on yet. Ask the super admin to enable Email/Password sign-in in Firebase."); } if (!signedIn) { let cu = auth.currentUser; if (!cu || !cu.isAnonymous) { cu = (await signInAnonymously(auth)).user; } let legacy = null; try { const ls = await getDoc(regDocRef); if (ls.exists()) legacy = ls.data(); } catch (le) {} if (!legacy || !legacy.password || legacy.password !== password) throw new Error("Incorrect Member ID or password."); await linkWithCredential(cu, EmailAuthProvider.credential(authEmail(mid, ver), authPw(password))); await updateDoc(regDocRef, { uid: cu.uid, password: deleteField(), authMigrated: true }); } await auth.currentUser.getIdToken(true); const snap = await getDoc(regDocRef); if (!snap.exists()) throw new Error("Member record not found."); const userData = snap.data(); localStorage.setItem('lba_profile', JSON.stringify(userData)); onLoginSuccess(userData); } })(), timeout ]); } catch (err) { setError(/permission|insufficient/i.test(err.message || '') ? (authMode === 'payment' && paymentMethod === 'cash' ? "Invalid Cash Key." : (authMode === 'register' ? "Invalid key, or the registration could not be completed. Please check and try again." : "Not allowed. Please try again or contact an officer.")) : (err.message.includes("database") ? "Database missing." : err.message)); } finally { setLoading(false); setStatusMessage(''); }
  };
  const activeBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-[#3E2723] text-[#FDB813]";
  const inactiveBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-amber-50 text-amber-900";
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-[#3E2723] relative">
      {hubSettings.maintenanceMode && (<div className="absolute top-0 left-0 right-0 z-[101]"><MaintenanceBanner /></div>)}
      {showForgotModal && (<div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-md"><div className="bg-white rounded-[40px] max-w-sm w-full p-10 shadow-2xl border-t-[12px] border-[#FDB813] text-center"><LifeBuoy size={32} className="mx-auto mb-6 text-amber-600"/><h4 className="font-serif text-2xl font-black uppercase">Account Recovery</h4><p className="text-sm font-medium text-amber-950 mt-4">Forgot your password or Member ID? Contact any officer through Messenger.</p><p className="text-[11px] font-bold text-gray-500 mt-3">Send your full name and LPU Student ID so an officer can verify you and reset your account.</p><a href="https://m.me/lpubaristas.official" target="_blank" rel="noreferrer" className="block w-full mt-6 bg-[#FDB813] text-[#3E2723] py-4 rounded-2xl font-black uppercase text-[10px] hover:bg-amber-400">Message an Officer on Messenger</a><button onClick={() => setShowForgotModal(false)} className="w-full mt-3 bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-[10px]">Close</button></div></div>)}
      <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-t-[12px] border-[#3E2723] mt-8">
        <div className="flex flex-col items-center mb-10 text-center"><img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-32 h-32 object-contain mb-4" /><h1 className="font-serif text-xl font-black uppercase">LPU Baristas' Association</h1><p className="text-[#FDB813] font-black tracking-[0.3em] text-[10px] bg-[#3E2723] px-4 py-1 rounded-full mt-2 uppercase">KAPERATA HUB</p></div>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-center text-xs font-bold">{error}</div>}
        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' && (
            <div className="space-y-3"><input type="text" required placeholder="Member ID" className="w-full p-4 border border-amber-200 rounded-2xl font-bold uppercase text-xs" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())} /><input type="password" required placeholder="Password" className="w-full p-4 border border-amber-200 rounded-2xl font-bold text-xs" value={password} onChange={(e) => setPassword(e.target.value)} /><div className="flex justify-end pr-2"><button type="button" onClick={() => setShowForgotModal(true)} className="text-[10px] font-black uppercase text-amber-600 hover:text-amber-800">Forgot Password?</button></div></div>
          )}
          {authMode === 'register' && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2"><input type="text" required placeholder="FIRST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none text-xs font-bold uppercase" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} /><input type="text" placeholder="MI" maxLength="1" className="p-3 border border-amber-200 rounded-xl outline-none text-xs text-center font-bold uppercase" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())} /><input type="text" required placeholder="LAST" className="col-span-2 p-3 border border-amber-200 rounded-xl outline-none text-xs font-bold uppercase" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} /></div>
              <input type="text" required placeholder="LPU Student ID No." autoComplete="off" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold uppercase" value={studentId} onChange={(e) => setStudentId(e.target.value)} />
              <input type="email" required placeholder="LPU network email or Gmail" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
              <p className="text-[9px] text-gray-400 font-bold -mt-1 ml-1">Use your LPU network email (name@lpu.edu.ph) or a Gmail address.</p>
              <div className="grid grid-cols-2 gap-2"><select required className="p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={program} onChange={(e) => setProgram(e.target.value)}><option value="">Select Program</option>{PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}</select><select required className="p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={membershipType} onChange={(e) => setMembershipType(e.target.value)}><option value="new">New Member</option><option value="renewal">Renewal</option></select></div>
              <div className="grid grid-cols-2 gap-2"><select required className="p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={birthMonth} onChange={(e) => setBirthMonth(e.target.value)}><option value="">Birth Month</option>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select><input type="number" required min="1" max="31" placeholder="Day" className="p-3 border border-amber-200 rounded-xl text-xs font-bold" value={birthDay} onChange={(e) => setBirthDay(e.target.value)} /></div>
              <input type="password" required placeholder="Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={password} onChange={(e) => setPassword(e.target.value)} /><input type="password" required placeholder="Confirm Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              <div className="space-y-2"><input type="text" placeholder="Leader Key (Optional)" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold uppercase" value={inputKey} onChange={(e) => setInputKey(e.target.value.toUpperCase())} />{inputKey && (<select className="w-full p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={registerCommittee} onChange={(e) => setRegisterCommittee(e.target.value)}><option value="">Select Committee</option>{COMMITTEES_INFO.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>)}</div>
            </div>
          )}
          {authMode === 'payment' && (
            <div className="space-y-4">
               <p className="text-center font-black text-sm uppercase text-[#3E2723]">Total Fee: ₱{pendingProfile?.membershipType === 'renewal' ? "50.00" : "100.00"}</p>
               <div className="flex gap-2"><button type="button" onClick={() => setPaymentMethod('gcash')} className={paymentMethod === 'gcash' ? activeBtnClass : inactiveBtnClass}>GCash</button>{hubSettings.allowedPayment !== 'gcash_only' && <button type="button" onClick={() => setPaymentMethod('cash')} className={paymentMethod === 'cash' ? activeBtnClass : inactiveBtnClass}>Cash</button>}</div>
               <div className="p-4 bg-amber-50 rounded-2xl text-[10px] font-black text-amber-900 text-center uppercase">{paymentMethod === 'gcash' ? `GCash: +63${hubSettings.gcashNumber || '9063751402'}` : "Provide Daily Cash Key"}</div>
               <input type="text" required placeholder={paymentMethod === 'gcash' ? "13-digit GCash Reference No." : "Daily Cash Key"} className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs uppercase" value={paymentMethod === 'gcash' ? refNo : cashOfficerKey} onChange={e => paymentMethod === 'gcash' ? setRefNo(e.target.value) : setCashOfficerKey(e.target.value.toUpperCase())} />
               {paymentMethod === 'gcash' && (<><input type="text" required placeholder="Name of the GCash sender" className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs uppercase" value={payerName} onChange={e => setPayerName(e.target.value)} /><div><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Date you paid</label><input type="date" required max={new Date().toISOString().slice(0, 10)} className="w-full p-3 border border-amber-200 rounded-xl outline-none text-xs" value={payDate} onChange={e => setPayDate(e.target.value)} /></div><p className="text-[9px] text-gray-500 font-bold text-center">An officer checks every GCash payment against the GCash records. Your access stays limited until it is confirmed.</p></>)}
               <button type="button" onClick={() => setAuthMode('register')} className="w-full text-xs font-bold text-gray-500 hover:text-[#3E2723] underline">Back to Registration</button>
            </div>
          )}
          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-2xl hover:bg-black transition-all font-black uppercase flex justify-center items-center gap-2 text-xs">{loading ? <div className="flex items-center gap-2"><Loader2 className="animate-spin" size={20}/><span className="text-[10px]">{statusMessage}</span></div> : (authMode === 'payment' ? 'Complete' : authMode === 'register' ? 'Register' : 'Enter Hub')}</button>
        </form>
        {authMode !== 'payment' && (<p className="text-center mt-6 text-[10px] text-amber-800 uppercase font-black">{authMode === 'login' ? ( hubSettings.registrationOpen !== true ? (<span className="ml-2 text-gray-500">Registration is currently closed.</span>) : <button onClick={() => setAuthMode('register')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Not Yet Registered? Brew With Us!</button> ) : <button onClick={() => setAuthMode('login')} className="ml-2 text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Back to Login</button>}</p>)}
      </div>
      <DataPrivacyFooter />
    </div>
  );
};

const Dashboard = ({ user, profile, setProfile, logout }) => {
  const [view, setView] = useState('home'); const [openGroups, setOpenGroups] = useState({}); const [termTab, setTermTab] = useState('overview'); const [feedbackList, setFeedbackList] = useState([]); const [fbForm, setFbForm] = useState({ rating: 0, category: 'Suggestion', message: '', anonymous: false }); const [fbBusy, setFbBusy] = useState(false); const [fbFilter, setFbFilter] = useState('all'); const [attTab, setAttTab] = useState('member'); const [attSearch, setAttSearch] = useState(''); const [attFilter, setAttFilter] = useState('all'); const [attOpen, setAttOpen] = useState(null); const [badgeDefs, setBadgeDefs] = useState(DEFAULT_BADGES); const [badgeForm, setBadgeForm] = useState({ id: '', name: '', icon: '', desc: '', kind: 'manual', value: '' }); const [badgeBusy, setBadgeBusy] = useState(false); const [migBusy, setMigBusy] = useState(false); const [migFails, setMigFails] = useState({}); const [migMsg, setMigMsg] = useState(''); const [inventory, setInventory] = useState([]); const [showInvForm, setShowInvForm] = useState(false); const [invForm, setInvForm] = useState(EMPTY_ITEM); const [editingInv, setEditingInv] = useState(null); const [invSearch, setInvSearch] = useState(''); const [officerForm, setOfficerForm] = useState(EMPTY_OFFICER_FORM); const [videoSettings, setVideoSettings] = useState(null); const [videoForm, setVideoForm] = useState({ required: false, intro: { title: '', url: '', minSeconds: 60 }, orientation: { title: '', url: '', minSeconds: 120 } }); const [gateSkipped, setGateSkipped] = useState(false); const [bdayCursor, setBdayCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; }); const [bdaySel, setBdaySel] = useState(null); const [renewalPayer, setRenewalPayer] = useState(''); const [renewalPayDate, setRenewalPayDate] = useState(() => new Date().toISOString().slice(0, 10)); const [members, setMembers] = useState([]); const [events, setEvents] = useState([]); const [announcements, setAnnouncements] = useState([]); const [suggestions, setSuggestions] = useState([]); const [committeeApps, setCommitteeApps] = useState([]); const [userApplications, setUserApplications] = useState([]); const [tasks, setTasks] = useState([]); const [projects, setProjects] = useState([]); const [expandedProjectId, setExpandedProjectId] = useState(null); const [logs, setLogs] = useState([]); const [polls, setPolls] = useState([]); const [seriesPosts, setSeriesPosts] = useState([]); const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] }); const [showPollForm, setShowPollForm] = useState(false); const [newSeriesPost, setNewSeriesPost] = useState({ title: '', imageUrls: [''], caption: '' }); const [showSeriesForm, setShowSeriesForm] = useState(false); const [editingSeriesId, setEditingSeriesId] = useState(null); const [showProjectForm, setShowProjectForm] = useState(false); const [newProject, setNewProject] = useState({ title: '', description: '', deadline: '', projectHeadId: '', projectHeadName: '' }); const [editingProject, setEditingProject] = useState(null); const [hubSettings, setHubSettings] = useState({ registrationOpen: true, renewalOpen: true, maintenanceMode: false, renewalMode: false, allowedPayment: 'gcash_only', gcashNumber: '09063751402' }); const [secureKeys, setSecureKeys] = useState({ officerKey: '', headKey: '', commKey: '' }); const [legacyContent, setLegacyContent] = useState({ body: "Loading association history...", achievements: [], imageSettings: { objectFit: 'cover', objectPosition: 'center' } }); const [mobileMenuOpen, setMobileMenuOpen] = useState(false); const [masterclassData, setMasterclassData] = useState({ certTemplate: '', moduleAttendees: { 1: [], 2: [], 3: [], 4: [], 5: [] }, moduleDetails: {} }); const [showCertificate, setShowCertificate] = useState(false); const [adminMcModule, setAdminMcModule] = useState(1); const [adminMcSearch, setAdminMcSearch] = useState(''); const [selectedMcMembers, setSelectedMcMembers] = useState([]); const [editingMcCurriculum, setEditingMcCurriculum] = useState(false); const [tempMcDetails, setTempMcDetails] = useState({ title: '', objectives: '', topics: '', icon: '' }); const [isAnniversary, setIsAnniversary] = useState(false); const [editingMember, setEditingMember] = useState(null); const [editMemberForm, setEditMemberForm] = useState({ joinedDate: '' }); const [emailModal, setEmailModal] = useState({ isOpen: false, app: null, type: '', subject: '', body: '' }); const [showAccoladeModal, setShowAccoladeModal] = useState(null); const [accoladeText, setAccoladeText] = useState(""); const [showTaskForm, setShowTaskForm] = useState(false); const [newTask, setNewTask] = useState({ ...EMPTY_TASK }); const [editingTask, setEditingTask] = useState(null); const [renewalRef, setRenewalRef] = useState(''); const [renewalMethod, setRenewalMethod] = useState('gcash'); const [renewalCashKey, setRenewalCashKey] = useState(''); const [newGcashNumber, setNewGcashNumber] = useState(''); const [showEventForm, setShowEventForm] = useState(false); const [newEvent, setNewEvent] = useState({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, registrationRequired: true, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' }); const [editingEvent, setEditingEvent] = useState(null); const [showAnnounceForm, setShowAnnounceForm] = useState(false); const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' }); const [editingAnnouncement, setEditingAnnouncement] = useState(null); const [searchQuery, setSearchQuery] = useState(""); const [selectedBaristas, setSelectedBaristas] = useState([]); const [isImporting, setIsImporting] = useState(false); const [confirmDelete, setConfirmDelete] = useState(null); const fileInputRef = useRef(null); const currentDailyKey = getActiveCashKey(secureKeys); const [settingsForm, setSettingsForm] = useState({ ...profile }); const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' }); const [tempShift, setTempShift] = useState({ date: '', name: '', startTime: '', endTime: '', capacity: 50, volunteerCapacity: 5 }); const [savingSettings, setSavingSettings] = useState(false); const [financialFilter, setFinancialFilter] = useState('all'); const [isEditingLegacy, setIsEditingLegacy] = useState(false); const [legacyForm, setLegacyForm] = useState({ body: '', imageUrl: '', galleryUrl: '', achievements: [], establishedDate: '', imageSettings: { objectFit: 'cover', objectPosition: 'center' } }); const [tempAchievement, setTempAchievement] = useState({ date: '', text: '' }); const [suggestionText, setSuggestionText] = useState(""); const [committeeForm, setCommitteeForm] = useState({ role: 'Committee Member' }); const [submittingApp, setSubmittingApp] = useState(false); const [attendanceEvent, setAttendanceEvent] = useState(null); const [exportFilter, setExportFilter] = useState('all'); const [currentPage, setCurrentPage] = useState(1); const itemsPerPage = 10;
  const [lastVisited, setLastVisited] = useState(() => { try { return JSON.parse(localStorage.getItem('lba_last_visited') || '{}'); } catch { return {}; } });

  // 🛡️ THE 4-TIER ACCESS SYSTEM 🛡️
  const isSuperAdmin = useMemo(() => profile?.role === 'superadmin', [profile?.role]);
  const isOfficer = useMemo(() => isSuperAdmin || ['OFFICER'].includes(String(profile?.positionCategory || '').toUpperCase()), [profile?.positionCategory, isSuperAdmin]);
  const isCommitteePlus = useMemo(() => isOfficer || ['COMMITTEE'].includes(String(profile?.positionCategory || '').toUpperCase()), [profile?.positionCategory, isOfficer]);
  const isCare = useMemo(() => String(profile?.positionCategory || '').toUpperCase() === 'COMMITTEE' && normCommittee(profile?.committee) === 'Care', [profile?.positionCategory, profile?.committee]);
  const isCommitteeHead = useMemo(() => String(profile?.positionCategory || '').toUpperCase() === 'COMMITTEE' && String(profile?.specificTitle || '').toUpperCase().includes('HEAD'), [profile?.positionCategory, profile?.specificTitle]);
  
  const isExpired = useMemo(() => profile?.status === 'expired', [profile?.status]);
  const isLimited = useMemo(() => profile?.status === 'expired' || profile?.paymentStatus === 'pending', [profile?.status, profile?.paymentStatus]);
  const isExemptFromRenewal = useMemo(() => ['OFFICER', 'EXECOMM', 'COMMITTEE', 'ORG ADVISER', 'ALUMNI'].includes(String(profile?.positionCategory || '').toUpperCase()), [profile?.positionCategory]);
  const isBirthday = useMemo(() => { if (!profile.birthMonth || !profile.birthDay) return false; const today = new Date(); return parseInt(profile.birthMonth) === (today.getMonth() + 1) && parseInt(profile.birthDay) === today.getDate(); }, [profile]);

  const financialStats = useMemo(() => {
    if (!members || !Array.isArray(members)) return { totalPaid: 0, cashCount: 0, gcashCount: 0, exemptCount: 0 };
    const validMembers = members.filter(m => m != null && typeof m === 'object');
    let filtered = validMembers; if (financialFilter !== 'all') { const [sy, sem] = financialFilter.split('-'); filtered = validMembers.filter(m => m?.lastRenewedSY === sy && m?.lastRenewedSem === sem); }
    const payingMembers = filtered.filter(m => { const isExempt = ['Officer', 'Committee', 'Alumni', 'Execomm'].includes(m?.positionCategory) || m?.paymentStatus === 'exempt'; return !isExempt && m?.paymentStatus === 'paid'; });
    const cashPayments = payingMembers.filter(m => m?.paymentDetails?.method === 'cash').length; const gcashPayments = payingMembers.filter(m => m?.paymentDetails?.method === 'gcash').length;
    return { totalPaid: payingMembers.length, cashCount: cashPayments, gcashCount: gcashPayments, exemptCount: filtered.length - payingMembers.length };
  }, [members, financialFilter]);

  const semesterOptions = useMemo(() => { if(!members || !Array.isArray(members)) return []; const sems = new Set(members.filter(m => m != null).map(m => `${m?.lastRenewedSY}-${m?.lastRenewedSem}`)); return Array.from(sems).filter(s => s !== "undefined-undefined").sort().reverse(); }, [members]);

  const teamStructure = useMemo(() => {
    if (!members || !Array.isArray(members)) return { tier1: [], tier2: [], tier3: [], committees: {} };
    const validMembers = members.filter(m => m != null && typeof m === 'object');
    const sortedMembers = [...validMembers].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    const hasTitle = (m, title) => String(m?.specificTitle || "").toUpperCase().includes(title.toUpperCase());
    const isCat = (m, cat) => String(m?.positionCategory || "").toUpperCase() === cat.toUpperCase();
    const committeesMap = {}; COMMITTEES_INFO.forEach(c => { committeesMap[c.id] = { heads: sortedMembers.filter(m => m?.committee === c.id && isCat(m, "Committee") && hasTitle(m, "Head")), members: sortedMembers.filter(m => m?.committee === c.id && isCat(m, "Committee") && !hasTitle(m, "Head")) }; });
    committeesMap['Unassigned'] = { heads: sortedMembers.filter(m => !m?.committee && isCat(m, "Committee") && hasTitle(m, "Head")), members: sortedMembers.filter(m => !m?.committee && isCat(m, "Committee") && !hasTitle(m, "Head")) };
    return { tier1: sortedMembers.filter(m => hasTitle(m, "President") && isCat(m, "Officer")), tier2: sortedMembers.filter(m => hasTitle(m, "Secretary") && isCat(m, "Officer")), tier3: sortedMembers.filter(m => !hasTitle(m, "President") && !hasTitle(m, "Secretary") && isCat(m, "Officer")), committees: committeesMap };
  }, [members]);

  const volunteerCount = useMemo(() => { if (!events || !profile.memberId) return 0; return events.reduce((acc, ev) => { if (!ev.isVolunteer || !ev.shifts) return acc; const shiftCount = ev.shifts.filter(s => s.volunteers?.includes(profile.memberId)).length; return acc + shiftCount; }, 0); }, [events, profile.memberId]);
  const newFeedbackCount = isOfficer ? feedbackList.filter(f => (f.status || 'new') === 'new').length : 0;
  const handleSubmitFeedback = async (e) => { e.preventDefault(); if (!fbForm.rating) return alert("Please tap the stars to rate the app."); if (fbForm.message.trim().length < 10) return alert("Please write a little more (at least 10 characters)."); setFbBusy(true); try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'feedback'), { memberId: profile.memberId, name: fbForm.anonymous ? '' : profile.name, anonymous: !!fbForm.anonymous, rating: fbForm.rating, category: fbForm.category, message: fbForm.message.trim(), status: 'new', createdAt: serverTimestamp() }); setFbForm({ rating: 0, category: 'Suggestion', message: '', anonymous: false }); alert("Thank you! Your feedback was sent to the officers."); } catch (err) { alert("Could not send feedback. Please try again."); } finally { setFbBusy(false); } };
  const handleFeedbackStatus = async (f, status) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'feedback', f.id), { status }); } catch (err) { alert("Could not update."); } };
  const handleDeleteFeedback = async (f) => { if (!confirm("Delete this feedback?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'feedback', f.id)); } catch (err) { alert("Could not delete."); } };
  useEffect(() => { if (hubSettings.allowedPayment === 'gcash_only' && renewalMethod !== 'gcash') setRenewalMethod('gcash'); }, [hubSettings.allowedPayment, renewalMethod]);
  const ATT_MIN = 60;
  const handleToggleExcuse = async (ev, memberId) => { try { const isEx = Array.isArray(ev.excused) && ev.excused.includes(memberId); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id), { excused: isEx ? arrayRemove(memberId) : arrayUnion(memberId) }); logAction("Attendance", `${isEx ? 'Removed excuse' : 'Excused'} ${memberId} for ${ev.name}`); } catch (e) { alert("Could not update. Please try again."); } };
  const attendanceData = useMemo(() => {
    if (!(isOfficer || isCare)) return { rows: [], events: [] };
    const today = new Date().toLocaleDateString('en-CA');
    const evs = (events || []).filter(e => e && e.attendanceRequired && e.startDate).map(e => ({ ...e, _end: e.endDate || e.startDate })).filter(e => e._end < today || (e._end === today && Array.isArray(e.attendees) && e.attendees.length > 0)).sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)));
    const rows = (members || []).filter(m => m && m.memberId && m.status !== 'expired' && !['Alumni', 'Blacklisted'].includes(m.positionCategory)).map(m => {
      const jd = m.joinedDate ? String(m.joinedDate).slice(0, 10) : '';
      const mine = evs.filter(e => !jd || String(e._end) >= jd).map(e => { const present = Array.isArray(e.attendees) && e.attendees.includes(m.memberId); const excused = !present && Array.isArray(e.excused) && e.excused.includes(m.memberId); return { ev: e, present, excused }; });
      const counted = mine.filter(x => !x.excused); const present = counted.filter(x => x.present).length;
      return { m, mine, present, absent: counted.length - present, excused: mine.length - counted.length, total: counted.length, pct: counted.length ? Math.round(present / counted.length * 100) : null };
    }).sort((a, b) => (a.pct === null ? 1 : b.pct === null ? -1 : a.pct - b.pct) || String(a.m.name).localeCompare(String(b.m.name)));
    return { rows, events: evs };
  }, [events, members, isOfficer, isCare]);
  const handleDownloadAttSummary = () => { const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`; const lines = [["Member ID", "Name", "Program", "Present", "Absent", "Excused", "Counted Events", "Attendance %", "Status"].join(',')]; attendanceData.rows.forEach(r => lines.push([r.m.memberId, r.m.name, r.m.program || '', r.present, r.absent, r.excused, r.total, r.pct === null ? '' : r.pct, r.pct === null ? 'No events yet' : (r.pct < ATT_MIN ? 'At risk' : 'On track')].map(q).join(','))); const blob = new Blob([lines.join('\n')], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'LBA_Attendance_Summary.csv'; a.click(); URL.revokeObjectURL(url); };
  const yearsInLBA = (() => { const n = parseInt(String(profile.memberId || '').substring(3, 5), 10); return isNaN(n) ? 0 : Math.max(0, new Date().getFullYear() - 2000 - n); })();
  const mcDone = [1, 2, 3, 4, 5].filter(id => masterclassData.moduleAttendees?.[id]?.includes(profile.memberId));
  const mcMasterEarned = mcDone.includes(1) && mcDone.includes(2) && [3, 4, 5].filter(id => mcDone.includes(id)).length >= 2;
  const badgeStatus = (b) => {
    const v = Number(b.value) || 0; const acc = Array.isArray(profile.accolades) ? profile.accolades.map(a => String(a).trim().toLowerCase()) : [];
    switch (b.kind) {
      case 'always': return { earned: true, note: '' };
      case 'category': return { earned: String(profile.positionCategory || '').toLowerCase() === String(b.value || '').toLowerCase(), note: '' };
      case 'years': return { earned: yearsInLBA >= v, note: `${Math.min(yearsInLBA, v)} / ${v} year${v === 1 ? '' : 's'}` };
      case 'volunteer': return { earned: volunteerCount >= v, note: `${Math.min(volunteerCount, v)} / ${v} shifts` };
      case 'modules': return { earned: mcDone.length >= v, note: `${Math.min(mcDone.length, v)} / ${v} modules` };
      case 'master': return { earned: mcMasterEarned, note: '' };
      default: return { earned: acc.includes(String(b.name || '').trim().toLowerCase()), note: 'Awarded by an officer' };
    }
  };
  const saveBadgeList = async (list, msg) => { setBadgeBusy(true); try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'badges'), { list, updatedAt: new Date().toISOString(), updatedBy: profile.name }); logAction("Badges", msg); return true; } catch (e) { alert("Could not save badges: " + ((e && e.message) || e)); return false; } finally { setBadgeBusy(false); } };
  const handleSaveBadge = async (e) => { e.preventDefault(); const f = badgeForm; if (!f.name.trim() || !f.desc.trim()) return alert("A badge needs a name and a short rule."); if (['years', 'volunteer', 'modules'].includes(f.kind) && !(Number(f.value) > 0)) return alert("Enter the number needed for this badge."); if (f.kind === 'category' && !String(f.value).trim()) return alert("Choose the position category."); const clean = { id: f.id || ('b' + Date.now().toString(36)), name: f.name.trim(), icon: (f.icon || '🏅').trim(), desc: f.desc.trim(), kind: f.kind, value: ['years', 'volunteer', 'modules'].includes(f.kind) ? Number(f.value) : (f.kind === 'category' ? f.value : '') }; const list = badgeDefs.some(b => b.id === clean.id) ? badgeDefs.map(b => b.id === clean.id ? clean : b) : [...badgeDefs, clean]; if (await saveBadgeList(list, `${f.id ? 'Edited' : 'Added'} badge: ${clean.name}`)) setBadgeForm({ id: '', name: '', icon: '', desc: '', kind: 'manual', value: '' }); };
  const handleDeleteBadge = async (b) => { if (!confirm(`Delete the badge "${b.name}"? Members will no longer see it.`)) return; await saveBadgeList(badgeDefs.filter(x => x.id !== b.id), `Deleted badge: ${b.name}`); };
  const handleResetBadges = async () => { if (!confirm("Reset the badge list to the original badges? Your own badges will be removed.")) return; await saveBadgeList(DEFAULT_BADGES, "Reset badges to defaults"); };

  const pendingAppCount = isSuperAdmin ? (committeeApps || []).filter(a => a && a.status === 'pending').length : 0;
  const notifications = useMemo(() => {
      const hasNew = (items, pageKey) => { if (!items || items.length === 0) return false; const lastVisit = lastVisited[pageKey]; if (!lastVisit) return true; return items.some(i => { const d = i.createdAt?.toDate ? i.createdAt.toDate() : new Date(i.createdAt || 0); return d > new Date(lastVisit); }); };
      let huntNotify = isSuperAdmin ? committeeApps.some(a => a.status === 'pending') : userApplications.some(a => { const updated = a.statusUpdatedAt?.toDate ? a.statusUpdatedAt.toDate() : null; const lastVisit = lastVisited['committee_hunt']; if (!updated) return false; return !lastVisit || updated > new Date(lastVisit); });
      let regNotify = isOfficer ? hasNew((members || []).map(m => ({ createdAt: m?.joinedDate })), 'members') : false;
      return { events: hasNew(events, 'events'), announcements: hasNew(announcements, 'announcements'), suggestions: hasNew(suggestions, 'suggestions'), committee_hunt: huntNotify, members: regNotify };
  }, [events, announcements, suggestions, members, committeeApps, userApplications, lastVisited, isOfficer, isSuperAdmin]);

  const filteredRegistry = useMemo(() => {
      if (!members || !Array.isArray(members)) return [];
      const validMembers = members.filter(m => m != null && typeof m === 'object');
      const queryUpper = (searchQuery || "").toUpperCase();
      let filtered = validMembers.filter(m => {
          if (!queryUpper) return true;
          const nameMatch = (m?.name || "").toUpperCase().includes(queryUpper); const idMatch = (m?.memberId || "").toUpperCase().includes(queryUpper); const emailMatch = (m?.email || "").toUpperCase().includes(queryUpper); const sidMatch = (m?.studentId || "").toUpperCase().includes(queryUpper);
          return nameMatch || idMatch || emailMatch || sidMatch;
      });
      if (exportFilter !== 'all') {
          if (exportFilter === 'active') filtered = filtered.filter(m => m?.status === 'active'); else if (exportFilter === 'inactive') filtered = filtered.filter(m => m?.status !== 'active'); else if (exportFilter === 'officers') filtered = filtered.filter(m => m?.positionCategory === 'Officer'); else if (exportFilter === 'committee') filtered = filtered.filter(m => m?.positionCategory === 'Committee'); else if (exportFilter === 'lace_issued') filtered = filtered.filter(m => m?.idLaceIssued); else if (exportFilter === 'lace_pending') filtered = filtered.filter(m => !m?.idLaceIssued && m?.status === 'active');
      }
      return filtered; 
  }, [members, searchQuery, exportFilter]);
  
  const totalPages = Math.max(1, Math.ceil(filteredRegistry.length / itemsPerPage));
  const paginatedRegistry = useMemo(() => filteredRegistry.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredRegistry, currentPage, itemsPerPage]);
  const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages)); const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  useEffect(() => { setCurrentPage(1); }, [searchQuery, exportFilter]);

  const updateLastVisited = (page) => { const newVisits = { ...lastVisited, [page]: new Date().toISOString() }; setLastVisited(newVisits); localStorage.setItem('lba_last_visited', JSON.stringify(newVisits)); };
  const handleExportCSV = () => { 
      if (!members) return; 
      const headers = ["ID", "Name", "Email", "Category", "Title", "Committee", "Status", "Joined", "Volunteer Shifts", "Masterclass", "Accolades", "Student ID", "ID Lace", "ID Lace Date", "Intro Video", "Orientation"]; 
      const rows = members.filter(m => m != null).map(m => {
          const volCount = events.reduce((acc, ev) => acc + (ev.shifts?.filter(s => s.volunteers?.includes(m.memberId)).length || 0), 0);
          const mcCompleted = [1,2,3,4,5].filter(id => masterclassData.moduleAttendees?.[id]?.includes(m.memberId)).map(id => `Mod ${id}`).join(', ');
          return [ 
              m?.memberId, 
              m?.name, 
              m?.email, 
              m?.positionCategory, 
              m?.specificTitle, 
              m?.committee || '', 
              m?.status, 
              getSafeDateString(m?.joinedDate) || '',
              volCount,
              mcCompleted,
              (m?.accolades || []).join('; '),
              m?.studentId || '',
              m?.idLaceIssued ? 'Issued' : 'Pending',
              m?.idLaceIssuedAt ? (getSafeDateString(m.idLaceIssuedAt) || '') : '',
              m?.videoAck?.intro?.at ? getSafeDateString(m.videoAck.intro.at) : '',
              m?.videoAck?.orientation?.at ? getSafeDateString(m.videoAck.orientation.at) : ''
          ];
      }); 
      generateCSV(headers, rows, `LBA_Registry_${new Date().toISOString().split('T')[0]}.csv`); 
  };
  const handleBulkEmail = () => { const targets = selectedBaristas.length > 0 ? members.filter(m => m && selectedBaristas.includes(m.memberId)) : members.filter(m => m != null); const emails = targets.map(m => m?.email).filter(e => e).join(','); if (emails) { if (emails.length > 1500) { try { navigator.clipboard.writeText(emails); } catch (e) {} alert("There are too many recipients for one link, so the email addresses were copied. Gmail will open - paste them into the BCC field."); openGmail({}); } else openGmail({ bcc: emails }); } };
  const toggleSelectAll = () => { if (selectedBaristas.length === paginatedRegistry.length && paginatedRegistry.length > 0) { setSelectedBaristas([]); } else { setSelectedBaristas(paginatedRegistry.filter(m => m != null).map(m => m.memberId)); } };
  const toggleSelectBarista = (id) => { if (selectedBaristas.includes(id)) setSelectedBaristas(prev => prev.filter(mid => mid !== id)); else setSelectedBaristas(prev => [...prev, id]); };
  const getSafeDateString = (dateVal) => { if (!dateVal) return ''; if (typeof dateVal === 'string') return dateVal.split('T')[0]; if (dateVal.toDate) return dateVal.toDate().toISOString().split('T')[0]; return ''; };
  const generateSecureDailyKey = () => {
    // Characters that are easy to read (removed 0, O, 1, I, L)
    const charset = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
    const uint32 = new Uint32Array(6); 
    window.crypto.getRandomValues(uint32); // Cryptographically secure random values
    
    let result = "";
    for (let i = 0; i < uint32.length; i++) {
        result += charset[uint32[i] % charset.length];
    }
    return result;
};
  const logAction = async (action, details) => { if (!profile) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() }); } catch (err) { console.error("Logging failed:", err); } };
  
  useEffect(() => {
      if (!user) return;
      const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), (docSnap) => { if (docSnap.exists()) { const data = docSnap.data(); if (JSON.stringify(data) !== JSON.stringify(profile)) { setProfile(data); localStorage.setItem('lba_profile', JSON.stringify(data)); } } });
      let unsubReg = () => {}; if (isOfficer || isCare) { unsubReg = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), (s) => setMembers(s.docs.map(d => { const { password: _pw, ...rest } = d.data(); return { id: d.id, ...(isOfficer ? d.data() : rest), committee: normCommittee(d.data().committee) }; }))); }
      const unsubEvents = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'events'), (s) => setEvents(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubAnn = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), (s) => setAnnouncements(s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => postTime(b) - postTime(a))));
      const unsubSug = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions')), (s) => { const data = s.docs.map(d => ({ id: d.id, ...d.data() })); data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)); setSuggestions(data); });
      let unsubApps = () => {}; if (isSuperAdmin) unsubApps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications')), (s) => setCommitteeApps(s.docs.map(d => ({ id: d.id, ...d.data(), committee: normCommittee(d.data().committee) }))));
      const unsubUserApps = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId)), (s) => setUserApplications(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      let unsubProjects = () => {}; if (isOfficer) unsubProjects = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), orderBy('createdAt', 'desc')), (s) => setProjects(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      let unsubTasks = () => {}; if (isOfficer) unsubTasks = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'tasks')), (s) => setTasks(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      let unsubLogs = () => {}; if (isSuperAdmin) unsubLogs = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), orderBy('timestamp', 'desc'), limit(50)), (s) => setLogs(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      let unsubInv = () => {}; if (isOfficer || isCare) unsubInv = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'), (s) => setInventory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubPolls = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'polls'), orderBy('createdAt', 'desc')), (s) => setPolls(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubSeries = onSnapshot(query(collection(db, 'artifacts', appId, 'public', 'data', 'series_posts'), orderBy('createdAt', 'desc')), (s) => setSeriesPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))));
      const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()));
      const unsubVideos = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'videos'), (snap) => { if (snap.exists()) { const d = snap.data(); setVideoSettings(d); setVideoForm({ required: !!d.required, intro: { title: '', url: '', minSeconds: 60, ...(d.intro || {}) }, orientation: { title: '', url: '', minSeconds: 120, ...(d.orientation || {}) } }); } else setVideoSettings({}); });
      const fbCol = collection(db, 'artifacts', appId, 'public', 'data', 'feedback');
      const unsubFb = onSnapshot(isOfficer ? query(fbCol) : query(fbCol, where('memberId', '==', profile.memberId)), (s) => { const d = s.docs.map(x => ({ id: x.id, ...x.data() })); d.sort((a, b) => postTime(b) - postTime(a)); setFeedbackList(d); }, () => {});
      const unsubBadges = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'badges'), (s) => { if (s.exists() && Array.isArray(s.data().list) && s.data().list.length) setBadgeDefs(s.data().list); else setBadgeDefs(DEFAULT_BADGES); }, () => {});
      const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()));
      const unsubLegacy = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), (s) => { if(s.exists()) { setLegacyContent(s.data()); const data = s.data(); setLegacyForm({ ...data, achievements: data.achievements || [], imageUrl: data.imageUrl || '', galleryUrl: data.galleryUrl || '', imageSettings: data.imageSettings || { objectFit: 'cover', objectPosition: 'center' } }); if (data.establishedDate) { const today = new Date(); const est = new Date(data.establishedDate); if (today.getMonth() === est.getMonth() && today.getDate() === est.getDate()) setIsAnniversary(true); } } });
      const unsubMC = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), (s) => { if(s.exists()) setMasterclassData(s.data()); else setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), { certTemplate: '', moduleAttendees: { 1: [], 2: [], 3: [], 4: [], 5: [] }, moduleDetails: {} }); });
      return () => { unsubProfile(); unsubReg(); unsubEvents(); unsubAnn(); unsubSug(); unsubApps(); unsubUserApps(); unsubProjects(); unsubTasks(); unsubLogs(); unsubInv(); unsubVideos(); unsubBadges(); unsubFb(); unsubPolls(); unsubSeries(); unsubOps(); unsubKeys(); unsubLegacy(); unsubMC(); };
  }, [user, isSuperAdmin, isOfficer, isCare, profile.memberId]);

  useEffect(() => { if (attendanceEvent && events.length > 0) { const liveEvent = events.find(e => e.id === attendanceEvent.id); if (liveEvent) setAttendanceEvent(liveEvent); } }, [events]);
  useEffect(() => { const head = document.head; let linkIcon = document.querySelector("link[rel~='icon']"); if (!linkIcon) { linkIcon = document.createElement('link'); linkIcon.rel = 'icon'; head.appendChild(linkIcon); } linkIcon.href = APP_ICON_URL; }, []);

  const handleUpdateProfile = async (e) => { e.preventDefault(); if (settingsForm.email && settingsForm.email !== profile.email && !isAllowedEmail(settingsForm.email)) { alert(EMAIL_RULE_MSG); return; } if (settingsForm.studentId && !isValidStudentId(settingsForm.studentId)) { alert("Student ID may only contain letters, numbers and dashes."); return; } setSavingSettings(true); try { const updated = { ...profile, ...settingsForm, birthMonth: parseInt(settingsForm.birthMonth), birthDay: parseInt(settingsForm.birthDay), studentId: String(settingsForm.studentId || '').trim().toUpperCase() }; if (settingsForm.email !== profile.email) { updated.email = settingsForm.email.toLowerCase(); } await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), updated); setProfile(updated); localStorage.setItem('lba_profile', JSON.stringify(updated)); alert("Profile updated successfully!"); } catch(err) { console.error(err); alert("Failed to update profile."); } finally { setSavingSettings(false); } };
  const handleChangePassword = async (e) => { e.preventDefault(); if (passwordForm.new !== passwordForm.confirm) return alert("New passwords do not match."); if (passwordForm.new.length < 6) return alert("Please use at least 6 characters."); try { const cu = auth.currentUser; if (!cu || !cu.email) return alert("Please log out and log in again, then retry."); await reauthenticateWithCredential(cu, EmailAuthProvider.credential(cu.email, authPw(passwordForm.current))); await updatePassword(cu, authPw(passwordForm.new)); setPasswordForm({ current: '', new: '', confirm: '' }); alert("Password changed successfully."); } catch (err) { alert(/credential|password/i.test(String((err && err.code) || (err && err.message))) ? "Incorrect current password." : "Failed to change password."); } };
  const handleDeleteSuggestion = async (id) => { if(!confirm("Are you sure you want to delete this suggestion?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'suggestions', id)); logAction("Delete Suggestion", `Deleted suggestion ID: ${id}`); } catch(err) {} };
  const handlePostSuggestion = async (e) => { e.preventDefault(); if (isLimited) return alert(isExpired ? "Your membership is expired. Please renew to post suggestions." : PENDING_MSG); if (!suggestionText.trim()) return; try { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'suggestions'), { text: suggestionText, authorId: profile.memberId, authorName: "Anonymous", createdAt: serverTimestamp() }); setSuggestionText(""); alert("Suggestion submitted anonymously!"); } catch (err) {} };
  const handleCreatePoll = async (e) => { e.preventDefault(); const validOptions = newPoll.options.filter(o => o.trim() !== ''); if (!newPoll.question || validOptions.length < 2) return alert("A question and at least 2 options are required."); try { const formattedOptions = validOptions.map((opt, idx) => ({ id: idx + 1, text: opt, votes: [] })); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'polls'), { question: newPoll.question, options: formattedOptions, createdBy: profile.name, createdAt: serverTimestamp(), status: 'active' }); setShowPollForm(false); setNewPoll({ question: '', options: ['', ''] }); logAction("Create Poll", `Created poll: ${newPoll.question}`); } catch (e) {} };
  const handleVotePoll = async (pollId, optionId) => { if (isLimited) return alert(isExpired ? "Renew membership to vote." : PENDING_MSG); try { const pollRef = doc(db, 'artifacts', appId, 'public', 'data', 'polls', pollId); const poll = polls.find(p => p.id === pollId); if (!poll) return; const updatedOptions = poll.options.map(opt => { const newVotes = opt.votes.filter(uid => uid !== profile.memberId); if (opt.id === optionId) newVotes.push(profile.memberId); return { ...opt, votes: newVotes }; }); await updateDoc(pollRef, { options: updatedOptions }); } catch (e) {} };
  const handleDeletePoll = async (id) => { if(!confirm("Delete this poll?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'polls', id)); } catch (e) {} };
  const handlePostSeries = async (e) => { e.preventDefault(); const validUrls = newSeriesPost.imageUrls.filter(url => url.trim() !== ''); if (validUrls.length === 0) return alert("At least one image URL is required."); try { if (editingSeriesId) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'series_posts', editingSeriesId), { title: newSeriesPost.title, imageUrls: validUrls, caption: newSeriesPost.caption, lastEdited: serverTimestamp() }); logAction("Update Series", `Updated Barista Diaries: ${newSeriesPost.title}`); setEditingSeriesId(null); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'series_posts'), { title: newSeriesPost.title, imageUrls: validUrls, caption: newSeriesPost.caption, author: profile.name, authorId: profile.memberId, createdAt: serverTimestamp() }); logAction("Post Series", `Posted to Barista Diaries: ${newSeriesPost.title}`); } setShowSeriesForm(false); setNewSeriesPost({ title: '', imageUrls: [''], caption: '' }); } catch (e) {} };
  const handleEditSeries = (post) => { setNewSeriesPost({ title: post.title, imageUrls: post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : [post.imageUrl || ''], caption: post.caption }); setEditingSeriesId(post.id); setShowSeriesForm(true); };
  const handleDeleteSeries = async (id) => { if(!confirm("Delete this post?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'series_posts', id)); } catch (e) {} };
  const addShift = () => { if (!tempShift.date || !tempShift.name) return alert("Date and Shift Name are required."); setNewEvent(prev => ({ ...prev, shifts: [...(prev.shifts||[]), { id: crypto.randomUUID(), date: tempShift.date, name: tempShift.name, startTime: tempShift.startTime, endTime: tempShift.endTime, capacity: tempShift.capacity, volunteerCapacity: tempShift.volunteerCapacity, attendees: [], volunteers: [] }] })); setTempShift({ date: '', name: '', startTime: '', endTime: '', capacity: 50, volunteerCapacity: 5 }); };
  const removeShift = (id) => { setNewEvent(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== id) })); };
  const handleShiftRegistration = async (ev, shiftId, role) => { if (isLimited) return alert(isExpired ? "Your membership is expired. Please renew first." : PENDING_MSG); const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id); const updatedShifts = ev.shifts.map(shift => { if (shift.id === shiftId) { const listKey = role === 'volunteer' ? 'volunteers' : 'attendees'; const capKey = role === 'volunteer' ? 'volunteerCapacity' : 'capacity'; const currentList = shift[listKey] || []; const isRegistered = currentList.includes(profile.memberId); if (isRegistered) { return { ...shift, [listKey]: currentList.filter(id => id !== profile.memberId) }; } else { if (currentList.length >= shift[capKey]) { alert(`This shift is full for ${role}s!`); return shift; } return { ...shift, [listKey]: [...currentList, profile.memberId] }; } } return shift; }); try { await updateDoc(eventRef, { shifts: updatedShifts }); } catch(err) { console.error(err); } };
  const handleAddAchievement = () => { if (!tempAchievement.text.trim()) return; const newAch = { text: tempAchievement.text.trim(), date: tempAchievement.date || new Date().toISOString().split('T')[0] }; const updatedList = [...(legacyForm.achievements || []), newAch].sort((a,b) => new Date(a.date) - new Date(b.date)); setLegacyForm(prev => ({ ...prev, achievements: updatedList })); setTempAchievement({ date: '', text: '' }); };
  const handleUpdateAchievement = (index, field, value) => { const updated = [...legacyForm.achievements]; updated[index] = { ...updated[index], [field]: value }; updated.sort((a,b) => new Date(a.date || '1970-01-01') - new Date(b.date || '1970-01-01')); setLegacyForm(prev => ({ ...prev, achievements: updated })); };
  const handleRemoveAchievement = (index) => { setLegacyForm(prev => ({ ...prev, achievements: prev.achievements.filter((_, i) => i !== index) })); };
  const handleAddEvent = async (e) => { e.preventDefault(); try { const eventPayload = { ...newEvent, name: newEvent.name.toUpperCase(), venue: newEvent.venue.toUpperCase(), createdAt: serverTimestamp(), attendees: [], registered: [] }; if (editingEvent) { delete eventPayload.createdAt; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent.id), eventPayload); logAction("Update Event", `Updated event: ${newEvent.name}`); setEditingEvent(null); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), eventPayload); logAction("Create Event", `Created event: ${newEvent.name}`); } setShowEventForm(false); setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, registrationRequired: true, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' }); } catch (err) {} };
  const handleEditEvent = (ev) => { setNewEvent({ ...ev, masterclassModuleIds: ev.masterclassModuleIds || (ev.masterclassModuleId ? [ev.masterclassModuleId] : []), shifts: ev.shifts || [], scheduleType: ev.scheduleType || 'WHOLE_DAY', attendanceRequired: ev.attendanceRequired || false, evaluationLink: ev.evaluationLink || '', isVolunteer: ev.isVolunteer || false, registrationRequired: ev.registrationRequired !== undefined ? ev.registrationRequired : true, openForAll: ev.openForAll !== undefined ? ev.openForAll : true, volunteerTarget: ev.volunteerTarget || { officer: 0, committee: 0, member: 0 } }); setEditingEvent(ev); setShowEventForm(true); };
  const handleDeleteEvent = async (id) => { if(!confirm("Delete this event?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id)); logAction("Delete Event", `Deleted event ID: ${id}`); } catch(err) {} };
  const handleToggleAttendanceLocal = async (memberId) => { if (!attendanceEvent || !memberId) return; const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', attendanceEvent.id); const isPresent = attendanceEvent.attendees?.includes(memberId); try { if (isPresent) { await updateDoc(eventRef, { attendees: arrayRemove(memberId) }); } else { await updateDoc(eventRef, { attendees: arrayUnion(memberId) }); } if (attendanceEvent.masterclassModuleIds && attendanceEvent.masterclassModuleIds.length > 0) { const trackerRef = doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'); const updates = {}; attendanceEvent.masterclassModuleIds.forEach(modId => { updates[`moduleAttendees.${modId}`] = isPresent ? arrayRemove(memberId) : arrayUnion(memberId); }); await updateDoc(trackerRef, updates); } setAttendanceEvent(prev => ({ ...prev, attendees: isPresent ? prev.attendees.filter(id => id !== memberId) : [...(prev.attendees || []), memberId] })); } catch(err) {} };
  const handleDownloadAttendance = () => { if (!attendanceEvent) return; const validMembers = members.filter(m => m != null); const presentMembers = validMembers.filter(m => attendanceEvent.attendees?.includes(m.memberId)); const headers = ["Name", "ID", "Position"]; const rows = presentMembers.sort((a,b) => (a.name || "").localeCompare(b.name || "")).map(m => [m.name, m.memberId, m.specificTitle]); generateCSV(headers, rows, `${attendanceEvent.name.replace(/\s+/g, '_')}_Attendance.csv`); };
  const handleRegisterEvent = async (ev) => { if (isLimited) return alert(isExpired ? "Your membership is expired. Please renew to join events." : PENDING_MSG); const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id); const isRegistered = ev.registered?.includes(profile.memberId); try { if (isRegistered) { await updateDoc(eventRef, { registered: arrayRemove(profile.memberId) }); } else { await updateDoc(eventRef, { registered: arrayUnion(profile.memberId) }); } } catch (err) {} };
  const handlePostAnnouncement = async (e) => { e.preventDefault(); try { if (editingAnnouncement) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', editingAnnouncement.id), { ...newAnnouncement, lastEdited: serverTimestamp() }); logAction("Update Announcement", `Updated announcement: ${newAnnouncement.title}`); setEditingAnnouncement(null); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'announcements'), { ...newAnnouncement, date: new Date().toISOString(), createdAt: serverTimestamp() }); logAction("Post Announcement", `Posted announcement: ${newAnnouncement.title}`); } setShowAnnounceForm(false); setNewAnnouncement({ title: '', content: '' }); } catch (err) { alert("The notice could not be posted: " + ((err && err.message) || 'unknown error')); } };
  const handleDeleteAnnouncement = async (id) => { if(!confirm("Delete this announcement?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'announcements', id)); logAction("Delete Announcement", `Deleted announcement ID: ${id}`); } catch(err) {} };
  const handleEditAnnouncement = (ann) => { setNewAnnouncement({ title: ann.title, content: ann.content }); setEditingAnnouncement(ann); setShowAnnounceForm(true); };
  const handleSaveLegacy = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'legacy', 'main'), legacyForm); logAction("Update Legacy", "Updated About Us / Legacy content"); setIsEditingLegacy(false); } catch(err) {} };
  const handleUpdateMemberDetails = async (e) => { e.preventDefault(); if (!editingMember) return; try { const docId = editingMember.id || editingMember.memberId; const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId); await updateDoc(memberRef, { joinedDate: new Date(editMemberForm.joinedDate).toISOString() }); logAction("Update Member", `Updated details for ${editingMember.name}`); setEditingMember(null); alert("Member details updated."); } catch(err) { alert("Failed to update member: " + err.message); } };
  const handleBulkAddMasterclass = async () => { if (selectedMcMembers.length === 0) return alert("No members selected!"); const currentAttendees = masterclassData.moduleAttendees?.[adminMcModule] || []; const updatedAttendees = [...new Set([...currentAttendees, ...selectedMcMembers])]; const newData = { ...masterclassData, moduleAttendees: { ...masterclassData.moduleAttendees, [adminMcModule]: updatedAttendees } }; try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData); logAction("Masterclass Add", `Added ${selectedMcMembers.length} to Module ${adminMcModule}`); setSelectedMcMembers([]); setAdminMcSearch(''); alert(`Added ${selectedMcMembers.length} attendees to Module ${adminMcModule}`); } catch(e) {} };
  const handleSaveCertTemplate = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), masterclassData); alert("Template Saved"); } catch(e) {} };
  const handleSaveMcCurriculum = async () => { try { const newData = { ...masterclassData, moduleDetails: { ...masterclassData.moduleDetails, [adminMcModule]: tempMcDetails } }; await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'), newData); logAction("Update Curriculum", `Updated Module ${adminMcModule}`); setEditingMcCurriculum(false); alert("Curriculum Updated"); } catch(e) {} };
  const handleUpdateGcashNumber = async () => { if (!newGcashNumber.trim()) return; try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, gcashNumber: newGcashNumber }); logAction("Update GCash", `Changed GCash number to ${newGcashNumber}`); setNewGcashNumber(''); alert("GCash Number Updated Successfully"); } catch (err) { alert("Failed to update GCash Number"); } };
  const submitApplication = async (payload) => { if (isLimited) return alert(isExpired ? "Your membership is expired. Please renew to apply." : PENDING_MSG); setSubmittingApp(true); try { const snap = await getDocs(query(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), where('memberId', '==', profile.memberId))); if (snap.docs.some(d => ['pending', 'for_interview'].includes(d.data().status))) { alert("You already have an application in progress. Please wait for the officers' update."); return; } await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'applications'), { memberId: profile.memberId, name: profile.name, email: profile.email, studentId: profile.studentId || '', program: profile.program || '', status: 'pending', createdAt: serverTimestamp(), statusUpdatedAt: serverTimestamp(), ...payload }); alert("Application submitted successfully!"); } catch (err) { alert("Failed to submit application."); } finally { setSubmittingApp(false); } };
  const handleApplyCommittee = async (e, targetCommittee) => { e.preventDefault(); await submitApplication({ appType: 'committee', committee: targetCommittee, role: 'Committee Member' }); };
  const handleApplyOfficer = async (e) => { e.preventDefault(); const f = officerForm; if (!f.role) return alert("Please choose the position you are applying for."); if (!/^https?:\/\/\S+\.\S+/i.test((f.resumeLink || '').trim())) return alert("Please paste a link to your resume (for example a Google Drive link set to 'Anyone with the link can view')."); if (!f.intro.trim() || !f.whyFit.trim() || !f.plan.trim() || f.answers.some(a => !a.trim())) return alert("Please answer every question before submitting."); await submitApplication({ appType: 'officer', committee: 'Executive Board', role: f.role, resumeLink: f.resumeLink.trim(), intro: f.intro.trim(), whyFit: f.whyFit.trim(), plan: f.plan.trim(), answers: EXEC_QUESTIONS.map((q, i) => ({ q, a: f.answers[i].trim() })) }); setOfficerForm(EMPTY_OFFICER_FORM); };
  const handleCreateProject = async (e) => { e.preventDefault(); try { const validMembers = members.filter(m => m != null); const projectHead = validMembers.find(m => m?.memberId === newProject.projectHeadId); const payload = { title: newProject.title, description: newProject.description, deadline: newProject.deadline, projectHeadId: newProject.projectHeadId, projectHeadName: projectHead ? projectHead.name : '' }; if (editingProject) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'projects', editingProject.id), { ...payload, lastEdited: serverTimestamp() }); logAction("Update Project", `Updated project: ${newProject.title}`); setEditingProject(null); } else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'projects'), { ...payload, createdBy: profile.memberId, createdAt: serverTimestamp(), status: 'active' }); logAction("Create Project", `Created project: ${newProject.title}`); } setShowProjectForm(false); setNewProject({ title: '', description: '', deadline: '', projectHeadId: '', projectHeadName: '' }); } catch(e) {} };
  const handleEditProject = (proj) => { setNewProject({ title: proj.title, description: proj.description, deadline: proj.deadline, projectHeadId: proj.projectHeadId, projectHeadName: proj.projectHeadName }); setEditingProject(proj); setShowProjectForm(true); };
  const handleSaveTask = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newTask.projectId) return alert("Task must belong to a project");
    if (!newTask.title || !newTask.title.trim()) return alert("Please enter a task title.");
    try {
      const assignee = members.find(m => m && m.memberId === newTask.assigneeId);
      const payload = { ...newTask, title: newTask.title.trim(), assigneeName: assignee ? assignee.name : '' };
      if (editingTask) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', editingTask.id), { ...payload, lastEdited: serverTimestamp() });
        logAction("Update Task", `Updated task: ${payload.title}`);
        setEditingTask(null);
      } else {
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'tasks'), { ...payload, createdBy: profile.memberId, creatorName: profile.name, createdAt: serverTimestamp() });
        logAction("Create Task", `Created task: ${payload.title}`);
      }
      setShowTaskForm(false);
      setNewTask({ ...EMPTY_TASK, projectId: newTask.projectId });
    } catch (err) { console.error(err); alert("Could not save the task. Please try again."); }
  };
  const handleUpdateTaskStatus = async (taskId, newStatus) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', taskId), { status: newStatus }); } catch (err) {} };
  const handleDeleteTask = async (id) => { if(!confirm("Delete this task?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'tasks', id)); logAction("Delete Task", `Deleted task ID: ${id}`); } catch(err) {} };
  const handleEditTask = (task) => { setNewTask({ ...EMPTY_TASK, title: task.title || '', description: task.description || '', deadline: task.deadline || '', link: task.link || '', status: task.status || 'pending', notes: task.notes || '', projectId: task.projectId || '', committee: task.committee || '', assigneeId: task.assigneeId || '', assigneeName: task.assigneeName || '' }); setEditingTask(task); setShowTaskForm(true); };
  const initiateAppAction = (app, type) => { let subject = ""; let body = ""; const isEx = app.appType === 'officer'; const kind = isEx ? 'Executive Board' : 'Committee'; const where = isEx ? 'Executive Board' : committeeTitle(app.committee); const signature = "\n\nBest regards,\nLPU Baristas' Association"; if (type === 'for_interview') { subject = `LBA ${kind} Application: Interview Invitation`; body = `Dear ${app.name},\n\nWe have reviewed your application for ${isEx ? "the" : "the"} ${where} and would like to invite you for an interview.\n\nPlease let us know your availability.\n${signature}`; } else if (type === 'accepted') { subject = `LBA ${kind} Application: Congratulations!`; body = `Dear ${app.name},\n\nWe are pleased to inform you that you have been accepted as ${app.role} of the ${where}!\n\nWelcome to the team! We will add you to the group chat shortly.\n${signature}`; } else if (type === 'denied') { subject = `LBA ${kind} Application Update`; body = `Dear ${app.name},\n\nThank you for your interest in joining the LBA ${kind}. After careful consideration, we regret to inform you that we cannot move forward with your application at this time.\n\nWe encourage you to stay active and apply again in the future.\n${signature}`; } setEmailModal({ isOpen: true, app, type, subject, body }); };
  const confirmAppAction = async () => { if (!emailModal.app) return; try { const { app, type, subject, body } = emailModal; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id), { status: type, statusUpdatedAt: serverTimestamp(), lastEmailSent: new Date().toISOString() }); if (type === 'accepted') { const isEx = app.appType === 'officer'; const newId = await handleUpdatePosition(app.memberId, isEx ? 'Officer' : 'Committee', app.role, isEx ? '' : normCommittee(app.committee), true); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', newId || app.memberId), { accolades: arrayUnion(isEx ? `Executive Board - ${app.role}` : `${committeeTitle(app.committee)} - ${app.role}`) }); } logAction("Application Action", `${type.toUpperCase()} application for ${app.name}`); openGmail({ to: app.email, subject, body }); setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' }); alert("Status updated and Gmail opened!"); } catch (err) { alert("Error updating status: " + ((err && err.message) || '')); } };
  const handleDeleteApp = async (id) => { if (!confirm("Delete this application?")) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', id)); logAction("Delete App", `Deleted application ID: ${id}`); } catch(err) {} };
  const handleToggleRegistration = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, registrationOpen: !hubSettings.registrationOpen }); logAction("Toggle Reg", `Registration ${!hubSettings.registrationOpen ? 'Opened' : 'Closed'}`); } catch (err) {} };
  const handleToggleMaintenance = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, maintenanceMode: !hubSettings.maintenanceMode }); logAction("Toggle Maintenance", `Maintenance ${!hubSettings.maintenanceMode ? 'Enabled' : 'Disabled'}`); } catch (err) {} };
  const handleToggleRenewalMode = async () => { try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, renewalMode: !hubSettings.renewalMode }); logAction("Toggle Renewal", `Renewal Mode ${!hubSettings.renewalMode ? 'ON' : 'OFF'}`); } catch (err) {} };
  const handleToggleAllowedPayment = async () => { const newMode = hubSettings.allowedPayment === 'gcash_only' ? 'both' : 'gcash_only'; try { await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { ...hubSettings, allowedPayment: newMode }); } catch (err) {} };
  
  const handleToggleSuperAdmin = async (memberId, currentRole, name) => { 
      if (!isSuperAdmin) return; 
      const targetCat = members.find(m => m.memberId === memberId)?.positionCategory;
      const revertRole = targetCat === 'Officer' ? 'admin' : 'member';
      const newRoleToSet = currentRole === 'superadmin' ? revertRole : 'superadmin'; 
      if (!confirm(`Are you sure you want to ${newRoleToSet === 'superadmin' ? 'GRANT' : 'REVOKE'} System Admin access for ${name}?`)) return; 
      try { 
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId), { role: newRoleToSet }); 
          logAction("Toggle Super Admin", `${newRoleToSet === 'superadmin' ? 'Granted' : 'Revoked'} admin access for ${name}`); 
          alert(`Successfully updated access for ${name}.`); 
      } catch (e) { alert("Failed to update access."); } 
  };

  const handleUpdatePosition = async (targetId, cat, specific = "", committee = "", explicitTitle = false) => { 
      if (!isSuperAdmin) return; 
      const validMembers = members.filter(m => m != null); 
      const target = validMembers.find(m => m.memberId === targetId); 
      if (!target) return; 
      let newId = target.memberId; 
      const isL = ['Officer', 'Committee'].includes(cat); 
      const baseId = newId.endsWith('C') ? newId.slice(0, -1) : newId; 
      newId = baseId + (isL ? 'C' : ''); 
      // Title follows the category: moving someone to Member always makes the title Member.
      const catChanged = cat !== target.positionCategory;
      const validFor = (c, t) => (c === 'Officer' && OFFICER_TITLES.includes(t)) || (c === 'Committee' && COMMITTEE_TITLES.includes(t));
      const defaultTitle = ({ Member: 'Member', Committee: 'Committee Member' })[cat] || cat;
      let title = specific || defaultTitle;
      if (cat === 'Member') title = 'Member';
      else if (catChanged && !explicitTitle && !validFor(cat, specific)) title = defaultTitle;
      const updates = { 
          positionCategory: cat, 
          specificTitle: title, 
          memberId: newId, 
          role: cat === 'Officer' ? 'admin' : (target.role === 'superadmin' ? 'superadmin' : 'member'), 
          paymentStatus: ['Officer', 'Committee', 'Alumni', 'Execomm'].includes(cat) ? 'exempt' : target.paymentStatus, 
          committee: cat === 'Committee' ? normCommittee(committee) : "" 
      }; 
      if (newId !== targetId) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', targetId)); 
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', newId), { ...target, ...updates }); 
      return newId;
  };

  const handleToggleIdLace = async (m) => {
      if (!isOfficer || !m) return; const issuing = !m.idLaceIssued;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', m.memberId), issuing ? { idLaceIssued: true, idLaceIssuedAt: new Date().toISOString(), idLaceIssuedBy: profile.name } : { idLaceIssued: false, idLaceIssuedAt: '', idLaceIssuedBy: '' });
          const lace = inventory.find(i => i && /id\s*lace/i.test(String(i.name || '')));
          if (lace) await handleAdjustStock(lace, issuing ? -1 : 1, `${issuing ? 'Issued to' : 'Returned by'} ${m.name} (${m.memberId})`, true);
          logAction("ID Lace", `${issuing ? 'Issued ID lace to' : 'Undid ID lace for'} ${m.name}`);
      } catch (err) { alert("Could not update ID lace status: " + ((err && err.message) || '')); }
  };
  const handleConfirmPayment = async (m) => {
      if (!isOfficer || !m) return; const pd = m.paymentDetails || {};
      if (!confirm(`Confirm that you saw this GCash payment in the GCash records?\n\n${m.name}\nRef ${pd.refNo}\nPHP ${pd.amount || ''} from ${pd.payerName || '?'}`)) return;
      try { const meta = getMemberIdMeta(); const upd = { status: 'active', paymentStatus: 'paid', paymentDetails: { ...pd, status: 'confirmed', verifiedBy: profile.name, verifiedAt: new Date().toISOString() } }; if (pd.purpose === 'renewal') { upd.lastRenewedSY = meta.sy; upd.lastRenewedSem = meta.sem; upd.membershipType = 'renewal'; } await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', m.memberId), upd); logAction("Payment Confirmed", `Confirmed GCash ${pd.refNo} for ${m.name}`); }
      catch (err) { alert("Could not confirm payment: " + ((err && err.message) || '')); }
  };
  const handleRejectPayment = async (m) => {
      if (!isOfficer || !m) return; const pd = m.paymentDetails || {}; const why = window.prompt(`Reject the payment of ${m.name}?\nTell the member why (for example: reference not found in GCash):`, 'Reference not found in GCash records'); if (why == null) return;
      try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', m.memberId), { status: 'expired', paymentStatus: 'unpaid', paymentDetails: { ...pd, status: 'rejected', rejectedBy: profile.name, rejectedAt: new Date().toISOString(), rejectedReason: why.trim() } }); logAction("Payment Rejected", `Rejected GCash ${pd.refNo} for ${m.name}: ${why.trim()}`); }
      catch (err) { alert("Could not reject payment: " + ((err && err.message) || '')); }
  };
  const videoVersion = Number((videoSettings && videoSettings.version) || 1);
  const handleVideoAck = async (kind, extra) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId), { ['videoAck.' + kind]: { version: videoVersion, at: new Date().toISOString(), ...(extra || {}) } }); } catch (err) { alert("Could not save your confirmation. Please try again. " + ((err && err.message) || '')); } };
  const handleSaveVideoSettings = async (bump) => { if (!isSuperAdmin) return; if (bump && !confirm("Everyone will have to watch the videos and confirm again the next time they open the Hub. Continue?")) return; try { const clean = (v) => ({ title: (v.title || '').trim(), url: (v.url || '').trim(), minSeconds: Math.max(10, parseInt(v.minSeconds, 10) || 60) }); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'videos'), { required: !!videoForm.required, intro: clean(videoForm.intro), orientation: clean(videoForm.orientation), version: bump ? videoVersion + 1 : videoVersion, updatedAt: new Date().toISOString(), updatedBy: profile.name }); logAction("Video Settings", bump ? "Updated videos and required everyone to watch again" : "Updated video settings"); alert(bump ? "Saved. Everyone must watch again." : "Saved."); } catch (err) { alert("Could not save: " + ((err && err.message) || '')); } };
  const handleAdjustStock = async (item, delta, reason, silent = false) => {
      const cur = Number(item.quantity || 0); const next = Math.max(0, cur + delta); const change = next - cur; if (change === 0) { if (!silent) alert("Stock cannot go below zero."); return; }
      try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', item.id), { quantity: next, updatedAt: new Date().toISOString(), updatedBy: profile.name, history: [...(item.history || []), { at: new Date().toISOString(), by: profile.name, change, balance: next, reason: reason || 'Adjustment' }].slice(-30) }); logAction("Inventory", `${item.name}: ${change > 0 ? '+' : ''}${change} (${reason || 'Adjustment'})`); }
      catch (err) { alert("Could not update stock: " + ((err && err.message) || '')); }
  };
  const handleSaveInventoryItem = async (e) => {
      e.preventDefault(); const name = (invForm.name || '').trim(); if (!name) return alert("Item name is required.");
      const qty = Math.max(0, parseInt(invForm.quantity, 10) || 0); const reorder = Math.max(0, parseInt(invForm.reorderLevel, 10) || 0); const nowIso = new Date().toISOString();
      const payload = { name, category: (invForm.category || '').trim() || 'General', unit: (invForm.unit || '').trim() || 'pcs', quantity: qty, reorderLevel: reorder, notes: (invForm.notes || '').trim(), updatedAt: nowIso, updatedBy: profile.name };
      try {
          if (editingInv) { const before = Number(editingInv.quantity || 0); const hist = qty !== before ? [{ at: nowIso, by: profile.name, change: qty - before, balance: qty, reason: 'Edited item' }] : []; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', editingInv.id), { ...payload, history: [...(editingInv.history || []), ...hist].slice(-30) }); logAction("Inventory", `Edited item: ${name}`); }
          else { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'inventory'), { ...payload, createdAt: serverTimestamp(), history: [{ at: nowIso, by: profile.name, change: qty, balance: qty, reason: 'Initial stock' }] }); logAction("Inventory", `Added item: ${name}`); }
          setShowInvForm(false); setEditingInv(null); setInvForm(EMPTY_ITEM);
      } catch (err) { alert("Could not save item: " + ((err && err.message) || '')); }
  };
  const handleDeleteInventoryItem = async (item) => { if (!confirm(`Delete "${item.name}" from the inventory? This cannot be undone.`)) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'inventory', item.id)); logAction("Inventory", `Deleted item: ${item.name}`); } catch (err) { alert("Could not delete item."); } };
  
  const initiateRemoveMember = (mid, name) => { setConfirmDelete({ mid, name }); };
  const confirmRemoveMember = async () => { if (!confirmDelete) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', confirmDelete.mid)); logAction("Remove Member", `Removed member: ${confirmDelete.name}`); } catch(e) { console.error(e); } finally { setConfirmDelete(null); } };
  const parseCSVText = (text) => {
    const rows = []; let row = [], cell = '', inQ = false; text = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQ) { if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += ch; }
      else if (ch === '"') inQ = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); cell = ''; rows.push(row); row = []; }
      else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(v => v.trim() !== ''));
  };
  const handleBulkImportCSV = async (e) => {
    const file = e.target.files[0]; if (!file) return; setIsImporting(true);
    const reader = new FileReader();
    reader.onerror = () => { alert("That file could not be read."); setIsImporting(false); e.target.value = ""; };
    reader.onload = async (evt) => {
      try {
        const rows = parseCSVText(String(evt.target.result));
        if (rows.length < 2) { alert("The file has no member rows under the header."); return; }
        const norm = (h) => String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
        const aliases = { id: 'id', memberid: 'id', name: 'name', fullname: 'name', email: 'email', emailaddress: 'email', program: 'program', course: 'program', category: 'cat', positioncategory: 'cat', title: 'title', specifictitle: 'title', committee: 'committee', status: 'status', joined: 'joined', joineddate: 'joined', studentid: 'sid', studentno: 'sid', lpuid: 'sid', idlace: 'lace' };
        const idx = {}; rows[0].forEach((h, i) => { const k = aliases[norm(h)]; if (k && idx[k] == null) idx[k] = i; });
        if (idx.name == null) { alert("No 'Name' column found. Columns in your file: " + rows[0].join(', ')); return; }
        const get = (r, k) => (idx[k] != null ? String(r[idx[k]] || '').trim() : '');
        const existing = new Set(members.filter(m => m != null).map(m => m.memberId));
        let maxNum = 0; existing.forEach(mid => { const mt = String(mid).match(/-(\d)(\d{4,})C?$/); if (mt) maxNum = Math.max(maxNum, parseInt(mt[2], 10)); });
        const meta = getMemberIdMeta(); const ops = []; let skipped = 0;
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i]; const name = get(r, 'name').toUpperCase(); if (!name) { skipped++; continue; }
          const pos = POSITION_CATEGORIES.find(c => c.toLowerCase() === get(r, 'cat').toLowerCase()) || 'Member';
          let mid = get(r, 'id').toUpperCase();
          if (mid && existing.has(mid)) { skipped++; continue; }
          if (!mid) { do { maxNum++; mid = generateLBAId(pos, maxNum - 1); } while (existing.has(mid)); }
          existing.add(mid);
          const status = get(r, 'status').toLowerCase() === 'active' ? 'active' : 'expired';
          const exempt = pos !== 'Member';
          const jd = get(r, 'joined') ? new Date(get(r, 'joined')) : null;
          ops.push({ mid, data: { name, email: get(r, 'email').toLowerCase(), program: get(r, 'program') || 'UNSET', positionCategory: pos, specificTitle: get(r, 'title') || pos, committee: normCommittee(get(r, 'committee')), studentId: get(r, 'sid').toUpperCase(), idLaceIssued: ['issued', 'yes', 'true', '1', 'y'].includes(get(r, 'lace').toLowerCase()), memberId: mid, role: pos === 'Officer' ? 'admin' : 'member', status, paymentStatus: exempt ? 'exempt' : (status === 'active' ? 'paid' : 'unpaid'), lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, joinedDate: jd && !isNaN(jd.getTime()) ? jd.toISOString() : new Date().toISOString() } });
        }
        for (let i = 0; i < ops.length; i++) { try { ops[i].data.uid = await createAuthAccount(ops[i].mid, "LBA" + ops[i].mid.slice(-5), 0); } catch (ce) { ops[i].data.authPending = true; } await sleep(350); }
        for (let i = 0; i < ops.length; i += 200) {
          const batch = writeBatch(db);
          ops.slice(i, i + 200).forEach(o => { batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', o.mid), o.data); if (o.data.studentId) batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'studentIds', o.data.studentId), { memberId: o.mid, at: new Date().toISOString() }); });
          await batch.commit();
        }
        logAction("Bulk Import", `Imported ${ops.length} members`);
        alert(`Imported ${ops.length} members.` + (skipped ? ` Skipped ${skipped} (blank name or ID already exists).` : ''));
      } catch (err) { console.error(err); alert("Import failed: " + (err && err.message ? err.message : err)); }
      finally { setIsImporting(false); e.target.value = ""; }
    };
    reader.readAsText(file);
  };
  const downloadImportTemplate = () => { const headers = ["Name", "Email", "Program", "PositionCategory", "SpecificTitle"]; const rows = [["JUAN DELA CRUZ", "juan@lpu.edu.ph", "BSIT", "Member", "Member"]]; generateCSV(headers, rows, "LBA_Import_Template.csv"); };
  const handleRotateDailyKey = async () => {
    if (!confirm("Generate a new Daily Cash Key? The old one stops working immediately.")) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), { dailyKey: randomKey(6), lastRotation: serverTimestamp() }, { merge: true });
      logAction("KEY_ROTATION", "Daily cash key rotated");
    } catch (err) { console.error(err); alert("Failed to rotate the cash key."); }
  };
  const handleRotateSecurityKeys = async () => {
    if (!confirm("Rotate ALL security keys (Officer, Head, Committee, Bypass)? The old keys stop working immediately, so share the new ones with the right people.")) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), { officerKey: `KAP-OFF-${randomKey(6)}`, headKey: `KAP-HEAD-${randomKey(6)}`, commKey: `KAP-COMM-${randomKey(6)}`, bypassKey: `KAP-PASS-${randomKey(6)}`, lastRotation: serverTimestamp() }, { merge: true });
      logAction("KEY_ROTATION", "Security keys rotated");
    } catch (err) { console.error(err); alert("Failed to rotate the security keys."); }
  };
  const handleSanitizeDatabase = async () => { if (!confirm("This will REMOVE DUPLICATES (by Name) and RE-GENERATE Member IDs. Are you sure?")) return; const batch = writeBatch(db); try { const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), orderBy('joinedDate', 'asc')); const snapshot = await getDocs(q); let count = 0; snapshot.docs.forEach((docSnap) => { const data = docSnap.data(); const category = data.positionCategory || "Member"; const meta = getMemberIdMeta(); count++; const padded = String(count).padStart(4, '0'); const isLeader = ['Officer', 'Committee'].includes(category); const newId = `LBA${meta.sy}-${meta.sem}${padded}${isLeader ? "C" : ""}`; batch.update(doc(db, 'artifacts', appId, 'public', 'data', 'registry', docSnap.id), { memberId: newId }); }); await batch.commit(); logAction("Sanitize DB", "Executed database sanitization"); alert(`Database sanitized! ${count} records updated.`); } catch (err) { alert("Failed to sanitize: " + err.message); } };
  const handleMigrateToRenewal = async () => { if(!confirm("This will update ALL current members to 'Renewal' status. Proceed?")) return; const batch = writeBatch(db); try { const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry')); const snapshot = await getDocs(q); let count = 0; snapshot.forEach(doc => { const data = doc.data(); if (data.membershipType !== 'renewal') { batch.update(doc.ref, { membershipType: 'renewal' }); count++; } }); if(count > 0) { await batch.commit(); logAction("Migrate Renewal", `Migrated ${count} members to renewal`); alert(`Migration Complete: ${count} members updated to Renewal status.`); } else { alert("No members needed updating."); } } catch (err) { alert("Migration failed."); } };
  const handleToggleStatus = async (memberId, currentStatus) => { if (!confirm(`Change status to ${currentStatus === 'active' ? 'EXPIRED' : 'ACTIVE'}?`)) return; try { const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId); const updates = { status: currentStatus === 'active' ? 'expired' : 'active' }; if (currentStatus === 'active') { updates.paymentStatus = 'unpaid'; } await updateDoc(memberRef, updates); logAction("Toggle Status", `Changed ${memberId} to ${updates.status}`); } catch(e) { console.error(e); } };
  const handleRenewalPayment = async (e) => { e.preventDefault(); const rm = hubSettings.allowedPayment === 'gcash_only' ? 'gcash' : renewalMethod; if (rm === 'gcash' && !renewalRef) return; if (rm === 'cash' && !renewalCashKey) return; try { const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', profile.memberId); const meta = getMemberIdMeta(); if (rm === 'gcash') { const ref = cleanRef(renewalRef); if (ref.length !== 13) return alert("A GCash reference number has 13 digits. Please copy it exactly from your GCash receipt."); if (!renewalPayer.trim()) return alert("Please enter the name of the GCash sender."); if (!renewalPayDate) return alert("Please enter the date you paid."); if (await isRefUsed(ref)) return alert("This reference number has already been used. Please check your receipt or contact an officer."); await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'payrefs', ref), { memberId: profile.memberId, at: new Date().toISOString() }); await updateDoc(memberRef, { paymentStatus: 'pending', paymentDetails: { method: 'gcash', refNo: ref, payerName: renewalPayer.trim().toUpperCase(), paidDate: renewalPayDate, amount: 50, purpose: 'renewal', submittedAt: new Date().toISOString() }, refHistory: arrayUnion(ref) }); setRenewalRef(''); setRenewalPayer(''); alert("Payment details received. An officer will confirm your GCash payment. Your access stays limited until then."); } else { await updateDoc(memberRef, { status: 'active', paymentStatus: 'paid', lastRenewedSY: meta.sy, lastRenewedSem: meta.sem, membershipType: 'renewal', cashKey: renewalCashKey.trim().toUpperCase(), paymentDetails: { method: 'cash', refNo: 'CASH', amount: 50, purpose: 'renewal', submittedAt: new Date().toISOString() } }); setRenewalCashKey(''); alert("Membership renewed successfully! Welcome back."); } } catch (err) { alert(rm === 'cash' ? "Renewal failed. Please check the cash key with an officer and try again." : "Renewal failed. Please try again."); } };
  const handleGiveAccolade = async () => { if (!accoladeText.trim() || !showAccoladeModal) return; try { const docId = showAccoladeModal.id || showAccoladeModal.memberId; const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId); await updateDoc(memberRef, { accolades: arrayUnion(accoladeText) }); setAccoladeText(""); const updated = [...(showAccoladeModal.currentAccolades || []), accoladeText]; setShowAccoladeModal(prev => ({...prev, currentAccolades: updated})); logAction("Award Accolade", `Awarded '${accoladeText}' to ${docId}`); alert("Accolade awarded!"); } catch (err) { alert("Failed to award accolade: " + err.message); } };
  const handleRemoveAccolade = async (accoladeToRemove) => { if(!confirm("Remove this accolade?")) return; try { const docId = showAccoladeModal.id || showAccoladeModal.memberId; const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId); await updateDoc(memberRef, { accolades: arrayRemove(accoladeToRemove) }); const updated = showAccoladeModal.currentAccolades.filter(a => a !== accoladeToRemove); setShowAccoladeModal(prev => ({...prev, currentAccolades: updated})); logAction("Remove Accolade", `Removed '${accoladeToRemove}' from ${docId}`); } catch(e) { alert("Failed to remove accolade"); } };
const handleMigratePasswords = async () => {
    if (!isSuperAdmin) return;
    if (!confirm("Move every member to secure login and erase stored passwords? Keep this page open until it says Done. Your own session may restart - just log in again.")) return;
    setMigBusy(true); setMigMsg('Starting...');
    try {
      const all = (members || []).filter(m => m && (m.id || m.memberId));
      const targets = all.filter(m => m.password); let ok = 0; const fails = [];
      const failMap = {};
      for (let i = 0; i < targets.length; i++) { const m = targets[i]; const docId = String(m.id || m.memberId).trim(); setMigMsg(`Securing ${i + 1} of ${targets.length}...`); let done = false; for (let attempt = 0; attempt < 2 && !done; attempt++) { try { const uid = await createAuthAccount(docId.toUpperCase(), m.password, 0); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId), { uid, password: deleteField(), authMigrated: true }); ok++; done = true; } catch (e) { const code = (e && e.code) || (e && e.message) || 'error'; if (attempt === 0 && /too-many|quota|network/i.test(String(code))) { await sleep(6000); continue; } failMap[docId] = code; fails.push(`${docId} (${code})`); break; } } await sleep(700); }
      setMigFails(failMap);
      setMigMsg('Building duplicate-protection lists...');
      let batch = writeBatch(db), n = 0;
      for (const m of all) {
        if (m.studentId) { batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'studentIds', String(m.studentId).toUpperCase()), { memberId: m.memberId, at: new Date().toISOString() }); n++; }
        const refs = new Set([...(Array.isArray(m.refHistory) ? m.refHistory : []), m.paymentDetails && m.paymentDetails.refNo]);
        refs.forEach(r => { if (r && /^\d{13}$/.test(String(r))) { batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'payrefs', String(r)), { memberId: m.memberId, at: new Date().toISOString() }); n++; } });
        if (n >= 400) { await batch.commit(); batch = writeBatch(db); n = 0; }
      }
      if (n) await batch.commit();
      logAction("Secure Login", `Migrated ${ok} of ${targets.length} members to secure login`);
      setMigMsg(`Done. ${ok} secured.` + (fails.length ? ` Not secured (${fails.length}): ${fails.join(', ')}. Run it again to retry, or reset those passwords.` : ' Everyone is secured.'));
    } catch (e) { setMigMsg('Stopped: ' + ((e && e.message) || e)); }
    finally { setMigBusy(false); }
  };
const handleResetPassword = async (memberId, email, name) => {
    if (!confirm(`Reset password for ${name}?`)) return;
    const tempPassword = "LBA-" + randomKey(6);
    const subject = "LBA Password Reset Request";
    const body = `Dear ${name},\n\nWe received a request to reset the password associated with your membership account at LPU Baristas' Association.\n\nMember ID: ${memberId}\nTemporary Password: ${tempPassword}\n\nLogin here: ${window.location.origin}\n\nPlease change this password right after logging in (Profile > Change Password).\n\nThank you,\nLBA Support Team`;
    try {
        const regRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId);
        const infoRef = doc(db, 'artifacts', appId, 'public', 'data', 'authinfo', memberId);
        const cur = await getDoc(regRef);
        if (!cur.exists()) { alert("Error: Member not found in registry."); return; }
        const inf = await getDoc(infoRef);
        const nv = (inf.exists() ? Number(inf.data().v) || 0 : 0) + 1;
        const newUid = await createAuthAccount(memberId, tempPassword, nv);
        await setDoc(infoRef, { v: nv, at: new Date().toISOString() });
        await updateDoc(regRef, { uid: newUid, password: deleteField(), authMigrated: true, passwordResetAt: new Date().toISOString() });
        openGmail({ to: email, subject, body });
        logAction("Reset Password", `Generated temp password for ${memberId}`);
        alert("Password reset! Opening Gmail...");
    } catch (err) {
        console.error("Reset Error:", err);
        alert("Failed to reset password. Check your connection or permissions.");
    }
};
  
  const pendingPayments = (members || []).filter(m => m && m.paymentStatus === 'pending').sort((a, b) => String(a.paymentDetails?.submittedAt || '').localeCompare(String(b.paymentDetails?.submittedAt || '')));
  const vReq = !!(videoSettings && videoSettings.required);
  const needIntro = vReq && !!(videoSettings.intro && videoSettings.intro.url) && !(profile.videoAck && profile.videoAck.intro && profile.videoAck.intro.version >= videoVersion);
  const needOrient = vReq && !!(videoSettings.orientation && videoSettings.orientation.url) && !(profile.videoAck && profile.videoAck.orientation && profile.videoAck.orientation.version >= videoVersion);
  const gateStep = needIntro ? 'intro' : (needOrient ? 'orientation' : null);
  const gateTotal = (vReq && videoSettings.intro && videoSettings.intro.url ? 1 : 0) + (vReq && videoSettings.orientation && videoSettings.orientation.url ? 1 : 0);
  const showGate = !!gateStep && !gateSkipped;
  const birthdayToday = (isOfficer || isCare) && (members || []).some(m => m && Number(m.birthMonth) === new Date().getMonth() + 1 && Number(m.birthDay) === new Date().getDate() && m.positionCategory !== 'Blacklisted');
  const menuGroups = [
    { id: 'explore', label: 'Explore', icon: Coffee, items: [
      { id: 'about', label: 'Legacy Story', icon: History },
      { id: 'team', label: 'Brew Crew', icon: Users },
      { id: 'masterclass', label: 'Training Academy', icon: GraduationCap },
      { id: 'series', label: 'Barista Diaries', icon: ImageIcon } ] },
    { id: 'community', label: 'Community', icon: MessageSquare, items: [
      { id: 'events', label: "What's Brewing?", icon: Calendar, hasNotification: notifications.events },
      { id: 'announcements', label: 'Grind Report', icon: Bell, hasNotification: notifications.announcements },
      { id: 'members_corner', label: "Member's Corner", icon: MessageSquare, hasNotification: notifications.suggestions },
      { id: 'feedback', label: 'App Feedback', icon: Smile, hasNotification: newFeedbackCount > 0 } ] },
    { id: 'involved', label: 'Get Involved', icon: Briefcase, items: [
      { id: 'committee_hunt', label: 'Join the Team', icon: Briefcase, hasNotification: notifications.committee_hunt },
      { id: 'videos', label: 'Orientation Videos', icon: Play } ] },
    ...((isOfficer || isCare) ? [ { id: 'care', label: "Member's Care Desk", icon: Heart, items: [
      { id: 'attendance', label: 'Attendance', icon: ClipboardList },
      { id: 'birthdays', label: 'Birthdays', icon: Gift, hasNotification: birthdayToday },
      { id: 'inventory', label: 'Inventory', icon: Package } ] } ] : []),
    ...(isOfficer ? [ { id: 'admin', label: isSuperAdmin ? 'Admin Desk' : 'Officer Desk', icon: ShieldCheck, items: [
      { id: 'members', label: 'Registry', icon: Users, hasNotification: notifications.members },
      { id: 'payments', label: 'Payments', icon: Banknote, hasNotification: pendingPayments.length > 0 },
      ...(isSuperAdmin ? [{ id: 'reports', label: 'Terminal', icon: FileText, hasNotification: pendingAppCount > 0 }] : []) ] } ] : []),
  ];

  const activeMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all bg-[#FDB813] text-[#3E2723] shadow-lg font-black relative";
  const inactiveMenuClass = "w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-amber-200/40 hover:bg-white/5 relative";

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col text-[#3E2723] font-sans relative overflow-hidden">
      {hubSettings.maintenanceMode && !isSuperAdmin && (<div className="w-full z-[101]"><MaintenanceBanner /></div>)}
      {hubSettings.maintenanceMode && isSuperAdmin && (<div className="w-full bg-red-600 text-white text-center py-2 px-4 flex items-center justify-center gap-2 font-black text-[10px] uppercase animate-pulse border-b-2 border-red-800"><AlertOctagon size={14} /><span>MAINTENANCE MODE IS CURRENTLY ACTIVE</span></div>)}
      
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Confirm Deletion</h3>
                <p className="text-sm text-gray-600 mb-8">Are you sure you want to remove <span className="font-bold text-[#3E2723]">{confirmDelete.name}</span>?</p>
                <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button onClick={confirmRemoveMember} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700">Delete</button></div>
            </div>
        </div>
      )}

      {emailModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Send Update Email</h3>
                <div className="space-y-4">
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">Subject</label><input type="text" className="w-full p-3 border rounded-xl text-xs font-bold" value={emailModal.subject} onChange={e => setEmailModal({...emailModal, subject: e.target.value})} /></div>
                    <div><label className="text-[10px] font-bold text-gray-500 uppercase">Message Body</label><textarea className="w-full p-3 border rounded-xl text-xs h-32" value={emailModal.body} onChange={e => setEmailModal({...emailModal, body: e.target.value})} /></div>
                    <div className="flex gap-3 pt-2"><button onClick={() => setEmailModal({ isOpen: false, app: null, type: '', subject: '', body: '' })} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button onClick={confirmAppAction} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Update & Open Email</button></div>
                </div>
            </div>
        </div>
      )}
      
      {editingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-[32px] p-8 max-w-sm w-full border-b-[8px] border-[#3E2723]">
                  <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Edit Member Details</h3>
                  <form onSubmit={handleUpdateMemberDetails} className="space-y-4">
                      <div><label className="text-[10px] font-bold text-gray-500 uppercase">Joined Date</label><input type="date" required className="w-full p-3 border rounded-xl text-xs font-bold" value={editMemberForm.joinedDate} onChange={e => setEditMemberForm({...editMemberForm, joinedDate: e.target.value})} /><p className="text-[9px] text-gray-400 mt-1">This date appears on their profile card.</p></div>
                      <div className="flex gap-3 pt-4"><button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Save</button></div>
                  </form>
              </div>
          </div>
      )}

      {showCertificate && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn">
              <div className="relative max-w-4xl w-full flex justify-center">
                  <button onClick={() => setShowCertificate(false)} className="absolute -top-12 right-0 text-white hover:text-amber-400 print:hidden"><X size={32}/></button>
                  {masterclassData.certTemplate ? (
                      <div className="relative bg-white shadow-2xl overflow-hidden w-full max-w-[800px] aspect-[1.414/1]">
                          <img src={getDirectLink(masterclassData.certTemplate)} alt="Certificate Background" className="absolute inset-0 w-full h-full object-cover" />
                          <div className="absolute inset-0 w-full h-full">
                              <div className="absolute w-full flex justify-center px-4 md:px-12 text-center" style={{ top: '45%' }}>
                                  <h2 className="font-serif font-black text-[#FDB813] uppercase tracking-wide drop-shadow-md whitespace-nowrap" style={{ fontSize: 'clamp(1rem, 4vw, 2.5rem)' }}>
                                      {profile.name}
                                  </h2>
                              </div>
                              <div className="absolute w-full flex justify-center" style={{ top: '75%' }}>
                                  <p className="font-serif text-[8px] sm:text-[10px] md:text-xs text-[#FDB813] font-bold tracking-[0.2em] drop-shadow-sm">
                                      {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                  </p>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="bg-white p-8 rounded-2xl text-center max-w-sm"><AlertTriangle size={48} className="mx-auto text-amber-500 mb-4"/><h3 className="font-bold text-xl mb-2">Certificate Template Missing</h3><p className="text-sm text-gray-500">The administration has not uploaded the certificate design yet.</p></div>
                  )}
                  {masterclassData.certTemplate && ( <button onClick={() => window.print()} className="absolute top-4 right-4 bg-white text-[#3E2723] p-3 rounded-full shadow-lg hover:bg-gray-100 print:hidden transition-transform hover:scale-110" title="Print or Save as PDF"><Printer size={20}/></button> )}
              </div>
          </div>
      )}

      {attendanceEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl h-[80vh] flex flex-col border-b-[8px] border-[#3E2723]">
                <div className="flex justify-between items-center mb-6 border-b pb-4 border-amber-100">
                    <div>
                        <h3 className="text-xl font-black uppercase text-[#3E2723]">Attendance Check</h3>
                        <p className="text-xs text-amber-600 font-bold mt-1">{attendanceEvent.name} • {getEventDay(attendanceEvent.startDate)} {getEventMonth(attendanceEvent.startDate)}</p>
                        {attendanceEvent.masterclassModuleIds && attendanceEvent.masterclassModuleIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">{attendanceEvent.masterclassModuleIds.map(mid => (<span key={mid} className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[8px] font-black uppercase rounded-full">Module {mid}</span>))}</div>
                        )}
                    </div>
                    <div className="flex gap-2"><button onClick={handleDownloadAttendance} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Download List"><Download size={20}/></button><button onClick={() => setAttendanceEvent(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button></div>
                </div>
                {(() => {
                    const validMembers = members.filter(m => m != null);
                    let targetList = validMembers;
                    if (attendanceEvent.scheduleType === 'MULTIPLE_SHIFTS' && attendanceEvent.shifts) { 
                        const shiftAttendees = attendanceEvent.shifts.flatMap(s => [...(s.attendees || []), ...(s.volunteers || [])]); 
                        targetList = validMembers.filter(m => shiftAttendees.includes(m.memberId)); 
                    } else if (attendanceEvent.registrationRequired) { 
                        targetList = validMembers.filter(m => attendanceEvent.registered && attendanceEvent.registered.includes(m.memberId)); 
                    }
                    const sortedMembers = [...targetList].sort((a,b) => (a?.name || "").localeCompare(b?.name || ""));
                    return (
                        <>
                            <div className="flex justify-between items-center mb-4 px-2"><span className="text-xs font-bold text-gray-500 uppercase">{attendanceEvent.registrationRequired ? 'Registered List' : 'Member List (Open Event)'}</span><span className="text-xs font-bold bg-[#3E2723] text-[#FDB813] px-3 py-1 rounded-full">Present: {attendanceEvent.attendees?.length || 0} / {targetList.length}</span></div>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {sortedMembers.length > 0 ? (
                                    sortedMembers.map(m => {
                                        const isPresent = attendanceEvent.attendees?.includes(m.memberId);
                                        return (
                                            <div key={m.id} onClick={() => handleToggleAttendanceLocal(m.memberId)} className={`p-4 rounded-xl flex items-center justify-between cursor-pointer transition-all border ${isPresent ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-transparent hover:bg-amber-50'}`}>
                                                <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isPresent ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-500'}`}>{m.name ? m.name.charAt(0) : "?"}</div><div><p className={`text-xs font-bold uppercase ${isPresent ? 'text-green-900' : 'text-gray-600'}`}>{m.name}</p><p className="text-[9px] text-gray-400">{m.memberId}</p></div></div>
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 ${isPresent ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>{isPresent && <CheckCircle2 size={14} className="text-white" />}</div>
                                            </div>
                                        );
                                    })
                                ) : (<div className="text-center py-10 opacity-50"><p className="text-sm font-bold">No members found.</p><p className="text-xs">{attendanceEvent.registrationRequired ? "Members must register first." : "Check database sync."}</p></div>)}
                            </div>
                        </>
                    );
                })()}
            </div>
        </div>
      )}

      {showAccoladeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]">
                <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trophy size={32} /></div>
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Award Accolade</h3>
                {showAccoladeModal.currentAccolades && showAccoladeModal.currentAccolades.length > 0 && (
                    <div className="mb-4 bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto">
                        <p className="text-[9px] font-black uppercase text-gray-400 mb-2 text-left">Current Badges</p>
                        <ul className="space-y-1">{showAccoladeModal.currentAccolades.map((acc, idx) => (<li key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100"><span className="text-[10px] font-bold text-gray-700">{acc}</span><button onClick={() => handleRemoveAccolade(acc)} className="text-red-400 hover:text-red-600"><X size={12}/></button></li>))}</ul>
                    </div>
                )}
                <input type="text" placeholder="Achievement Title" className="w-full p-3 border rounded-xl text-xs mb-6" value={accoladeText} onChange={e => setAccoladeText(e.target.value)} />
                <div className="flex gap-3"><button onClick={() => setShowAccoladeModal(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Close</button><button onClick={handleGiveAccolade} className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold uppercase text-xs hover:bg-yellow-600">Award</button></div>
            </div>
        </div>
      )}

      {showPollForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-[32px] p-8 max-w-md w-full border-b-[8px] border-[#3E2723]">
                  <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Create New Poll</h3>
                  <div className="space-y-4">
                      <input type="text" placeholder="Poll Question" className="w-full p-3 border border-amber-200 rounded-xl text-sm font-bold" value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} />
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                          {newPoll.options.map((opt, index) => (
                              <div key={index} className="flex gap-2">
                                  <input type="text" placeholder={`Option ${index + 1}`} className="flex-1 p-3 border rounded-xl text-xs" value={opt} onChange={e => { const updatedOptions = [...newPoll.options]; updatedOptions[index] = e.target.value; setNewPoll({...newPoll, options: updatedOptions}); }} />
                                  {newPoll.options.length > 2 && (<button type="button" onClick={() => { const filtered = newPoll.options.filter((_, i) => i !== index); setNewPoll({...newPoll, options: filtered}); }} className="text-red-400 hover:text-red-600 font-bold px-2">X</button>)}
                              </div>
                          ))}
                      </div>
                      <button type="button" onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="text-xs text-amber-600 font-bold uppercase w-full text-center hover:text-amber-800">+ Add Another Option</button>
                      <div className="flex gap-3 pt-4 border-t border-gray-100"><button onClick={() => setShowPollForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button onClick={handleCreatePoll} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-[#FDB813] font-bold uppercase text-xs hover:bg-black">Post Poll</button></div>
                  </div>
              </div>
          </div>
      )}

      {showSeriesForm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
              <div className="bg-white rounded-[32px] p-8 max-w-md w-full border-b-[8px] border-[#3E2723]">
                  <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingSeriesId ? 'Edit Diary Post' : 'Post to Barista Diaries'}</h3>
                  <div className="space-y-4">
                      <input type="text" placeholder="Post Title" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={newSeriesPost.title} onChange={e => setNewSeriesPost({...newSeriesPost, title: e.target.value})} />
                      <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                          <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Image URLs (Google Drive / Direct Links)</label>
                          {newSeriesPost.imageUrls.map((url, index) => (
                              <div key={index} className="flex gap-2">
                                  <input type="text" placeholder={`Image URL ${index + 1}`} className="flex-1 p-3 border rounded-xl text-xs" value={url} onChange={e => { const updatedUrls = [...newSeriesPost.imageUrls]; updatedUrls[index] = e.target.value; setNewSeriesPost({...newSeriesPost, imageUrls: updatedUrls}); }} />
                                  {index === newSeriesPost.imageUrls.length - 1 ? (<button type="button" onClick={() => setNewSeriesPost({...newSeriesPost, imageUrls: [...newSeriesPost.imageUrls, '']})} className="bg-amber-100 text-amber-700 font-black rounded-xl px-4 hover:bg-amber-200">+</button>) : (<button type="button" onClick={() => { const filtered = newSeriesPost.imageUrls.filter((_, i) => i !== index); setNewSeriesPost({...newSeriesPost, imageUrls: filtered}); }} className="text-red-400 hover:text-red-600 font-bold px-3">X</button>)}
                              </div>
                          ))}
                      </div>
                      <textarea placeholder="Write your caption here..." className="w-full p-3 border border-amber-200 rounded-xl text-xs h-24 custom-scrollbar" value={newSeriesPost.caption} onChange={e => setNewSeriesPost({...newSeriesPost, caption: e.target.value})} />
                      <div className="flex gap-3 pt-2"><button onClick={() => setShowSeriesForm(false)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button onClick={handlePostSeries} className="flex-1 py-3 rounded-xl bg-[#3E2723] text-[#FDB813] font-bold uppercase text-xs hover:bg-black">{editingSeriesId ? 'Save Changes' : 'Publish'}</button></div>
                  </div>
              </div>
          </div>
      )}

      {showEventForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-2xl w-full border-b-[8px] border-[#3E2723] h-[80vh] overflow-y-auto custom-scrollbar">
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingEvent ? 'Edit Event' : 'Create Event'}</h3>
                <form onSubmit={handleAddEvent} className="space-y-4">
                    <input type="text" placeholder="Event Name" required className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newEvent.name} onChange={e => setNewEvent({...newEvent, name: e.target.value})} />
                    <input type="text" placeholder="Venue" required className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newEvent.venue} onChange={e => setNewEvent({...newEvent, venue: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="text-[10px] font-bold text-gray-500 uppercase">Start</label><div className="flex gap-2"><input type="date" required className="w-full p-3 border rounded-xl text-xs" value={newEvent.startDate} onChange={e => setNewEvent({...newEvent, startDate: e.target.value})} /><input type="time" className="w-full p-3 border rounded-xl text-xs" value={newEvent.startTime} onChange={e => setNewEvent({...newEvent, startTime: e.target.value})} /></div></div>
                        <div><label className="text-[10px] font-bold text-gray-500 uppercase">End</label><div className="flex gap-2"><input type="date" className="w-full p-3 border rounded-xl text-xs" value={newEvent.endDate} onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} /><input type="time" className="w-full p-3 border rounded-xl text-xs" value={newEvent.endTime} onChange={e => setNewEvent({...newEvent, endTime: e.target.value})} /></div></div>
                    </div>
                    <div className="flex gap-6 bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                            <input type="radio" name="scheduleType" value="WHOLE_DAY" checked={newEvent.scheduleType === 'WHOLE_DAY' || !newEvent.scheduleType} onChange={() => setNewEvent({...newEvent, scheduleType: 'WHOLE_DAY'})} className="w-4 h-4 text-amber-600 focus:ring-amber-500" /> Whole Day Event
                        </label>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                            <input type="radio" name="scheduleType" value="MULTIPLE_SHIFTS" checked={newEvent.scheduleType === 'MULTIPLE_SHIFTS'} onChange={() => setNewEvent({...newEvent, scheduleType: 'MULTIPLE_SHIFTS'})} className="w-4 h-4 text-amber-600 focus:ring-amber-500" /> More Than 1 Shift
                        </label>
                    </div>
                    <textarea placeholder="Description" className="w-full p-3 border rounded-xl text-xs h-24" value={newEvent.description} onChange={e => setNewEvent({...newEvent, description: e.target.value})} />
                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer"><input type="checkbox" checked={newEvent.registrationRequired} onChange={e => setNewEvent({...newEvent, registrationRequired: e.target.checked})} className="rounded text-amber-600 focus:ring-amber-500"/> Registration Required</label>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer"><input type="checkbox" checked={newEvent.isVolunteer} onChange={e => setNewEvent({...newEvent, isVolunteer: e.target.checked})} className="rounded text-amber-600 focus:ring-amber-500"/> Volunteer Event</label>
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-600 cursor-pointer"><input type="checkbox" checked={newEvent.attendanceRequired} onChange={e => setNewEvent({...newEvent, attendanceRequired: e.target.checked})} className="rounded text-amber-600 focus:ring-amber-500"/> Attendance Check</label>
                    </div>


                    {newEvent.scheduleType === 'MULTIPLE_SHIFTS' && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 space-y-4">
                            <h4 className="text-xs font-black uppercase text-amber-800">Define Shifts / Days</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Date</label><input type="date" className="w-full p-2 border rounded-lg text-xs" value={tempShift.date} onChange={e => setTempShift({...tempShift, date: e.target.value})} /></div>
                                <div><div className="flex justify-between items-center ml-1 mb-1"><label className="text-[10px] font-bold text-gray-500 uppercase">Session Name</label><select className="text-[9px] border-none outline-none bg-transparent text-amber-600 font-black uppercase cursor-pointer" onChange={e => { const val = e.target.value; if (val === 'AM Session') setTempShift({...tempShift, name: 'AM Session', startTime: '08:00', endTime: '12:00'}); else if (val === 'PM Session') setTempShift({...tempShift, name: 'PM Session', startTime: '13:00', endTime: '17:00'}); e.target.value = ''; }}><option value="">Quick Fill ▼</option><option value="AM Session">AM Session (8am-12nn)</option><option value="PM Session">PM Session (1pm-5pm)</option></select></div><input type="text" placeholder="e.g. AM Session" className="w-full p-2 border border-amber-200 rounded-lg text-xs font-bold" value={tempShift.name} onChange={e => setTempShift({...tempShift, name: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Start Time</label><input type="time" className="w-full p-2 border rounded-lg text-xs" value={tempShift.startTime} onChange={e => setTempShift({...tempShift, startTime: e.target.value})} /></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase ml-1">End Time</label><input type="time" className="w-full p-2 border rounded-lg text-xs" value={tempShift.endTime} onChange={e => setTempShift({...tempShift, endTime: e.target.value})} /></div>
                            </div>
                            <div className="flex gap-4 items-center bg-white p-2 rounded-lg border border-amber-200">
                                <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">Attendee Cap: <input type="number" className="p-2 border rounded-lg text-xs w-16" value={tempShift.capacity} onChange={e => setTempShift({...tempShift, capacity: parseInt(e.target.value)})} /></label>
                                {newEvent.isVolunteer && (<label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase">Volunteer Cap: <input type="number" className="p-2 border rounded-lg text-xs w-16" value={tempShift.volunteerCapacity} onChange={e => setTempShift({...tempShift, volunteerCapacity: parseInt(e.target.value)})} /></label>)}
                                <button type="button" onClick={addShift} className="ml-auto bg-amber-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase hover:bg-amber-700">Add Slot</button>
                            </div>
                            {newEvent.shifts?.length > 0 && (
                                <div className="space-y-2 mt-4 pt-4 border-t border-amber-200">
                                    {newEvent.shifts.map(s => (
                                        <div key={s.id} className="flex justify-between items-center text-xs bg-white p-3 rounded-xl border border-amber-200 shadow-sm">
                                            <div><span className="font-bold text-[#3E2723] uppercase">{s.name}</span> <span className="text-gray-500">| {s.date} ({s.startTime} - {s.endTime})</span><div className="text-[9px] text-gray-400 mt-1">Capacity: {s.capacity} Attendees {newEvent.isVolunteer ? `| ${s.volunteerCapacity} Volunteers` : ''}</div></div>
                                            <button type="button" onClick={() => removeShift(s.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                    <input type="text" placeholder="Evaluation Link (Optional)" className="w-full p-3 border rounded-xl text-xs" value={newEvent.evaluationLink} onChange={e => setNewEvent({...newEvent, evaluationLink: e.target.value})} />
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowEventForm(false); setEditingEvent(null); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">{editingEvent ? 'Update' : 'Create'}</button></div>
                </form>
            </div>
        </div>
      )}

      {showAnnounceForm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white rounded-[32px] p-8 max-w-lg w-full border-b-[8px] border-[#3E2723]">
                <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">{editingAnnouncement ? 'Edit Notice' : 'Post Notice'}</h3>
                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                    <input type="text" placeholder="Title" required className="w-full p-3 border rounded-xl text-xs font-bold uppercase" value={newAnnouncement.title} onChange={e => setNewAnnouncement({...newAnnouncement, title: e.target.value})} />
                    <textarea placeholder="Content" required className="w-full p-3 border rounded-xl text-xs h-32" value={newAnnouncement.content} onChange={e => setNewAnnouncement({...newAnnouncement, content: e.target.value})} />
                    <div className="flex gap-3 pt-2"><button type="button" onClick={() => { setShowAnnounceForm(false); setEditingAnnouncement(null); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button><button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">{editingAnnouncement ? 'Update' : 'Post'}</button></div>
                </form>
            </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden relative">
          <aside className={`bg-[#3E2723] text-amber-50 flex-col md:w-64 md:flex ${mobileMenuOpen ? 'fixed inset-0 z-50 w-64 shadow-2xl flex' : 'hidden'}`}>
            <div className="p-8 border-b border-amber-900/30 text-center"><img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-20 h-20 object-contain mx-auto mb-4" /><h1 className="font-serif font-black text-[10px] uppercase">LPU Baristas' Association</h1><p className="text-[8px] text-amber-200/30 mt-1">Hub build 24 Nov · menu v2</p></div>
            <div className="md:hidden p-4 flex justify-end absolute top-2 right-2"><button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button></div>
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
              {(() => {
                const go = (id) => { setView(id); updateLastVisited(id); setMobileMenuOpen(false); };
                const row = (item, sub) => { const active = view === item.id; const Icon = item.icon; return (
                  <button key={item.id} onClick={() => go(item.id)} className={(active ? activeMenuClass : inactiveMenuClass) + (sub ? ' !py-3 !pl-6' : '')}>
                    <Icon size={sub ? 16 : 18}/> <span className="uppercase text-[10px] font-black">{item.label}</span>
                    {item.hasNotification && (<div className="absolute right-4 top-1/2 -translate-y-1/2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-sm"></div>)}
                  </button>); };
                return (<>
                  {row({ id: 'home', label: 'Dashboard', icon: Home })}
                  {menuGroups.map(g => {
                    const hasActive = g.items.some(i => i.id === view); const isOpen = openGroups[g.id] !== undefined ? openGroups[g.id] : hasActive; const GI = g.icon; const dot = g.items.some(i => i.hasNotification);
                    return (
                      <div key={g.id}>
                        <button onClick={() => setOpenGroups(prev => ({ ...prev, [g.id]: !isOpen }))} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all text-amber-200/70 hover:bg-white/5 relative">
                          <GI size={18}/> <span className="uppercase text-[10px] font-black flex-1 text-left">{g.label}</span>
                          {dot && !isOpen && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                          <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isOpen && <div className="space-y-1 mt-1 border-l border-amber-900/40 ml-6">{g.items.map(i => row(i, true))}</div>}
                      </div>);
                  })}
                </>);
              })()}
            </nav>
            <div className="p-6 border-t border-amber-900/30 space-y-4">
                <div className="flex justify-center gap-4"><a href={SOCIAL_LINKS.facebook} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Facebook size={18} /></a><a href={SOCIAL_LINKS.instagram} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Instagram size={18} /></a><a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Music size={18} /></a><a href={gmailUrl({ to: SOCIAL_LINKS.email })} target="_blank" rel="noreferrer" className="text-amber-200/60 hover:text-[#FDB813] transition-colors"><Mail size={18} /></a></div>
                <button onClick={() => { localStorage.removeItem('lba_profile'); logout(); }} className="w-full flex items-center justify-center gap-2 text-red-400 font-black text-[10px] uppercase hover:text-red-300"><LogOut size={16} /> Exit Hub</button>
            </div>
          </aside>
          
          {mobileMenuOpen && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}></div>}

          {showGate && <VideoGate cfg={videoSettings} profile={profile} step={gateStep} stepNo={gateStep === 'intro' ? 1 : gateTotal} stepTotal={gateTotal} onAck={handleVideoAck} canSkip={isSuperAdmin} onSkip={() => setGateSkipped(true)} />}
          <main className="flex-1 overflow-y-auto p-4 md:p-10 relative custom-scrollbar">
            <ErrorBoundary resetKey={view}>
                <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4"><button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-[#3E2723]"><Menu size={24}/></button><h2 className="font-serif text-3xl font-black uppercase text-[#3E2723]">KAPErata Hub</h2></div>
                <div onClick={() => setView('settings')} className="bg-white p-2 pr-6 rounded-full border border-amber-100 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-amber-50 transition-colors" title="Edit Profile"><img src={getDirectLink(profile.photoUrl) || `https://ui-avatars.com/api/?name=${profile.name}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover" /><div className="hidden sm:block"><p className="text-[10px] font-black uppercase text-[#3E2723]">{profile.nickname || profile.name.split(' ')[0]} {isSuperAdmin && <ShieldCheck size={10} className="inline text-amber-500"/>}</p><p className="text-[8px] font-black text-amber-500 uppercase">{profile.specificTitle}</p></div></div>
                </header>

                {view === 'home' && (
                  <div className="space-y-10 animate-fadeIn">
                    <div className="text-center mb-8"><h2 className="font-serif text-3xl md:text-4xl font-black uppercase text-[#3E2723] mb-2 tracking-wide">WELCOME TO THE KAPERATA HUB!</h2><p className="text-amber-700/80 font-bold uppercase text-xs md:text-sm tracking-widest max-w-xl mx-auto">Your go-to space for updates, announcements, and everything brewing in the KAPErata community. ☕✨</p>
                      <div className="flex flex-wrap justify-center gap-3 mt-5"><button onClick={() => setView('manual')} className="flex items-center gap-2 bg-white border border-amber-200 hover:bg-amber-50 text-[#3E2723] px-4 py-2 rounded-full shadow-sm text-[10px] font-black uppercase"><BookOpen size={14} className="text-amber-500"/> User Manual</button><button onClick={() => setView('videos')} className="flex items-center gap-2 bg-white border border-amber-200 hover:bg-amber-50 text-[#3E2723] px-4 py-2 rounded-full shadow-sm text-[10px] font-black uppercase"><Play size={14} className="text-amber-500"/> Orientation Videos</button><button onClick={() => setView('feedback')} className="flex items-center gap-2 bg-white border border-amber-200 hover:bg-amber-50 text-[#3E2723] px-4 py-2 rounded-full shadow-sm text-[10px] font-black uppercase"><Smile size={14} className="text-amber-500"/> Give Feedback</button></div></div>

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
                                {profile.status === 'active' && (<div className="flex-1 py-3 rounded-xl font-black uppercase text-xs bg-[#FDB813] text-[#3E2723] flex items-center justify-center gap-2 shadow-lg"><Coffee size={14}/> 10% Off B&apos;Cafe</div>)}
                            </div>
                            <p className="text-[8px] font-bold uppercase text-white/40 mt-6">Valid for AY {profile.lastRenewedSY || new Date().getFullYear()} &bull; Non-Transferable</p>
                        </div>
                    </div>

                    {profile.status === 'expired' && profile.paymentStatus !== 'pending' && (
                        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl mb-6 shadow-md">
                            <div className="flex items-start justify-between"><div><h3 className="text-xl font-black uppercase text-red-700 flex items-center gap-2"><AlertCircle size={24}/> Membership Expired</h3><p className="text-sm text-red-800 mt-2 font-medium">Your membership access is currently limited. Please settle your full membership fee to reactivate your account and restore full access to all features.</p></div><div className="text-right"><span className="bg-red-200 text-red-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">Status: Expired</span></div></div>
                            {profile.paymentDetails && profile.paymentDetails.status === 'rejected' && <p className="mt-4 text-xs font-bold text-red-700">Your last GCash payment was not confirmed{profile.paymentDetails.rejectedReason ? ': ' + profile.paymentDetails.rejectedReason : ''}. Please check the reference number and try again, or pay in cash to an officer.</p>}
                            <div className="mt-6 bg-white p-6 rounded-2xl border border-red-100">
                                <h4 className="text-sm font-black uppercase text-gray-700 mb-4">Renewal Payment</h4>
                                <p className="text-xs text-gray-500 mb-4">Please send the full membership fee via GCash to the number below, then enter your Reference Number to verify.</p>
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="bg-blue-50 p-4 rounded-xl text-center w-full md:w-auto"><p className="text-[10px] font-black uppercase text-blue-800">{hubSettings.allowedPayment === 'gcash_only' ? 'GCash Only' : 'GCash Number'}</p><p className="text-lg font-black text-blue-900">+63{hubSettings.gcashNumber || '9063751402'}</p></div>
                                    <form onSubmit={handleRenewalPayment} className="flex-1 w-full flex flex-col gap-3">
                                        {hubSettings.allowedPayment !== 'gcash_only' && (<div className="flex gap-2"><button type="button" onClick={() => setRenewalMethod('gcash')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${renewalMethod === 'gcash' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-200 text-gray-500'}`}>GCash</button><button type="button" onClick={() => setRenewalMethod('cash')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${renewalMethod === 'cash' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}>Cash</button></div>)}
                                        {(hubSettings.allowedPayment === 'gcash_only' || renewalMethod === 'gcash') ? (<>
                                            <input type="text" required placeholder="13-digit GCash Reference No." className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" value={renewalRef} onChange={(e) => setRenewalRef(e.target.value)} />
                                            <input type="text" required placeholder="Name of the GCash sender" className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none" value={renewalPayer} onChange={(e) => setRenewalPayer(e.target.value)} />
                                            <div><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Date you paid</label><input type="date" required max={new Date().toISOString().slice(0, 10)} className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:border-red-500" value={renewalPayDate} onChange={(e) => setRenewalPayDate(e.target.value)} /></div>
                                            <p className="text-[10px] text-gray-500 font-bold">An officer confirms every GCash payment against the GCash records. Your access stays limited until then.</p>
                                        </>) : (<><div className="text-xs bg-green-50 p-3 rounded-lg text-green-900">Pay an officer in cash to get the Daily Cash Key.</div><input type="text" required placeholder="Enter Daily Cash Key" className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase outline-none focus:border-red-500" value={renewalCashKey} onChange={(e) => setRenewalCashKey(e.target.value.toUpperCase())} /></>)}
                                        <button type="submit" className="bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-red-700 transition-colors shadow-lg">Reactivate</button></form>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {profile.paymentStatus === 'pending' && (<div className="border-l-4 border-amber-500 bg-amber-50 p-6 rounded-r-xl mb-6"><h3 className="text-xl font-black uppercase text-amber-800 flex items-center gap-2"><Banknote size={24}/> Payment Waiting for Confirmation</h3><p className="text-sm text-amber-900 mt-2 font-medium">We received your GCash payment details (Ref. {profile.paymentDetails?.refNo || ''}). An officer will confirm it against the GCash records. Until then your access is limited: you can browse, but you cannot join events, vote, post or apply.</p></div>)}
                    {!isExpired && profile.paymentStatus !== 'pending' && hubSettings.renewalMode && !isExemptFromRenewal && (
                        <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-xl mb-6 shadow-md animate-slideIn">
                             <div className="flex items-start justify-between"><div><h3 className="text-xl font-black uppercase text-orange-700 flex items-center gap-2"><RefreshCcw size={24}/> Renewal Period Open</h3><p className="text-sm text-orange-800 mt-2 font-medium">Please renew your membership within the 15-day period to avoid expiration.</p></div><div className="text-right"><span className="bg-orange-200 text-orange-800 px-3 py-1 rounded-full text-[10px] font-black uppercase">Action Required</span></div></div>
                            <div className="mt-6 bg-white p-6 rounded-2xl border border-orange-100">
                                 <h4 className="text-sm font-black uppercase text-gray-700 mb-4">Renew Membership</h4>
                                 <div className="flex flex-col gap-4">
                                     {hubSettings.allowedPayment !== 'gcash_only' && (<div className="flex gap-2"><button type="button" onClick={() => setRenewalMethod('gcash')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${renewalMethod === 'gcash' ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-white border-gray-200 text-gray-500'}`}>GCash</button><button type="button" onClick={() => setRenewalMethod('cash')} className={`flex-1 py-2 text-xs font-bold rounded-lg border ${renewalMethod === 'cash' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-white border-gray-200 text-gray-500'}`}>Cash</button></div>)}
                                     <form onSubmit={handleRenewalPayment} className="flex flex-col gap-3">
                                         {(hubSettings.allowedPayment === 'gcash_only' || renewalMethod === 'gcash') ? (<div className="space-y-3"><div className="text-xs bg-blue-50 p-3 rounded-lg text-blue-900"><strong>Send to:</strong> 0{hubSettings.gcashNumber || '9063751402'} (GCash)</div><input type="text" required placeholder="13-digit GCash Reference No." className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase outline-none focus:border-orange-500" value={renewalRef} onChange={(e) => setRenewalRef(e.target.value)} /><input type="text" required placeholder="Name of the GCash sender" className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase outline-none focus:border-orange-500" value={renewalPayer} onChange={(e) => setRenewalPayer(e.target.value)} /><div><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Date you paid</label><input type="date" required max={new Date().toISOString().slice(0, 10)} className="w-full p-3 border border-gray-300 rounded-xl text-xs outline-none focus:border-orange-500" value={renewalPayDate} onChange={(e) => setRenewalPayDate(e.target.value)} /></div><p className="text-[10px] text-gray-500 font-bold">An officer confirms GCash payments against the GCash records. Access stays limited until then.</p></div>) : (<div className="space-y-3"><div className="text-xs bg-green-50 p-3 rounded-lg text-green-900">Pay to an officer to get the Daily Cash Key.</div><input type="text" required placeholder="Enter Daily Cash Key" className="w-full p-3 border border-gray-300 rounded-xl text-xs uppercase outline-none focus:border-orange-500" value={renewalCashKey} onChange={(e) => setRenewalCashKey(e.target.value.toUpperCase())} /></div>)}
                                         <button type="submit" className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-orange-700 transition-colors shadow-lg">Confirm Renewal</button>
                                     </form>
                                 </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-4">
                        {isBirthday && (<div className="bg-gradient-to-r from-pink-500 to-rose-500 p-8 rounded-[40px] shadow-xl flex items-center gap-6 relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><Cake size={120} /></div><div className="bg-white/20 p-4 rounded-full text-white"><Cake size={40} /></div><div className="text-white z-10"><h3 className="font-serif text-3xl font-black uppercase">Happy Birthday!</h3><p className="font-medium text-white/90">Wishing you the happiest of days, {profile.nickname || profile.name.split(' ')[0]}! 🎂</p></div></div>)}
                        {isAnniversary && (<div className="bg-gradient-to-r from-[#FDB813] to-amber-500 p-8 rounded-[40px] shadow-xl flex items-center gap-6 relative overflow-hidden"><div className="absolute top-0 right-0 p-8 opacity-10"><Sparkles size={120} /></div><div className="bg-white/20 p-4 rounded-full text-white"><Sparkles size={40} /></div><div className="text-white z-10"><h3 className="font-serif text-3xl font-black uppercase">Happy Anniversary, LBA!</h3><p className="font-medium text-white/90">Celebrating another year of brewing excellence and community. ☕✨</p></div></div>)}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-3 space-y-6">
                            <div>
                                <h3 className="font-serif text-xl font-black uppercase text-[#3E2723] mb-4 flex items-center gap-2"><Bell size={20} className="text-amber-600"/> Latest Notices</h3>
                                <div className="space-y-4">
                                {announcements.length === 0 ? 
                                    <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center"><p className="text-xs font-bold text-gray-400 uppercase">All caught up!</p><p className="text-[10px] text-gray-300">No new notices to display.</p></div>
                                : announcements.slice(0, 2).map(ann => (
                                    <div key={ann.id} className="bg-white p-6 rounded-3xl border border-amber-100 shadow-sm relative group hover:shadow-md transition-shadow">
                                        {isOfficer && (<div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"><button onClick={() => handleEditAnnouncement(ann)} className="p-2 bg-white rounded-full text-amber-500 hover:text-amber-600 hover:bg-amber-50 shadow-sm" title="Edit"><Pen size={14}/></button><button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 bg-white rounded-full text-red-500 hover:text-red-600 hover:bg-red-50 shadow-sm" title="Delete"><Trash2 size={14}/></button></div>)}
                                        <div className="flex justify-between items-start mb-2"><h4 className="font-black text-sm uppercase text-[#3E2723] pr-16">{isRecentPost(ann) && <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full mr-2 align-middle">NEW</span>}{ann.title}</h4><span className="text-[8px] font-bold text-gray-400 uppercase">{formatDate(ann.date)}</span></div>
                                        <p className="text-xs text-gray-600 line-clamp-2">{ann.content}</p>
                                    </div>
                                ))}
                                </div>
                            </div>
                            <div>
                                <h3 className="font-serif text-xl font-black uppercase text-[#3E2723] mb-4 flex items-center gap-2"><Calendar size={20} className="text-amber-600"/> Upcoming Events</h3>
                                <div className="space-y-4">
                                {events.length === 0 ? 
                                    <div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center"><Calendar size={24} className="mx-auto text-gray-300 mb-2"/><p className="text-xs font-bold text-gray-400 uppercase">No upcoming events</p><p className="text-[10px] text-gray-300">Stay tuned for future updates!</p></div>
                                : events.slice(0, 3).map(ev => {
                                    const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                                    return (
                                        <div key={ev.id} className="bg-white p-4 rounded-3xl border border-amber-100 flex items-center gap-4 hover:shadow-md transition-shadow relative group">
                                            {isOfficer && (<div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"><button onClick={() => handleEditEvent(ev)} className="p-2 bg-white rounded-full text-amber-500 hover:text-amber-600 hover:bg-amber-50 shadow-sm" title="Edit"><Pen size={12}/></button></div>)}
                                            <div className="bg-[#3E2723] text-[#FDB813] w-12 h-12 rounded-xl flex flex-col items-center justify-center font-black leading-tight shrink-0"><span className="text-xs font-black">{day}</span><span className="text-[8px] uppercase">{month}</span></div>
                                            <div className="min-w-0 pr-12"><h4 className="font-black text-xs uppercase truncate">{ev.name}</h4><p className="text-[10px] text-gray-500 truncate">{ev.venue} • {ev.startTime}</p></div>
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                        </div>

                        {/* Badges */}
                        <div className="bg-white p-6 md:p-8 rounded-[32px] border border-amber-100 lg:col-span-3">
                            {(() => { const rows = (badgeDefs || []).map(b => ({ b, st: badgeStatus(b) })); const got = rows.filter(r => r.st.earned).length; const manualNames = (badgeDefs || []).filter(b => b.kind === 'manual').map(b => String(b.name).trim().toLowerCase()); const extra = (Array.isArray(profile.accolades) ? profile.accolades : []).filter(a => !manualNames.includes(String(a).trim().toLowerCase())); return (<>
                                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-6"><div><h3 className="font-black text-sm uppercase text-[#3E2723] flex items-center gap-2"><Trophy size={16} className="text-amber-500"/> Badges</h3><p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Each badge shows what it is for and how to earn it.</p></div><span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 px-3 py-1 rounded-full self-start">{got} of {rows.length} earned</span></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {rows.map(({ b, st }) => (
                                        <div key={b.id} className={`flex items-start gap-4 p-4 rounded-2xl border ${st.earned ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-100'}`}>
                                            <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center text-3xl ${st.earned ? 'bg-white shadow-sm' : 'bg-gray-100 grayscale opacity-50'}`}>{b.icon}</div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap"><p className={`font-black text-xs uppercase ${st.earned ? 'text-[#3E2723]' : 'text-gray-500'}`}>{b.name}</p>{st.earned ? <span className="text-[8px] font-black uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Earned</span> : <span className="text-[8px] font-black uppercase bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1"><Lock size={8}/> Locked</span>}</div>
                                                <p className="text-[10px] font-bold text-gray-500 mt-1 leading-snug"><span className="uppercase text-amber-600">How to earn: </span>{b.desc}</p>
                                                {!st.earned && st.note && <p className="text-[9px] font-black uppercase text-amber-700 mt-1">{st.note}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {extra.length > 0 && (<div className="mt-6"><p className="text-[10px] font-black uppercase text-gray-400 mb-2">Special recognition</p><div className="flex flex-wrap gap-2">{extra.map((a, i) => (<span key={i} className="bg-purple-50 text-purple-800 border border-purple-100 px-3 py-1.5 rounded-full text-[10px] font-black uppercase">🏆 {a}</span>))}</div></div>)}
                            </>); })()}
                        </div>
                    </div>
                  </div>
                )}

            {view === 'about' && (
                <div className="space-y-8 animate-fadeIn text-[#3E2723]">
                    {legacyContent.imageUrl && (<div className="w-full h-64 md:h-80 rounded-[40px] overflow-hidden mb-8 shadow-xl"><img src={getDirectLink(legacyContent.imageUrl)} alt="Legacy Banner" className="w-full h-full object-cover" /></div>)}
                    <div className="bg-white p-8 rounded-[40px] shadow-sm border-t-[8px] border-[#3E2723]">
                        <h3 className="font-serif text-4xl font-black uppercase mb-4">Our Legacy</h3>
                        {isEditingLegacy ? (
                            <div className="space-y-4">
                                <textarea className="w-full p-4 border rounded-xl" rows="6" value={legacyForm.body} onChange={e => setLegacyForm({ ...legacyForm, body: e.target.value })} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><input type="text" placeholder="Banner Image URL" className="p-3 border rounded-xl text-xs" value={legacyForm.imageUrl || ''} onChange={e => setLegacyForm({ ...legacyForm, imageUrl: e.target.value })} /><input type="text" placeholder="Gallery Folder Link" className="p-3 border rounded-xl text-xs" value={legacyForm.galleryUrl || ''} onChange={e => setLegacyForm({ ...legacyForm, galleryUrl: e.target.value })} /></div>
                                <div className="flex gap-2"><input type="date" className="p-3 border rounded-xl" value={legacyForm.establishedDate || ''} onChange={e => setLegacyForm({ ...legacyForm, establishedDate: e.target.value })} /><button onClick={handleSaveLegacy} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold uppercase">Save Changes</button><button onClick={() => setIsEditingLegacy(false)} className="bg-gray-200 text-gray-600 px-6 py-2 rounded-xl font-bold uppercase">Cancel</button></div>
                            </div>
                        ) : (
                            <div>
                                <p className="text-lg leading-relaxed whitespace-pre-wrap font-medium text-gray-700">{legacyContent.body}</p>
                                {legacyContent.galleryUrl && (<a href={legacyContent.galleryUrl} target="_blank" rel="noreferrer" className="inline-block mt-4 text-amber-600 font-bold underline">View Photo Gallery</a>)}
                                {isOfficer && <button onClick={() => setIsEditingLegacy(true)} className="block mt-4 text-amber-600 text-xs font-bold uppercase hover:underline">Edit Story</button>}
                            </div>
                        )}
                    </div>
                    <div className="bg-[#3E2723] text-white p-8 rounded-[40px]">
                        <h3 className="font-serif text-2xl font-black uppercase mb-6 text-[#FDB813]">Milestones</h3>
                        <div className="space-y-6 border-l-2 border-[#FDB813] pl-6 ml-2">
                            {legacyContent.achievements?.map((ach, i) => (<div key={i} className="relative"><div className="absolute -left-[31px] top-1 w-4 h-4 bg-[#FDB813] rounded-full border-2 border-[#3E2723]"></div><span className="text-xs font-bold text-amber-200/60 uppercase tracking-widest">{ach.date}</span><p className="font-bold text-lg">{ach.text}</p></div>))}
                        </div>
                    </div>
                </div>
            )}

            {view === 'masterclass' && (
                <div className="space-y-8 animate-fadeIn text-[#3E2723]">
                    <div className="relative overflow-hidden rounded-[40px] bg-[#3E2723] text-[#FDB813] p-10 md:p-16 text-center shadow-2xl border-4 border-[#FDB813]">
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                        <div className="relative z-10 flex flex-col items-center gap-4">
                            <GraduationCap size={56} />
                            <span className="bg-[#FDB813] text-[#3E2723] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.3em]">Coming Soon</span>
                            <h3 className="font-serif text-4xl md:text-6xl font-black uppercase tracking-wide">Barista Training Academy</h3>
                            <p className="text-amber-100/80 font-bold text-xs md:text-sm uppercase tracking-widest max-w-xl">Hands-on coffee training with different certification levels. Still in planning and discussion with the officers.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[['📚', 'Structured training', 'Lessons from coffee basics to advanced brewing.'], ['🎖️', 'Certifications', 'Different certification levels you can earn.'], ['🤝', 'Led by LBA', 'Trainings run by our officers and trained members.']].map(([ic, t, d]) => (<div key={t} className="bg-white p-6 rounded-[28px] border border-amber-100 text-center"><div className="text-3xl mb-2">{ic}</div><p className="font-black text-xs uppercase">{t}</p><p className="text-[11px] text-gray-500 font-bold mt-1">{d}</p></div>))}
                    </div>
                    <p className="text-center text-[11px] font-bold text-gray-500 uppercase">Details will be announced in the Grind Report. Your past Masterclass attendance is safely kept.</p>
                    {isOfficer && (
                        <details className="bg-white rounded-[28px] border border-amber-100 p-6">
                            <summary className="cursor-pointer font-black uppercase text-xs">Officers: saved Masterclass attendance records</summary>
                            <div className="mt-4 space-y-4">
                                {DEFAULT_MASTERCLASS_MODULES.map(mod => { const ids = masterclassData.moduleAttendees?.[mod.id] || []; const details = masterclassData.moduleDetails?.[mod.id] || {}; return (<div key={mod.id}><p className="text-[10px] font-black uppercase text-amber-700">Module {mod.id}: {details.title || mod.title} ({ids.length})</p><p className="text-[11px] text-gray-600 font-bold mt-1">{ids.length ? ids.map(id => { const m = (members || []).find(x => x && x.memberId === id); return m ? m.name : id; }).join(', ') : 'No attendees recorded.'}</p></div>); })}
                            </div>
                        </details>
                    )}
                </div>
            )}

            {view === 'team' && (
                <div className="space-y-16 animate-fadeIn text-center pb-20">
                    <div><h3 className="font-serif text-5xl font-black uppercase text-[#3E2723] mb-2">The Brew Crew</h3><p className="text-amber-600 text-sm font-bold uppercase tracking-widest">Executive Committee {getMemberIdMeta().sy}</p></div>
                    {teamStructure.tier1.length > 0 && (<div className="flex justify-center">{teamStructure.tier1.map(m => <MemberCard key={m.id} m={m} />)}</div>)}
                    {teamStructure.tier2.length > 0 && (<div className="flex justify-center gap-6 flex-wrap">{teamStructure.tier2.map(m => <MemberCard key={m.id} m={m} />)}</div>)}
                    {teamStructure.tier3.length > 0 && (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">{teamStructure.tier3.map(m => <MemberCard key={m.id} m={m} />)}</div>)}
                    <div className="border-t-[4px] border-[#3E2723]/10 pt-16 space-y-20">
                        <div className="text-center mb-10"><h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Committee Departments</h3><p className="text-amber-600 text-xs font-bold uppercase tracking-widest mt-2">The Backbone of LBA</p></div>
                        {COMMITTEES_INFO.map(c => {
                            const group = teamStructure.committees[c.id];
                            if (!group || (group.heads.length === 0 && group.members.length === 0)) return null;
                            return (
                                <div key={c.id} className="bg-white p-10 rounded-[48px] border-2 border-amber-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 right-0 h-32 bg-[#3E2723] opacity-5"></div>
                                    <div className="relative z-10 mb-10"><h3 className="font-serif text-3xl font-black uppercase text-[#3E2723] mb-2">{c.title}</h3><p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-2xl mx-auto">{c.description}</p></div>
                                    {group.heads.length > 0 && (<div className="mb-12 relative z-10"><span className="inline-block bg-[#FDB813] text-[#3E2723] px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-amber-200">Department Heads</span><div className="flex flex-wrap justify-center gap-6 mt-6">{group.heads.map(m => <MemberCard key={m.id} m={m} />)}</div></div>)}
                                    {group.members.length > 0 && (<div className="relative z-10"><span className="inline-block bg-gray-100 text-gray-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">Committee Members</span><div className="flex flex-wrap justify-center gap-6 mt-6">{group.members.map(m => <MemberCard key={m.id} m={m} />)}</div></div>)}
                                </div>
                            );
                        })}
                        {(teamStructure.committees['Unassigned']?.heads.length > 0 || teamStructure.committees['Unassigned']?.members.length > 0) && (
                             <div className="bg-gray-50 p-10 rounded-[48px] border border-gray-200"><h3 className="font-serif text-2xl font-black uppercase text-gray-500 mb-8">General Pool (Unassigned)</h3><div className="flex flex-wrap justify-center gap-6">{[...teamStructure.committees['Unassigned'].heads, ...teamStructure.committees['Unassigned'].members].map(m => <MemberCard key={m.id} m={m} />)}</div></div>
                        )}
                    </div>
                </div>
            )}

            {view === 'events' && (
                <div className="space-y-6 animate-fadeIn">
                     <div className="flex justify-between items-center">
                        <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">What's Brewing?</h3>
                        {isCommitteePlus && <button onClick={() => { setEditingEvent(null); setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, registrationRequired: true, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' }); setShowEventForm(true); }} className="bg-[#3E2723] text-[#FDB813] px-4 py-3 rounded-2xl shadow-md hover:bg-black transition-colors font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> New Event</button>}
                    </div>
                    <div className="space-y-4">
                        {events.length === 0 ? (
                            <div className="p-10 bg-white rounded-[32px] border border-dashed border-amber-200 text-center"><Calendar size={32} className="mx-auto text-amber-300 mb-3"/><p className="text-sm font-black text-amber-900 uppercase">No upcoming events</p><p className="text-xs text-amber-700/60 mt-1">Stay tuned for future updates!</p></div>
                        ) : (
                            events.map(ev => {
                                const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                                return (
                                    <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                         {isCommitteePlus && (<div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"><button onClick={() => handleEditEvent(ev)} className="p-2 bg-white border border-amber-100 rounded-xl text-amber-600 hover:bg-amber-50 shadow-sm" title="Edit Event"><Pen size={14}/></button><button onClick={() => handleDeleteEvent(ev.id)} className="p-2 bg-white border border-red-100 rounded-xl text-red-600 hover:bg-red-50 shadow-sm" title="Delete Event"><Trash2 size={14}/></button></div>)}
                                         <div className="flex flex-col sm:flex-row gap-6">
                                            <div className="bg-[#3E2723] text-[#FDB813] w-24 h-24 rounded-2xl flex flex-col items-center justify-center font-black leading-none shrink-0 shadow-inner"><span className="text-3xl">{day}</span><span className="text-xs uppercase mt-2 tracking-widest">{month}</span></div>
                                            <div className="flex-1">
                                                <div className="pr-24">
                                                    <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723]">{ev.name}</h4>
                                                    {false && ev.masterclassModuleIds && ev.masterclassModuleIds.length > 0 && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {ev.masterclassModuleIds.map(mid => (
                                                                <button key={mid} onClick={() => setView('masterclass')} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 hover:bg-purple-200 transition-colors shadow-sm"><GraduationCap size={10}/> Masterclass Module {mid}</button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs font-bold text-amber-700 uppercase mt-3 flex items-center gap-2 flex-wrap">
                                                    <MapPin size={12}/> {ev.venue} • <Clock size={12}/> {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}
                                                    {ev.scheduleType === 'MULTIPLE_SHIFTS' && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[8px] tracking-wider ml-1">MULTIPLE SHIFTS</span>}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{ev.description}</p>
                                                
                                                {ev.scheduleType === 'MULTIPLE_SHIFTS' ? (
                                                    <div className="w-full mt-6 space-y-2 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                                        <h5 className="text-[10px] font-black uppercase text-gray-500 mb-3 border-b pb-2">Available Slots</h5>
                                                        {ev.shifts?.map(shift => {
                                                            const isAttending = shift.attendees?.includes(profile.memberId);
                                                            const isVolunteering = shift.volunteers?.includes(profile.memberId);
                                                            return (
                                                                <div key={shift.id} className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-3 rounded-xl border border-gray-200 gap-3 shadow-sm">
                                                                    <div>
                                                                        <p className="text-xs font-bold text-[#3E2723] uppercase">{shift.name}</p>
                                                                        <p className="text-[9px] text-gray-500 uppercase mt-1 flex items-center gap-1"><Calendar size={10}/> {formatDate(shift.date)} • <Clock size={10}/> {shift.startTime} - {shift.endTime}</p>
                                                                    </div>
                                                                    <div className="flex flex-wrap gap-2 w-full xl:w-auto">
                                                                        {ev.registrationRequired && (
                                                                            <button onClick={() => handleShiftRegistration(ev, shift.id, 'attendee')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg font-black uppercase text-[9px] transition-all ${isAttending ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-white border border-amber-200 text-amber-700 hover:bg-amber-50'}`}>
                                                                                {isAttending ? 'Registered ✓' : `Join (${shift.attendees?.length || 0}/${shift.capacity})`}
                                                                            </button>
                                                                        )}
                                                                        {ev.isVolunteer && (
                                                                            <button onClick={() => handleShiftRegistration(ev, shift.id, 'volunteer')} className={`flex-1 xl:flex-none px-4 py-2 rounded-lg font-black uppercase text-[9px] transition-all ${isVolunteering ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100'}`}>
                                                                                {isVolunteering ? 'Volunteering ✓' : `Volunteer (${shift.volunteers?.length || 0}/${shift.volunteerCapacity})`}
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                        {isCommitteePlus && ev.attendanceRequired && (<button onClick={() => setAttendanceEvent(ev)} className="w-full mt-2 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-black uppercase text-[10px] hover:bg-indigo-200 transition-colors flex justify-center items-center gap-2 border border-indigo-200"><ClipboardList size={14}/> Open Attendance</button>)}
                                                    </div>
                                                ) : (
                                                    <div className="mt-6 flex flex-wrap gap-3">
                                                        {ev.registrationRequired && (<button onClick={() => handleRegisterEvent(ev)} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all shadow-sm ${ev.registered?.includes(profile.memberId) ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-[#FDB813] text-[#3E2723] hover:bg-amber-400'}`}>{ev.registered?.includes(profile.memberId) ? 'Registered ✓' : 'Register Now'}</button>)}
                                                        {isCommitteePlus && ev.attendanceRequired && (<button onClick={() => setAttendanceEvent(ev)} className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-black uppercase text-[10px] hover:bg-indigo-200 transition-colors flex items-center gap-2 border border-indigo-200"><ClipboardList size={14}/> Open Attendance</button>)}
                                                    </div>
                                                )}
                                                
                                                {ev.evaluationLink && <a href={ev.evaluationLink} target="_blank" rel="noreferrer" className="inline-block mt-4 text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200">📝 Post-Event Evaluation</a>}
                                            </div>
                                          </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {view === 'announcements' && (
                <div className="space-y-6 animate-fadeIn">
                     <div className="flex justify-between items-center">
                        <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Grind Report</h3>
                        {isCommitteePlus && <button onClick={() => { setEditingAnnouncement(null); setNewAnnouncement({ title: '', content: '' }); setShowAnnounceForm(true); }} className="bg-[#3E2723] text-[#FDB813] px-4 py-3 rounded-2xl shadow-md hover:bg-black transition-colors font-black uppercase text-[10px] flex items-center gap-2"><Plus size={16}/> New Notice</button>}
                    </div>
                    {announcements.length === 0 ? (
                        <div className="p-10 bg-white rounded-[32px] border border-dashed border-amber-200 text-center"><Bell size={32} className="mx-auto text-amber-300 mb-3"/><p className="text-sm font-black text-amber-900 uppercase">All caught up!</p><p className="text-xs text-amber-700/60 mt-1">No new notices to display.</p></div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {announcements.map(ann => (
                                <div key={ann.id} className="bg-yellow-50 p-8 rounded-[32px] border border-yellow-200 shadow-sm relative group hover:shadow-md transition-shadow">
                                    {isCommitteePlus && (<div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditAnnouncement(ann)} className="p-2 bg-white rounded-xl text-amber-600 border border-amber-100 hover:bg-amber-50 shadow-sm" title="Edit"><Pen size={14}/></button><button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-2 bg-white rounded-xl text-red-600 border border-red-100 hover:bg-red-50 shadow-sm" title="Delete"><Trash2 size={14}/></button></div>)}
                                    {isRecentPost(ann) && <span className="inline-block bg-red-500 text-white px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 mr-2">New</span>}<span className="inline-block bg-[#FDB813] px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#3E2723] mb-4 shadow-sm">{formatDate(ann.date)}</span>
                                    <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-3 pr-20 leading-tight">{ann.title}</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === 'feedback' && (() => {
                const cats = ['Suggestion', 'Bug / Problem', 'Compliment', 'Other']; const stat = { new: 'bg-red-100 text-red-700', reviewed: 'bg-blue-100 text-blue-700', planned: 'bg-purple-100 text-purple-700', done: 'bg-green-100 text-green-700' };
                const rated = feedbackList.filter(f => f.rating); const avg = rated.length ? (rated.reduce((a, f) => a + Number(f.rating), 0) / rated.length).toFixed(1) : '—';
                const shown = feedbackList.filter(f => fbFilter === 'all' || (f.status || 'new') === fbFilter);
                return (
                <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto text-[#3E2723]">
                    <div className="text-center"><h3 className="font-serif text-4xl font-black uppercase">App Feedback</h3><p className="text-gray-500 font-bold text-xs uppercase">Tell us what to fix, add or keep.</p></div>
                    <form onSubmit={handleSubmitFeedback} className="bg-white p-6 md:p-8 rounded-[32px] border border-amber-100 space-y-4">
                        <div><p className="text-[10px] font-black uppercase text-gray-400 mb-2">How is the Hub for you?</p><div className="flex gap-1">{[1, 2, 3, 4, 5].map(n => (<button key={n} type="button" onClick={() => setFbForm({ ...fbForm, rating: n })} className={`text-4xl leading-none transition-transform hover:scale-110 ${n <= fbForm.rating ? 'text-[#FDB813]' : 'text-gray-200'}`} aria-label={`${n} star${n > 1 ? 's' : ''}`}>★</button>))}</div></div>
                        <div className="flex flex-wrap gap-2">{cats.map(c => (<button key={c} type="button" onClick={() => setFbForm({ ...fbForm, category: c })} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${fbForm.category === c ? 'bg-[#3E2723] text-[#FDB813]' : 'bg-amber-50 text-amber-900'}`}>{c}</button>))}</div>
                        <textarea required placeholder="What would make the Hub better? Tell us what you like, what is confusing, or what is broken." className="w-full p-4 border border-amber-200 rounded-2xl text-xs h-32 outline-none focus:border-amber-500" value={fbForm.message} onChange={e => setFbForm({ ...fbForm, message: e.target.value })} />
                        <label className="flex items-center gap-2 text-[11px] font-bold text-gray-500 cursor-pointer"><input type="checkbox" checked={fbForm.anonymous} onChange={e => setFbForm({ ...fbForm, anonymous: e.target.checked })} /> Hide my name from the list officers see</label>
                        <button type="submit" disabled={fbBusy} className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-xs hover:bg-black disabled:opacity-50">{fbBusy ? 'Sending...' : 'Send Feedback'}</button>
                    </form>
                    {isOfficer && (<div className="grid grid-cols-3 gap-3">{[['Total', feedbackList.length], ['Average rating', avg + (rated.length ? ' ★' : '')], ['New', newFeedbackCount]].map(([l, v]) => (<div key={l} className="bg-white p-4 rounded-2xl border border-amber-100 text-center"><p className="text-2xl font-black">{v}</p><p className="text-[9px] font-black uppercase text-gray-500">{l}</p></div>))}</div>)}
                    {isOfficer && (<div className="flex gap-2 flex-wrap">{[['all', 'All'], ['new', 'New'], ['reviewed', 'Reviewed'], ['planned', 'Planned'], ['done', 'Done']].map(([k, l]) => (<button key={k} onClick={() => setFbFilter(k)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${fbFilter === k ? 'bg-amber-500 text-white' : 'bg-white border border-amber-100 text-amber-900'}`}>{l}</button>))}</div>)}
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-gray-400">{isOfficer ? 'Member feedback' : 'Your feedback'}</p>
                        {shown.length === 0 && <div className="bg-white p-6 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400 font-bold uppercase">{isOfficer ? 'No feedback yet.' : 'You have not sent any feedback yet.'}</div>}
                        {shown.map(f => (<div key={f.id} className="bg-white p-5 rounded-2xl border border-amber-100">
                            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[#FDB813] text-lg leading-none">{'★'.repeat(Number(f.rating) || 0)}<span className="text-gray-200">{'★'.repeat(5 - (Number(f.rating) || 0))}</span></p><p className="text-[9px] font-black uppercase text-gray-400 mt-1">{f.category}{isOfficer ? ' · ' + (f.anonymous ? 'Anonymous' : (f.name || f.memberId)) : ''}</p></div><span className={`text-[8px] font-black uppercase px-3 py-1 rounded-full ${stat[f.status || 'new']}`}>{f.status || 'new'}</span></div>
                            <p className="text-xs font-medium mt-3 whitespace-pre-wrap">{f.message}</p>
                            {isOfficer && (<div className="flex items-center gap-2 mt-4 flex-wrap"><select value={f.status || 'new'} onChange={e => handleFeedbackStatus(f, e.target.value)} className="p-2 border border-amber-200 rounded-lg text-[10px] font-black uppercase"><option value="new">New</option><option value="reviewed">Reviewed</option><option value="planned">Planned</option><option value="done">Done</option></select><button onClick={() => handleDeleteFeedback(f)} className="ml-auto text-[10px] font-black uppercase text-red-500 hover:underline">Delete</button></div>)}
                        </div>))}
                    </div>
                </div>); })()}

            {view === 'members_corner' && (
                <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto">
                    <div className="text-center mb-8"><h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Member's Corner</h3><p className="text-gray-500 font-bold text-xs uppercase">Your voice, your vote, your community.</p></div>
                    <div className="bg-[#3E2723] text-[#FDB813] p-6 rounded-[28px] flex flex-col sm:flex-row sm:items-center gap-4 justify-between"><div><p className="font-black uppercase text-sm flex items-center gap-2"><Smile size={18}/> Help us improve the Hub</p><p className="text-[11px] text-amber-100/80 font-bold mt-1">Rate the app and share ideas, bugs or compliments.</p></div><button onClick={() => setView('feedback')} className="bg-[#FDB813] text-[#3E2723] px-6 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-amber-400 self-start sm:self-auto">Give Feedback</button></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex justify-between items-center"><h4 className="font-black uppercase text-sm flex items-center gap-2 text-[#3E2723]"><BarChart2 size={18}/> Community Polls</h4>{isCommitteePlus && <button onClick={() => { setNewPoll({ question: '', options: ['', ''] }); setShowPollForm(true); }} className="bg-amber-100 text-amber-700 p-2 rounded-xl hover:bg-amber-200"><Plus size={16}/></button>}</div>
                            <div className="space-y-4">
                                {polls.length === 0 ? (<div className="p-6 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-xs text-gray-400">No active polls.</div>) : (
                                    polls.map(poll => (
                                        <div key={poll.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm relative group">
                                            {isCommitteePlus && <button onClick={() => handleDeletePoll(poll.id)} className="absolute top-4 right-4 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 size={14}/></button>}
                                            <h5 className="font-bold text-sm text-[#3E2723] mb-4 pr-6">{poll.question}</h5>
                                            <div className="space-y-3">
                                                {poll.options && poll.options.map(opt => {
                                                    const totalVotes = poll.options.reduce((acc, o) => acc + (o.votes?.length || 0), 0);
                                                    const percent = totalVotes === 0 ? 0 : Math.round(((opt.votes?.length || 0) / totalVotes) * 100);
                                                    const hasVoted = opt.votes?.includes(profile.memberId);
                                                    return (
                                                        <div key={opt.id} onClick={() => handleVotePoll(poll.id, opt.id)} className={`relative overflow-hidden rounded-xl border-2 cursor-pointer transition-all ${hasVoted ? 'border-[#3E2723]' : 'border-gray-100 hover:border-amber-200'}`}>
                                                            <div className="absolute top-0 left-0 bottom-0 bg-amber-100 transition-all duration-500" style={{ width: `${percent}%` }}></div>
                                                            <div className="relative p-3 flex justify-between items-center z-10"><span className={`text-xs font-bold ${hasVoted ? 'text-[#3E2723]' : 'text-gray-600'}`}>{opt.text}</span><span className="text-[10px] font-black opacity-60">{percent}%</span></div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <p className="text-[9px] text-gray-400 text-right mt-3 uppercase font-bold">{poll.options?.reduce((acc,o)=>acc+(o.votes?.length||0),0)} Votes</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center"><h4 className="font-black uppercase text-sm flex items-center gap-2 text-[#3E2723]"><MessageSquare size={18}/> Suggestion Box</h4></div>
                            <div className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm">
                                <form onSubmit={handlePostSuggestion}>
                                    <textarea className="w-full p-4 bg-gray-50 rounded-2xl border-none outline-none text-sm resize-none focus:ring-2 ring-amber-100" rows="3" placeholder="Drop your thoughts anonymously..." value={suggestionText} onChange={e => setSuggestionText(e.target.value)} />
                                    <div className="flex justify-end mt-4"><button type="submit" disabled={!suggestionText.trim()} className="bg-[#3E2723] text-white px-6 py-3 rounded-xl font-black uppercase text-xs flex items-center gap-2 hover:bg-black disabled:opacity-50"><Send size={14}/> Send</button></div>
                                </form>
                            </div>
                             <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {suggestions.map(s => (
                                    <div key={s.id} className="bg-white p-4 rounded-2xl border border-gray-100 relative group">
                                        {isCommitteePlus && <button onClick={() => handleDeleteSuggestion(s.id)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600"><Trash2 size={12}/></button>}
                                        <p className="text-gray-800 text-xs font-medium italic">"{s.text}"</p>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mt-2 text-right">{s.createdAt?.toDate ? formatDate(s.createdAt.toDate()) : "Just now"}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {view === 'series' && (
                <div className="space-y-8 animate-fadeIn">
                     <div className="flex justify-between items-end mb-4">
                         <div><h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Barista Diaries</h3><p className="text-gray-500 font-bold text-xs uppercase">Life behind the bar & beyond</p></div>
                        {isCommitteePlus && (<button onClick={() => { setEditingSeriesId(null); setNewSeriesPost({ title: '', imageUrls: [''], caption: '' }); setShowSeriesForm(true); }} className="bg-[#3E2723] text-white px-6 py-3 rounded-xl font-black uppercase text-xs hover:bg-black flex items-center gap-2"><Plus size={16}/> New Post</button>)}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                         {seriesPosts.length === 0 ? (<div className="col-span-full py-20 text-center text-gray-400"><Smile size={48} className="mx-auto mb-4 opacity-50"/><p>No stories yet. Be the first to share!</p></div>) : (
                             seriesPosts.map(post => {
                                 const postImages = post.imageUrls && post.imageUrls.length > 0 ? post.imageUrls : (post.imageUrl ? [post.imageUrl] : []);
                                 const canEdit = isCommitteePlus || profile.memberId === post.authorId;
                                 return (
                                     <div key={post.id} className="bg-white rounded-[32px] overflow-hidden border border-amber-100 shadow-sm hover:shadow-lg transition-shadow group relative">
                                         {canEdit && (<div className="absolute top-4 right-4 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => handleEditSeries(post)} className="p-2 bg-white/90 backdrop-blur rounded-full text-amber-600 hover:text-amber-800 shadow-md"><Pen size={14}/></button><button onClick={() => handleDeleteSeries(post.id)} className="p-2 bg-white/90 backdrop-blur rounded-full text-red-500 hover:text-red-700 shadow-md"><Trash2 size={14}/></button></div>)}
                                         <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar h-64 bg-gray-100">
                                             {postImages.map((imgUrl, idx) => (
                                                 <div key={idx} className="w-full flex-shrink-0 snap-center relative"><img src={getDirectLink(imgUrl)} alt={`${post.title} ${idx+1}`} className="w-full h-full object-cover" />{postImages.length > 1 && (<div className="absolute bottom-2 right-3 bg-black/50 text-white text-[9px] px-2 py-1 rounded-full font-bold tracking-widest backdrop-blur-sm">{idx + 1} / {postImages.length}</div>)}</div>
                                             ))}
                                         </div>
                                         <div className="p-6">
                                             <h4 className="font-black text-lg text-[#3E2723] mb-2 leading-tight">{post.title}</h4>
                                             <p className="text-xs text-gray-600 leading-relaxed mb-4 whitespace-pre-wrap">{post.caption}</p>
                                             <div className="flex justify-between items-center text-[9px] font-bold uppercase text-gray-400 border-t border-gray-100 pt-4"><span>By {post.author}</span><span>{post.createdAt?.toDate ? formatDate(post.createdAt.toDate()) : 'Recently'}</span></div>
                                         </div>
                                     </div>
                                 );
                             })
                         )}
                    </div>
                </div>
            )}

            {view === 'committee_hunt' && (
                <div className="space-y-8 animate-fadeIn">
                     <div className="bg-[#3E2723] text-white p-10 rounded-[48px] text-center relative overflow-hidden">
                        <div className="relative z-10"><h3 className="font-serif text-4xl font-black uppercase mb-4">Join the Team</h3><p className="text-amber-200/80 font-bold uppercase text-sm max-w-xl mx-auto">Apply for a committee or the executive board. Serve the student body, hone your leadership skills, and be part of the legacy.</p></div>
                        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    </div>
                    {userApplications && userApplications.length > 0 && (
                        <div className="bg-white p-8 rounded-[32px] border-2 border-amber-200 shadow-md">
                            <h4 className="font-black uppercase text-sm mb-4 text-[#3E2723] flex items-center gap-2"><Briefcase size={18}/> Your Application Status</h4>
                            <div className="space-y-3">
                                {userApplications.map(app => {
                                    let statusBg = 'bg-yellow-50 border-yellow-200'; let statusText = <p className="text-yellow-700 font-black uppercase text-xs">Application Pending</p>;
                                    if (app.status === 'for_interview') { statusBg = 'bg-blue-50 border-blue-200 animate-pulse'; statusText = <><p className="text-blue-700 font-black uppercase text-xs">For Interview</p><p className="text-[10px] text-blue-600 mt-1">Please check your email.</p></>; } 
                                    else if (app.status === 'accepted') { statusBg = 'bg-green-50 border-green-300'; statusText = <><p className="text-green-700 font-black uppercase text-sm">🎉 CONGRATULATIONS!</p><p className="text-[10px] text-green-600 mt-1">Welcome to the team!</p></>; } 
                                    else if (app.status === 'denied') { statusBg = 'bg-gray-50 border-gray-200'; statusText = <><p className="text-gray-700 font-black uppercase text-xs">Application Closed</p><p className="text-[10px] text-gray-500 mt-1">Reach out to any officer for feedback.</p></>; }
                                    return (
                                        <div key={app.id} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-5 rounded-2xl border-2 ${statusBg} gap-4`}>
                                            <div><p className="font-black text-[#3E2723] uppercase text-lg">{committeeTitle(app.committee)}</p><p className="text-xs text-gray-500 font-bold uppercase">{app.role}</p><p className="text-[9px] text-gray-400 mt-1">Applied: {app.createdAt?.toDate ? formatDate(app.createdAt.toDate()) : 'Recently'}</p></div>
                                            <div className="text-left sm:text-right">{statusText}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    <div>
                        <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-1">Committees</h4>
                        <p className="text-xs text-gray-500 font-bold mb-4">Pick the committee that fits you and tap Apply Now.</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                            {COMMITTEES_INFO.map(c => {
                                const hasAppliedToThis = userApplications && userApplications.some(a => a.committee === c.id && a.status !== 'denied');
                                return (
                                    <div key={c.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm hover:shadow-xl transition-shadow flex flex-col">
                                        <div className="h-32 rounded-2xl bg-gray-100 mb-6 overflow-hidden"><img src={c.image} className="w-full h-full object-cover" alt={c.title} /></div>
                                        <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-2">{c.title}</h4>
                                        <p className="text-xs text-gray-600 mb-4 leading-relaxed flex-1">{c.description}</p>
                                        <div className="flex flex-wrap gap-1 mb-4">{(c.roles || []).map(r => <span key={r} className="bg-amber-50 text-amber-800 text-[8px] font-black uppercase px-2 py-1 rounded-full">{r}</span>)}</div>
                                        <button onClick={(e) => handleApplyCommittee(e, c.id)} disabled={submittingApp || hasAppliedToThis} className={`w-full py-4 rounded-xl font-black uppercase text-xs transition-all ${hasAppliedToThis ? 'bg-green-100 text-green-700 cursor-not-allowed border border-green-200' : 'bg-[#3E2723] text-[#FDB813] hover:bg-black shadow-md hover:shadow-lg'}`}>{hasAppliedToThis ? 'Applied ✓' : 'Apply Now'}</button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="py-2">
                        <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-1">Executive Board Positions</h4>
                        <p className="text-xs text-gray-500 font-bold mb-4">Read the roles and responsibilities of each position before you apply.</p>
                        <div className="divide-y divide-amber-900/10 border-y border-amber-900/10">
                            {EXEC_ROLES.map(r => (
                                <details key={r.position} className="py-4">
                                    <summary className="cursor-pointer list-none flex items-center justify-between gap-3"><span className="font-black uppercase text-sm text-[#3E2723]">{r.position}</span><ChevronRight size={16} className="text-gray-400"/></summary>
                                    {r.duties.length > 0 ? (
                                        <ol className="mt-3 space-y-2 list-decimal list-inside text-xs leading-relaxed font-medium text-gray-700">{r.duties.map((d, k) => <li key={k}>{d}</li>)}</ol>
                                    ) : (<p className="mt-3 text-xs text-gray-500 font-medium">Responsibilities for this position have not been listed yet. Ask any officer for details.</p>)}
                                    <button type="button" onClick={() => { setOfficerForm({ ...officerForm, role: r.position }); const el = document.getElementById('exec-application'); if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }} className="mt-4 text-[10px] font-black uppercase text-amber-700 border border-amber-700/30 px-4 py-2 rounded-lg hover:bg-amber-50">Apply for {r.position}</button>
                                </details>
                            ))}
                        </div>
                    </div>

                    <div id="exec-application" className="bg-white p-8 rounded-[40px] border-4 border-[#3E2723] shadow-sm">
                        <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723] mb-1">Executive Board Application</h4>
                        <p className="text-xs text-gray-500 font-bold mb-6">Ready to lead? Choose a position to start your application. The current officers review every application and may invite you for an interview.</p>
                        {(userApplications || []).some(a => a.appType === 'officer' && ['pending', 'for_interview'].includes(a.status)) ? (
                            <p className="bg-green-50 text-green-700 border border-green-200 rounded-2xl p-4 text-xs font-black uppercase">Application submitted ✓ Track it under Your Application Status.</p>
                        ) : (
                        <form onSubmit={handleApplyOfficer} className="space-y-5 max-w-2xl">
                            <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Position you are applying for</label><select required className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm uppercase" value={officerForm.role} onChange={e => setOfficerForm({ ...officerForm, role: e.target.value })}><option value="">Choose a position...</option>{EXEC_POSITIONS.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                            {officerForm.role && (<>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Resume link</label><input type="url" required placeholder="https://drive.google.com/..." className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={officerForm.resumeLink} onChange={e => setOfficerForm({ ...officerForm, resumeLink: e.target.value })} /><p className="text-[9px] text-gray-400 mt-1 ml-1">Upload your resume to Google Drive, set sharing to "Anyone with the link can view", then paste the link here.</p></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Brief self-introduction</label><textarea required rows="4" maxLength={700} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={officerForm.intro} onChange={e => setOfficerForm({ ...officerForm, intro: e.target.value })} placeholder="Who are you, what is your program and year, and how have you been involved in LBA?"></textarea></div>
                                <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Why are you fit for {officerForm.role}?</label><textarea required rows="4" maxLength={700} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={officerForm.whyFit} onChange={e => setOfficerForm({ ...officerForm, whyFit: e.target.value })} placeholder="Your skills, experience and strengths for this role."></textarea></div>
                                <div className="pt-2 border-t border-amber-100"><p className="text-[10px] font-black uppercase text-[#3E2723]">Leadership questions</p><p className="text-[9px] text-gray-400 font-bold">Tip: answer with the situation, what you did, and the result. Real examples work best.</p></div>
                                {EXEC_QUESTIONS.map((q, i) => (
                                    <div key={i}><label className="text-[11px] font-bold text-[#3E2723] ml-1 block mb-1">{i + 1}. {q}</label><textarea required rows="4" maxLength={700} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={officerForm.answers[i]} onChange={e => setOfficerForm({ ...officerForm, answers: officerForm.answers.map((a, k) => k === i ? e.target.value : a) })}></textarea></div>
                                ))}
                                <div><label className="text-[11px] font-bold text-[#3E2723] ml-1 block mb-1">{EXEC_QUESTIONS.length + 1}. What would you do in your first 30 days as {officerForm.role}?</label><textarea required rows="4" maxLength={700} className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={officerForm.plan} onChange={e => setOfficerForm({ ...officerForm, plan: e.target.value })}></textarea></div>
                                <button type="submit" disabled={submittingApp} className="w-full sm:w-auto px-8 py-4 rounded-xl font-black uppercase text-xs bg-[#3E2723] text-[#FDB813] hover:bg-black shadow-md disabled:opacity-50">{submittingApp ? 'Submitting...' : 'Submit Application'}</button>
                            </>)}
                        </form>
                        )}
                    </div>
                </div>
            )}

            {view === 'manual' && (
                <div className="space-y-6 animate-fadeIn max-w-3xl mx-auto text-[#3E2723]">
                    <div className="flex items-center gap-4 border-b-4 border-[#3E2723] pb-6">
                        <StatIcon icon={BookOpen} variant="amber" />
                        <div><h3 className="font-serif text-4xl font-black uppercase">User Manual</h3><p className="text-amber-500 font-black uppercase text-[10px]">How to use the Kaperata Hub</p></div>
                    </div>
                    {MANUAL_SECTIONS.filter(sec => sec.level === 'all' || (sec.level === 'officer' && isOfficer) || (sec.level === 'admin' && isSuperAdmin)).map((sec, idx) => (
                        <details key={sec.title} open={idx === 0} className="bg-white rounded-[28px] border border-amber-100 shadow-sm group">
                            <summary className="cursor-pointer list-none p-6 flex items-center justify-between gap-3">
                                <span className="font-black uppercase text-sm">{sec.title}</span>
                                {sec.level !== 'all' && <span className="bg-purple-100 text-purple-700 text-[8px] font-black uppercase px-3 py-1 rounded-full">{sec.level === 'admin' ? 'System Admin' : 'Officers'}</span>}
                            </summary>
                            <ul className="px-6 pb-6 space-y-3 list-disc list-inside text-xs leading-relaxed font-medium text-gray-700">{sec.items.map((it, k) => <li key={k}>{it}</li>)}</ul>
                        </details>
                    ))}
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase">Need help? lbaofficial.pr@gmail.com</p>
                </div>
            )}

            {view === 'payments' && isOfficer && (() => {
                const confirmed = (members || []).filter(m => m && m.paymentDetails && m.paymentDetails.method === 'gcash' && m.paymentDetails.status === 'confirmed').sort((a, b) => String(b.paymentDetails.verifiedAt || '').localeCompare(String(a.paymentDetails.verifiedAt || ''))).slice(0, 15);
                const fmt = (iso) => { const d = iso ? new Date(iso) : null; return d && !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '-'; };
                const waitDays = (iso) => { const d = iso ? new Date(iso) : null; return d && !isNaN(d.getTime()) ? Math.floor((Date.now() - d.getTime()) / 86400000) : 0; };
                return (
                <div className="space-y-8 animate-fadeIn text-[#3E2723] max-w-4xl">
                    <div className="pb-6 border-b border-amber-900/10"><h3 className="font-serif text-4xl font-black uppercase">Payments to Verify</h3><p className="text-amber-500 font-black uppercase text-[10px]">Match each GCash payment with the GCash records, then confirm</p></div>
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] font-bold text-amber-900 leading-relaxed">How to verify: open the GCash app, go to Transactions, and look for the same reference number, amount and sender. If it matches, tap Confirm. If it is not there, tap Reject and give a reason. Members stay on limited access until you confirm.</div>
                    {pendingPayments.length === 0 ? (<p className="text-center py-10 text-[11px] font-black uppercase text-gray-400">No payments waiting. All caught up!</p>) : (
                    <div className="divide-y divide-amber-900/10 border-y border-amber-900/10">
                        {pendingPayments.map(m => { const pd = m.paymentDetails || {}; const wait = waitDays(pd.submittedAt); return (
                            <div key={m.memberId} className="py-5 flex flex-col md:flex-row md:items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-black uppercase text-sm">{m.name} <span className="text-[10px] font-mono text-gray-400 ml-1">{m.memberId}</span></p>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase">{m.program || ''}{m.studentId ? ' · ' + m.studentId : ''} · {pd.purpose === 'renewal' ? 'Renewal' : 'New member'}</p>
                                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-[11px]">
                                        <p><span className="text-gray-400 font-bold uppercase text-[9px]">Reference</span><br/><span className="font-mono font-black">{pd.refNo || '-'}</span></p>
                                        <p><span className="text-gray-400 font-bold uppercase text-[9px]">Amount</span><br/><span className="font-black">PHP {pd.amount || '-'}</span></p>
                                        <p><span className="text-gray-400 font-bold uppercase text-[9px]">GCash sender</span><br/><span className="font-black">{pd.payerName || '-'}</span></p>
                                        <p><span className="text-gray-400 font-bold uppercase text-[9px]">Date paid</span><br/><span className="font-black">{pd.paidDate || '-'}</span></p>
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase mt-2 ${wait >= 7 ? 'text-red-600' : 'text-gray-400'}`}>Submitted {fmt(pd.submittedAt)} · waiting {wait} day{wait === 1 ? '' : 's'}{wait >= 7 ? ' · overdue, please verify or reject' : ''}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleConfirmPayment(m)} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase bg-green-600 text-white hover:bg-green-700">Confirm</button>
                                    <button onClick={() => handleRejectPayment(m)} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase text-red-600 border border-red-200 hover:bg-red-50">Reject</button>
                                </div>
                            </div>); })}
                    </div>)}
                    {confirmed.length > 0 && (<div><h4 className="font-black uppercase text-sm mb-3">Recently confirmed</h4><div className="divide-y divide-amber-900/10 border-y border-amber-900/10">{confirmed.map(m => (<div key={m.memberId} className="py-3 flex justify-between gap-3 text-xs"><div><span className="font-black uppercase">{m.name}</span><span className="text-gray-400 font-mono ml-2">{m.paymentDetails.refNo}</span></div><span className="text-[10px] text-gray-500 font-bold text-right">Confirmed by {m.paymentDetails.verifiedBy || '-'}<br/>{fmt(m.paymentDetails.verifiedAt)}</span></div>))}</div></div>)}
                </div>);
            })()}

            {view === 'videos' && (() => {
                const vs = videoSettings || {}; const hasAny = (vs.intro && vs.intro.url) || (vs.orientation && vs.orientation.url);
                const ackOf = (kind) => profile.videoAck && profile.videoAck[kind] && profile.videoAck[kind].version >= videoVersion ? profile.videoAck[kind] : null;
                const eligible = (members || []).filter(m => m && m.positionCategory !== 'Blacklisted' && m.status === 'active');
                const lacking = (kind) => eligible.filter(m => !(m.videoAck && m.videoAck[kind] && m.videoAck[kind].version >= videoVersion));
                const sections = [['intro', 'Welcome to the Kaperata Hub', 'About LBA, this app and what members can do.'], ['orientation', 'Membership Orientation', 'Roles, responsibilities, infractions and misconduct, and opportunities.']];
                const vf = (kind, field, val) => setVideoForm({ ...videoForm, [kind]: { ...videoForm[kind], [field]: val } });
                return (
                <div className="space-y-8 animate-fadeIn text-[#3E2723] max-w-3xl">
                    <div className="pb-6 border-b border-amber-900/10"><h3 className="font-serif text-4xl font-black uppercase">Orientation Videos</h3><p className="text-amber-500 font-black uppercase text-[10px]">Watch any time</p></div>
                    {!hasAny && <p className="text-xs font-bold text-gray-500">No videos have been added yet.{isSuperAdmin ? ' Add the links below.' : ' Please check back soon.'}</p>}
                    {sections.map(([kind, title, desc]) => { const v = vs[kind]; if (!v || !v.url) return null; const a = ackOf(kind); return (
                        <div key={kind} className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2"><div><h4 className="font-serif text-2xl font-black uppercase">{v.title || title}</h4><p className="text-[11px] font-bold text-gray-500">{desc}</p></div>{a ? <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">Acknowledged {formatDate(a.at)}</span> : <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">Not yet acknowledged</span>}</div>
                            <VideoPlayer url={v.url} />
                        </div>); })}
                    {isOfficer && vs.required && (
                        <div className="border-t border-amber-900/10 pt-6"><h4 className="font-black uppercase text-sm mb-1">Who has confirmed</h4><p className="text-[11px] font-bold text-gray-500 mb-3">Active members still to confirm.</p>
                            {sections.map(([kind, title]) => vs[kind] && vs[kind].url ? (<details key={kind} className="py-2 border-b border-amber-900/10"><summary className="cursor-pointer text-xs font-black uppercase">{vs[kind].title || title}: {eligible.length - lacking(kind).length} of {eligible.length} confirmed</summary><p className="mt-2 text-[11px] text-gray-600 font-medium leading-relaxed">{lacking(kind).length === 0 ? 'Everyone has confirmed.' : lacking(kind).map(m => m.name).join(' · ')}</p></details>) : null)}
                        </div>)}
                    {isSuperAdmin && (
                        <div className="border-t border-amber-900/10 pt-6 space-y-5">
                            <h4 className="font-black uppercase text-sm">Manage videos (System Admin)</h4>
                            <p className="text-[11px] font-bold text-gray-500 leading-relaxed">Upload each video to YouTube as Unlisted (best, because the Hub can check that it was really watched), or use a Google Drive, Facebook or direct .mp4 link, then paste the link. For links other than YouTube or .mp4, members can continue after the minimum seconds you set.</p>
                            {sections.map(([kind, title]) => (<div key={kind} className="space-y-2"><p className="text-[10px] font-black uppercase text-amber-700">{title}</p>
                                <input className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" placeholder="Title (optional)" value={videoForm[kind].title} onChange={e => vf(kind, 'title', e.target.value)} />
                                <input className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" placeholder="Video link (https://...)" value={videoForm[kind].url} onChange={e => vf(kind, 'url', e.target.value)} />
                                <div className="flex items-center gap-2"><label className="text-[10px] font-bold text-gray-400 uppercase">Minimum seconds (non-YouTube links)</label><input type="number" min="10" className="w-24 p-2 border border-amber-200 rounded-lg text-xs font-bold" value={videoForm[kind].minSeconds} onChange={e => vf(kind, 'minSeconds', e.target.value)} /></div></div>))}
                            <label className="flex items-start gap-3 text-xs font-bold cursor-pointer"><input type="checkbox" className="mt-0.5 w-4 h-4" checked={!!videoForm.required} onChange={e => setVideoForm({ ...videoForm, required: e.target.checked })} /><span>Require members to watch and confirm before entering the Hub. Test the links first, then turn this on.</span></label>
                            <div className="flex flex-wrap gap-2"><button onClick={() => handleSaveVideoSettings(false)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase bg-[#3E2723] text-[#FDB813]">Save</button><button onClick={() => handleSaveVideoSettings(true)} className="px-6 py-3 rounded-xl text-[10px] font-black uppercase text-amber-700 border border-amber-700/30 hover:bg-amber-50">Save and require everyone to watch again</button></div>
                        </div>)}
                </div>);
            })()}

            {view === 'attendance' && (isOfficer || isCare) && (() => {
                const { rows, events: attEvents } = attendanceData; const q = attSearch.trim().toLowerCase();
                const shown = rows.filter(r => (!q || String(r.m.name).toLowerCase().includes(q) || String(r.m.memberId).toLowerCase().includes(q)) && (attFilter === 'all' || (attFilter === 'risk' && r.pct !== null && r.pct < ATT_MIN) || (attFilter === 'good' && r.pct !== null && r.pct >= ATT_MIN)));
                const withData = rows.filter(r => r.pct !== null); const avg = withData.length ? Math.round(withData.reduce((a, r) => a + r.pct, 0) / withData.length) : 0; const risk = withData.filter(r => r.pct < ATT_MIN).length;
                return (
                <div className="space-y-6 animate-fadeIn text-[#3E2723]">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-3"><div><h3 className="font-serif text-4xl font-black uppercase">Attendance</h3><p className="text-amber-600 font-bold text-xs uppercase">Member's Care Desk &middot; members need at least {ATT_MIN}% attendance</p></div><button onClick={handleDownloadAttSummary} className="flex items-center gap-2 bg-white border border-amber-200 px-4 py-2 rounded-full text-[10px] font-black uppercase hover:bg-amber-50 self-start"><Download size={14}/> Download summary</button></div>
                    <div className="grid grid-cols-3 gap-3">{[['Events tracked', attEvents.length], ['Average attendance', avg + '%'], ['Below ' + ATT_MIN + '%', risk]].map(([l, v]) => (<div key={l} className={`p-5 rounded-[24px] border text-center ${l.startsWith('Below') && risk > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-amber-100'}`}><p className="text-2xl md:text-3xl font-black">{v}</p><p className="text-[9px] font-black uppercase text-gray-500 mt-1">{l}</p></div>))}</div>
                    <div className="flex gap-2"><button onClick={() => setAttTab('member')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase ${attTab === 'member' ? 'bg-[#3E2723] text-[#FDB813]' : 'bg-amber-50 text-amber-900'}`}>By member</button><button onClick={() => setAttTab('event')} className={`px-5 py-2 rounded-full text-[10px] font-black uppercase ${attTab === 'event' ? 'bg-[#3E2723] text-[#FDB813]' : 'bg-amber-50 text-amber-900'}`}>By event</button></div>
                    {attTab === 'member' ? (<>
                        <div className="flex flex-col md:flex-row gap-3"><div className="flex items-center gap-2 bg-white border border-amber-100 px-4 py-2 rounded-2xl flex-1"><Search size={16}/><input type="text" placeholder="Search name or ID..." className="bg-transparent outline-none text-[11px] font-black uppercase w-full" value={attSearch} onChange={e => setAttSearch(e.target.value)} /></div><div className="flex gap-2">{[['all', 'All'], ['risk', 'Below ' + ATT_MIN + '%'], ['good', 'On track']].map(([k, l]) => (<button key={k} onClick={() => setAttFilter(k)} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase ${attFilter === k ? 'bg-amber-500 text-white' : 'bg-white border border-amber-100 text-amber-900'}`}>{l}</button>))}</div></div>
                        {attEvents.length === 0 && <div className="bg-white p-8 rounded-[28px] border border-amber-100 text-center text-xs font-bold text-gray-500 uppercase">No past events with required attendance yet. Mark "attendance required" when creating an event, then take attendance on the event.</div>}
                        <div className="space-y-2">{shown.map(r => { const open = attOpen === r.m.memberId; const low = r.pct !== null && r.pct < ATT_MIN; return (
                            <div key={r.m.memberId} className={`bg-white rounded-2xl border ${low ? 'border-red-200' : 'border-amber-100'}`}>
                                <button onClick={() => setAttOpen(open ? null : r.m.memberId)} className="w-full flex items-center gap-4 p-4 text-left"><div className="flex-1 min-w-0"><p className="font-black text-xs uppercase truncate">{r.m.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{r.m.memberId} &middot; {r.m.program || ''}</p></div><div className="hidden sm:block w-32"><div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${low ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: (r.pct || 0) + '%' }}></div></div></div><div className="text-right"><p className={`font-black text-sm ${low ? 'text-red-600' : ''}`}>{r.pct === null ? '—' : r.pct + '%'}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{r.present} present &middot; {r.absent} absent{r.excused ? ' · ' + r.excused + ' excused' : ''}</p></div><ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`}/></button>
                                {open && (<div className="border-t border-amber-50 p-4 space-y-2">{r.mine.length === 0 && <p className="text-[10px] font-bold text-gray-400 uppercase">No tracked events yet.</p>}{r.mine.map(x => (<div key={x.ev.id} className="flex items-center gap-3 text-[11px]"><span className={`w-20 text-center px-2 py-1 rounded-full text-[8px] font-black uppercase ${x.present ? 'bg-green-100 text-green-700' : x.excused ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{x.present ? 'Present' : x.excused ? 'Excused' : 'Absent'}</span><span className="flex-1 font-bold uppercase truncate">{x.ev.name}</span><span className="text-gray-400 font-bold">{x.ev.startDate}</span>{!x.present && <button onClick={() => handleToggleExcuse(x.ev, r.m.memberId)} className="text-[9px] font-black uppercase text-amber-700 hover:underline">{x.excused ? 'Undo excuse' : 'Mark excused'}</button>}</div>))}</div>)}
                            </div>); })}{shown.length === 0 && attEvents.length > 0 && <p className="text-center text-[11px] font-bold text-gray-400 uppercase py-6">No members match.</p>}</div>
                    </>) : (
                        <div className="space-y-2">{attEvents.length === 0 && <div className="bg-white p-8 rounded-[28px] border border-amber-100 text-center text-xs font-bold text-gray-500 uppercase">No past events with required attendance yet.</div>}{attEvents.map(ev => (<div key={ev.id} className="bg-white p-4 rounded-2xl border border-amber-100 flex items-center gap-4"><div className="flex-1 min-w-0"><p className="font-black text-xs uppercase truncate">{ev.name}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{ev.startDate}{ev.venue ? ' · ' + ev.venue : ''}</p></div><p className="text-[10px] font-black uppercase text-amber-700">{(ev.attendees || []).length} present</p><button onClick={() => setAttendanceEvent(ev)} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase hover:bg-indigo-200">Open attendance</button></div>))}</div>
                    )}
                </div>); })()}

            {view === 'birthdays' && (isOfficer || isCare) && (() => {
                const { y, m } = bdayCursor; const today = new Date(); const dim = new Date(y, m + 1, 0).getDate(); const first = new Date(y, m, 1).getDay();
                const people = (members || []).filter(mm => mm && mm.birthMonth && mm.birthDay && mm.positionCategory !== 'Blacklisted');
                const byDay = {}; people.filter(mm => Number(mm.birthMonth) - 1 === m).forEach(mm => { const d = Math.min(Number(mm.birthDay), dim); if (!byDay[d]) byDay[d] = []; byDay[d].push(mm); });
                const monthName = new Date(y, m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                const shortName = (mm) => String(mm.nickname || (mm.firstName || mm.name || '')).split(' ')[0];
                const upcoming = people.map(mm => { let dt = new Date(today.getFullYear(), Number(mm.birthMonth) - 1, Number(mm.birthDay)); const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()); if (dt < t0) dt = new Date(today.getFullYear() + 1, Number(mm.birthMonth) - 1, Number(mm.birthDay)); return { mm, dt, days: Math.round((dt - t0) / 86400000) }; }).filter(x => x.days <= 30).sort((a, b) => a.days - b.days);
                const cells = []; for (let i = 0; i < first; i++) cells.push(null); for (let d = 1; d <= dim; d++) cells.push(d);
                const isToday = (d) => d && y === today.getFullYear() && m === today.getMonth() && d === today.getDate();
                const sel = bdaySel && byDay[bdaySel] ? byDay[bdaySel] : [];
                return (
                <div className="space-y-8 animate-fadeIn text-[#3E2723] max-w-4xl">
                    <div className="pb-6 border-b border-amber-900/10"><h3 className="font-serif text-4xl font-black uppercase">Birthdays</h3><p className="text-amber-500 font-black uppercase text-[10px]">For officers and the Member's Care Committee</p></div>
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <button onClick={() => { setBdaySel(null); setBdayCursor(m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }); }} className="p-2 rounded-lg border border-amber-900/20 hover:bg-amber-50" aria-label="Previous month"><ChevronLeft size={16}/></button>
                            <div className="text-center"><p className="font-serif text-2xl font-black uppercase">{monthName}</p><button onClick={() => { setBdaySel(null); setBdayCursor({ y: today.getFullYear(), m: today.getMonth() }); }} className="text-[10px] font-black uppercase text-amber-600">Today</button></div>
                            <button onClick={() => { setBdaySel(null); setBdayCursor(m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }); }} className="p-2 rounded-lg border border-amber-900/20 hover:bg-amber-50" aria-label="Next month"><ChevronRight size={16}/></button>
                        </div>
                        <div className="grid grid-cols-7 text-center text-[9px] font-black uppercase text-gray-400 pb-1">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}</div>
                        <div className="grid grid-cols-7 border-t border-l border-amber-900/10">
                            {cells.map((d, i) => { const list = d ? (byDay[d] || []) : []; return (
                                <button key={i} disabled={!d} onClick={() => setBdaySel(d === bdaySel ? null : d)} className={`min-h-[64px] md:min-h-[88px] p-1 text-left border-r border-b border-amber-900/10 align-top ${d ? 'hover:bg-amber-50' : 'bg-transparent'} ${bdaySel === d ? 'bg-amber-100' : ''}`}>
                                    {d && <span className={`inline-flex items-center justify-center text-[10px] font-black w-5 h-5 rounded-full ${isToday(d) ? 'bg-[#3E2723] text-[#FDB813]' : 'text-gray-500'}`}>{d}</span>}
                                    <span className="hidden md:block">{list.slice(0, 2).map(mm => <span key={mm.memberId} className="block truncate text-[9px] font-bold text-amber-800 leading-tight">🎂 {shortName(mm)}</span>)}{list.length > 2 && <span className="block text-[9px] font-black text-gray-400">+{list.length - 2} more</span>}</span>
                                    {list.length > 0 && <span className="md:hidden block text-[9px] font-black text-amber-700">🎂 {list.length}</span>}
                                </button>); })}
                        </div>
                        {bdaySel && (<div className="mt-4 border-l-2 border-amber-500 pl-4"><p className="text-[10px] font-black uppercase text-gray-400">{new Date(y, m, bdaySel).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</p>{sel.length === 0 ? <p className="text-xs font-bold text-gray-500">No birthdays.</p> : sel.map(mm => <p key={mm.memberId} className="text-sm font-black uppercase">{mm.name} <span className="text-[10px] font-bold text-gray-400 normal-case">{mm.program || ''}</span></p>)}</div>)}
                    </div>
                    <div>
                        <h4 className="font-black uppercase text-sm mb-3">Coming up (next 30 days)</h4>
                        {upcoming.length === 0 ? <p className="text-xs font-bold text-gray-500">No birthdays in the next 30 days.</p> : (
                        <div className="divide-y divide-amber-900/10 border-y border-amber-900/10">{upcoming.map(({ mm, dt, days }) => (<div key={mm.memberId} className="py-3 flex items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-black uppercase truncate">{mm.name}</p><p className="text-[10px] font-bold text-gray-400 uppercase">{mm.positionCategory === 'Member' ? 'Member' : (mm.specificTitle || mm.positionCategory)}{mm.program ? ' · ' + mm.program : ''}</p></div><div className="text-right shrink-0"><p className={`text-xs font-black uppercase ${days === 0 ? 'text-red-600' : ''}`}>{days === 0 ? 'Today! 🎉' : days === 1 ? 'Tomorrow' : `In ${days} days`}</p><p className="text-[10px] font-bold text-gray-400">{dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p></div></div>))}</div>)}
                    </div>
                    {people.length === 0 && <p className="text-xs font-bold text-gray-500">No birthdays recorded yet. Members enter their birthday when they sign up.</p>}
                </div>);
            })()}

            {view === 'inventory' && (isOfficer || isCare) && (() => {
                const q = (invSearch || '').trim().toLowerCase();
                const items = (inventory || []).filter(i => i != null);
                const list = items.filter(i => !q || String(i.name || '').toLowerCase().includes(q) || String(i.category || '').toLowerCase().includes(q)).sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
                const isLow = (i) => Number(i.quantity || 0) <= Number(i.reorderLevel || 0);
                const lowCount = items.filter(isLow).length; const totalUnits = items.reduce((n, i) => n + Number(i.quantity || 0), 0);
                const hasLace = items.some(i => /id\s*lace/i.test(String(i.name || '')));
                const openAdd = (preset) => { setEditingInv(null); setInvForm({ ...EMPTY_ITEM, ...(preset || {}) }); setShowInvForm(true); };
                const openEdit = (i) => { setEditingInv(i); setInvForm({ name: i.name || '', category: i.category || '', quantity: String(i.quantity ?? 0), unit: i.unit || 'pcs', reorderLevel: String(i.reorderLevel ?? 0), notes: i.notes || '' }); setShowInvForm(true); };
                const adjust = (i) => { const v = window.prompt(`Adjust "${i.name}" (current ${i.quantity} ${i.unit || ''}).\nEnter a number: positive to add, negative to remove.`, '1'); if (v == null) return; const n = parseInt(v, 10); if (!n) return alert("Please enter a whole number such as 5 or -2."); const why = window.prompt('Reason (optional):', n > 0 ? 'Restocked' : 'Used') || ''; handleAdjustStock(i, n, why); };
                return (
                <div className="space-y-6 animate-fadeIn text-[#3E2723]">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b-4 border-[#3E2723] pb-6">
                        <div className="flex items-center gap-4"><StatIcon icon={Package} variant="amber" /><div><h3 className="font-serif text-4xl font-black uppercase">Inventory</h3><p className="text-amber-500 font-black uppercase text-[10px]">Stock on hand</p></div></div>
                        <div className="flex gap-2 flex-wrap">
                            {!hasLace && <button onClick={() => openAdd({ name: 'ID Lace', category: 'Membership', unit: 'pcs', reorderLevel: '10' })} className="bg-amber-100 text-amber-800 px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase">+ Track ID Lace</button>}
                            <button onClick={() => { const rows = list.map(i => [i.name, i.category, i.quantity, i.unit, i.reorderLevel, isLow(i) ? 'LOW' : 'OK', i.notes || '', i.updatedAt ? getSafeDateString(i.updatedAt) : '']); generateCSV(["Item", "Category", "Quantity", "Unit", "Reorder Level", "Stock", "Notes", "Last Updated"], rows, `LBA_Inventory_${new Date().toISOString().split('T')[0]}.csv`); }} className="bg-green-600 text-white px-4 py-2.5 rounded-2xl font-black text-[10px] uppercase flex items-center gap-1"><FileBarChart size={12}/> CSV</button>
                            <button onClick={() => openAdd()} className="bg-[#3E2723] text-[#FDB813] px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase flex items-center gap-1"><Plus size={14}/> Add Item</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 md:gap-6">
                        <div className="bg-white p-5 rounded-[28px] border border-amber-100 text-center"><p className="text-[9px] font-black uppercase text-gray-400">Items</p><p className="text-2xl font-black">{items.length}</p></div>
                        <div className="bg-white p-5 rounded-[28px] border border-amber-100 text-center"><p className="text-[9px] font-black uppercase text-gray-400">Total Units</p><p className="text-2xl font-black text-amber-600">{totalUnits}</p></div>
                        <div className={`p-5 rounded-[28px] border text-center ${lowCount ? 'bg-red-50 border-red-200' : 'bg-white border-amber-100'}`}><p className="text-[9px] font-black uppercase text-gray-400">Low Stock</p><p className={`text-2xl font-black ${lowCount ? 'text-red-600' : 'text-green-600'}`}>{lowCount}</p></div>
                    </div>
                    {showInvForm && (
                        <form onSubmit={handleSaveInventoryItem} className="bg-white p-6 rounded-[32px] border-4 border-[#3E2723] space-y-4">
                            <h4 className="font-black uppercase text-sm">{editingInv ? 'Edit Item' : 'Add Item'}</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <input required placeholder="Item name (e.g. ID Lace)" className="p-3 border border-amber-200 rounded-xl text-xs font-bold" value={invForm.name} onChange={e => setInvForm({ ...invForm, name: e.target.value })} />
                                <input placeholder="Category (e.g. Membership, Supplies)" className="p-3 border border-amber-200 rounded-xl text-xs font-bold" value={invForm.category} onChange={e => setInvForm({ ...invForm, category: e.target.value })} />
                                <div><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Quantity on hand</label><input type="number" min="0" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={invForm.quantity} onChange={e => setInvForm({ ...invForm, quantity: e.target.value })} /></div>
                                <div><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Unit</label><input placeholder="pcs, packs, boxes" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={invForm.unit} onChange={e => setInvForm({ ...invForm, unit: e.target.value })} /></div>
                                <div><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Reorder level (flag as low at or below)</label><input type="number" min="0" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={invForm.reorderLevel} onChange={e => setInvForm({ ...invForm, reorderLevel: e.target.value })} /></div>
                                <div><label className="text-[9px] font-bold text-gray-400 uppercase ml-1">Notes</label><input placeholder="Supplier, storage location..." className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={invForm.notes} onChange={e => setInvForm({ ...invForm, notes: e.target.value })} /></div>
                            </div>
                            <div className="flex gap-2 justify-end"><button type="button" onClick={() => { setShowInvForm(false); setEditingInv(null); }} className="px-5 py-3 rounded-xl text-[10px] font-black uppercase bg-gray-100 text-gray-500">Cancel</button><button type="submit" className="px-6 py-3 rounded-xl text-[10px] font-black uppercase bg-[#3E2723] text-[#FDB813]">Save Item</button></div>
                        </form>
                    )}
                    <div className="flex items-center gap-2 bg-white border border-amber-100 px-4 py-3 rounded-2xl"><Search size={16}/><input type="text" placeholder="Search items..." className="bg-transparent outline-none text-[11px] font-black uppercase w-full" value={invSearch} onChange={e => setInvSearch(e.target.value)} /></div>
                    <div className="space-y-3">
                        {list.length === 0 ? (<p className="text-center py-12 text-[11px] font-black uppercase text-gray-400">{items.length === 0 ? 'No items yet. Tap Add Item to start tracking stock.' : 'No items match your search.'}</p>) : list.map(i => {
                            const last = (i.history || [])[(i.history || []).length - 1];
                            return (
                            <div key={i.id} className={`bg-white p-5 rounded-[28px] border-2 flex flex-col md:flex-row md:items-center gap-4 ${isLow(i) ? 'border-red-200' : 'border-amber-100'}`}>
                                <div className="flex-1 min-w-0">
                                    <p className="font-black uppercase text-sm truncate">{i.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">{i.category || 'General'} · reorder at {i.reorderLevel ?? 0}</p>
                                    {i.notes && <p className="text-[10px] text-gray-500 mt-1">{i.notes}</p>}
                                    {last && <p className="text-[9px] text-gray-400 mt-1">Last: {last.change > 0 ? '+' : ''}{last.change} · {last.reason} · {last.by} · {formatDate(last.at)}</p>}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => handleAdjustStock(i, -1, 'Quick adjust')} className="w-9 h-9 rounded-full bg-gray-100 font-black text-lg hover:bg-gray-200" aria-label="Remove one">−</button>
                                    <div className="text-center min-w-[64px]"><p className={`text-2xl font-black leading-none ${isLow(i) ? 'text-red-600' : ''}`}>{i.quantity ?? 0}</p><p className="text-[9px] font-bold text-gray-400 uppercase">{i.unit || 'pcs'}</p></div>
                                    <button onClick={() => handleAdjustStock(i, 1, 'Quick adjust')} className="w-9 h-9 rounded-full bg-gray-100 font-black text-lg hover:bg-gray-200" aria-label="Add one">+</button>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    {isLow(i) && <span className="bg-red-100 text-red-700 text-[8px] font-black uppercase px-3 py-1 rounded-full">Low Stock</span>}
                                    <button onClick={() => adjust(i)} className="bg-amber-50 text-amber-700 px-3 py-2 rounded-xl text-[9px] font-black uppercase">Adjust</button>
                                    <button onClick={() => openEdit(i)} className="bg-amber-50 text-amber-600 p-2 rounded-lg" title="Edit"><Pen size={14}/></button>
                                    {isSuperAdmin && <button onClick={() => handleDeleteInventoryItem(i)} className="bg-red-50 text-red-500 p-2 rounded-lg" title="Delete"><Trash2 size={14}/></button>}
                                </div>
                            </div>);
                        })}
                    </div>
                </div>);
            })()}

            {view === 'members' && isOfficer && (
                <div className="space-y-6 animate-fadeIn text-[#3E2723]">
                    {isSuperAdmin && (<div className="bg-red-50 border-2 border-red-200 rounded-[32px] p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between"><div><p className="font-black uppercase text-xs text-red-700 flex items-center gap-2"><Lock size={14}/> Login security</p><p className="text-[11px] text-red-900/80 mt-1">{(members || []).filter(m => m && m.password).length} member(s) still have a readable password stored. Run this once to move everyone to secure login and erase stored passwords.</p>{migMsg && <p className="text-[11px] font-bold mt-2 text-red-900">{migMsg}</p>}{(members || []).filter(m => m && m.password).length > 0 && (<div className="mt-3 space-y-1">{(members || []).filter(m => m && m.password).map(m => (<div key={m.id || m.memberId} className="flex items-center gap-2 text-[10px] font-bold text-red-900 bg-white/70 rounded-lg px-3 py-1"><span className="flex-1 min-w-0 truncate">{m.name} &middot; {m.id || m.memberId}{migFails[m.id || m.memberId] ? ' · ' + migFails[m.id || m.memberId] : ''}</span><button onClick={() => handleResetPassword(m.id || m.memberId, m.email, m.name)} className="shrink-0 text-[9px] font-black uppercase underline">Reset instead</button><button onClick={() => setConfirmDelete({ mid: m.id || m.memberId, name: m.name })} className="shrink-0 text-[9px] font-black uppercase underline text-red-600">Delete</button></div>))}</div>)}</div><button disabled={migBusy} onClick={handleMigratePasswords} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] hover:bg-red-700 disabled:opacity-50">{migBusy ? 'Working...' : 'Secure all passwords'}</button></div>)}
                    <div className="bg-white p-6 rounded-[40px] border border-amber-100 flex justify-between items-center flex-col md:flex-row gap-4">
                        <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl w-full md:w-auto"><Search size={16}/><input type="text" placeholder="Search..." className="bg-transparent outline-none text-[10px] font-black uppercase w-full" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/></div>
                        <div className="flex gap-2 w-full md:w-auto justify-end">
                            <select className="bg-white border border-amber-100 text-[9px] font-black uppercase px-2 rounded-xl outline-none" value={exportFilter} onChange={e => setExportFilter(e.target.value)}><option value="all">All</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="officers">Officers</option><option value="committee">Committee</option><option value="lace_issued">ID Lace Issued</option><option value="lace_pending">ID Lace Pending</option></select>
                            <button onClick={handleExportCSV} className="bg-green-600 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase flex items-center gap-1"><FileBarChart size={12}/> CSV</button>
                            <button onClick={handleBulkEmail} className="bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Email</button>
                            {isSuperAdmin && (
                                <>
                                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkImportCSV} />
                                    <button onClick={()=>fileInputRef.current.click()} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Import</button>
                                </>
                            )}
                        </div>
                    </div>
                    
                    <div className="md:hidden space-y-4">
                        {paginatedRegistry && paginatedRegistry.map(m => (
                            <div key={m?.memberId || Math.random()} className={`bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm ${m?.status !== 'active' ? 'opacity-70 grayscale' : ''}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3"><img src={getDirectLink(m?.photoUrl) || `https://ui-avatars.com/api/?name=${m?.name || 'User'}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover border-2 border-[#3E2723]" alt="avatar"/><div><p className="font-black text-xs uppercase">{m?.name || 'Unknown'} {m?.role === 'superadmin' && <ShieldCheck size={12} className="inline text-purple-600"/>}</p><p className="text-[10px] font-mono text-gray-500">{m?.memberId || 'No ID'}</p></div></div>
                                    <button onClick={()=>toggleSelectBarista(m?.memberId)}>{selectedBaristas.includes(m?.memberId) ? <CheckCircle2 size={20} className="text-[#FDB813]"/> : <div className="w-5 h-5 border-2 border-amber-100 rounded-full"></div>}</button>
                                </div>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div><label className="text-[8px] font-bold text-gray-400 uppercase">Category</label><select className="w-full bg-amber-50 text-[10px] font-black p-2 rounded-lg outline-none uppercase disabled:opacity-50" value={m?.positionCategory || "Member"} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle, m.committee)} disabled={!isSuperAdmin}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                                        <div><label className="text-[8px] font-bold text-gray-400 uppercase">Title</label><select className="w-full bg-white border border-amber-100 text-[10px] font-black p-2 rounded-lg outline-none uppercase disabled:opacity-50" value={m?.specificTitle || "Member"} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value, m.committee)} disabled={!isSuperAdmin}><option value="Member">Member</option><option value="Org Adviser">Org Adviser</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                                    </div>
                                    {m?.positionCategory === 'Committee' && (<div><label className="text-[8px] font-bold text-indigo-400 uppercase">Committee Dept</label><select className="w-full bg-indigo-50 text-indigo-900 text-[10px] font-black p-2 rounded-lg outline-none uppercase disabled:opacity-50" value={m?.committee || ""} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, m.specificTitle, e.target.value)} disabled={!isSuperAdmin}><option value="">Select Dept...</option>{COMMITTEES_INFO.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>)}
                                </div>
                                <div className="flex items-center justify-between mb-3 text-[9px] font-black uppercase"><span className="text-gray-400">ID Lace{m?.studentId ? ' · ' + m.studentId : ''}</span><button onClick={() => handleToggleIdLace(m)} title={m?.idLaceIssued ? ('Issued ' + formatDate(m.idLaceIssuedAt) + (m.idLaceIssuedBy ? ' by ' + m.idLaceIssuedBy : '')) : 'Mark ID lace as issued'} className={'px-2 py-1 rounded-full text-[8px] font-black uppercase ' + (m?.idLaceIssued ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700')}>{m?.idLaceIssued ? 'Issued ✓' : 'Pending'}</button></div>
                                <div className="mt-4 pt-4 border-t border-amber-50 flex justify-between items-center">
                                    <button onClick={() => isSuperAdmin && handleToggleStatus(m.memberId, m.status)} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase ${m?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`} disabled={!isSuperAdmin}>{m?.status === 'active' ? (m?.membershipType || 'ACTIVE') : 'EXPIRED'}</button>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setAccoladeText(""); setShowAccoladeModal({ id: m.id, memberId: m.memberId, currentAccolades: m?.accolades || [] }); }} className="bg-yellow-50 text-yellow-600 p-2 rounded-lg"><Trophy size={16}/></button>
                                        <button onClick={() => handleResetPassword(m.memberId, m.email, m.name)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg" title="Reset Password"><RefreshCcw size={16}/></button>
                                        {isSuperAdmin && (
                                            <>
                                                <button onClick={() => handleToggleSuperAdmin(m.memberId, m.role, m.name)} className={`p-2 rounded-lg ${m.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-400 hover:bg-purple-50 hover:text-purple-600'}`} title={m.role === 'superadmin' ? 'Revoke Admin' : 'Make Admin'}><ShieldCheck size={16}/></button>
                                                <button onClick={() => { setEditingMember(m); setEditMemberForm({ joinedDate: getSafeDateString(m.joinedDate) }); }} className="bg-amber-50 text-amber-600 p-2 rounded-lg"><Pen size={16}/></button>
                                                <button onClick={()=>initiateRemoveMember(m.memberId, m.name)} className="bg-red-50 text-red-500 p-2 rounded-lg"><Trash2 size={16}/></button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="hidden md:block bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-hidden">
                        <table className="w-full text-left uppercase table-fixed">
                            <thead className="bg-[#3E2723] text-white font-serif tracking-widest">
                                <tr className="text-[10px]">
                                    <th className="p-4 w-12 text-center"><button onClick={toggleSelectAll}>{selectedBaristas.length === (paginatedRegistry?.length || 0) && selectedBaristas.length > 0 ? <CheckCircle2 size={16} className="text-[#FDB813]"/> : <Plus size={16}/>}</button></th>
                                    <th className="p-4 w-1/4">Barista</th>
                                    <th className="p-4 w-32 text-center">ID</th>
                                    <th className="p-4 w-24 text-center">ID Lace</th>
                                    <th className="p-4 w-24 text-center">Status</th>
                                    <th className="p-4 w-40 text-center">Designation</th>
                                    <th className="p-4 w-40 text-right">Manage</th>
                                </tr>
                            </thead>
                            <tbody className="text-[#3E2723] divide-y divide-amber-50">
                                {paginatedRegistry && paginatedRegistry.map(m => (
                                <tr key={m?.memberId || Math.random()} className={`hover:bg-amber-50/50 ${m?.status !== 'active' ? 'opacity-50 grayscale' : ''}`}>
                                    <td className="p-4 text-center"><button onClick={()=>toggleSelectBarista(m?.memberId)}>{selectedBaristas.includes(m?.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813]"/> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto"></div>}</button></td>
                                    <td className="py-4 px-4"><div className="flex items-center gap-4"><img src={getDirectLink(m?.photoUrl) || `https://ui-avatars.com/api/?name=${m?.name || 'User'}&background=FDB813&color=3E2723`} className="w-8 h-8 rounded-full object-cover border-2 border-[#3E2723]" alt="avatar" /><div className="min-w-0"><p className="font-black text-xs truncate">{m?.name || 'Unknown'} {m?.role === 'superadmin' && <ShieldCheck size={12} className="inline text-purple-600"/>}</p><p className="text-[8px] opacity-60 truncate">"{m?.nickname || m?.program || ''}"</p><div className="flex flex-wrap gap-1 mt-1">{Array.isArray(m?.accolades) && m.accolades.map((acc, i) => (<span key={i} title={acc} className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded cursor-help">🏆</span>))}</div></div></div></td>
                                    <td className="text-center font-mono font-black text-xs">{m?.memberId || 'N/A'}{m?.studentId && <span className="block text-[8px] font-bold text-gray-400 normal-case">{m.studentId}</span>}</td>
                                    <td className="text-center"><button onClick={() => handleToggleIdLace(m)} title={m?.idLaceIssued ? ('Issued ' + formatDate(m.idLaceIssuedAt) + (m.idLaceIssuedBy ? ' by ' + m.idLaceIssuedBy : '')) : 'Mark ID lace as issued'} className={'px-2 py-1 rounded-full text-[8px] font-black uppercase ' + (m?.idLaceIssued ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700')}>{m?.idLaceIssued ? 'Issued ✓' : 'Pending'}</button></td>
                                    <td className="text-center font-black text-[10px] uppercase">
                                        <button onClick={() => isSuperAdmin && handleToggleStatus(m.memberId, m.status)} className={`px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-default ${m?.status === 'active' ? (m?.membershipType === 'new' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700') : 'bg-gray-200 text-gray-500'}`} disabled={!isSuperAdmin}>{m?.status === 'active' ? (m?.membershipType || 'ACTIVE') : 'EXPIRED'}</button>
                                    </td>
                                    <td className="text-center py-2">
                                        <div className="flex flex-col gap-1 items-center">
                                            <select className="bg-amber-50 text-[8px] font-black p-1 rounded outline-none w-32 disabled:opacity-50" value={m?.positionCategory || "Member"} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle, m.committee)} disabled={!isSuperAdmin}>{POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select>
                                            <select className="bg-white border border-amber-100 text-[8px] font-black p-1 rounded outline-none w-32 disabled:opacity-50" value={m?.specificTitle || "Member"} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value, m.committee)} disabled={!isSuperAdmin}><option value="Member">Member</option><option value="Org Adviser">Org Adviser</option>{OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}{COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}</select>
                                            {m?.positionCategory === 'Committee' && (
                                                <select className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[8px] font-black p-1 rounded outline-none w-32 focus:ring-1 focus:ring-indigo-400 disabled:opacity-50" value={m?.committee || ""} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, m.specificTitle, e.target.value)} disabled={!isSuperAdmin}><option value="">Select Dept...</option>{COMMITTEES_INFO.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
                                            )}
                                        </div>
                                    </td>
                                    <td className="text-right p-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => { setAccoladeText(""); setShowAccoladeModal({ id: m.id, memberId: m.memberId, currentAccolades: m?.accolades || [] }); }} className="text-yellow-500 p-2 hover:bg-yellow-50 rounded-lg" title="Award Accolade"><Trophy size={14}/></button>
                                            <button onClick={() => handleResetPassword(m.memberId, m.email, m.name)} className="text-blue-500 p-2 hover:bg-blue-50 rounded-lg" title="Reset Password"><RefreshCcw size={14}/></button>
                                            {isSuperAdmin && (
                                                <>
                                                    <button onClick={() => handleToggleSuperAdmin(m.memberId, m.role, m.name)} className={`p-2 rounded-lg ${m.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'text-gray-400 hover:bg-purple-50 hover:text-purple-600'}`} title={m.role === 'superadmin' ? 'Revoke Admin' : 'Make Admin'}><ShieldCheck size={14}/></button>
                                                    <button onClick={() => { setEditingMember(m); setEditMemberForm({ joinedDate: getSafeDateString(m.joinedDate) }); }} className="text-amber-500 p-2 hover:bg-amber-50 rounded-lg" title="Edit Member Details"><Pen size={14}/></button>
                                                    <button onClick={()=>initiateRemoveMember(m.memberId, m.name)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center bg-white p-4 rounded-[24px] border border-amber-100 shadow-sm mt-4">
                        <button onClick={prevPage} disabled={currentPage === 1} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-[10px] disabled:opacity-50 hover:bg-gray-200 transition-colors">Previous</button>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page <span className="text-[#3E2723] text-xs">{currentPage}</span> of {totalPages || 1}</span>
                        <button onClick={nextPage} disabled={currentPage === totalPages || !totalPages} className="px-6 py-3 bg-[#3E2723] text-[#FDB813] rounded-xl font-black uppercase text-[10px] disabled:opacity-50 hover:bg-black transition-colors">Next</button>
                    </div>
                </div>
            )}

         {view === 'reports' && isSuperAdmin && (
        !financialStats || !hubSettings || !secureKeys ? (
          /* LOADING STATE */
          <div className="flex flex-col items-center justify-center p-20 space-y-4">
            <div className="w-12 h-12 border-4 border-[#3E2723] border-t-amber-500 rounded-full animate-spin"></div>
            <p className="font-black uppercase text-[10px] text-amber-800 animate-pulse">
              Heating up the roaster... (Loading Data)
            </p>
          </div>
        ) : (
          /* ACTUAL TERMINAL */
          <div className="divide-y divide-amber-900/10 animate-fadeIn text-[#3E2723] max-w-5xl">
            <div className="flex items-center gap-4 pb-8">
              <div>
                <h3 className="font-serif text-4xl font-black uppercase">Terminal</h3>
                <p className="text-amber-500 font-black uppercase text-[10px]">The Control Roaster</p>
              </div>
            </div>

            <div className="py-4 flex gap-2 overflow-x-auto custom-scrollbar">{[['overview', 'Overview'], ['badges', 'Badges'], ['finance', 'Finance'], ['security', 'Security'], ['applications', 'Applications'], ['log', 'Activity Log'], ['system', 'System']].map(([k, l]) => (<button key={k} onClick={() => setTermTab(k)} className={`shrink-0 px-5 py-2 rounded-full text-[10px] font-black uppercase transition-all ${termTab === k ? 'bg-[#3E2723] text-[#FDB813] shadow' : 'bg-amber-50 text-amber-900 hover:bg-amber-100'}`}>{l}{k === 'applications' && pendingAppCount > 0 && <span className="ml-2 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">{pendingAppCount}</span>}</button>))}</div>
            {termTab === 'badges' && (<>
            <div className="py-8 space-y-6">
              <div><h4 className="font-black uppercase text-sm flex items-center gap-2"><Trophy size={16} className="text-amber-500"/> Badge Manager</h4><p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Create badges and set the rule for earning them. Members see these on their profile.</p></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(badgeDefs || []).map(b => (<div key={b.id} className="flex items-start gap-3 p-4 bg-white rounded-2xl border border-amber-100"><div className="text-2xl">{b.icon}</div><div className="flex-1 min-w-0"><p className="font-black text-xs uppercase">{b.name}</p><p className="text-[10px] text-gray-500 font-bold mt-0.5">{b.desc}</p><p className="text-[9px] font-black uppercase text-amber-700 mt-1">{(BADGE_KINDS.find(k => k.id === b.kind) || {}).label}{b.value !== '' && b.value != null && b.kind !== 'manual' ? ` · ${b.value}` : ''}</p></div><div className="flex flex-col gap-1"><button onClick={() => { setBadgeForm({ id: b.id, name: b.name, icon: b.icon, desc: b.desc, kind: b.kind, value: b.value }); }} className="text-[9px] font-black uppercase text-amber-700 hover:underline">Edit</button><button onClick={() => handleDeleteBadge(b)} className="text-[9px] font-black uppercase text-red-500 hover:underline">Delete</button></div></div>))}
              </div>
              <form onSubmit={handleSaveBadge} className="bg-amber-50 p-5 rounded-2xl border border-amber-100 space-y-3">
                <p className="text-[10px] font-black uppercase text-amber-800">{badgeForm.id ? 'Edit badge' : 'Add a new badge'}</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <input type="text" placeholder="Badge name" className="p-3 border rounded-xl text-xs font-bold md:col-span-2" value={badgeForm.name} onChange={e => setBadgeForm({ ...badgeForm, name: e.target.value })} />
                  <input type="text" placeholder="Icon (an emoji, e.g. 🏅)" className="p-3 border rounded-xl text-xs font-bold" value={badgeForm.icon} onChange={e => setBadgeForm({ ...badgeForm, icon: e.target.value })} />
                  <select className="p-3 border rounded-xl text-xs font-bold" value={badgeForm.kind} onChange={e => setBadgeForm({ ...badgeForm, kind: e.target.value, value: '' })}>{BADGE_KINDS.map(k => <option key={k.id} value={k.id}>{k.label}</option>)}</select>
                </div>
                <input type="text" placeholder="How to earn it (shown to members), e.g. Join 20 volunteer shifts." className="w-full p-3 border rounded-xl text-xs font-bold" value={badgeForm.desc} onChange={e => setBadgeForm({ ...badgeForm, desc: e.target.value })} />
                {['years', 'volunteer', 'modules'].includes(badgeForm.kind) && (<input type="number" min="1" placeholder={(BADGE_KINDS.find(k => k.id === badgeForm.kind) || {}).hint} className="w-full p-3 border rounded-xl text-xs font-bold" value={badgeForm.value} onChange={e => setBadgeForm({ ...badgeForm, value: e.target.value })} />)}
                {badgeForm.kind === 'category' && (<select className="w-full p-3 border rounded-xl text-xs font-bold" value={badgeForm.value} onChange={e => setBadgeForm({ ...badgeForm, value: e.target.value })}><option value="">Choose position category</option>{['Member', 'Officer', 'Committee', 'Execomm', 'Alumni'].map(c => <option key={c} value={c}>{c}</option>)}</select>)}
                {badgeForm.kind === 'manual' && (<p className="text-[10px] font-bold text-amber-800">Manual badge: an officer awards it with "Give Accolade" in the Registry, typing exactly "{badgeForm.name || 'the badge name'}".</p>)}
                <div className="flex gap-2 flex-wrap"><button type="submit" disabled={badgeBusy} className="bg-[#3E2723] text-[#FDB813] px-6 py-3 rounded-xl font-black uppercase text-[10px] disabled:opacity-50">{badgeBusy ? 'Saving...' : (badgeForm.id ? 'Update badge' : 'Add badge')}</button>{badgeForm.id && <button type="button" onClick={() => setBadgeForm({ id: '', name: '', icon: '', desc: '', kind: 'manual', value: '' })} className="bg-white border px-6 py-3 rounded-xl font-black uppercase text-[10px]">Cancel</button>}<button type="button" onClick={handleResetBadges} className="ml-auto text-[10px] font-black uppercase text-red-500 hover:underline">Reset to original badges</button></div>
              </form>
            </div>

            </>)}
{termTab === 'overview' && (<>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 md:divide-x divide-amber-900/10 py-8">
              <div className="px-4 py-2 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                <p className="text-2xl font-black text-[#3E2723]">{(financialStats?.totalPaid || 0) + (financialStats?.exemptCount || 0)}</p>
              </div>
              <div className="px-4 py-2 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Paid</p>
                <p className="text-2xl font-black text-green-600">{financialStats?.totalPaid || 0}</p>
              </div>
              <div className="px-4 py-2 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Exempt</p>
                <p className="text-2xl font-black text-blue-600">{financialStats?.exemptCount || 0}</p>
              </div>
              <div className="px-4 py-2 text-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Apps</p>
                <p className="text-2xl font-black text-purple-600">{(committeeApps || []).filter(a => !['accepted','denied'].includes(a.status)).length}</p>
              </div>
            </div>

        {/* MEMBERS CARE SNAPSHOT */}
        {(() => {
            const all = (members || []).filter(m => m != null && m.positionCategory !== 'Blacklisted');
            const active = all.filter(m => m.status === 'active').length; const issued = all.filter(m => m.idLaceIssued).length;
            const lowStock = (inventory || []).filter(i => i && Number(i.quantity || 0) <= Number(i.reorderLevel || 0)).length;
            const cell = (label, val, tone) => (<div className="text-center px-2"><p className="text-[9px] font-black uppercase text-gray-400">{label}</p><p className={`text-2xl font-black ${tone || ''}`}>{val}</p></div>);
            return (
            <div className="py-8">
                <div className="flex items-center justify-between mb-6"><h4 className="font-black uppercase text-sm flex items-center gap-2"><Users size={18}/> Member’s Care Snapshot</h4><span className="text-amber-600 text-[10px] font-black">LIVE</span></div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-y-6 md:divide-x divide-amber-900/10">
                    {cell('Members', all.length)}{cell('Active', active, 'text-green-600')}{cell('Expired', all.length - active, 'text-gray-500')}{cell('ID Lace Issued', `${issued}/${all.length}`, 'text-amber-600')}{cell('Low Stock Items', lowStock, lowStock ? 'text-red-600' : 'text-green-600')}
                </div>
            </div>);
        })()}

        </>)}
{termTab === 'finance' && (<>
        <div className="py-8 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-6"><Banknote size={32}/><div className="leading-tight"><h4 className="font-serif text-2xl font-black uppercase">Daily Cash Key</h4><p className="text-[10px] font-black uppercase opacity-60">Verification Code</p></div></div>
                <div className="flex items-center gap-3"><div className="font-mono text-4xl font-black tracking-widest">{currentDailyKey || "----"}</div><button onClick={handleRotateDailyKey} title="Generate a new cash key" className="p-3 rounded-lg border border-amber-900/20 hover:bg-amber-50"><RefreshCcw size={18}/></button></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-amber-800">GCash Number: <span className="font-mono">{hubSettings?.gcashNumber}</span></p>
                        <input type="text" placeholder="Update GCash..." className="w-full mt-2 p-2 bg-transparent border-b border-amber-900/20 text-xs font-bold outline-none" value={newGcashNumber} onChange={(e) => setNewGcashNumber(e.target.value)} />
                    </div>
                    <button onClick={async () => { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), { gcashNumber: newGcashNumber }); setNewGcashNumber(''); }} className="p-3 rounded-lg border border-amber-900/20 hover:bg-amber-50 font-black uppercase text-[10px]"><RefreshCcw size={16}/></button>
                </div>

                <button onClick={() => {
                    const headers = ["Name", "ID", "Type", "Status", "Ref No", "Date"];
                    const rows = members.filter(m => m.paymentStatus === 'paid').map(m => [m.name, m.memberId, m.membershipType, m.paymentStatus, m.paymentDetails?.refNo || 'N/A', formatDate(m.joinedDate)]);
                    generateCSV(headers, rows, `LBA_Finance_${new Date().toLocaleDateString()}.csv`);
                }} className="text-green-700 border border-green-700/30 px-6 py-3 rounded-lg font-black uppercase text-xs flex items-center justify-center gap-3 hover:bg-green-50">
                    <Download size={20}/> Export Financial Report
                </button>
            </div>
        </div>
        
        </>)}
{termTab === 'security' && (<>
        <div className="py-8">
            <div className="flex justify-between items-center mb-6"><h4 className="font-serif text-2xl font-black uppercase">Security Vault</h4><Lock size={20} className="text-amber-600"/></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className=""><span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Officer Key</span><span className="font-mono text-xl font-black text-[#3E2723] tracking-wider">{secureKeys?.officerKey || "N/A"}</span></div>
                <div className=""><span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Head Key</span><span className="font-mono text-xl font-black text-[#3E2723] tracking-wider">{secureKeys?.headKey || "N/A"}</span></div>
                <div className=""><span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Comm Key</span><span className="font-mono text-xl font-black text-[#3E2723] tracking-wider">{secureKeys?.commKey || "N/A"}</span></div>
                <div className=" relative overflow-hidden"><div className="absolute top-0 right-0 text-amber-600 text-[8px] font-black">PAYMENT BYPASS</div><span className="text-[10px] font-black uppercase text-gray-400 block mb-1">Bypass Key</span><span className="font-mono text-xl font-black text-[#3E2723] tracking-wider">{secureKeys?.bypassKey || "N/A"}</span></div>
            </div>
            <button onClick={handleRotateSecurityKeys} className="mt-6 text-red-600 border border-red-600/30 px-5 py-3 rounded-lg font-black uppercase text-[10px] hover:bg-red-50 transition-colors flex items-center justify-center gap-2"><RefreshCcw size={14}/> Rotate Security Keys</button>
        </div>

        </>)}
{termTab === 'applications' && (<>
        <div className="py-8">
            <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2 text-purple-700"><Users size={16}/> Join the Team Applications</h4>
            <div className="max-h-64 overflow-y-auto space-y-2">
                {committeeApps.length > 0 ? [...committeeApps].sort((a, b) => postTime(b) - postTime(a)).map(app => (
                    <div key={app.id} className="flex justify-between items-center py-3 border-b border-amber-900/10 last:border-0">
                        <div>
                            <span className="font-black text-xs uppercase block">{app.name}</span>
                            <span className="text-[10px] font-bold text-purple-400 uppercase">{committeeTitle(app.committee)} · {app.role} · {app.status}</span><span className="block text-[10px] font-bold text-gray-400 uppercase mt-0.5">Submitted {(() => { const ts = app.createdAt || app.statusUpdatedAt; const d = ts && ts.toDate ? ts.toDate() : (ts ? new Date(ts) : null); return d && !isNaN(d.getTime()) ? d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'date not recorded'; })()}</span>{app.appType === 'officer' && (<details className="mt-2 normal-case"><summary className="cursor-pointer text-[10px] font-black text-purple-600 uppercase">View application</summary><div className="mt-2 space-y-2 text-[11px] text-gray-700 font-medium border-l-2 border-amber-900/10 pl-3">{app.resumeLink && /^https?:\/\//i.test(app.resumeLink) && <p><a href={app.resumeLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-black underline">Open resume</a></p>}{app.studentId && <p><b>Student ID:</b> {app.studentId} · {app.program}</p>}{app.intro && <p><b>Introduction:</b> {app.intro}</p>}{app.whyFit && <p><b>Why fit:</b> {app.whyFit}</p>}{(app.answers || []).map((x, k) => <p key={k}><b>{x.q}</b><br/>{x.a}</p>)}{app.plan && <p><b>First 30 days:</b> {app.plan}</p>}</div></details>)}
                        </div>
                        <div className="flex gap-2">
                            {['pending'].includes(app.status) && (<button onClick={() => initiateAppAction(app, 'for_interview')} title="Invite for interview" className="text-blue-600 p-2 rounded-lg hover:bg-blue-50"><Mail size={14}/></button>)}
                            {app.status !== 'accepted' && (<button onClick={() => initiateAppAction(app, 'accepted')} title="Accept" className="text-purple-700 p-2 rounded-lg hover:bg-purple-50"><CheckCircle2 size={14}/></button>)}
                            {!['accepted', 'denied'].includes(app.status) && (<button onClick={() => initiateAppAction(app, 'denied')} title="Decline" className="text-gray-500 p-2 rounded-lg hover:bg-gray-100"><X size={14}/></button>)}
                            <button onClick={() => { if (confirm('Delete this application?')) deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'applications', app.id)); }} title="Delete" className="text-red-500 p-2 rounded-lg hover:bg-red-50"><Trash2 size={14}/></button>
                        </div>
                    </div>
                )) : <p className="text-center py-6 text-[10px] font-bold text-gray-400 uppercase">No active applications</p>}
            </div>
        </div>

        </>)}
{termTab === 'log' && (<>
        <div className="py-8 max-h-96 overflow-y-auto custom-scrollbar">
            <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2"><ClipboardList size={16}/> Operations Log</h4>
            <div className="space-y-2">
                {logs && logs.length > 0 ? ( logs.map(log => ( <div key={log.id} className="flex justify-between items-center py-2 border-b border-amber-900/5 text-xs"><div><span className="font-bold text-[#3E2723] block">{log.action}</span><span className="text-gray-500">{log.details}</span></div><div className="text-right"><span className="block font-bold text-amber-700">{log.actor}</span><span className="text-[9px] text-gray-400">{log.timestamp?.toDate ? formatDate(log.timestamp.toDate()) : 'Just now'}</span></div></div> )) ) : ( <p className="text-center text-gray-400 text-xs py-4">No recent activity recorded.</p> )}
            </div>
        </div>

        </>)}
{termTab === 'system' && (<>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 py-8">
            <div className="">
                <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2"><Settings2 size={16}/> System Controls</h4>
                <div className="space-y-4">
                    <div className="flex justify-between items-center py-3 border-b border-amber-900/10"><span className="text-xs font-bold text-gray-600">Maintenance Mode</span><button onClick={handleToggleMaintenance} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white transition-colors ${hubSettings.maintenanceMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-gray-400 hover:bg-gray-500'}`}>{hubSettings.maintenanceMode ? "ACTIVE" : "OFF"}</button></div>
                    <div className="flex justify-between items-center py-3 border-b border-amber-900/10"><span className="text-xs font-bold text-gray-600">Registration</span><button onClick={handleToggleRegistration} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white transition-colors ${hubSettings.registrationOpen ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600'}`}>{hubSettings.registrationOpen ? "OPEN" : "CLOSED"}</button></div>
                    <div className="flex justify-between items-center py-3 border-b border-amber-900/10"><span className="text-xs font-bold text-gray-600">Renewal Season</span><button onClick={handleToggleRenewalMode} className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase text-white transition-colors ${hubSettings.renewalMode ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400 hover:bg-gray-500'}`}>{hubSettings.renewalMode ? "ACTIVE" : "OFF"}</button></div>
                    <div className="flex justify-between items-center py-3 border-b border-amber-900/10"><span className="text-xs font-bold text-gray-600">Payment Methods</span><button onClick={handleToggleAllowedPayment} className="px-4 py-2 bg-blue-100 text-blue-700 rounded-xl text-[10px] font-bold uppercase hover:bg-blue-200">{hubSettings.allowedPayment === 'gcash_only' ? 'GCash Only' : 'Cash & GCash'}</button></div>
                </div>
            </div>
           <div className="">
                <h4 className="font-black uppercase text-sm mb-4 flex items-center gap-2 text-red-700"><AlertOctagon size={16}/> Danger Zone</h4>
                <div className="space-y-3">
                    <button onClick={handleSanitizeDatabase} className="w-full text-red-600 border border-red-200 py-3 rounded-lg font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-red-50"><Database size={14}/> Sanitize Database</button>
                    <button onClick={handleMigrateToRenewal} className="w-full text-orange-600 border border-orange-200 py-3 rounded-lg font-black uppercase text-[10px] flex items-center justify-center gap-2 hover:bg-orange-50"><RefreshCcw size={14}/> Migrate: Set All to Renewal</button>
                   </div>
              </div>
            </div>
</>)}
          </div>
        ) 
      )} 

            {view === 'settings' && (
                  <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto">
                      <div className="flex items-center gap-4 mb-8"><div className="p-4 bg-amber-100 text-amber-700 rounded-2xl"><Settings2 size={32} /></div><div><h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Settings</h3><p className="text-gray-500 font-bold text-xs uppercase">Manage your barista profile</p></div></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm">
                              <h4 className="font-black text-lg uppercase text-[#3E2723] mb-6 flex items-center gap-2"><User size={20} className="text-amber-500"/> Personal Details</h4>
                              <form onSubmit={handleUpdateProfile} className="space-y-4">
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label><input type="text" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm uppercase" value={settingsForm.name || ''} onChange={e => setSettingsForm({...settingsForm, name: e.target.value.toUpperCase()})} placeholder="LAST, FIRST MI." /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nickname / Display Name</label><input type="text" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.nickname || ''} onChange={e => setSettingsForm({...settingsForm, nickname: e.target.value})} placeholder="How should we call you?" /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Address (LPU network email or Gmail)</label><input type="email" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.email || ''} onChange={e => setSettingsForm({...settingsForm, email: e.target.value})} placeholder="email@example.com" /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">LPU Student ID No.</label><input type="text" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm uppercase" value={settingsForm.studentId || ''} onChange={e => setSettingsForm({...settingsForm, studentId: e.target.value})} placeholder="Student ID number" /></div>
                                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"><span className="text-[10px] font-bold text-gray-400 uppercase">ID Lace</span><span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${profile.idLaceIssued ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{profile.idLaceIssued ? `Issued${profile.idLaceIssuedAt ? ' · ' + formatDate(profile.idLaceIssuedAt) : ''}` : 'Not yet issued'}</span></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Profile Photo URL</label><input type="text" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.photoUrl || ''} onChange={e => setSettingsForm({...settingsForm, photoUrl: e.target.value})} placeholder="https://..." /><p className="text-[9px] text-gray-400 mt-1 ml-1">Paste a direct link to an image (Google Drive/Photos links supported).</p></div>
                                  <div className="grid grid-cols-2 gap-4">
                                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Birth Month</label><select className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.birthMonth || ''} onChange={e => setSettingsForm({...settingsForm, birthMonth: e.target.value})}><option value="">Month</option>{MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}</select></div>
                                      <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Birth Day</label><input type="number" min="1" max="31" className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={settingsForm.birthDay || ''} onChange={e => setSettingsForm({...settingsForm, birthDay: e.target.value})} /></div>
                                  </div>
                                  <div className="pt-4"><button type="submit" disabled={savingSettings} className="w-full py-4 bg-[#3E2723] text-[#FDB813] rounded-2xl font-black uppercase text-xs hover:bg-black transition-colors disabled:opacity-50">{savingSettings ? "Saving..." : "Update Profile"}</button></div>
                              </form>
                          </div>
                          <div className="bg-white p-8 rounded-[40px] border-2 border-amber-100 shadow-sm">
                              <h4 className="font-black text-lg uppercase text-[#3E2723] mb-6 flex items-center gap-2"><Lock size={20} className="text-red-500"/> Security</h4>
                              <form onSubmit={handleChangePassword} className="space-y-4">
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Current Password</label><input type="password" required className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={passwordForm.current} onChange={e => setPasswordForm({...passwordForm, current: e.target.value})} /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">New Password</label><input type="password" required className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={passwordForm.new} onChange={e => setPasswordForm({...passwordForm, new: e.target.value})} /></div>
                                  <div><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Confirm New Password</label><input type="password" required className="w-full p-4 bg-gray-50 rounded-xl border border-transparent focus:border-amber-300 outline-none font-bold text-sm" value={passwordForm.confirm} onChange={e => setPasswordForm({...passwordForm, confirm: e.target.value})} /></div>
                                  <div className="pt-4"><button type="submit" className="w-full py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-xs hover:bg-red-600 transition-colors">Change Password</button></div>
                              </form>
                          </div>
                      </div>
                      <div className="bg-[#3E2723] p-8 rounded-[40px] text-white/50 text-center text-xs"><p>Member ID: <span className="font-mono text-white font-bold">{profile.memberId}</span></p><p className="mt-2">Need help with your account? Contact the PR Committee.</p></div>
                  </div>
                )}
            </ErrorBoundary>
             <DataPrivacyFooter />
          </main>
        </div>
      </div>
       );
      };

export default function App() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(() => { try { return JSON.parse(localStorage.getItem('lba_profile')); } catch { return null; } });
    useEffect(() => { const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => { setUser(firebaseUser); if (!firebaseUser) { setProfile(null); localStorage.removeItem('lba_profile'); } }); return () => unsubscribe(); }, []);
    const logout = async () => { await signOut(auth); setProfile(null); localStorage.removeItem('lba_profile'); };
    useEffect(() => { if (profile && user && auth.currentUser && auth.currentUser.isAnonymous) { logout(); } }, [profile, user]);
    if (!profile) { return <Login user={user} onLoginSuccess={setProfile} />; }
    return <Dashboard user={user} profile={profile} setProfile={setProfile} logout={logout} />;
}
