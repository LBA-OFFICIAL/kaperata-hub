import React, { useState, useEffect } from 'react';
import { signInAnonymously } from 'firebase/auth';
import { collection, doc, onSnapshot, getDocs, query, where, limit, runTransaction } from 'firebase/firestore';
import { auth, db, appId } from '../firebase';
import { ORG_LOGO_URL, PROGRAMS, MONTHS, getDirectLink, generateLBAId, getDailyCashPasskey, getMemberIdMeta } from '../utils/helpers';
import { Loader2, X, HelpCircle, ArrowRight, ArrowLeft, Coffee } from 'lucide-react';

const Login = ({ onLoginSuccess, initialError }) => {
  const [authMode, setAuthMode] = useState('login');
  const [regStep, setRegStep] = useState(1); // 1: Profile, 2: Payment
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [showForgotHelp, setShowForgotHelp] = useState(false);
  
  // Login State
  const [memberIdInput, setMemberIdInput] = useState('');
  const [password, setPassword] = useState('');

  // Register State
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

    // Step 1 Validation
    if (authMode === 'register' && regStep === 1) {
      if (formData.pass !== formData.confirm) return setError("Passwords do not match!");
      if (!formData.prog) return setError("Please select a program.");
      setRegStep(2);
      return;
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
            <button onClick={() => setShowForgotHelp(false)} className="absolute top-4 right-4 text-gray-400"><X size={20}/></button>
            <HelpCircle size={40} className="mx-auto text-amber-500 mb-4" />
            <h2 className="font-serif text-lg font-black uppercase mb-2">Lost Your Keys?</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed">Contact an Officer to verify your identity and retrieve your password.</p>
          </div>
        </div>
      )}

      <div className="bg-white p-10 md:p-14 rounded-[60px] shadow-2xl max-w-md w-full border-b-[12px] border-amber-400 relative">
        <div className="flex flex-col items-center mb-8 text-center">
          <img src={getDirectLink(ORG_LOGO_URL)} className="w-20 h-20 mb-4 object-contain" alt="LBA" />
          <h1 className="font-serif text-xl font-black uppercase tracking-tight leading-tight">LPU Baristas' Association</h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-600 mt-1">Kaperata Hub</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase text-center">{error}</div>}

        <form onSubmit={handleAuth} className="space-y-3">
          {authMode === 'login' ? (
            <div className="space-y-3">
              <input type="text" placeholder="BARISTA ID" className="w-full p-4 bg-amber-50/50 rounded-2xl font-black text-xs outline-none uppercase" value={memberIdInput} onChange={(e) => setMemberIdInput(e.target.value)} required />
              <div className="space-y-1">
                <input type="password" placeholder="PASSWORD" className="w-full p-4 bg-amber-50/50 rounded-2xl font-black text-xs outline-none" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowForgotHelp(true)} className="w-full text-right text-[9px] font-black uppercase text-amber-800/50 px-2">Forgot Password?</button>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-xs flex justify-center items-center gap-2 mt-2">
                {loading ? <Loader2 className="animate-spin" /> : 'Enter Hub'}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {regStep === 1 ? (
                <>
                  {/* STEP 1: PROFILE */}
                  <div className="grid grid-cols-5 gap-1">
                    <input type="text" placeholder="FIRST" className="col-span-2 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, fName: e.target.value})} value={formData.fName} required />
                    <input type="text" placeholder="MI" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none text-center" onChange={(e)=>setFormData({...formData, mi: e.target.value})} value={formData.mi} />
                    <input type="text" placeholder="LAST" className="col-span-2 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, lName: e.target.value})} value={formData.lName} required />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <select className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, prog: e.target.value})} value={formData.prog} required>
                      <option value="">SELECT PROGRAM</option>
                      {PROGRAMS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                    <div className="flex gap-1">
                      <select className="w-2/3 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black uppercase outline-none" onChange={(e)=>setFormData({...formData, bMonth: e.target.value})} value={formData.bMonth}>
                        {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label.slice(0,3)}</option>)}
                      </select>
                      <input type="number" placeholder="DD" min="1" max="31" className="w-1/3 p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none text-center" onChange={(e)=>setFormData({...formData, bDay: e.target.value})} value={formData.bDay} required />
                    </div>
                  </div>

                  <input type="email" placeholder="LPU EMAIL" className="w-full p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, email: e.target.value})} value={formData.email} required />
                  <div className="grid grid-cols-2 gap-2">
                    <input type="password" placeholder="PASSWORD" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, pass: e.target.value})} value={formData.pass} required />
                    <input type="password" placeholder="CONFIRM" className="p-3 bg-amber-50/50 rounded-xl text-[10px] font-black outline-none" onChange={(e)=>setFormData({...formData, confirm: e.target.value})} value={formData.confirm} required />
                  </div>
                  <input type="text" placeholder="ACCESS KEY (OPTIONAL)" className="w-full p-3 bg-[#3E2723] text-white rounded-xl text-[10px] font-black uppercase outline-none placeholder:text-white/20" onChange={(e)=>setFormData({...formData, key: e.target.value})} value={formData.key} />
                  
                  <button type="submit" className="w-full bg-[#3E2723] text-[#FDB813] py-4 rounded-2xl font-black uppercase text-xs flex justify-center items-center gap-2 mt-2">
                    Next: Payment <ArrowRight size={16}/>
                  </button>
                </>
              ) : (
                <>
                  {/* STEP 2: PAYMENT */}
                  <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 text-center mb-2">
                    <p className="text-[10px] font-black uppercase text-amber-800">Final Step: Membership Fee</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase px-1">Member Type</label>
                      <select className="w-full p-3 bg-white border-2 border-amber-100 rounded-xl text-[10px] font-black uppercase outline-none" value={regType} onChange={(e) => setRegType(e.target.value)}>
                        <option value="New Member">New (₱100)</option>
                        <option value="For Renewal">Renewal (₱50)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase px-1">Payment Method</label>
                      <select className="w-full p-3 bg-white border-2 border-amber-100 rounded-xl text-[10px] font-black uppercase outline-none" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}>
                        <option value="GCash">GCash</option>
                        <option value="Cash">Cash</option>
                      </select>
                    </div>
                  </div>

                  {payMethod === 'GCash' ? (
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase px-1">Transaction Ref No.</label>
                      <input type="text" placeholder="e.g. 5012 345 678" className="w-full p-4 bg-blue-50 border-2 border-blue-100 rounded-xl text-xs font-black uppercase outline-none" value={refNo} onChange={(e) => setRefNo(e.target.value)} required />
                    </div>
                  ) : (
                    <div className="p-4 bg-[#3E2723] text-amber-400 rounded-xl text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest">Pay via Cashier</p>
                      <p className="text-[8px] font-bold opacity-60">Daily Key: {getDailyCashPasskey()}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button type="button" onClick={() => setRegStep(1)} className="py-4 bg-gray-100 text-gray-500 rounded-2xl font-black uppercase text-xs flex justify-center items-center gap-2">
                      <ArrowLeft size={16}/> Back
                    </button>
                    <button type="submit" disabled={loading} className="py-4 bg-[#3E2723] text-[#FDB813] rounded-2xl font-black uppercase text-xs flex justify-center items-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : 'Brew Now'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </form>

        <button onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setRegStep(1); }} className="w-full mt-6 text-[10px] font-black uppercase text-amber-800 underline text-center">
          {authMode === 'login' ? 'New Barista? Join Us' : 'Back to Login'}
        </button>
      </div>
    </div>
  );
};

export default Login;
