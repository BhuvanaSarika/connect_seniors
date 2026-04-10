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
    console.log('Ingest Protocol initiated');
    const newId = `new_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newRow: RollNumberRange = { id: newId, prefix: '', startNum: 1, endNum: 100, suffix: '', padLength: 2, role: 'junior', academicYear: '2024-25' };
    setRanges(prev => [newRow, ...prev]);
  };

  const handleChange = (id: string, field: keyof RollNumberRange, value: string | number) => {
    setRanges(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleRemove = async (id: string) => {
    if (!id.startsWith('new_')) {
      if (!confirm('Operational security: confirm deletion of this systemic rule? This may affect existing authentication protocols.')) return;
      await deleteDoc(doc(db, 'rollNumberRanges', id));
    }
    setRanges(prev => prev.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    let skipped = 0;
    try {
      for (const range of ranges) {
        if (!range.prefix || range.prefix.trim() === '') {
          skipped++;
          continue;
        }
        const validRange = { ...range };
        if (validRange.id.startsWith('default_') || validRange.id.startsWith('new_')) {
          validRange.id = `${validRange.prefix}_${validRange.role}`;
        }
        await setDoc(doc(db, 'rollNumberRanges', validRange.id), validRange);
      }
      alert(`Operational success: Registry rules updated.${skipped > 0 ? ` Note: ${skipped} empty ranges were skipped.` : ''}`);
      const snap = await getDocs(collection(db, 'rollNumberRanges'));
      setRanges(snap.docs.map(d => ({ id: d.id, ...d.data() } as RollNumberRange)));
    } catch (err) {
      console.error(err);
      alert('Operational failure: could not commit registry rules. Ensure you have admin permissions.');
    }
    setSaving(false);
  };

  if (fetching) return (
    <div className="flex justify-center py-24">
      <div className="animate-spin w-8 h-8 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  return (
    <div className="text-slate-900 w-full overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Registry Configuration</p>
          <h1 className="text-3xl font-display font-black text-slate-900 tracking-tight mb-2">Roll Number Protocols</h1>
          <p className="text-slate-500 font-medium text-sm max-w-2xl">
             Manage systemic validation rules for academic identifiers. These protocols govern profile creation and role assignment for all new technical assets.
          </p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={handleAdd} className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-2 active:scale-95 shadow-xl shadow-slate-900/20">
            <FiPlus /> Ingest Protocol
          </button>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary px-6 py-2.5 text-[10px] shadow-xl shadow-primary/20 disabled:opacity-20 flex items-center gap-2 active:scale-95">
            <FiSave /> {saving ? 'Synchronizing...' : 'Commit All'}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-6 mb-12 flex items-start gap-4 border border-slate-800 shadow-xl shadow-slate-200/50 hidden md:flex">
        <FiShield size={24} className="text-primary shrink-0 mt-1" />
        <div>
           <p className="text-[10px] font-bold text-white uppercase tracking-widest mb-2">Protocol Warning</p>
           <p className="text-slate-400 text-xs font-medium leading-relaxed max-w-3xl">
              Modification of these rules directly impacts the registration gatekeeper. The system matches identifiers using the pattern: <code className="text-primary bg-white/5 px-2 py-0.5 rounded mx-1">Prefix + Number (0-padded) + Suffix</code>.
           </p>
        </div>
      </div>

      <div className="clean-card shadow-2xl shadow-slate-200/50 overflow-x-auto w-full">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-28 whitespace-nowrap">Class/Role</th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-32 whitespace-nowrap">Prefix ID</th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Lower</th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Upper</th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-24">Suffix</th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-20 whitespace-nowrap">Padding</th>
              <th className="px-3 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 w-28">Cycle</th>
              <th className="px-3 py-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {ranges.map((range) => (
              <tr key={range.id} className="hover:bg-slate-50/50 transition-colors animate-in fade-in duration-300">
                <td className="px-3 py-3">
                  <select
                    value={range.role}
                    onChange={(e) => handleChange(range.id, 'role', e.target.value)}
                    className="w-full bg-transparent border-none outline-none font-bold text-[10px] uppercase tracking-widest text-slate-900 cursor-pointer focus:ring-0"
                  >
                    <option value="junior">Junior Grade</option>
                    <option value="senior">Senior Grade</option>
                  </select>
                </td>
                <td className="px-3 py-3 font-mono font-bold text-slate-900 text-xs">
                  <input type="text" value={range.prefix} onChange={e => handleChange(range.id, 'prefix', e.target.value)} className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary outline-none transition-all uppercase placeholder-slate-300" placeholder="e.g. 22A91A" />
                </td>
                <td className="px-3 py-3">
                  <input type="number" value={range.startNum} onChange={e => handleChange(range.id, 'startNum', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary outline-none transition-all font-mono text-xs" />
                </td>
                <td className="px-3 py-3">
                  <input type="number" value={range.endNum} onChange={e => handleChange(range.id, 'endNum', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary outline-none transition-all font-mono text-xs" />
                </td>
                <td className="px-3 py-3">
                  <input type="text" value={range.suffix} onChange={e => handleChange(range.id, 'suffix', e.target.value)} className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary outline-none transition-all font-mono text-xs placeholder-slate-300" placeholder="Opt..." />
                </td>
                <td className="px-3 py-3">
                  <input type="number" value={range.padLength} onChange={e => handleChange(range.id, 'padLength', parseInt(e.target.value) || 0)} className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary outline-none transition-all font-mono text-xs" min="1" max="5" />
                </td>
                <td className="px-3 py-3">
                  <input type="text" value={range.academicYear} onChange={e => handleChange(range.id, 'academicYear', e.target.value)} className="w-full px-2 py-1.5 rounded bg-slate-50 border border-slate-200 focus:bg-white focus:border-primary outline-none transition-all text-[10px] font-bold uppercase tracking-widest placeholder-slate-300" placeholder="2024-25" />
                </td>
                <td className="px-2 py-3 text-center">
                  <button type="button" onClick={() => handleRemove(range.id)} className="p-1.5 rounded text-slate-400 hover:bg-red-500 hover:text-white transition-all bg-white border border-slate-200 hover:border-transparent">
                    <FiTrash2 size={14} />
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
