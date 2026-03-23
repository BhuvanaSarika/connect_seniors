"use client"
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorProfile, TimeSlot, MentorshipBooking } from '@/types';
import Link from 'next/link';
import { FiClock, FiUser, FiCalendar, FiCheck, FiPlus } from 'react-icons/fi';

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
      // Create booking record
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

      alert('Booking request sent to mentor!');
      setSelectedMentor(null);
      setPhone('');
    } catch (err) {
      console.error(err);
      alert('Failed to send booking request');
    }
    setBookingLoading(false);
  };

  const getNextAvailableDateForDay = (dayOfWeek: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + (dayOfWeek + 7 - d.getDay()) % 7);
    if (d.getDay() === new Date().getDay() && dayOfWeek === new Date().getDay()) {
      d.setDate(d.getDate() + 7); // Move to next week if it's today (simplified)
    }
    return d.toISOString().split('T')[0];
  };

  if (loading || !appUser) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const isSenior = appUser.role === 'senior' || appUser.role === 'admin';

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-8 h-1 bg-primary rounded-full" />
            <span className="text-xs font-bold uppercase tracking-widest text-primary-light">Experts Network</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-display font-extrabold text-gray-900 leading-tight">
            1:1 <span className="text-gradient">Mentorship</span>
          </h1>
          <p className="text-gray-500 mt-2 max-w-lg">
            Connect with industry-leading seniors for personalized career guidance, technical deep-dives, and resume reviews.
          </p>
        </div>
        {isSenior && (
          <Link 
            href="/mentorship/dashboard" 
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gray-900 text-white font-bold shadow-float hover:bg-primary transition-all hover:scale-[1.02] active:scale-95"
          >
            Senior Dashboard
          </Link>
        )}
      </div>

      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-premium">
          <FiUser className="mx-auto text-gray-100 mb-6" size={64} />
          <p className="text-gray-400 text-xl font-medium">No mentors available yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mentors.map(mentor => (
            <div key={mentor.uid} className="group relative bg-white rounded-[2.5rem] p-8 shadow-premium hover:shadow-float border border-gray-100 transition-all duration-500 hover:-translate-y-2 flex flex-col">
              <div className="flex items-center gap-5 mb-8">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-display font-bold text-3xl shadow-inner group-hover:bg-primary group-hover:text-white transition-all duration-500">
                    {mentor.displayName.charAt(0)}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-white shadow-lg border border-gray-50 flex items-center justify-center text-green-500">
                     <FiCheck size={16} />
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors">{mentor.displayName}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">ID: {mentor.rollNumber}</p>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-8 line-clamp-3 leading-relaxed flex-1">
                {mentor.bio}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {mentor.expertise.slice(0, 3).map((exp, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-600 text-[10px] font-bold uppercase tracking-widest border border-gray-100">
                    {exp}
                  </span>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-0.5">Availability</span>
                  <span className="text-sm font-bold text-primary">{mentor.availableSlots?.filter(s => !s.isBooked).length || 0} Slots</span>
                </div>
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  disabled={!mentor.availableSlots || mentor.availableSlots.filter(s => !s.isBooked).length === 0}
                  className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-black/5 disabled:opacity-30"
                >
                  Book Session
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedMentor && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto transform transition-all p-8 md:p-12 relative">
            <button onClick={() => setSelectedMentor(null)} className="absolute top-8 right-8 p-2 rounded-xl hover:bg-gray-100 text-gray-400">
               <FiPlus size={24} className="rotate-45" />
            </button>
            <div className="text-center mb-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <FiCalendar size={32} />
              </div>
              <h2 className="text-3xl font-display font-bold text-gray-900">Schedule Session</h2>
              <p className="text-gray-500 mt-2">Booking with <span className="text-primary font-bold">{selectedMentor.displayName}</span></p>
            </div>

            <form onSubmit={handleBookSlot} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Select Available Slot</label>
                <div className="grid grid-cols-1 gap-3">
                  {selectedMentor.availableSlots?.filter(s => !s.isBooked).map(slot => (
                    <label key={slot.id} className={`group flex items-center justify-between p-5 rounded-2xl border-2 cursor-pointer transition-all ${selectedSlot?.id === slot.id ? 'border-primary bg-primary/5 shadow-md' : 'border-gray-100 hover:border-primary-light/30 bg-white'}`}>
                      <div className="flex items-center gap-4">
                        <input
                          type="radio" name="slot" className="hidden"
                          checked={selectedSlot?.id === slot.id}
                          onChange={() => {
                            setSelectedSlot(slot);
                            setBookingDate(getNextAvailableDateForDay(slot.dayOfWeek));
                          }}
                        />
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedSlot?.id === slot.id ? 'border-primary' : 'border-gray-200'}`}>
                           {selectedSlot?.id === slot.id && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 font-display">{daysOfWeek[slot.dayOfWeek]}</p>
                          <p className="text-sm text-gray-500">{slot.startTime} - {slot.endTime}</p>
                        </div>
                      </div>
                      {selectedSlot?.id === slot.id && (
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1.5 rounded-lg border border-primary/10">
                          Next: {new Date(getNextAvailableDateForDay(slot.dayOfWeek)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Contact Details</label>
                <div className="relative">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">
                    <FiClock size={18} />
                  </div>
                  <input
                    type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-12 pr-5 py-4 rounded-2xl border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium"
                    placeholder="WhatsApp/Phone Number"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="submit" disabled={!selectedSlot || !phone || bookingLoading} className="flex-1 py-4 rounded-2xl bg-primary text-white font-bold text-lg shadow-float hover:bg-primary-dark transition-all disabled:opacity-50">
                  {bookingLoading ? 'Requesting...' : 'Confirm Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
