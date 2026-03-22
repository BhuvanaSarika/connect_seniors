'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorProfile, TimeSlot, MentorshipBooking } from '@/types';
import Link from 'next/link';
import { FiClock, FiUser, FiCalendar, FiCheck } from 'react-icons/fi';

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
    if (!appUser || !selectedMentor || !selectedSlot || !bookingDate) return;
    setBookingLoading(true);

    try {
      // Create booking record
      const booking: Omit<MentorshipBooking, 'id'> = {
        mentorUid: selectedMentor.uid,
        mentorName: selectedMentor.displayName,
        juniorUid: appUser.uid,
        juniorName: appUser.displayName,
        slotId: selectedSlot.id,
        date: bookingDate,
        status: 'pending',
        createdAt: Timestamp.now(),
      };
      await addDoc(collection(db, 'bookings'), booking);

      // We DON'T mark the slot as booked immediately in the mentor's profile 
      // until the mentor approves, but we simulate a success message here.
      alert('Booking request sent to mentor!');
      setSelectedMentor(null);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">1:1 Mentorship</h1>
          <p className="text-gray-500 mt-1">Book personalized sessions with approved senior mentors</p>
        </div>
        {isSenior && (
          <Link href="/mentorship/dashboard" className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold shadow-lg hover:shadow-primary/40 hover:scale-105 transition-all">
            Mentor Dashboard
          </Link>
        )}
      </div>

      {fetching ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : mentors.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-muted/20 shadow-sm">
          <FiUser className="mx-auto text-muted mb-4" size={48} />
          <p className="text-gray-400 text-lg">No approved mentors found.</p>
          <p className="text-sm text-gray-400 mt-2">Seniors must set up their profile and wait for admin approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors.map(mentor => (
            <div key={mentor.uid} className="bg-white rounded-2xl shadow-md border border-muted/20 overflow-hidden flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary-light flex items-center justify-center text-white font-bold text-xl shadow-inner">
                    {mentor.displayName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-primary-dark leading-tight">{mentor.displayName}</h3>
                    <p className="text-xs text-gray-500 font-mono">{mentor.rollNumber}</p>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4 line-clamp-3 leading-relaxed">{mentor.bio}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {mentor.expertise.map((exp, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-md bg-bg-light text-primary-dark text-xs font-semibold border border-primary/10">
                      {exp}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-4 bg-bg-light border-t border-muted/20">
                <div className="flex items-center justify-between mb-3 text-sm">
                  <span className="text-gray-500 flex items-center gap-1"><FiClock /> Available Slots</span>
                  <span className="font-semibold text-primary">{mentor.availableSlots?.filter(s => !s.isBooked).length || 0} slots</span>
                </div>
                <button
                  onClick={() => setSelectedMentor(mentor)}
                  disabled={!mentor.availableSlots || mentor.availableSlots.filter(s => !s.isBooked).length === 0}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold shadow-sm hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-primary-dark">Book Session with {selectedMentor.displayName}</h2>
              <p className="text-sm text-gray-500 mt-1">Select an available time slot</p>
            </div>
            
            <form onSubmit={handleBookSlot} className="p-6">
              <div className="space-y-4 max-h-[40vh] overflow-y-auto mb-6 pr-2">
                {selectedMentor.availableSlots?.filter(s => !s.isBooked).map(slot => (
                  <label key={slot.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedSlot?.id === slot.id ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-primary-light/50 bg-white'
                  }`}>
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="slot" 
                        className="w-4 h-4 text-primary"
                        checked={selectedSlot?.id === slot.id}
                        onChange={() => {
                          setSelectedSlot(slot);
                          setBookingDate(getNextAvailableDateForDay(slot.dayOfWeek));
                        }}
                      />
                      <div>
                        <p className="font-bold text-primary-dark">{daysOfWeek[slot.dayOfWeek]}</p>
                        <p className="text-sm text-gray-500">{slot.startTime} - {slot.endTime}</p>
                      </div>
                    </div>
                    {selectedSlot?.id === slot.id && (
                       <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                         Next: {new Date(getNextAvailableDateForDay(slot.dayOfWeek)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                       </span>
                    )}
                  </label>
                ))}
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setSelectedMentor(null)} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={!selectedSlot || bookingLoading} className="flex-1 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:shadow-primary/40 focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all flex justify-center items-center gap-2">
                  {bookingLoading ? 'Sending Request...' : <><FiCalendar /> Request Booking</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
