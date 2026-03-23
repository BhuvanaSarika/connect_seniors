'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RollNumberRange } from '@/types';
import { FiPlus, FiTrash2, FiSave, FiAlertCircle, FiShield, FiInfo } from 'react-icons/fi';
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
      if (!confirm('Operational security: confirm deletion of this systemic rule? This may affect existing authentication protocols.')) return;
      await deleteDoc(doc(db, 'rollNumberRanges', id));
    }
    setRanges(ranges.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const range of ranges) {
        if (!range.prefix) continue;
        const validRange = { ...range };
        if (validRange.id.startsWith('default_') || validRange.id.startsWith('new_')) {
          validRange.id = `${validRange.prefix}_${validRange.role}`;
        }
        await setDoc(doc(db, 'rollNumberRanges', validRange.id), validRange);
      }
      alert('Operational success: Registry rules updated.');
      const snap = await getDocs(collection(db, 'rollNumberRanges'));
      setRanges(snap.docs.map(d => ({ id: d.id, ...d.data() } as RollNumberRange)));
    } catch (err) {
      console.error(err);
      alert('Operational failure: could not commit registry rules.');
    }
    setSaving(false);
  };

  if (fetching) return (
    <div className="flex justify-center py-24">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="text-slate-900">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registry Configuration</p>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-2">Roll Number Protocols</h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl">
             Manage systemic validation rules for academic identifiers. These protocols govern profile creation and role assignment for all new technical assets.
          </p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleAdd} className="px-6 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center gap-2">
            <FiPlus /> Ingest Protocol
          </button>
          <button onClick={handleSave} disabled={saving} className="btn-primary px-8 py-2.5 text-[10px] shadow-xl shadow-primary/20 disabled:opacity-20 flex items-center gap-2">
            <FiSave /> {saving ? 'Synchronizing...' : 'Commit All'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 mb-12 flex items-start gap-4 border border-slate-800 shadow-xl shadow-slate-200/50">
        <FiShield size={24} className="text-primary shrink-0 mt-1" />
        <div>
           <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Protocol Warning</p>
           <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-3xl">
              Modification of these rules directly impacts the registration gatekeeper. The system matches identifiers using the pattern: <code className="text-primary bg-white/5 px-2 py-0.5 rounded mx-1">Prefix + Number (0-padded) + Suffix</code>.
           </p>
        </div>
      </div>

      <div className="clean-card overflow-x-auto shadow-2xl shadow-slate-200/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Class/Role</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Prefix ID</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Lower Bound</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Upper Bound</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Suffix</th>
              <th className="px-4 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Padding</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cycle</th>
              <th className="px-6 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranges.map((range) => (
              <tr key={range.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <select
                    value={range.role}
                    onChange={(e) => handleChange(range.id, 'role', e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-bold text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer focus:ring-0"
                  >
                    <option value="junior">Junior Grade</option>
                    <option value="senior">Senior Grade</option>
                  </select>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-slate-900 text-sm">
                  <input type="text" value={range.prefix} onChange={e => handleChange(range.id, 'prefix', e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all uppercase" placeholder="22A91A" />
                </td>
                <td className="px-6 py-4">
                  <input type="number" value={range.startNum} onChange={e => handleChange(range.id, 'startNum', parseInt(e.target.value))} className="w-20 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-mono text-sm" />
                </td>
                <td className="px-4 py-4">
                  <input type="number" value={range.endNum} onChange={e => handleChange(range.id, 'endNum', parseInt(e.target.value))} className="w-20 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-mono text-sm" />
                </td>
                <td className="px-6 py-4">
                  <input type="text" value={range.suffix} onChange={e => handleChange(range.id, 'suffix', e.target.value)} className="w-16 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-mono text-sm" />
                </td>
                <td className="px-4 py-4">
                  <input type="number" value={range.padLength} onChange={e => handleChange(range.id, 'padLength', parseInt(e.target.value))} className="w-16 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all font-mono text-sm" min="1" max="5" />
                </td>
                <td className="px-6 py-4">
                  <input type="text" value={range.academicYear} onChange={e => handleChange(range.id, 'academicYear', e.target.value)} className="w-24 px-3 py-2 rounded-lg border border-slate-100 bg-slate-50 focus:bg-white focus:border-primary outline-none transition-all text-[10px] font-bold uppercase tracking-widest" placeholder="2024-25" />
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => handleRemove(range.id)} className="p-2 rounded-lg text-slate-300 hover:bg-red-600 hover:text-white transition-all border border-transparent hover:border-red-100">
                    <FiTrash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-8 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest px-2">
         <p>Global Rule Registry</p>
         <p className="flex items-center gap-2"><FiInfo className="text-primary" /> Changes are committed to the centralized Firestore terminal.</p>
      </div>
    </div>
  );
}
