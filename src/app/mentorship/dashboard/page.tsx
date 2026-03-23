import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MentorProfile, TimeSlot, MentorshipBooking } from '@/types';
import Link from 'next/link';
import { FiClock, FiCheckCircle, FiUser, FiCalendar, FiPlus } from 'react-icons/fi';

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
        // Fetch Profile
        const snap = await getDoc(doc(db, 'mentorProfiles', appUser.uid));
        if (snap.exists()) {
          const data = snap.data() as MentorProfile;
          setProfile(data);
          setBio(data.bio);
          setExpertiseTags(data.expertise.join(', '));
          setSlots(data.availableSlots || []);
        }

        // Fetch Bookings
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
      alert('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save profile');
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
      // 1. Update Booking
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      
      setBookings(curr => curr.map(b => b.id === bookingId ? { ...b, status } : b));

      // 2. If confirmed, lock the slot
      if (status === 'confirmed') {
        const updatedSlots = slots.map(s => s.id === slotId ? { ...s, isBooked: true } : s);
        await updateDoc(doc(db, 'mentorProfiles', appUser.uid), { availableSlots: updatedSlots });
        setSlots(updatedSlots);
        alert('Booking confirmed! You can now see their contact details.');
      } else {
        alert('Booking declined.');
      }
      
    } catch (err) {
      console.error(err);
      alert('Failed to update booking status');
    }
    setActionLoading(null);
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary-dark">Mentor Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage your mentorship profile and availability</p>
        </div>
        <Link href="/mentorship" className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium transition-colors">
          View All Mentors
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Profile Form */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-2xl shadow-lg border border-muted/20 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-primary-dark flex items-center gap-2">
                <FiUser className="text-primary" /> Profile Details
              </h2>
              {profile && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${profile.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {profile.isApproved ? 'Approved Mentor' : 'Pending Approval'}
                </span>
              )}
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Bio</label>
                <textarea
                  required
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-bg-light"
                  placeholder="Introduce yourself and your experience..."
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expertise Tags (comma-separated)</label>
                <input
                  type="text"
                  required
                  value={expertiseTags}
                  onChange={(e) => setExpertiseTags(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-bg-light"
                  placeholder="React, Next.js, AI, Machine Learning"
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <h3 className="text-lg font-bold text-primary-dark mb-4 flex items-center gap-2">
                  <FiClock className="text-accent" /> Available Time Slots
                </h3>
                
                {/* Add Slot */}
                <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-bg-light rounded-xl border border-muted/30">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Day</label>
                    <select value={newDay} onChange={(e) => setNewDay(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 outline-none">
                      {daysOfWeek.map((day, i) => <option key={i} value={i}>{day}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Start Time</label>
                    <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">End Time</label>
                    <input type="time" value={newEndTime} onChange={(e) => setNewEndTime(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-200 outline-none" />
                  </div>
                  <button type="button" onClick={handleAddSlot} className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-dark transition-colors flex items-center gap-2">
                    <FiPlus /> Add
                  </button>
                </div>

                {/* List Slots */}
                <div className="space-y-2">
                  {slots.length === 0 ? (
                     <p className="text-sm text-gray-500 italic">No slots added yet.</p>
                  ) : (
                    slots.map(slot => (
                      <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white">
                        <div className="flex items-center gap-4">
                          <span className="font-semibold text-primary w-12">{daysOfWeek[slot.dayOfWeek]}</span>
                          <span className="text-gray-600">{slot.startTime} - {slot.endTime}</span>
                          {slot.isBooked && (
                            <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                              Booked
                            </span>
                          )}
                        </div>
                        {!slot.isBooked && (
                          <button type="button" onClick={() => handleRemoveSlot(slot.id)} className="text-red-400 hover:text-red-600 text-sm font-medium">
                            Remove
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" disabled={saving} className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-primary-light text-white font-semibold text-lg shadow-lg hover:shadow-primary/40 transition-all disabled:opacity-60">
                  {saving ? 'Saving Profile...' : 'Save Profile & Availability'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Manage Bookings */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-lg border border-muted/20 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-primary-dark mb-6 flex items-center gap-2">
              <FiCalendar className="text-primary-light" /> Mentorship Requests
            </h2>
            
            {bookings.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-gray-400">No booking requests yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => {
                  const slot = slots.find(s => s.id === booking.slotId);
                  const isUpcoming = new Date(booking.date) >= new Date(new Date().setHours(0,0,0,0));
                  
                  return (
                    <div key={booking.id} className="p-4 rounded-xl border border-gray-200 bg-bg-light">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-bold text-primary-dark">{booking.juniorName}</div>
                        <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-200 text-gray-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        {new Date(booking.date).toLocaleDateString()}
                        {slot ? ` • ${slot.startTime} - ${slot.endTime}` : ''}
                      </div>
                      
                      {/* Actions */}
                      {booking.status === 'pending' && isUpcoming && (
                        <div className="flex gap-2 mt-3">
                           <button onClick={() => handleBookingAction(booking.id, booking.slotId, 'confirmed')} disabled={actionLoading === booking.id} className="flex-1 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-dark disabled:opacity-50">
                             {actionLoading === booking.id ? '...' : 'Accept'}
                           </button>
                           <button onClick={() => handleBookingAction(booking.id, booking.slotId, 'cancelled')} disabled={actionLoading === booking.id} className="flex-1 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 disabled:opacity-50">
                             {actionLoading === booking.id ? '...' : 'Decline'}
                           </button>
                        </div>
                      )}
                      
                      {booking.status === 'confirmed' && (
                         <div className="mt-3 p-3 bg-white rounded-lg border border-gray-100 text-sm">
                           <p className="text-xs text-gray-500 mb-1 tracking-wider uppercase font-semibold">Contact Details</p>
                           <p className="font-medium text-gray-800 break-all">{booking.juniorEmail}</p>
                           <p className="font-medium text-gray-800">{booking.juniorPhone}</p>
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
