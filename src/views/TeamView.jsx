import React, { useContext, useMemo } from 'react';
import { HubContext } from '../contexts/HubContext';
import { COMMITTEES_INFO, getMemberIdMeta } from '../utils/helpers';
import MemberCard from '../components/MemberCardNew';

const TeamView = () => {
  const { members } = useContext(HubContext);

  // --- HIERARCHY LOGIC ---
  const teamStructure = useMemo(() => {
    if (!members || !Array.isArray(members)) return { tier1: [], tier2: [], tier3: [], committees: {} };
    
    const validMembers = members.filter(m => m != null && typeof m === 'object');
    const sortedMembers = [...validMembers].sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    
    const hasTitle = (m, title) => String(m?.specificTitle || "").toUpperCase().includes(title.toUpperCase());
    const isCat = (m, cat) => String(m?.positionCategory || "").toUpperCase() === cat.toUpperCase();

    // Map members to their specific committees
    const committeesMap = {};
    COMMITTEES_INFO.forEach(c => { 
      committeesMap[c.id] = { 
        heads: sortedMembers.filter(m => m?.committee === c.id && isCat(m, "Committee") && hasTitle(m, "Head")), 
        members: sortedMembers.filter(m => m?.committee === c.id && isCat(m, "Committee") && !hasTitle(m, "Head")) 
      }; 
    });

    // Handle members who haven't been assigned a specific dept yet
    committeesMap['Unassigned'] = { 
      heads: sortedMembers.filter(m => !m?.committee && isCat(m, "Committee") && hasTitle(m, "Head")), 
      members: sortedMembers.filter(m => !m?.committee && isCat(m, "Committee") && !hasTitle(m, "Head")) 
    };

    return { 
      tier1: sortedMembers.filter(m => hasTitle(m, "President") && isCat(m, "Officer")), 
      tier2: sortedMembers.filter(m => hasTitle(m, "Secretary") && isCat(m, "Officer")), 
      tier3: sortedMembers.filter(m => !hasTitle(m, "President") && !hasTitle(m, "Secretary") && isCat(m, "Officer")), 
      committees: committeesMap 
    };
  }, [members]);

  return (
    <div className="space-y-16 animate-fadeIn text-center pb-20">
        
        {/* EXECUTIVE COMMITTEE HEADER */}
        <div>
            <h3 className="font-serif text-5xl font-black uppercase text-[#3E2723] mb-2">The Brew Crew</h3>
            <p className="text-amber-600 text-sm font-bold uppercase tracking-widest">
                Executive Committee AY {getMemberIdMeta().sy}
            </p>
        </div>

        {/* EXECOM TIERS */}
        <div className="space-y-12">
            {teamStructure.tier1.length > 0 && (
                <div className="flex justify-center">
                    {teamStructure.tier1.map(m => <MemberCard key={m.memberId} m={m} />)}
                </div>
            )}
            
            {teamStructure.tier2.length > 0 && (
                <div className="flex justify-center gap-6 flex-wrap">
                    {teamStructure.tier2.map(m => <MemberCard key={m.memberId} m={m} />)}
                </div>
            )}
            
            {teamStructure.tier3.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                    {teamStructure.tier3.map(m => <MemberCard key={m.memberId} m={m} />)}
                </div>
            )}
        </div>

        {/* COMMITTEE DEPARTMENTS SECTION */}
        <div className="border-t-[4px] border-[#3E2723]/10 pt-16 space-y-20">
            <div className="text-center mb-10">
                <h3 className="font-serif text-4xl font-black uppercase text-[#3E2723]">Committee Departments</h3>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-2">The Backbone of LBA Operations</p>
            </div>

            {COMMITTEES_INFO.map(c => {
                const group = teamStructure.committees[c.id];
                if (!group || (group.heads.length === 0 && group.members.length === 0)) return null;
                
                return (
                    <div key={c.id} className="bg-white p-10 rounded-[48px] border-2 border-amber-100 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-[#3E2723] opacity-5"></div>
                        
                        <div className="relative z-10 mb-10">
                            <h3 className="font-serif text-3xl font-black uppercase text-[#3E2723] mb-2">{c.title}</h3>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest max-w-2xl mx-auto">{c.description}</p>
                        </div>

                        {/* Dept Heads */}
                        {group.heads.length > 0 && (
                            <div className="mb-12 relative z-10">
                                <span className="inline-block bg-[#FDB813] text-[#3E2723] px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm border border-amber-200">
                                    Department Heads
                                </span>
                                <div className="flex flex-wrap justify-center gap-6 mt-6">
                                    {group.heads.map(m => <MemberCard key={m.memberId} m={m} />)}
                                </div>
                            </div>
                        )}

                        {/* Dept Members */}
                        {group.members.length > 0 && (
                            <div className="relative z-10">
                                <span className="inline-block bg-gray-100 text-gray-600 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
                                    Committee Members
                                </span>
                                <div className="flex flex-wrap justify-center gap-6 mt-6">
                                    {group.members.map(m => <MemberCard key={m.memberId} m={m} />)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}

            {/* UNASSIGNED POOL (Fall-through for new leaders) */}
            {(teamStructure.committees['Unassigned']?.heads.length > 0 || teamStructure.committees['Unassigned']?.members.length > 0) && (
                 <div className="bg-gray-50 p-10 rounded-[48px] border border-gray-200 opacity-80">
                    <h3 className="font-serif text-2xl font-black uppercase text-gray-500 mb-8">General Pool (Unassigned)</h3>
                    <div className="flex flex-wrap justify-center gap-6">
                        {[...teamStructure.committees['Unassigned'].heads, ...teamStructure.committees['Unassigned'].members].map(m => (
                            <MemberCard key={m.memberId} m={m} />
                        ))}
                    </div>
                 </div>
            )}
        </div>
    </div>
  );
};

export default TeamView;
