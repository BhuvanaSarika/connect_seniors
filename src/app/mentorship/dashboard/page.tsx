"use client"
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorProfile, TimeSlot, MentorshipBooking } from '@/types';
import Link from 'next/link';
import { FiClock, FiCheckCircle, FiUser, FiCalendar, FiPlus, FiInfo, FiLayers, FiX, FiCheck, FiArrowLeft } from 'react-icons/fi';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MentorshipDashboardPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<MentorProfile | null>(null);
  const [bookings, setBookings] = useState<MentorshipBooking[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [bio, setBio] = useState('');
  const [expertiseTags, setExpertiseTags] = useState('');
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [newDay, setNewDay] = useState(1);
  const [newStartTime, setNewStartTime] = useState('14:00');
  const [newEndTime, setNewEndTime] = useState('15:00');

  useEffect(() => {
    if (!loading && (!appUser || (appUser.role !== 'senior' && appUser.role !== 'admin'))) {
      router.push('/mentorship');
    }
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, 'mentorProfiles', appUser.uid));
        if (snap.exists()) {
          const data = snap.data() as MentorProfile;
          setProfile(data);
          setBio(data.bio);
          setExpertiseTags(data.expertise.join(', '));
          setSlots(data.availableSlots || []);
        }

        const bookingsQ = query(
          collection(db, 'bookings'),
          where('mentorUid', '==', appUser.uid)
        );
        const bSnap = await getDocs(bookingsQ);
        setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as MentorshipBooking)));

      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchData();
  }, [appUser]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser) return;
    setSaving(true);
    try {
      const updatedProfile: MentorProfile = {
        uid: appUser.uid,
        displayName: appUser.displayName,
        rollNumber: appUser.rollNumber,
        isApproved: profile?.isApproved ?? false,
        bio,
        expertise: expertiseTags.split(',').map(t => t.trim()).filter(Boolean),
        availableSlots: slots,
      };
      await setDoc(doc(db, 'mentorProfiles', appUser.uid), updatedProfile);
      setProfile(updatedProfile);
      alert('Operational success: Profile and availability index updated.');
    } catch (err) {
      console.error(err);
      alert('Operational failure: could not commit profile changes.');
    }
    setSaving(false);
  };

  const handleAddSlot = () => {
    const newSlot: TimeSlot = {
      id: `slot_${Date.now()}`,
      dayOfWeek: newDay,
      startTime: newStartTime,
      endTime: newEndTime,
      isBooked: false,
    };
    setSlots([...slots, newSlot]);
  };

  const handleRemoveSlot = (id: string) => {
    setSlots(slots.filter(s => s.id !== id));
  };

  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleBookingAction = async (bookingId: string, slotId: string, status: 'confirmed' | 'cancelled') => {
    if (!appUser) return;
    setActionLoading(bookingId);
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      setBookings(curr => curr.map(b => b.id === bookingId ? { ...b, status } : b));

      if (status === 'confirmed') {
        const updatedSlots = slots.map(s => s.id === slotId ? { ...s, isBooked: true } : s);
        await updateDoc(doc(db, 'mentorProfiles', appUser.uid), { availableSlots: updatedSlots });
        setSlots(updatedSlots);
        alert('Protocol: Booking confirmed. Junior terminal coordinates established.');
      } else {
        alert('Protocol: Booking request declined.');
      }
    } catch (err) {
      console.error(err);
      alert('Operational error: could not finalize booking status.');
    }
    setActionLoading(null);
  };

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-900">
      {/* Module Header */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-6 cursor-pointer group" onClick={() => router.push('/mentorship')}>
               <FiArrowLeft className="text-slate-400 group-hover:text-slate-900 transition-colors" />
               <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400 group-hover:text-slate-900 transition-colors">Back to expert network</p>
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Mentor <span className="text-slate-900/40 italic">Control Center.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed max-w-2xl">
               Technical operations and availability management. Monitor incoming mentorship requests and refine your systemic profile.
            </p>
          </div>
          {profile && (
            <div className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${profile.isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
              {profile.isApproved ? 'Global Network Authorized' : 'Governance Review Pending'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Profile Configuration */}
        <div className="lg:col-span-8 space-y-12">
           <form onSubmit={handleSaveProfile} className="space-y-12">
              <section className="clean-card p-10">
                <div className="flex items-center gap-4 mb-10">
                   <FiUser className="text-primary" />
                   <h2 className="text-xl font-display font-black text-slate-900 tracking-tight uppercase tracking-widest text-[10px]">Registry Identity</h2>
                </div>
                
                <div className="space-y-8">
                  <div>
                    <label className="section-label mb-3 block">Professional Abstract</label>
                    <textarea
                      required value={bio} onChange={(e) => setBio(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-medium text-sm min-h-[120px]"
                      placeholder="Define your professional contribution and engineering focus..."
                    />
                  </div>
                  <div>
                    <label className="section-label mb-3 block">Technical Expertise (Delimited by Comma)</label>
                    <input
                      type="text" required value={expertiseTags} onChange={(e) => setExpertiseTags(e.target.value)}
                      className="w-full px-5 py-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-medium text-sm"
                      placeholder="e.g. Distributed Systems, Rust, Cloud Architecture"
                    />
                  </div>
                </div>
              </section>

              <section className="clean-card p-10">
                <div className="flex items-center gap-4 mb-10">
                   <FiClock className="text-primary" />
                   <h2 className="text-xl font-display font-black text-slate-900 tracking-tight uppercase tracking-widest text-[10px]">Temporal Availability</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 p-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="md:col-span-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Day</label>
                    <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none text-xs font-bold uppercase tracking-widest">
                      {daysOfWeek.map((day, i) => <option key={i} value={i}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Start</label>
                    <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none text-xs" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">End</label>
                    <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white outline-none text-xs" />
                  </div>
                  <div className="flex items-end">
                    <button type="button" onClick={handleAddSlot} className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-primary transition-all flex items-center justify-center gap-2">
                       <FiPlus /> Ingest Slot
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {slots.length === 0 ? (
                    <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-2xl">
                       <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">No availability protocols initialized.</p>
                    </div>
                  ) : (
                    slots.map(slot => (
                      <div key={slot.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-white group hover:border-slate-900 transition-all">
                        <div className="flex items-center gap-4">
                           <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-display font-black text-xs border transition-all ${slot.isBooked ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-900 border-slate-100 group-hover:bg-slate-900 group-hover:text-white'}`}>
                              {daysOfWeek[slot.dayOfWeek].charAt(0)}
                           </div>
                           <div>
                              <p className="text-xs font-bold text-slate-900">{daysOfWeek[slot.dayOfWeek]}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{slot.startTime} — {slot.endTime}</p>
                           </div>
                        </div>
                        <div className="flex items-center gap-2">
                           {slot.isBooked && <FiCheckCircle className="text-emerald-500" size={14} />}
                           {!slot.isBooked && (
                              <button type="button" onClick={() => handleRemoveSlot(slot.id)} className="p-2 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all">
                                 <FiX size={14} />
                              </button>
                           )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </section>

              <div className="pt-6">
                 <button type="submit" disabled={saving} className="btn-primary w-full py-4 text-sm shadow-xl shadow-primary/20 disabled:opacity-20">
                    {saving ? 'Synchronizing Control Center...' : 'Commit Systemic Profile'}
                 </button>
              </div>
           </form>
        </div>

        {/* Operational Requests */}
        <div className="lg:col-span-4">
           <div className="clean-card p-8 sticky top-24 border-slate-900/5 bg-slate-50/50 backdrop-blur-sm">
              <div className="flex items-center gap-4 mb-10">
                 <FiLayers className="text-primary" />
                 <h2 className="text-xl font-display font-black text-slate-900 tracking-tight uppercase tracking-widest text-[10px]">Request Terminal</h2>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                   <FiInfo className="mx-auto text-slate-100 mb-4" size={32} />
                   <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">No active handshake requests.</p>
                </div>
              ) : (
                <div className="space-y-6">
                   {bookings.map(booking => {
                     const slot = slots.find(s => s.id === booking.slotId);
                     const isUpcoming = new Date(booking.date) >= new Date(new Date().setHours(0, 0, 0, 0));

                     return (
                       <div key={booking.id} className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-primary transition-all shadow-sm">
                         <div className="flex items-start justify-between mb-4">
                            <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Inbound Request</p>
                               <p className="font-bold text-slate-900 text-sm">{booking.juniorName}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                               booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                               booking.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                               'bg-slate-100 text-slate-400 border-slate-200'
                            }`}>
                               {booking.status}
                            </span>
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 mb-6">
                           <FiCalendar size={12} className="text-primary" />
                           {new Date(booking.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                           {slot ? ` • ${slot.startTime} - ${slot.endTime}` : ''}
                         </div>

                         {booking.status === 'pending' && isUpcoming && (
                           <div className="flex gap-2">
                             <button onClick={() => handleBookingAction(booking.id, booking.slotId, 'confirmed')} disabled={actionLoading === booking.id} className="flex-1 py-2 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all disabled:opacity-50">
                               {actionLoading === booking.id ? '...' : 'Authorize'}
                             </button>
                             <button onClick={() => handleBookingAction(booking.id, booking.slotId, 'cancelled')} disabled={actionLoading === booking.id} className="flex-1 py-2 rounded-lg border border-slate-100 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all disabled:opacity-50">
                               {actionLoading === booking.id ? '...' : 'Declined'}
                             </button>
                           </div>
                         )}

                         {booking.status === 'confirmed' && (
                           <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-[10px] space-y-2">
                             <p className="font-bold text-slate-400 uppercase tracking-widest mb-1 leading-none">Coordinates</p>
                             <p className="font-bold text-slate-900 bg-white px-3 py-2 rounded border border-slate-100 break-all">{booking.juniorEmail}</p>
                             <p className="font-bold text-slate-900 bg-white px-3 py-2 rounded border border-slate-100">{booking.juniorPhone}</p>
                           </div>
                         )}
                       </div>
                     );
                   })}
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
