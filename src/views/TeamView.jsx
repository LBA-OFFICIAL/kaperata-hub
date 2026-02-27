import React, { useContext, useMemo } from 'react';
import { HubContext } from '../contexts/HubContext';
import { COMMITTEES_INFO, getMemberIdMeta } from '../utils/helpers';
import MemberCard from '../components/MemberCardNew';

const TeamView = () => {
  const { members, loading } = useContext(HubContext);

  const teamStructure = useMemo(() => {
    // Safety check: if members is undefined or not an array, return empty structure
    if (!members || !Array.isArray(members)) {
      return { tier1: [], tier2: [], tier3: [], committees: {} };
    }
    
    const validMembers = members.filter(m => m != null && typeof m === 'object');
    // Sort by name alphabetically
    const sortedMembers = [...validMembers].sort((a, b) => 
      (a?.name || "").localeCompare(b?.name || "")
    );
    
    const hasTitle = (m, title) => String(m?.specificTitle || "").toUpperCase().includes(title.toUpperCase());
    const isCat = (m, cat) => String(m?.positionCategory || "").toUpperCase() === cat.toUpperCase();

    const committeesMap = {};
    
    // Ensure COMMITTEES_INFO exists before mapping
    if (COMMITTEES_INFO) {
      COMMITTEES_INFO.forEach(c => { 
        committeesMap[c.id] = { 
          heads: sortedMembers.filter(m => m?.committee === c.id && isCat(m, "Committee") && hasTitle(m, "Head")), 
          members: sortedMembers.filter(m => m?.committee === c.id && isCat(m, "Committee") && !hasTitle(m, "Head")) 
        }; 
      });
    }

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

  // Loading State
  if (loading) {
    return <div className="py-20 text-center animate-pulse uppercase font-black text-gray-400">Grinding the roster...</div>;
  }

  // Empty State
  if (!members || members.length === 0) {
    return (
      <div className="py-20 text-center">
        <h3 className="font-serif text-3xl font-black text-[#3E2723] uppercase">No Brew Crew Found</h3>
        <p className="text-gray-500 text-xs font-bold uppercase mt-2">Check the Registry to ensure members have Officer/Committee roles assigned.</p>
      </div>
    );
  }

  return (
    <div className="space-y-16 animate-fadeIn text-center pb-20">
        <div>
            <h3 className="font-serif text-5xl font-black uppercase text-[#3E2723] mb-2">The Brew Crew</h3>
            <p className="text-amber-600 text-sm font-bold uppercase tracking-widest">
                Executive Committee AY {getMemberIdMeta?.().sy || '2025-2026'}
            </p>
        </div>

        {/* EXECOM TIERS */}
        <div className="space-y-12">
            {teamStructure.tier1.map(m => <MemberCard key={m.memberId || m.id} m={m} />)}
            
            <div className="flex justify-center gap-6 flex-wrap">
                {teamStructure.tier2.map(m => <MemberCard key={m.memberId || m.id} m={m} />)}
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 justify-items-center">
                {teamStructure.tier3.map(m => <MemberCard key={m.memberId || m.id} m={m} />)}
            </div>
        </div>

        {/* COMMITTEE SECTIONS */}
        <div className="border-t-[4px] border-[#3E2723]/10 pt-16 space-y-20">
            {COMMITTEES_INFO?.map(c => {
                const group = teamStructure.committees[c.id];
                if (!group || (group.heads.length === 0 && group.members.length === 0)) return null;
                
                return (
                    <div key={c.id} className="bg-white p-10 rounded-[48px] border-2 border-amber-100 shadow-sm relative overflow-hidden">
                        <div className="relative z-10 mb-10">
                            <h3 className="font-serif text-3xl font-black uppercase text-[#3E2723] mb-2">{c.title}</h3>
                            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest">{c.description}</p>
                        </div>

                        {group.heads.length > 0 && (
                            <div className="mb-12">
                                <span className="bg-[#FDB813] text-[#3E2723] px-6 py-2 rounded-full text-[10px] font-black uppercase">Heads</span>
                                <div className="flex flex-wrap justify-center gap-6 mt-6">
                                    {group.heads.map(m => <MemberCard key={m.memberId || m.id} m={m} />)}
                                </div>
                            </div>
                        )}
                        
                        {group.members.length > 0 && (
                            <div>
                                <span className="bg-gray-100 text-gray-500 px-6 py-2 rounded-full text-[10px] font-black uppercase">Members</span>
                                <div className="flex flex-wrap justify-center gap-6 mt-6">
                                    {group.members.map(m => <MemberCard key={m.memberId || m.id} m={m} />)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};

export default TeamView;
