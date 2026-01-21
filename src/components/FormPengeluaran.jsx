import React, { useState } from 'react';

function FormPengeluaran({ initial, settings, onSave }) {
    const [form, setForm] = useState(initial || {
        tanggal: new Date().toISOString().split('T')[0],
        penerima: '',
        kategori: 'Distribusi Zakat',
        jumlah: 0,
        metodePembayaran: 'Tunai',
        keterangan: ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveWithLoading = async () => {
        setIsSaving(true);
        try {
            await onSave(form);
        } catch (e) {
            alert('Gagal menyimpan: ' + e);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-4 text-left">
            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Tanggal</label>
                <input
                    type="date"
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    value={form.tanggal}
                    onChange={e => setForm({ ...form, tanggal: e.target.value })}
                />
            </div>

            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Penerima / Keperluan *</label>
                <input
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    placeholder="Nama penerima atau keperluan..."
                    value={form.penerima}
                    onChange={e => setForm({ ...form, penerima: e.target.value })}
                />
            </div>

            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Kategori</label>
                <select
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    value={form.kategori}
                    onChange={e => setForm({ ...form, kategori: e.target.value })}
                >
                    {(settings?.kategoriPengeluaran || ['Distribusi Zakat', 'Program Infak', 'Operasional Masjid', 'Lainnya']).map(kat => (
                        <option key={kat} className="bg-gray-900">{kat}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Jumlah (Rp) *</label>
                <input
                    type="number"
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    placeholder="0"
                    value={form.jumlah || ''}
                    onChange={e => setForm({ ...form, jumlah: parseFloat(e.target.value) || 0 })}
                />
            </div>

            <div>
                <label className="text-xs text-[var(--text-secondary)] mb-1 block">Metode Pembayaran</label>
                <select
                    className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]"
                    value={form.metodePembayaran}
                    onChange={e => setForm({ ...form, metodePembayaran: e.target.value })}
                >
                    <option className="bg-gray-900">Tunai</option>
                    <option className="bg-gray-900">Transfer</option>
                    <option className="bg-gray-900">QRIS</option>
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
                onClick={handleSaveWithLoading}
                disabled={isSaving}
                className={`w-full py-3 rounded-xl font-bold transition flex justify-center items-center gap-2 ${isSaving
                    ? 'bg-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-white text-black hover:bg-white/90'
                    }`}
            >
                {isSaving && (
                    <svg className="animate-spin h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                )}
                <span>{isSaving ? 'Menyimpan...' : '💾 Simpan Pengeluaran'}</span>
            </button>
        </div>
    );
}

export default FormPengeluaran;
