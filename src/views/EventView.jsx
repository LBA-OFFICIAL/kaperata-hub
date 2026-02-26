import React, { useState, useContext, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, appId } from '../firebase';
import { HubContext } from '../contexts/HubContext';
import { getEventDateParts, formatDate, getEventDay, getEventMonth, DEFAULT_MASTERCLASS_MODULES, generateCSV } from '../utils/helpers';
import { Calendar, Plus, Pen, Trash2, MapPin, Clock, GraduationCap, ClipboardList, CheckCircle2, X, Download } from 'lucide-react';

const EventView = () => {
  const { events, profile, isCommitteePlus, isExpired, members } = useContext(HubContext);

  // Local States for Event Forms & Modals
  const [showEventForm, setShowEventForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ 
    name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', 
    description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, 
    registrationRequired: true, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, 
    shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' 
  });
  const [tempShift, setTempShift] = useState({ date: '', name: '', startTime: '', endTime: '', capacity: 50, volunteerCapacity: 5 });
  const [attendanceEvent, setAttendanceEvent] = useState(null);

  // Keep attendance event in sync with live database updates
  useEffect(() => { 
    if (attendanceEvent && events.length > 0) { 
      const liveEvent = events.find(e => e.id === attendanceEvent.id); 
      if (liveEvent) setAttendanceEvent(liveEvent); 
    } 
  }, [events]);

  // Helper: Activity Logger
  const logAction = async (action, details) => { 
    if (!profile) return; 
    try { 
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'activity_logs'), { 
        action, details, actor: profile.name, actorId: profile.memberId, timestamp: serverTimestamp() 
      }); 
    } catch (err) { console.error("Logging failed:", err); } 
  };

  // --- ACTIONS ---

  const handleAddEvent = async (e) => { 
    e.preventDefault(); 
    try { 
      const eventPayload = { ...newEvent, name: newEvent.name.toUpperCase(), venue: newEvent.venue.toUpperCase(), attendees: [], registered: [] }; 
      if (editingEvent) { 
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', editingEvent.id), eventPayload); 
        logAction("Update Event", `Updated event: ${newEvent.name}`); 
      } else { 
        await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'events'), { ...eventPayload, createdAt: serverTimestamp() }); 
        logAction("Create Event", `Created event: ${newEvent.name}`); 
      } 
      setShowEventForm(false); 
      setEditingEvent(null);
    } catch (err) { alert("Failed to save event."); } 
  };

  const handleEditEvent = (ev) => { 
    setNewEvent({ 
      ...ev, 
      masterclassModuleIds: ev.masterclassModuleIds || (ev.masterclassModuleId ? [ev.masterclassModuleId] : []), 
      shifts: ev.shifts || [], scheduleType: ev.scheduleType || 'WHOLE_DAY', 
      attendanceRequired: ev.attendanceRequired || false, evaluationLink: ev.evaluationLink || '', 
      isVolunteer: ev.isVolunteer || false, registrationRequired: ev.registrationRequired !== undefined ? ev.registrationRequired : true, 
      openForAll: ev.openForAll !== undefined ? ev.openForAll : true, volunteerTarget: ev.volunteerTarget || { officer: 0, committee: 0, member: 0 } 
    }); 
    setEditingEvent(ev); 
    setShowEventForm(true); 
  };

  const handleDeleteEvent = async (id) => { 
    if(!confirm("Delete this event?")) return; 
    try { 
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'events', id)); 
      logAction("Delete Event", `Deleted event ID: ${id}`); 
    } catch(err) {} 
  };

  const handleRegisterEvent = async (ev) => { 
    if (isExpired) return alert("Your membership is expired. Please renew to join events."); 
    const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id); 
    const isRegistered = ev.registered?.includes(profile.memberId); 
    try { 
      if (isRegistered) { await updateDoc(eventRef, { registered: arrayRemove(profile.memberId) }); } 
      else { await updateDoc(eventRef, { registered: arrayUnion(profile.memberId) }); } 
    } catch (err) {} 
  };

  // --- SHIFT LOGIC ---
  const addShift = () => { 
    if (!tempShift.date || !tempShift.name) return alert("Date and Shift Name are required."); 
    setNewEvent(prev => ({ 
      ...prev, 
      shifts: [...(prev.shifts||[]), { id: crypto.randomUUID(), date: tempShift.date, name: tempShift.name, startTime: tempShift.startTime, endTime: tempShift.endTime, capacity: tempShift.capacity, volunteerCapacity: tempShift.volunteerCapacity, attendees: [], volunteers: [] }] 
    })); 
    setTempShift({ date: '', name: '', startTime: '', endTime: '', capacity: 50, volunteerCapacity: 5 }); 
  };

  const removeShift = (id) => { 
    setNewEvent(prev => ({ ...prev, shifts: prev.shifts.filter(s => s.id !== id) })); 
  };

  const handleShiftRegistration = async (ev, shiftId, role) => { 
    if (isExpired) return alert("Your membership is expired. Please renew first."); 
    const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', ev.id); 
    const updatedShifts = ev.shifts.map(shift => { 
      if (shift.id === shiftId) { 
        const listKey = role === 'volunteer' ? 'volunteers' : 'attendees'; 
        const capKey = role === 'volunteer' ? 'volunteerCapacity' : 'capacity'; 
        const currentList = shift[listKey] || []; 
        const isRegistered = currentList.includes(profile.memberId); 
        if (isRegistered) { 
          return { ...shift, [listKey]: currentList.filter(id => id !== profile.memberId) }; 
        } else { 
          if (currentList.length >= shift[capKey]) { alert(`This shift is full for ${role}s!`); return shift; } 
          return { ...shift, [listKey]: [...currentList, profile.memberId] }; 
        } 
      } 
      return shift; 
    }); 
    try { await updateDoc(eventRef, { shifts: updatedShifts }); } catch(err) {} 
  };

  // --- ATTENDANCE LOGIC ---
  const handleToggleAttendanceLocal = async (memberId) => { 
    if (!attendanceEvent || !memberId) return; 
    const eventRef = doc(db, 'artifacts', appId, 'public', 'data', 'events', attendanceEvent.id); 
    const isPresent = attendanceEvent.attendees?.includes(memberId); 
    try { 
      if (isPresent) { await updateDoc(eventRef, { attendees: arrayRemove(memberId) }); } 
      else { await updateDoc(eventRef, { attendees: arrayUnion(memberId) }); } 
      
      // Auto-sync with Masterclass Tracker if event is linked to modules
      if (attendanceEvent.masterclassModuleIds && attendanceEvent.masterclassModuleIds.length > 0) { 
        const trackerRef = doc(db, 'artifacts', appId, 'public', 'data', 'masterclass', 'tracker'); 
        const updates = {}; 
        attendanceEvent.masterclassModuleIds.forEach(modId => { 
          updates[`moduleAttendees.${modId}`] = isPresent ? arrayRemove(memberId) : arrayUnion(memberId); 
        }); 
        await updateDoc(trackerRef, updates); 
      } 
    } catch(err) {} 
  };

  const handleDownloadAttendance = () => { 
    if (!attendanceEvent) return; 
    const validMembers = members.filter(m => m != null); 
    const presentMembers = validMembers.filter(m => attendanceEvent.attendees?.includes(m.memberId)); 
    const headers = ["Name", "ID", "Position"]; 
    const rows = presentMembers.sort((a,b) => (a.name || "").localeCompare(b.name || "")).map(m => [m.name, m.memberId, m.specificTitle]); 
    generateCSV(headers, rows, `${attendanceEvent.name.replace(/\s+/g, '_')}_Attendance.csv`); 
  };


  return (
    <div className="space-y-6 animate-fadeIn relative">
      
      {/* HEADER */}
      <div className="flex justify-between items-center">
          <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">What's Brewing?</h3>
          {isCommitteePlus && (
            <button 
              onClick={() => { 
                setEditingEvent(null); 
                setNewEvent({ name: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', description: '', attendanceRequired: false, evaluationLink: '', isVolunteer: false, registrationRequired: true, openForAll: true, volunteerTarget: { officer: 0, committee: 0, member: 0 }, shifts: [], masterclassModuleIds: [], scheduleType: 'WHOLE_DAY' }); 
                setShowEventForm(true); 
              }} 
              className="bg-[#3E2723] text-[#FDB813] px-4 py-3 rounded-2xl shadow-md hover:bg-black transition-colors font-black uppercase text-[10px] flex items-center gap-2"
            >
              <Plus size={16}/> New Event
            </button>
          )}
      </div>

      {/* EVENT LIST */}
      <div className="space-y-4">
          {events.length === 0 ? (
              <div className="p-10 bg-white rounded-[32px] border border-dashed border-amber-200 text-center"><Calendar size={32} className="mx-auto text-amber-300 mb-3"/><p className="text-sm font-black text-amber-900 uppercase">No upcoming events</p><p className="text-xs text-amber-700/60 mt-1">Stay tuned for future updates!</p></div>
          ) : (
              events.map(ev => {
                  const { day, month } = getEventDateParts(ev.startDate, ev.endDate);
                  return (
                      <div key={ev.id} className="bg-white p-6 rounded-[32px] border border-amber-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                            
                            {/* Admin Controls Overlay */}
                            {isCommitteePlus && (
                              <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button onClick={() => handleEditEvent(ev)} className="p-2 bg-white border border-amber-100 rounded-xl text-amber-600 hover:bg-amber-50 shadow-sm" title="Edit Event"><Pen size={14}/></button>
                                <button onClick={() => handleDeleteEvent(ev.id)} className="p-2 bg-white border border-red-100 rounded-xl text-red-600 hover:bg-red-50 shadow-sm" title="Delete Event"><Trash2 size={14}/></button>
                              </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row gap-6">
                              {/* Date Block */}
                              <div className="bg-[#3E2723] text-[#FDB813] w-24 h-24 rounded-2xl flex flex-col items-center justify-center font-black leading-none shrink-0 shadow-inner">
                                <span className="text-3xl">{day}</span>
                                <span className="text-xs uppercase mt-2 tracking-widest">{month}</span>
                              </div>
                              
                              <div className="flex-1">
                                  <div className="pr-24">
                                      <h4 className="font-serif text-2xl font-black uppercase text-[#3E2723]">{ev.name}</h4>
                                      {ev.masterclassModuleIds && ev.masterclassModuleIds.length > 0 && (
                                          <div className="flex flex-wrap gap-2 mt-2">
                                              {ev.masterclassModuleIds.map(mid => (
                                                  <span key={mid} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-[8px] font-black uppercase flex items-center gap-1 shadow-sm">
                                                    <GraduationCap size={10}/> Masterclass Module {mid}
                                                  </span>
                                              ))}
                                          </div>
                                      )}
                                  </div>
                                  <p className="text-xs font-bold text-amber-700 uppercase mt-3 flex items-center gap-2 flex-wrap">
                                      <MapPin size={12}/> {ev.venue} • <Clock size={12}/> {ev.startTime} {ev.endTime ? `- ${ev.endTime}` : ''}
                                      {ev.scheduleType === 'MULTIPLE_SHIFTS' && <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md text-[8px] tracking-wider ml-1">MULTIPLE SHIFTS</span>}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-wrap">{ev.description}</p>
                                  
                                  {/* Shift Management OR Simple Registration */}
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
                                          {isCommitteePlus && ev.attendanceRequired && (
                                            <button onClick={() => setAttendanceEvent(ev)} className="w-full mt-2 px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-black uppercase text-[10px] hover:bg-indigo-200 transition-colors flex justify-center items-center gap-2 border border-indigo-200">
                                              <ClipboardList size={14}/> Open Attendance
                                            </button>
                                          )}
                                      </div>
                                  ) : (
                                      <div className="mt-6 flex flex-wrap gap-3">
                                          {ev.registrationRequired && (
                                            <button onClick={() => handleRegisterEvent(ev)} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] transition-all shadow-sm ${ev.registered?.includes(profile.memberId) ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-[#FDB813] text-[#3E2723] hover:bg-amber-400'}`}>
                                              {ev.registered?.includes(profile.memberId) ? 'Registered ✓' : 'Register Now'}
                                            </button>
                                          )}
                                          {isCommitteePlus && ev.attendanceRequired && (
                                            <button onClick={() => setAttendanceEvent(ev)} className="px-6 py-3 bg-indigo-100 text-indigo-700 rounded-xl font-black uppercase text-[10px] hover:bg-indigo-200 transition-colors flex items-center gap-2 border border-indigo-200">
                                              <ClipboardList size={14}/> Open Attendance
                                            </button>
                                          )}
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

      {/* EVENT FORM MODAL */}
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

                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                        <h4 className="text-xs font-black uppercase text-purple-800 mb-3 flex items-center gap-2"><GraduationCap size={14}/> Link to Masterclass</h4>
                        <div className="flex flex-wrap gap-3">
                            {DEFAULT_MASTERCLASS_MODULES.map(mod => (
                                <label key={mod.id} className="flex items-center gap-1.5 text-[10px] font-bold text-purple-900 cursor-pointer uppercase hover:bg-purple-100 px-2 py-1 rounded-md transition-colors">
                                    <input type="checkbox" checked={newEvent.masterclassModuleIds?.includes(mod.id)} onChange={e => { const ids = newEvent.masterclassModuleIds || []; if (e.target.checked) setNewEvent({...newEvent, masterclassModuleIds: [...ids, mod.id]}); else setNewEvent({...newEvent, masterclassModuleIds: ids.filter(id => id !== mod.id)}); }} className="rounded text-purple-600 focus:ring-purple-500"/> Mod {mod.id}
                                </label>
                            ))}
                        </div>
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
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => { setShowEventForm(false); setEditingEvent(null); }} className="flex-1 py-3 rounded-xl bg-gray-100 font-bold uppercase text-xs text-gray-600 hover:bg-gray-200">Cancel</button>
                        <button type="submit" className="flex-1 py-3 rounded-xl bg-[#3E2723] text-white font-bold uppercase text-xs hover:bg-black">{editingEvent ? 'Update' : 'Create'}</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* ATTENDANCE MODAL */}
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
                    <div className="flex gap-2">
                      <button onClick={handleDownloadAttendance} className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Download List"><Download size={20}/></button>
                      <button onClick={() => setAttendanceEvent(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
                    </div>
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
    </div>
  );
};

export default EventView;
