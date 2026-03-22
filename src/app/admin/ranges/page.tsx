'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RollNumberRange } from '@/types';
import { FiPlus, FiTrash2, FiSave, FiAlertCircle } from 'react-icons/fi';
import { DEFAULT_ROLL_NUMBER_RANGES } from '@/lib/rollNumberValidator';

export default function AdminRangesPage() {
  const [ranges, setRanges] = useState<RollNumberRange[]>([]);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchRanges = async () => {
      try {
        const snap = await getDocs(collection(db, 'rollNumberRanges'));
        if (snap.empty) {
          // Initialize from defaults if empty
          const defaults = DEFAULT_ROLL_NUMBER_RANGES.map((r, i) => ({ ...r, id: `default_${i}` }));
          setRanges(defaults);
        } else {
          setRanges(snap.docs.map(d => ({ id: d.id, ...d.data() } as RollNumberRange)));
        }
      } catch (err) { console.error(err); }
      setFetching(false);
    };
    fetchRanges();
  }, []);

  const handleAdd = () => {
    setRanges([
      ...ranges,
      { id: `new_${Date.now()}`, prefix: '', startNum: 1, endNum: 100, suffix: '', padLength: 2, role: 'junior', academicYear: '2024-25' }
    ]);
  };

  const handleChange = (id: string, field: keyof RollNumberRange, value: string | number) => {
    setRanges(ranges.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemove = async (id: string) => {
    if (!id.startsWith('new_')) {
      if (!confirm('Warning: Deleting this range may affect existing users. Proceed?')) return;
      await deleteDoc(doc(db, 'rollNumberRanges', id));
    }
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Need a batch operation in a real app, here we loop for simplicity since it's admin only
      for (const range of ranges) {
        if (!range.prefix) continue; // skip invalid
        const validRange = { ...range };
        if (validRange.id.startsWith('default_') || validRange.id.startsWith('new_')) {
          validRange.id = `${validRange.prefix}_${validRange.role}`;
        }
        await setDoc(doc(db, 'rollNumberRanges', validRange.id), validRange);
      }
      alert('Roll number ranges saved successfully!');
      
      // Refresh
      const snap = await getDocs(collection(db, 'rollNumberRanges'));
      setRanges(snap.docs.map(d => ({ id: d.id, ...d.data() } as RollNumberRange)));
    } catch (err) {
      console.error(err);
      alert('Failed to save ranges');
    }
    setSaving(false);
  };

  if (fetching) return <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full mx-auto mt-20" />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roll Number Ranges</h1>
          <p className="text-gray-500 text-sm mt-1">Manage rules for user registration and role assignment.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleAdd} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">
            <FiPlus /> Add Rule
          </button>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors disabled:opacity-50">
            <FiSave /> {saving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-red-700 text-sm">
        <FiAlertCircle size={20} className="shrink-0 mt-0.5" />
        <p>
          <strong>Warning:</strong> Changing these rules controls who can register. Patterns match: <code className="bg-red-100 px-1 py-0.5 rounded">Prefix + Number (0-padded) + Suffix</code>.
          Example: <code className="font-bold">22A91A44</code> (prefix) + <code className="font-bold">01</code> (start: 1, pLen: 2) + <code className="font-bold">_U</code> (suffix) = "22A91A4401_U".
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-4 py-3 border-b">Role</th>
              <th className="px-4 py-3 border-b">Prefix</th>
              <th className="px-4 py-3 border-b">Start Range</th>
              <th className="px-4 py-3 border-b">End Range</th>
              <th className="px-4 py-3 border-b">Suffix</th>
              <th className="px-4 py-3 border-b">Padding</th>
              <th className="px-4 py-3 border-b">Acad. Year</th>
              <th className="px-4 py-3 border-b w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranges.map((range) => (
              <tr key={range.id} className="hover:bg-gray-50/50">
                <td className="px-4 py-3">
                  <select
                    value={range.role}
                    onChange={(e) => handleChange(range.id, 'role', e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-semibold focus:ring-0 cursor-pointer"
                  >
                    <option value="junior">Junior</option>
                    <option value="senior">Senior</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input type="text" value={range.prefix} onChange={e => handleChange(range.id, 'prefix', e.target.value)} className="w-full px-2 py-1.5 rounded border border-gray-200 outline-none uppercase font-mono" placeholder="22A91A44" />
                </td>
                <td className="px-4 py-3">
                  <input type="number" value={range.startNum} onChange={e => handleChange(range.id, 'startNum', parseInt(e.target.value))} className="w-20 px-2 py-1.5 rounded border border-gray-200 outline-none font-mono" />
                </td>
                <td className="px-4 py-3">
                  <input type="number" value={range.endNum} onChange={e => handleChange(range.id, 'endNum', parseInt(e.target.value))} className="w-20 px-2 py-1.5 rounded border border-gray-200 outline-none font-mono" />
                </td>
                <td className="px-4 py-3">
                  <input type="text" value={range.suffix} onChange={e => handleChange(range.id, 'suffix', e.target.value)} className="w-16 px-2 py-1.5 rounded border border-gray-200 outline-none uppercase font-mono" placeholder="_U" />
                </td>
                <td className="px-4 py-3">
                  <input type="number" value={range.padLength} onChange={e => handleChange(range.id, 'padLength', parseInt(e.target.value))} className="w-16 px-2 py-1.5 rounded border border-gray-200 outline-none font-mono" min="1" max="5" title="Number of digits (e.g. 2 for 01-99)" />
                </td>
                <td className="px-4 py-3">
                  <input type="text" value={range.academicYear} onChange={e => handleChange(range.id, 'academicYear', e.target.value)} className="w-24 px-2 py-1.5 rounded border border-gray-200 outline-none uppercase" placeholder="2024-25" />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleRemove(range.id)} className="p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded">
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
