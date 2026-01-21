import React, { useState } from 'react';

function FormMustahik({ initial, onSave }) {
    const [form, setForm] = useState(initial || {
        nama: '',
        alamat: '',
        kategori: 'Fakir',
        keterangan: ''
    });

    return (
        <div className="space-y-4 text-left">
            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Nama Mustahik *</label>
                <input
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    placeholder="Nama lengkap..."
                    value={form.nama}
                    onChange={e => setForm({ ...form, nama: e.target.value })}
                />
            </div>

            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Alamat</label>
                <textarea
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    placeholder="Alamat lengkap..."
                    value={form.alamat}
                    onChange={e => setForm({ ...form, alamat: e.target.value })}
                    rows="2"
                />
            </div>

            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Kategori</label>
                <select
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    value={form.kategori}
                    onChange={e => setForm({ ...form, kategori: e.target.value })}
                >
                    <option className="bg-gray-900">Fakir</option>
                    <option className="bg-gray-900">Miskin</option>
                    <option className="bg-gray-900">Amil</option>
                    <option className="bg-gray-900">Mualaf</option>
                    <option className="bg-gray-900">Riqab</option>
                    <option className="bg-gray-900">Gharim</option>
                    <option className="bg-gray-900">Fisabilillah</option>
                    <option className="bg-gray-900">Ibnu Sabil</option>
                </select>
            </div>

            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Keterangan (opsional)</label>
                <textarea
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    placeholder="Catatan tambahan..."
                    value={form.keterangan}
                    onChange={e => setForm({ ...form, keterangan: e.target.value })}
                    rows="2"
                />
            </div>

            <button
                onClick={() => onSave(form)}
                className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-white/90 transition shadow-xl mt-4"
            >
                💾 Simpan Mustahik
            </button>
        </div>
    );
}

export default FormMustahik;
