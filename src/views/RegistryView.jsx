import React, { useState, useContext, useMemo, useRef, useEffect } from 'react';
import { doc, updateDoc, deleteDoc, collection, addDoc, serverTimestamp, writeBatch, query, getDocs, orderBy, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { 
    POSITION_CATEGORIES, OFFICER_TITLES, COMMITTEE_TITLES, COMMITTEES_INFO, 
    getDirectLink, generateCSV, getMemberIdMeta, generateLBAId 
} from '../utils/helpers';
import { 
    Search, FileBarChart, ShieldCheck, CheckCircle2, Plus, 
    Pen, Trash2, Trophy, RefreshCcw, X 
} from 'lucide-react';

const RegistryView = () => {
    const { 
        members, profile, isSuperAdmin, events, masterclassData 
    } = useContext(HubContext);

    // Local States
    const [searchQuery, setSearchQuery] = useState("");
    const [exportFilter, setExportFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBaristas, setSelectedBaristas] = useState([]);
    const [isImporting, setIsImporting] = useState(false);
    
    // Modal States
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [editingMember, setEditingMember] = useState(null);
    const [editMemberForm, setEditMemberForm] = useState({ joinedDate: '' });
    const [showAccoladeModal, setShowAccoladeModal] = useState(null);
    const [accoladeText, setAccoladeText] = useState("");
    
    const fileInputRef = useRef(null);
    const itemsPerPage = 10;

    // Helper: Activity Logger
    const logAction = async (action, details) => { 
        if (!profile) return; 
        try { 
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
                action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
            }); 
        } catch (err) { console.error("Logging failed:", err); } 
    };

    const getSafeDateString = (dateVal) => { 
        if (!dateVal) return ''; 
        if (typeof dateVal === 'string') return dateVal.split('T')[0]; 
        if (dateVal.toDate) return dateVal.toDate().toISOString().split('T')[0]; 
        return ''; 
    };

    // --- FILTERING & PAGINATION ---
    const filteredRegistry = useMemo(() => {
        if (!members || !Array.isArray(members)) return [];
        const validMembers = members.filter(m => m != null && typeof m === 'object');
        const queryUpper = (searchQuery || "").toUpperCase();
        
        let filtered = validMembers.filter(m => {
            if (!queryUpper) return true;
            const nameMatch = (m?.name || "").toUpperCase().includes(queryUpper); 
            const idMatch = (m?.memberId || "").toUpperCase().includes(queryUpper); 
            const emailMatch = (m?.email || "").toUpperCase().includes(queryUpper);
            return nameMatch || idMatch || emailMatch;
        });
        
        if (exportFilter !== 'all') {
            if (exportFilter === 'active') filtered = filtered.filter(m => m?.status === 'active'); 
            else if (exportFilter === 'inactive') filtered = filtered.filter(m => m?.status !== 'active'); 
            else if (exportFilter === 'officers') filtered = filtered.filter(m => m?.positionCategory === 'Officer'); 
            else if (exportFilter === 'committee') filtered = filtered.filter(m => m?.positionCategory === 'Committee');
        }
        return filtered; 
    }, [members, searchQuery, exportFilter]);
    
    const totalPages = Math.max(1, Math.ceil(filteredRegistry.length / itemsPerPage));
    const paginatedRegistry = useMemo(() => filteredRegistry.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredRegistry, currentPage, itemsPerPage]);
    
    const nextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages)); 
    const prevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
    
    useEffect(() => { setCurrentPage(1); }, [searchQuery, exportFilter]);

    // --- ACTIONS ---
    const toggleSelectAll = () => { 
        if (selectedBaristas.length === paginatedRegistry.length && paginatedRegistry.length > 0) { 
            setSelectedBaristas([]); 
        } else { 
            setSelectedBaristas(paginatedRegistry.filter(m => m != null).map(m => m.memberId)); 
        } 
    };
    
    const toggleSelectBarista = (id) => { 
        if (selectedBaristas.includes(id)) setSelectedBaristas(prev => prev.filter(mid => mid !== id)); 
        else setSelectedBaristas(prev => [...prev, id]); 
    };

    const handleExportCSV = () => { 
        if (!members) return; 
        const headers = ["ID", "Name", "Email", "Category", "Title", "Committee", "Status", "Joined", "Volunteer Shifts", "Masterclass", "Accolades"]; 
        const rows = members.filter(m => m != null).map(m => {
            const volCount = events.reduce((acc, ev) => acc + (ev.shifts?.filter(s => s.volunteers?.includes(m.memberId)).length || 0), 0);
            const mcCompleted = [1,2,3,4,5].filter(id => masterclassData.moduleAttendees?.[id]?.includes(m.memberId)).map(id => `Mod ${id}`).join(', ');
            return [ 
                m?.memberId, m?.name, m?.email, m?.positionCategory, m?.specificTitle, m?.committee || '', 
                m?.status, getSafeDateString(m?.joinedDate) || '', volCount, mcCompleted, (m?.accolades || []).join('; ')
            ];
        }); 
        generateCSV(headers, rows, `LBA_Registry_${new Date().toISOString().split('T')[0]}.csv`); 
    };
    
    const handleBulkEmail = () => { 
        const targets = selectedBaristas.length > 0 ? members.filter(m => m && selectedBaristas.includes(m.memberId)) : members.filter(m => m != null); 
        const emails = targets.map(m => m?.email).filter(e => e).join(','); 
        if (emails) window.location.href = `mailto:?bcc=${emails}`; 
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
                let count = members.filter(m => m != null).length; 
                for (let i = 1; i < rows.length; i++) { 
                    const [name, email, prog, pos, title] = rows[i].split(',').map(s => s.trim()); 
                    if (!name || !email) continue; 
                    const mid = generateLBAId(pos, count++); 
                    const meta = getMemberIdMeta(); 
                    const data = { 
                        name: name.toUpperCase(), email: email.toLowerCase(), program: prog || "UNSET", 
                        positionCategory: pos || "Member", specificTitle: title || pos || "Member", 
                        memberId: mid, role: pos === 'Officer' ? 'admin' : 'member', status: 'expired', 
                        paymentStatus: pos !== 'Member' ? 'exempt' : 'unpaid', lastRenewedSem: meta.sem, lastRenewedSY: meta.sy, 
                        password: "LBA" + mid.slice(-5), joinedDate: new Date().toISOString() 
                    }; 
                    batch.set(doc(db, 'artifacts', appId, 'public', 'data', 'registry', mid), data); 
                } 
                await batch.commit(); 
                logAction("Bulk Import", `Imported ${rows.length - 1} members`); 
                alert("Import successful!");
            } catch (err) { alert("Failed to import CSV."); } 
            finally { setIsImporting(false); e.target.value = ""; } 
        }; 
        reader.readAsText(file); 
    };

    const handleUpdatePosition = async (targetId, cat, specific = "", committee = "") => { 
        if (!isSuperAdmin) return; 
        const validMembers = members.filter(m => m != null); 
        const target = validMembers.find(m => m.memberId === targetId); 
        if (!target) return; 
        
        let newId = target.memberId; 
        const isL = ['Officer', 'Committee'].includes(cat); 
        const baseId = newId.endsWith('C') ? newId.slice(0, -1) : newId; 
        newId = baseId + (isL ? 'C' : ''); 
        
        const updates = { 
            positionCategory: cat, 
            specificTitle: specific || cat, 
            memberId: newId, 
            role: cat === 'Officer' ? 'admin' : (target.role === 'superadmin' ? 'superadmin' : 'member'), 
            paymentStatus: ['Officer', 'Committee', 'Alumni', 'Execomm'].includes(cat) ? 'exempt' : target.paymentStatus, 
            committee: cat === 'Committee' ? committee : "" 
        }; 
        
        if (newId !== targetId) await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', targetId)); 
        await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', newId), { ...target, ...updates }); 
    };

    const handleToggleStatus = async (memberId, currentStatus) => { 
        if (!confirm(`Change status to ${currentStatus === 'active' ? 'EXPIRED' : 'ACTIVE'}?`)) return; 
        try { 
            const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId); 
            const updates = { status: currentStatus === 'active' ? 'expired' : 'active' }; 
            if (currentStatus === 'active') updates.paymentStatus = 'unpaid'; 
            await updateDoc(memberRef, updates); 
            logAction("Toggle Status", `Changed ${memberId} to ${updates.status}`); 
        } catch(e) { console.error(e); } 
    };

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

    const handleResetPassword = async (memberId, email, name) => { 
        if (!confirm(`Reset password for ${name}?`)) return; 
        const tempPassword = "LBA-" + Math.random().toString(36).slice(-6).toUpperCase(); 
        const subject = "LBA Password Reset Request"; 
        const body = `Dear ${name},\n\nWe received a request to reset the password associated with your membership account at LPU Baristas' Association.\n\nMember ID: ${memberId}\nTemporary Password: ${tempPassword}\n\nHow to Access Your Account:\nClick the link below to access the secure login portal:\n${window.location.origin}\n\nEnter your Member ID and the Temporary Password provided above.\nOnce logged in, you will be prompted to create a new, permanent password immediately.\n\nThank you,\nThe LPU Baristas' Association Support Team`; 
        try { 
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', memberId), { password: tempPassword }); 
            window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`; 
            logAction("Reset Password", `Reset password for ${memberId}`); 
            alert("Password reset! Opening email client..."); 
        } catch (err) { alert("Failed to reset password."); } 
    };

    // --- MODAL ACTIONS ---
    const initiateRemoveMember = (mid, name) => { setConfirmDelete({ mid, name }); };
    
    const confirmRemoveMember = async () => { 
        if (!confirmDelete) return; 
        try { 
            await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'registry', confirmDelete.mid)); 
            logAction("Remove Member", `Removed member: ${confirmDelete.name}`); 
        } catch(e) { console.error(e); } 
        finally { setConfirmDelete(null); } 
    };

    const handleUpdateMemberDetails = async (e) => { 
        e.preventDefault(); 
        if (!editingMember) return; 
        try { 
            const docId = editingMember.id || editingMember.memberId; 
            const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId); 
            await updateDoc(memberRef, { joinedDate: new Date(editMemberForm.joinedDate).toISOString() }); 
            logAction("Update Member", `Updated details for ${editingMember.name}`); 
            setEditingMember(null); 
            alert("Member details updated."); 
        } catch(err) { alert("Failed to update member."); } 
    };

    const handleGiveAccolade = async () => { 
        if (!accoladeText.trim() || !showAccoladeModal) return; 
        try { 
            const docId = showAccoladeModal.id || showAccoladeModal.memberId; 
            const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId); 
            await updateDoc(memberRef, { accolades: arrayUnion(accoladeText) }); 
            
            const updated = [...(showAccoladeModal.currentAccolades || []), accoladeText]; 
            setShowAccoladeModal(prev => ({...prev, currentAccolades: updated})); 
            setAccoladeText(""); 
            logAction("Award Accolade", `Awarded '${accoladeText}' to ${docId}`); 
            alert("Accolade awarded!"); 
        } catch (err) { alert("Failed to award accolade."); } 
    };
    
    const handleRemoveAccolade = async (accoladeToRemove) => { 
        if(!confirm("Remove this accolade?")) return; 
        try { 
            const docId = showAccoladeModal.id || showAccoladeModal.memberId; 
            const memberRef = doc(db, 'artifacts', appId, 'public', 'data', 'registry', docId); 
            await updateDoc(memberRef, { accolades: arrayRemove(accoladeToRemove) }); 
            
            const updated = showAccoladeModal.currentAccolades.filter(a => a !== accoladeToRemove); 
            setShowAccoladeModal(prev => ({...prev, currentAccolades: updated})); 
            logAction("Remove Accolade", `Removed '${accoladeToRemove}' from ${docId}`); 
        } catch(e) { alert("Failed to remove accolade"); } 
    };

    return (
        <div className="space-y-6 animate-fadeIn text-[#3E2723]">
            
            {/* Top Control Bar */}
            <div className="bg-white p-6 rounded-[40px] border border-amber-100 flex justify-between items-center flex-col md:flex-row gap-4">
                <div className="flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl w-full md:w-auto">
                    <Search size={16}/>
                    <input type="text" placeholder="Search..." className="bg-transparent outline-none text-[10px] font-black uppercase w-full" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
                </div>
                <div className="flex gap-2 w-full md:w-auto justify-end">
                    <select className="bg-white border border-amber-100 text-[9px] font-black uppercase px-2 rounded-xl outline-none" value={exportFilter} onChange={e => setExportFilter(e.target.value)}>
                        <option value="all">All</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="officers">Officers</option>
                        <option value="committee">Committee</option>
                    </select>
                    <button onClick={handleExportCSV} className="bg-green-600 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase flex items-center gap-1"><FileBarChart size={12}/> CSV</button>
                    <button onClick={handleBulkEmail} className="bg-blue-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase">Email</button>
                    {isSuperAdmin && (
                        <>
                            <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleBulkImportCSV} />
                            <button onClick={()=>fileInputRef.current.click()} disabled={isImporting} className="bg-indigo-500 text-white px-5 py-2.5 rounded-2xl font-black text-[9px] uppercase disabled:opacity-50">
                                {isImporting ? 'Importing...' : 'Import'}
                            </button>
                        </>
                    )}
                </div>
            </div>
            
            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-4">
                {paginatedRegistry && paginatedRegistry.map(m => (
                    <div key={m?.memberId || Math.random()} className={`bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm ${m?.status !== 'active' ? 'opacity-70 grayscale' : ''}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <img src={getDirectLink(m?.photoUrl) || `https://ui-avatars.com/api/?name=${m?.name || 'User'}&background=FDB813&color=3E2723`} className="w-10 h-10 rounded-full object-cover border-2 border-[#3E2723]" alt="avatar"/>
                                <div>
                                    <p className="font-black text-xs uppercase">{m?.name || 'Unknown'} {m?.role === 'superadmin' && <ShieldCheck size={12} className="inline text-purple-600"/>}</p>
                                    <p className="text-[10px] font-mono text-gray-500">{m?.memberId || 'No ID'}</p>
                                </div>
                            </div>
                            <button onClick={()=>toggleSelectBarista(m?.memberId)}>
                                {selectedBaristas.includes(m?.memberId) ? <CheckCircle2 size={20} className="text-[#FDB813]"/> : <div className="w-5 h-5 border-2 border-amber-100 rounded-full"></div>}
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[8px] font-bold text-gray-400 uppercase">Category</label>
                                    <select className="w-full bg-amber-50 text-[10px] font-black p-2 rounded-lg outline-none uppercase disabled:opacity-50" value={m?.positionCategory || "Member"} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle, m.committee)} disabled={!isSuperAdmin}>
                                        {POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[8px] font-bold text-gray-400 uppercase">Title</label>
                                    <select className="w-full bg-white border border-amber-100 text-[10px] font-black p-2 rounded-lg outline-none uppercase disabled:opacity-50" value={m?.specificTitle || "Member"} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value, m.committee)} disabled={!isSuperAdmin}>
                                        <option value="Member">Member</option><option value="Org Adviser">Org Adviser</option>
                                        {OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}
                                        {COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            {m?.positionCategory === 'Committee' && (
                                <div>
                                    <label className="text-[8px] font-bold text-indigo-400 uppercase">Committee Dept</label>
                                    <select className="w-full bg-indigo-50 text-indigo-900 text-[10px] font-black p-2 rounded-lg outline-none uppercase disabled:opacity-50" value={m?.committee || ""} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, m.specificTitle, e.target.value)} disabled={!isSuperAdmin}>
                                        <option value="">Select Dept...</option>{COMMITTEES_INFO.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>
                        <div className="mt-4 pt-4 border-t border-amber-50 flex justify-between items-center">
                            <button onClick={() => isSuperAdmin && handleToggleStatus(m.memberId, m.status)} className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase ${m?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`} disabled={!isSuperAdmin}>
                                {m?.status === 'active' ? (m?.membershipType || 'ACTIVE') : 'EXPIRED'}
                            </button>
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
            
            {/* Desktop View (Table) */}
            <div className="hidden md:block bg-white rounded-[40px] border border-amber-100 shadow-xl overflow-hidden">
                <table className="w-full text-left uppercase table-fixed">
                    <thead className="bg-[#3E2723] text-white font-serif tracking-widest">
                        <tr className="text-[10px]">
                            <th className="p-4 w-12 text-center"><button onClick={toggleSelectAll}>{selectedBaristas.length === (paginatedRegistry?.length || 0) && selectedBaristas.length > 0 ? <CheckCircle2 size={16} className="text-[#FDB813]"/> : <Plus size={16}/>}</button></th>
                            <th className="p-4 w-1/3">Barista</th>
                            <th className="p-4 w-32 text-center">ID</th>
                            <th className="p-4 w-24 text-center">Status</th>
                            <th className="p-4 w-40 text-center">Designation</th>
                            <th className="p-4 w-40 text-right">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="text-[#3E2723] divide-y divide-amber-50">
                        {paginatedRegistry && paginatedRegistry.map(m => (
                        <tr key={m?.memberId || Math.random()} className={`hover:bg-amber-50/50 ${m?.status !== 'active' ? 'opacity-50 grayscale' : ''}`}>
                            <td className="p-4 text-center"><button onClick={()=>toggleSelectBarista(m?.memberId)}>{selectedBaristas.includes(m?.memberId) ? <CheckCircle2 size={18} className="text-[#FDB813]"/> : <div className="w-4 h-4 border-2 border-amber-100 rounded-md mx-auto"></div>}</button></td>
                            <td className="py-4 px-4">
                                <div className="flex items-center gap-4">
                                    <img src={getDirectLink(m?.photoUrl) || `https://ui-avatars.com/api/?name=${m?.name || 'User'}&background=FDB813&color=3E2723`} className="w-8 h-8 rounded-full object-cover border-2 border-[#3E2723]" alt="avatar" />
                                    <div className="min-w-0">
                                        <p className="font-black text-xs truncate">{m?.name || 'Unknown'} {m?.role === 'superadmin' && <ShieldCheck size={12} className="inline text-purple-600"/>}</p>
                                        <p className="text-[8px] opacity-60 truncate">"{m?.nickname || m?.program || ''}"</p>
                                        <div className="flex flex-wrap gap-1 mt-1">{Array.isArray(m?.accolades) && m.accolades.map((acc, i) => (<span key={i} title={acc} className="text-[8px] bg-yellow-100 text-yellow-700 px-1 rounded cursor-help">🏆</span>))}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="text-center font-mono font-black text-xs">{m?.memberId || 'N/A'}</td>
                            <td className="text-center font-black text-[10px] uppercase">
                                <button onClick={() => isSuperAdmin && handleToggleStatus(m.memberId, m.status)} className={`px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity disabled:cursor-default ${m?.status === 'active' ? (m?.membershipType === 'new' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700') : 'bg-gray-200 text-gray-500'}`} disabled={!isSuperAdmin}>
                                    {m?.status === 'active' ? (m?.membershipType || 'ACTIVE') : 'EXPIRED'}
                                </button>
                            </td>
                            <td className="text-center py-2">
                                <div className="flex flex-col gap-1 items-center">
                                    <select className="bg-amber-50 text-[8px] font-black p-1 rounded outline-none w-32 disabled:opacity-50" value={m?.positionCategory || "Member"} onChange={e=>handleUpdatePosition(m.memberId, e.target.value, m.specificTitle, m.committee)} disabled={!isSuperAdmin}>
                                        {POSITION_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                                    </select>
                                    <select className="bg-white border border-amber-100 text-[8px] font-black p-1 rounded outline-none w-32 disabled:opacity-50" value={m?.specificTitle || "Member"} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, e.target.value, m.committee)} disabled={!isSuperAdmin}>
                                        <option value="Member">Member</option><option value="Org Adviser">Org Adviser</option>
                                        {OFFICER_TITLES.map(t=><option key={t} value={t}>{t}</option>)}
                                        {COMMITTEE_TITLES.map(t=><option key={t} value={t}>{t}</option>)}
                                    </select>
                                    {m?.positionCategory === 'Committee' && (
                                        <select className="bg-indigo-50 border border-indigo-200 text-indigo-800 text-[8px] font-black p-1 rounded outline-none w-32 focus:ring-1 focus:ring-indigo-400 disabled:opacity-50" value={m?.committee || ""} onChange={e=>handleUpdatePosition(m.memberId, m.positionCategory, m.specificTitle, e.target.value)} disabled={!isSuperAdmin}>
                                            <option value="">Select Dept...</option>{COMMITTEES_INFO.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                        </select>
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

            {/* Pagination Controls */}
            <div className="flex justify-between items-center bg-white p-4 rounded-[24px] border border-amber-100 shadow-sm mt-4">
                <button onClick={prevPage} disabled={currentPage === 1} className="px-6 py-3 bg-gray-100 text-gray-600 rounded-xl font-black uppercase text-[10px] disabled:opacity-50 hover:bg-gray-200 transition-colors">Previous</button>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Page <span className="text-[#3E2723] text-xs">{currentPage}</span> of {totalPages || 1}</span>
                <button onClick={nextPage} disabled={currentPage === totalPages || !totalPages} className="px-6 py-3 bg-[#3E2723] text-[#FDB813] rounded-xl font-black uppercase text-[10px] disabled:opacity-50 hover:bg-black transition-colors">Next</button>
            </div>

            {/* --- MODALS --- */}
            
            {/* 1. Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trash2 size={32} /></div>
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Confirm Deletion</h3>
                        <p className="text-sm text-gray-600 mb-8">Are you sure you want to remove <span className="font-bold text-[#3E2723]">{confirmDelete.name}</span>?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                            <button onClick={confirmRemoveMember} className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold uppercase text-xs hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Edit Member Details Modal */}
            {editingMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full border-b-[8px] border-[#3E2723]">
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-4">Edit Member Details</h3>
                        <form onSubmit={handleUpdateMemberDetails} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase">Joined Date</label>
                                <input type="date" required className="w-full p-3 border rounded-xl text-xs font-bold" value={editMemberForm.joinedDate} onChange={e => setEditMemberForm({...editMemberForm, joinedDate: e.target.value})} />
                                <p className="text-[9px] text-gray-400 mt-1">This date appears on their profile card.</p>
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button type="button" onClick={() => setEditingMember(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 3. Award Accolade Modal */}
            {showAccoladeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-[32px] p-8 max-w-sm w-full text-center border-b-[8px] border-[#3E2723]">
                        <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4"><Trophy size={32} /></div>
                        <h3 className="text-xl font-black uppercase text-[#3E2723] mb-2">Award Accolade</h3>
                        {showAccoladeModal.currentAccolades && showAccoladeModal.currentAccolades.length > 0 && (
                            <div className="mb-4 bg-gray-50 rounded-xl p-3 max-h-32 overflow-y-auto">
                                <p className="text-[9px] font-black uppercase text-gray-400 mb-2 text-left">Current Badges</p>
                                <ul className="space-y-1">
                                    {showAccoladeModal.currentAccolades.map((acc, idx) => (
                                        <li key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                                            <span className="text-[10px] font-bold text-gray-700">{acc}</span>
                                            <button onClick={() => handleRemoveAccolade(acc)} className="text-red-400 hover:text-red-600"><X size={12}/></button>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <input type="text" placeholder="Achievement Title" className="w-full p-3 border rounded-xl text-xs mb-6" value={accoladeText} onChange={e => setAccoladeText(e.target.value)} />
                        <div className="flex gap-3">
                            <button onClick={() => setShowAccoladeModal(null)} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Close</button>
                            <button onClick={handleGiveAccolade} className="flex-1 py-3 rounded-xl bg-yellow-500 text-white font-bold uppercase text-xs hover:bg-yellow-600">Award</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RegistryView;
