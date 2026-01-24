import React, { useState, useEffect } from 'react';
import { X, CheckCircle, CreditCard, ChevronRight } from 'lucide-react';
import { formatRupiah } from '../utils/format';

function PublicPaymentModal({ settings, onClose }) {
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        nama: '',
        jenis: '',
        jumlah: '',
        keterangan: ''
    });

    const safeSettings = settings || {};
    const jenisList = safeSettings.jenisPenerimaan || ['Zakat Fitrah', 'Zakat Maal', 'Infaq', 'Sedekah', 'Fidyah'];

    const handleNext = () => {
        if (!form.nama.trim()) return alert('⚠️ Mohon isi nama Anda (atau Hamba Allah)');
        if (!form.jenis) return alert('⚠️ Mohon pilih jenis pembayaran');
        if (!form.jumlah || parseFloat(form.jumlah) <= 0) return alert('⚠️ Mohon isi nominal pembayaran');
        setStep(2);
    };

    const handleProcess = () => {
        // Construct WA Message
        const nominal = formatRupiah(parseFloat(form.jumlah));
        const message = `*PEMBAYARAN ZAKAT BARU*
---------------------------
👤 Nama: ${form.nama}
🏷️ Jenis: ${form.jenis}
💰 Nominal: ${nominal}
📝 Ket: ${form.keterangan || '-'}

Mohon konfirmasi pembayaran ini.`;

        const waUrl = `https://wa.me/${settings.nomorKonsultasi}?text=${encodeURIComponent(message)}`;

        // Open WA
        window.open(waUrl, '_blank');

        // Auto Close logic? Maybe show success then close.
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[var(--bg-page)] rounded-3xl overflow-hidden border border-[var(--glass-border)] shadow-2xl animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-[var(--border-surface)] flex justify-between items-center bg-[var(--bg-surface)]">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <CreditCard size={20} className="text-emerald-400" />
                        Bayar Zakat
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition text-[var(--text-muted)]">
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {step === 1 ? (
                        <>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Nama Muzakki</label>
                                    <input
                                        autoFocus
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] text-[var(--text-primary)] focus:border-emerald-500/50 focus:outline-none transition"
                                        placeholder="Nama Lengkap / Hamba Allah"
                                        value={form.nama}
                                        onChange={e => setForm({ ...form, nama: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Jenis Pembayaran</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {jenisList.map(j => (
                                            <button
                                                key={j}
                                                onClick={() => setForm({ ...form, jenis: j })}
                                                className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition text-left ${form.jenis === j ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'border-[var(--border-surface)] hover:border-emerald-500/30'}`}
                                            >
                                                {j}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Nominal (Rp)</label>
                                    <input
                                        type="number"
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] text-[var(--text-primary)] font-mono text-lg focus:border-emerald-500/50 focus:outline-none transition"
                                        placeholder="0"
                                        value={form.jumlah}
                                        onChange={e => setForm({ ...form, jumlah: e.target.value })}
                                    />
                                    {form.jumlah > 0 && <p className="text-xs text-emerald-400 font-bold text-right">{formatRupiah(form.jumlah)}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Doa / Keterangan (Opsional)</label>
                                    <textarea
                                        className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] text-[var(--text-primary)] focus:border-emerald-500/50 focus:outline-none transition text-sm"
                                        placeholder="Semoga berkah..."
                                        rows={2}
                                        value={form.keterangan}
                                        onChange={e => setForm({ ...form, keterangan: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleNext}
                                className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-md shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2"
                            >
                                Lanjut <ChevronRight size={18} />
                            </button>
                        </>
                    ) : (
                        <div className="text-center space-y-6 py-4">
                            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-400 animate-pulse">
                                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg">
                                    <span className="text-2xl">📱</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h4 className="font-bold text-xl">Konfirmasi via WhatsApp</h4>
                                <p className="text-sm text-[var(--text-muted)]">Anda akan diarahkan ke WhatsApp Admin untuk mengirim detail pembayaran dan bukti transfer.</p>
                            </div>

                            <div className="bg-[var(--bg-surface)] p-4 rounded-2xl text-left space-y-2 border border-[var(--border-surface)]">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Nama</span>
                                    <span className="font-bold">{form.nama}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--text-muted)]">Jenis</span>
                                    <span className="font-bold">{form.jenis}</span>
                                </div>
                                <div className="flex justify-between text-sm border-t border-[var(--border-surface)] pt-2 mt-2">
                                    <span className="text-[var(--text-muted)]">Total</span>
                                    <span className="font-bold text-emerald-400 text-lg">{formatRupiah(form.jumlah)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleProcess}
                                className="w-full py-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-md shadow-lg shadow-green-500/20 transition flex items-center justify-center gap-2"
                            >
                                Buka WhatsApp Sekarang
                            </button>

                            <button
                                onClick={() => setStep(1)}
                                className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] px-4 py-2"
                            >
                                Kembali Edit
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default PublicPaymentModal;