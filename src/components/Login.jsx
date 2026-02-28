import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, onSnapshot, getDocs, query, where, limit, runTransaction } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';
import { ORG_LOGO_URL, PROGRAMS, MONTHS, getDirectLink, generateLBAId, getDailyCashPasskey, getMemberIdMeta } from '../utils/helpers';
import { Loader2, Lock, Mail, Coffee, HelpCircle, X } from 'lucide-react';

const Login = ({ onLoginSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  
  // Input States
  const [memberIdInput, setMemberIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [regType, setRegType] = useState('New Member');
  const [payMethod, setPayMethod] = useState('GCash');
  const [refNo, setRefNo] = useState('');
  const [formData, setFormData] = useState({
    fName: '', mi: '', lName: '', email: '', prog: '', pass: '', confirm: '', bMonth: '1', bDay: '1', key: ''
  });

  const [secureKeys, setSecureKeys] = useState(null);

  useEffect(() => {
    return onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'keys'), (s) => s.exists() && setSecureKeys(s.data()));
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    
    if (authMode === 'register' && formData.pass !== formData.confirm) {
      return setError("Passwords do not match!");
    }

    setLoading(true);
    try {
      if (authMode === 'register') {
        const currentUser = (await signInAnonymously(auth)).user;
        const counterRef = doc(db, 'artifacts', appId, 'public', 'data', 'settings', 'counters');
        
        const profile = await runTransaction(db, async (tx) => {
          const snap = await tx.get(counterRef);
          const count = snap.exists() ? (snap.data().memberCount || 0) : 0;

          let cat = 'Member', role = 'member', payStatus = 'unpaid', title = 'Member';
          const uk = formData.key.trim().toUpperCase();
          if (uk && uk === secureKeys?.officerKey?.toUpperCase()) { cat = 'Officer'; role = 'admin'; payStatus = 'exempt'; title = 'Officer'; }
          else if (uk && uk === secureKeys?.headKey?.toUpperCase()) { cat = 'Committee'; payStatus = 'exempt'; title = 'Committee Head'; }

          const lbaId = generateLBAId(cat, count);
          const meta = getMemberIdMeta();
          
          const data = {
            uid: currentUser.uid, memberId: lbaId,
            name: `${formData.fName} ${formData.mi ? formData.mi + '. ' : ''}${formData.lName}`.toUpperCase(),
            email: formData.email.toLowerCase(), password: formData.pass, program: formData.prog,
            birthMonth: parseInt(formData.bMonth), birthDay: parseInt(formData.bDay),
            registrationType: regType, paymentMethod: payMethod,
            paymentRef: payMethod === 'GCash' ? refNo : 'CASH_PENDING',
            paymentStatus: payStatus, positionCategory: cat, specificTitle: title, role, status: 'active',
            lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, joinedDate: new Date().toISOString()
          };

          tx.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', lbaId), data);
          tx.set(counterRef, { memberCount: count + 1 }, { merge: true });
          return data;
        });
        onLoginSuccess(profile);
      } else {
        const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'registry'), where('memberId', '==', memberIdInput.trim().toUpperCase()), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) throw new Error("ID not found.");
        const userData = snap.docs[0].data();
        if (userData.password !== password) throw new Error("Incorrect password.");
        onLoginSuccess(userData);
      }
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF7] p-6 text-[#3E2723]">
      {/* FORGOT PASSWORD MODAL */}
      {showForgotHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-[#3E2723]/60 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-[40px] shadow-2xl max-w-xs w-full text-center relative border-b-8 border-amber-400">
            <button onClick={() => setShowForgotHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black"><X size={20}/></button>
            <HelpCircle size={40} className="mx-auto text-amber-500 mb-4" />
            <h2 className="font-serif text-lg font-black uppercase mb-2">Lost Your Keys?</h2>
            <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase">
              For security, please contact an <span className="text-[#3E2723]">LBA Officer</span> or the <span className="text-[#3E2723]">Registry Head</span> to verify your identity and reset your password.
            </p>
            <button onClick={() => setShowForgotHelp(false)} className="mt-6 w-full py-3 bg-[#3E2723] text-[#FDB813] rounded-xl font-black text-[10px] uppercase">Got it</button>
          </div>
        </div>
      )}

      <div className="bg-white p-10 md:p-14 rounded-[60px] shadow-2xl max-w-md w-full border-b-[12px] border-amber-400 relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-10 text-center">
          <img src={getDirectLink(ORG_LOGO_URL)} className="w-24 h-24 mb-6 object-contain" alt="LBA" />
          <h1 className="font-serif text-xl font-black uppercase leading-tight tracking-tight px-4">
            LPU Baristas' Association
          </h1>
          <p className="text-[11px] font-black uppercase tracking-[0.4em] text-amber-600 mt-2">
            Kaperata Hub
          </p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase text-center border border-red-100">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-4">
          {authMode === 'login' ? (
            <div className="space-y-3">
              <input type="text" placeholder="BARISTA ID" className="w-full p-4 bg-amber-50/50 rounded-2xl font-black text-xs outline-none uppercase" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value)} required />
              <div className="space-y-2">
                <input type="password" placeholder="PASSWORD" className="w-full p-4 bg-amber-50/50 rounded-2xl font-black text-xs outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <div className="text-right px-2">
                   <button type="button" onClick={() => setShowForgotHelp(true)} className="text-[9px] font-black uppercase text-amber-800/60 hover:text-amber-800 transition-colors">Forgot Password?</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Registration Fields... Same as before */}
              <div className="grid grid-cols-2 gap-2">
                <select className="p-3 bg-amber-100 rounded-xl text-[10px] font-black uppercase outline-none" value={regType} onChange={(e) => setRegType(e.target.value)}>
                  <option value="New Member">New (₱100)</option>
                  <option value="For Renewal">Renewal (₱50)</option>
                </select>
                <select className="p-3 bg-amber-100 rounded-xl text-[10px] font-black uppercase outline-none" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                  <option value="GCash">GCash</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>
              <div className="grid grid-cols-5 gap-1">
                <input type="text" placeholder="FIRST" className="col-span-2 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, fName: e.target.value})} required />
                <input type="text" placeholder="MI" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none text-center" onChange={(e)=>setFormData({...formData, mi: e.target.value})} />
                <input type="text" placeholder="LAST" className="col-span-2 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, lName: e.target.value})} required />
              </div>
              <input type="email" placeholder="LPU EMAIL" className="w-full p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, email: e.target.value})} required />
              <div className="grid grid-cols-2 gap-2">
                <input type="password" placeholder="PASSWORD" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, pass: e.target.value})} required />
                <input type="password" placeholder="CONFIRM" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, confirm: e.target.value})} required />
              </div>
              <input type="text" placeholder="ACCESS KEY (OPTIONAL)" className="w-full p-3 bg-[#3E2723] text-white rounded-xl text-[10px] font-black uppercase outline-none placeholder:text-white/20" onChange={(e)=>setFormData({...formData, key: e.target.value})} />
            </div>
          )}

          <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-5 rounded-[28px] font-black uppercase text-xs flex justify-center items-center gap-2 shadow-xl hover:scale-[1.02] active:scale-95 transition-all mt-4">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (authMode === 'login' ? 'Brew Session' : 'Brew Membership')}
          </button>
        </form>

        <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-amber-800 underline decoration-2 underline-offset-4 text-center">
          {authMode === 'login' ? 'New Barista? Join Us' : 'Already a Member? Login'}
        </button>
      </div>
      
      <div className="mt-10 h-1 w-12 bg-amber-200 rounded-full" />
    </div>
  );
};

export default Login;
