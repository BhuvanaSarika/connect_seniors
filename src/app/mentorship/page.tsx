"use client"
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorProfile, TimeSlot, MentorshipBooking } from '@/types';
import Link from 'next/link';
import { FiClock, FiUser, FiCalendar, FiCheck, FiPlus, FiArrowRight, FiInfo, FiX } from 'react-icons/fi';

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MentorshipPage() {
  const { appUser, loading } = useAuth();
  const router = useRouter();
  const [mentors, setMentors] = useState<MentorProfile[]>([]);
  const [fetching, setFetching] = useState(true);

  // Booking Modal
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (!loading && !appUser) router.push('/login');
  }, [loading, appUser, router]);

  useEffect(() => {
    if (!appUser) return;
    const fetchMentors = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'mentorProfiles'), where('isApproved', '==', true)));
        setMentors(snap.docs.map(d => ({ uid: d.id, ...d.data() } as MentorProfile)));
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchMentors();
  }, [appUser]);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appUser || !selectedMentor || !selectedSlot || !bookingDate || !phone) return;
    setBookingLoading(true);

    try {
      const booking: Omit<MentorshipBooking, 'id'> = {
        mentorUid: selectedMentor.uid,
        mentorName: selectedMentor.displayName,
        juniorUid: appUser.uid,
        juniorName: appUser.displayName,
        juniorEmail: appUser.email || 'No email provided',
        juniorPhone: phone,
        slotId: selectedSlot.id,
        date: bookingDate,
        status: 'pending',
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'bookings'), booking);

      alert('Operational success: Booking request dispatched to mentor terminal.');
      setSelectedMentor(null);
      setPhone('');
    } catch (err) {
      console.error(err);
      alert('Operational failure: Booking request could not be finalized.');
    }
    setBookingLoading(false);
  };

  const getNextAvailableDateForDay = (dayOfWeek: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + (dayOfWeek + 7 - d.getDay()) % 7);
    if (d.getDay() === new Date().getDay() && dayOfWeek === new Date().getDay()) {
      d.setDate(d.getDate() + 7);
    }
    return d.toISOString().split('T')[0];
  };

  if (loading || !appUser) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 text-slate-900">
      {/* Module Header */}
      <div className="mb-16">
        <div className="inline-flex items-center gap-2 mb-6">
          <span className="w-10 h-1 bg-primary rounded-full" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Expert Network</p>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-display font-black text-slate-900 leading-tight mb-4 tracking-tight">
              Direct <span className="text-slate-900/40 italic">Mentorship.</span>
            </h1>
            <p className="text-slate-500 font-medium leading-relaxed">
              Secure 1:1 technical deep-dives with industry-active seniors. Focused professional guidance for critical career architecture.
            </p>
          </div>
          {isSenior && (
            <Link
              href="/mentorship/dashboard"
              className="btn-primary"
            >
              Mentor Dashboard
            </Link>
          )}
        </div>
      </div>

      {fetching ? (
        <div className="flex justify-center py-24"><div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : mentors.length === 0 ? (
        <div className="clean-card py-32 text-center border-slate-200 bg-slate-50/10">
          <FiUser className="mx-auto text-slate-100 mb-6" size={48} />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No mentors are currently taking bookings.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mentors.map(mentor => (
            <div key={mentor.uid} className="clean-card p-8 group flex flex-col border-slate-200 hover:border-slate-900 transition-all duration-300">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-50 text-slate-900 flex items-center justify-center font-display font-black text-2xl border border-slate-200 group-hover:bg-slate-900 group-hover:text-white transition-all duration-500">
                    {mentor.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-primary transition-colors">{mentor.displayName}</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {mentor.rollNumber}</p>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500" title="Vetted Mentor">
                  <FiCheck size={12} />
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-3">
                  {mentor.bio}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {mentor.expertise.slice(0, 3).map((exp, i) => (
                    <span key={i} className="px-2.5 py-1 rounded bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-widest border border-slate-200">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5">Availability Index</p>
                  <p className="text-sm font-bold text-slate-900">{mentor.availableSlots?.filter(s => !s.isBooked).length || 0} Slots Open</p>
                </div>
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  disabled={!mentor.availableSlots || mentor.availableSlots.filter(s => !s.isBooked).length === 0}
                  className="btn-primary text-xs px-5 py-2 disabled:opacity-20"
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal - Refined Systemic UI */}
      {selectedMentor && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all p-10 md:p-14 relative border border-slate-200">
            <button onClick={() => setSelectedMentor(null)} className="absolute top-8 right-8 p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <FiX size={20} />
            </button>
            <div className="text-center mb-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-900 border border-slate-100 flex items-center justify-center mx-auto mb-6">
                <FiCalendar size={28} />
              </div>
              <h2 className="text-3xl font-display font-black text-slate-900 mb-2 tracking-tight">Protocol: Schedule</h2>
              <p className="text-slate-500 font-medium">Authoring session with <span className="text-primary font-bold">@{selectedMentor.displayName.replace(/\s+/g, '').toLowerCase()}</span></p>
            </div>

            <form onSubmit={handleBookSlot} className="space-y-10">
              <div>
                <label className="section-label mb-6 block">Select Temporal Slot</label>
                <div className="grid grid-cols-1 gap-3">
                  {selectedMentor.availableSlots?.filter(s => !s.isBooked).map(slot => (
                    <label key={slot.id} className={`group flex items-center justify-between p-5 rounded-xl border-2 cursor-pointer transition-all ${selectedSlot?.id === slot.id ? 'border-primary bg-primary/5' : 'border-slate-50 hover:bg-slate-50 bg-white'}`}>
                      <div className="flex items-center gap-5">
                        <input
                          type="radio" name="slot" className="hidden"
                          checked={selectedSlot?.id === slot.id}
                          onChange={() => {
                            setSelectedSlot(slot);
                            setBookingDate(getNextAvailableDateForDay(slot.dayOfWeek));
                          }}
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedSlot?.id === slot.id ? 'border-primary' : 'border-slate-200 group-hover:border-primary/50'}`}>
                          {selectedSlot?.id === slot.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{daysOfWeek[slot.dayOfWeek]}</p>
                          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
                            <FiClock size={12} />
                            {slot.startTime} - {slot.endTime}
                          </div>
                        </div>
                      </div>
                      {selectedSlot?.id === slot.id && (
                        <div className="text-[10px] font-bold text-primary bg-white border border-primary/20 px-3 py-1 rounded">
                          {new Date(getNextAvailableDateForDay(slot.dayOfWeek)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="section-label mb-4 block">Communication Terminal</label>
                <div className="relative">
                  <FiInfo className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                  <input
                    type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="input-clean pl-14"
                    placeholder="WhatsApp / Contact Number"
                  />
                </div>
                <p className="text-[9px] text-slate-400 mt-3 font-medium uppercase tracking-widest pl-1 leading-relaxed">
                  Mentor will initiate contact via this terminal.
                </p>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={!selectedSlot || !phone || bookingLoading} className="btn-primary w-full py-4 text-sm disabled:opacity-20 shadow-xl shadow-primary/20">
                  {bookingLoading ? 'Establishing Handshake...' : 'Finalize Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
