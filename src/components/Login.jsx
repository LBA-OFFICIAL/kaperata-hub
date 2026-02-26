import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, onSnapshot, getDocs, query, where, limit, runTransaction, updateDoc } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';
import { 
  ORG_LOGO_URL, PROGRAMS, MONTHS, SOCIAL_LINKS, 
  getDirectLink, getMemberIdMeta, generateLBAId, getDailyCashPasskey 
} from '../utils/helpers';
import { Loader2, Coffee, ShieldCheck, LifeBuoy } from 'lucide-react';

const Login = ({ onLoginSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState('login');
  const [memberIdInput, setMemberIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [program, setProgram] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [inputKey, setInputKey] = useState('');
  const [registerCommittee, setRegisterCommittee] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [refNo, setRefNo] = useState('');
  const [cashOfficerKey, setCashOfficerKey] = useState('');
  const [membershipType, setMembershipType] = useState('new');
  const [error, setError] = useState(initialError || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [pendingProfile, setPendingProfile] = useState(null);
  const [hubSettings, setHubSettings] = useState({ registrationOpen: true, maintenanceMode: false, gcashNumber: '09063751402' });
  const [secureKeys, setSecureKeys] = useState(null);
  const [showForgotModal, setShowForgotModal] = useState(false);

  useEffect(() => {
    const unsubOps = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'ops'), (s) => s.exists() && setHubSettings(s.data()));
    const unsubKeys = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()));
    return () => { unsubOps(); unsubKeys(); };
  }, []);

 const handleAuth = async (e) => {
  e.preventDefault();
  if (loading) return;
  setError('');
  setLoading(true);
  setStatusMessage('Authenticating...');

  try {
    let currentUser = auth.currentUser;
    if (!currentUser) {
      const result = await signInAnonymously(auth);
      currentUser = result.user;
    }

    if (authMode === 'register') {
      const registryRef = collection(db, 'artifacts', appId, 'public', 'data', 'registry');
      const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');

      const newProfile = await runTransaction(db, async (transaction) => {
        const counterSnap = await transaction.get(counterRef);
        // FIX: renamed to registrationCount to avoid redeclaration
        const registrationCount = (counterSnap.exists() ? counterSnap.data().memberCount || 0 : 0) + 1;
        
        let pc = 'Member', st = 'Member', role = 'member', pay = 'unpaid';
        if (inputKey) {
          const uk = inputKey.trim().toUpperCase();
          if (uk === secureKeys?.officerKey?.toUpperCase()) { pc = 'Officer'; role = 'admin'; pay = 'exempt'; }
          else if (uk === secureKeys?.headKey?.toUpperCase()) { pc = 'Committee'; st = 'Committee Head'; pay = 'exempt'; }
          else if (uk === secureKeys?.commKey?.toUpperCase()) { pc = 'Committee'; st = 'Committee Member'; pay = 'exempt'; }
        }

        const assignedId = generateLBAId(pc, registrationCount - 1);
        const meta = getMemberIdMeta();
        const profileData = {
          uid: currentUser.uid,
          name: `${firstName} ${middleInitial ? middleInitial + '. ' : ''}${lastName}`.toUpperCase(),
          email: email.toLowerCase(),
          password,
          program,
          birthMonth: parseInt(birthMonth),
          birthDay: parseInt(birthDay),
          positionCategory: pc,
          specificTitle: st,
          memberId: assignedId,
          role,
          status: 'active',
          paymentStatus: pay,
          lastRenewedSem: meta.sem,
          lastRenewedSY: meta.sy,
          joinedDate: new Date().toISOString()
        };

        transaction.set(doc(registryRef, assignedId), profileData);
        transaction.set(counterRef, { memberCount: registrationCount }, { merge: true });
        return profileData;
      });

      if (newProfile.paymentStatus === 'exempt') {
        onLoginSuccess(newProfile);
      } else {
        setPendingProfile(newProfile);
        setAuthMode('payment');
      }
    } else if (authMode === 'login') {
      const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) throw new Error("ID not found.");
      const userData = snap.docs[0].data();
      if (userData.password !== password) throw new Error("Incorrect password.");
      onLoginSuccess(userData);
    }
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
    setStatusMessage('');
  }
};

  const activeBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-[#3E2723] text-[#FDB813]";
  const inactiveBtnClass = "flex-1 p-4 rounded-2xl border font-black uppercase text-[10px] bg-amber-50 text-amber-900";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-4 text-[#3E2723] relative">
      <div className="bg-white p-10 rounded-[48px] shadow-2xl max-w-md w-full border-t-[12px] border-[#3E2723]">
        <div className="flex flex-col items-center mb-10 text-center">
          <img src={getDirectLink(ORG_LOGO_URL)} alt="LBA" className="w-32 h-32 object-contain mb-4" />
          <h1 className="font-serif text-xl font-black uppercase">LPU Baristas' Association</h1>
          <p className="text-[#FDB813] font-black tracking-[0.3em] text-[10px] bg-[#3E2723] px-4 py-1 rounded-full mt-2 uppercase">KAPERATA HUB</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-xl text-center text-xs font-bold">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' ? (
            <div className="space-y-3">
              <input type="text" required placeholder="Member ID" className="w-full p-4 border border-amber-200 rounded-2xl font-bold uppercase text-xs" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())} />
              <input type="password" required placeholder="Password" className="w-full p-4 border border-amber-200 rounded-2xl font-bold text-xs" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          ) : (
            <div className="space-y-3">
               <div className="grid grid-cols-5 gap-2">
                  <input type="text" required placeholder="FIRST" className="col-span-2 p-3 border border-amber-200 rounded-xl text-xs font-bold uppercase" value={firstName} onChange={(e) => setFirstName(e.target.value.toUpperCase())} />
                  <input type="text" placeholder="MI" maxLength="1" className="p-3 border border-amber-200 rounded-xl text-xs text-center font-bold uppercase" value={middleInitial} onChange={(e) => setMiddleInitial(e.target.value.toUpperCase())} />
                  <input type="text" required placeholder="LAST" className="col-span-2 p-3 border border-amber-200 rounded-xl text-xs font-bold uppercase" value={lastName} onChange={(e) => setLastName(e.target.value.toUpperCase())} />
               </div>
               <input type="email" required placeholder="LPU Email" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={email} onChange={(e) => setEmail(e.target.value)} />
               <select required className="w-full p-3 border border-amber-200 rounded-xl text-xs font-black uppercase" value={program} onChange={(e) => setProgram(e.target.value)}>
                  <option value="">Select Program</option>
                  {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
               </select>
               <input type="password" required placeholder="Password" className="w-full p-3 border border-amber-200 rounded-xl text-xs font-bold" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-2xl hover:bg-black transition-all font-black uppercase flex justify-center items-center gap-2 text-xs">
            {loading ? <Loader2 className="animate-spin" size={20}/> : (authMode === 'login' ? 'Enter Hub' : 'Register')}
          </button>
        </form>

        <p className="text-center mt-6 text-[10px] text-amber-800 uppercase font-black">
          {authMode === 'login' ? (
            <button onClick={() => setAuthMode('register')} className="text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Not Yet Registered? Brew With Us!</button>
          ) : (
            <button onClick={() => setAuthMode('login')} className="text-[#3E2723] underline decoration-[#FDB813] decoration-4 underline-offset-8">Back to Login</button>
          )}
        </p>
      </div>
    </div>
  );
};

export default Login;
