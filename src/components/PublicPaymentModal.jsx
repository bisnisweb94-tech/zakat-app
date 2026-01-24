import React, { useState, useEffect } from 'react';
import { X, CreditCard, Loader2, CheckCircle, Trash2, Upload } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import gasClient from '../api/gasClient';

function PublicPaymentModal({ data, onClose, settings }) {
    const safeSettings = settings || {};
    const [form, setForm] = useState({
        tanggal: new Date().toISOString().split('T')[0],
        muzakki: '',
        noHP: '',
        alamat: '',
        jumlahKeluarga: 0,
        anggotaKeluarga: [],
        jenis: [],
        jumlah: {},
        beratBeras: {},
        metodePembayaran: 'Transfer', // Default Transfer for public
        lokasi: safeSettings?.daftarLokasi?.[0] || 'Masjid',
        buktiTransfer: null,
        hitungOtomatis: true,
        keterangan: ''
    });

    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [uploadingFile, setUploadingFile] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [statusMsg, setStatusMsg] = useState('');

    const handlePhoneChange = (value) => {
        let formatted = value.replace(/\D/g, '');
        if (formatted.startsWith('0') && formatted.length > 1) formatted = '62' + formatted.substring(1);
        setForm({ ...form, noHP: formatted });
    };

    const toggleJenis = (j) => {
        const isSelected = form.jenis.includes(j);
        const newJenis = isSelected ? form.jenis.filter(x => x !== j) : [...form.jenis, j];
        const newJumlah = { ...form.jumlah };
        const newBerat = { ...form.beratBeras };
        if (isSelected) { delete newJumlah[j]; delete newBerat[j]; }
        setForm({ ...form, jenis: newJenis, jumlah: newJumlah, beratBeras: newBerat });
    };

    const hitungZakatFitrah = () => {
        if (!safeSettings || !form.hitungOtomatis) return 0;
        const totalJiwa = 1 + (parseInt(form.jumlahKeluarga) || 0);
        return totalJiwa * (safeSettings.nilaiZakatFitrah || 0);
    };

    useEffect(() => {
        if (form.hitungOtomatis && form.jenis.includes('Zakat Fitrah') && safeSettings) {
            const zakatOtomatis = hitungZakatFitrah();
            if (zakatOtomatis !== form.jumlah['Zakat Fitrah']) {
                setForm(prev => ({ ...prev, jumlah: { ...prev.jumlah, 'Zakat Fitrah': zakatOtomatis } }));
            }
        }
    }, [form.jumlahKeluarga, form.hitungOtomatis, form.jenis, safeSettings]);

    const handleUploadFile = async () => {
        if (!selectedFile) return alert('⚠️ Pilih file terlebih dahulu!');
        if (!form.muzakki?.trim()) return alert('⚠️ Isi nama anda terlebih dahulu!');

        setUploadingFile(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target.result.split(',')[1];
            const fileName = `bukti_public_${form.muzakki.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
            try {
                const res = await gasClient.request('uploadBuktiTransfer', { base64Data, fileName, contentType: selectedFile.type });
                if (res.success) {
                    setForm({ ...form, buktiTransfer: res });
                    alert('✅ File berhasil diupload!');
                } else {
                    alert('❌ Gagal upload: ' + res.error);
                }
            } catch (err) {
                alert('❌ Error: ' + err.message);
            } finally {
                setUploadingFile(false);
            }
        };
        reader.readAsDataURL(selectedFile);
    };

    const handleSave = async () => {
        if (!form.muzakki) return alert('Nama wajib diisi');
        if (form.jenis.length === 0) return alert('Pilih minimal satu jenis zakat');
        if (!form.noHP) return alert('Nomor WhatsApp wajib diisi untuk pengiriman bukti');

        setLoading(true);
        setStatusMsg('Menyimpan data...');

        try {
            // 1. Prepare Transaction Data
            const transaction = {
                ...form,
                id: Date.now().toString(),
                createdAt: new Date().toISOString(),
                petugas: 'SelfInput', // Hardcoded as requested
                jumlah: form.jenis.reduce((acc, j) => ({ ...acc, [j]: form.jumlah[j] || 0 }), {}),
                beratBeras: form.jenis.reduce((acc, j) => ({ ...acc, [j]: form.beratBeras[j] || 0 }), {})
            };

            // 2. Update Muzakki DB (Optional but good for consistency)
            const muzakkiDB = data.muzakkiDB || [];
            const existingIndex = muzakkiDB.findIndex(m => m.nama.toLowerCase() === form.muzakki.toLowerCase());
            let updatedMuzakkiDB = [...muzakkiDB];

            if (existingIndex >= 0) {
                updatedMuzakkiDB[existingIndex] = { ...updatedMuzakkiDB[existingIndex], noHP: form.noHP, alamat: form.alamat, lastTransaction: new Date().toISOString() };
            } else {
                updatedMuzakkiDB.push({
                    id: Date.now().toString(),
                    nama: form.muzakki,
                    noHP: form.noHP,
                    alamat: form.alamat,
                    createdAt: new Date().toISOString(),
                    lastTransaction: new Date().toISOString()
                });
            }

            // 3. Save All Data
            // Note: In a real concurrent app, we should use a specific backend function to append, 
            // but here we follow the existing pattern of sending the full array.
            const newPenerimaan = [transaction, ...(data.penerimaan || [])];

            await Promise.all([
                gasClient.updateData('masjid-penerimaan', newPenerimaan),
                gasClient.updateData('masjid-muzakki', updatedMuzakkiDB)
            ]);

            // 4. Send WhatsApp Receipt Automatically
            setStatusMsg('Mengirim bukti WA...');
            await gasClient.request('sendTransactionReceipt', {
                transaction: transaction,
                settings: settings
            });

            setSuccess(true);
            setStatusMsg('Berhasil! Terima kasih.');

            setTimeout(() => {
                onClose();
                window.location.reload(); // Refresh to show new data
            }, 3000);

        } catch (err) {
            console.error(err);
            alert('Gagal memproses: ' + err.message);
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                <div className="glass-card p-8 rounded-[2.5rem] text-center max-w-sm w-full border border-emerald-500/30 bg-emerald-500/10">
                    <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                        <CheckCircle size={40} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black text-white mb-2">Alhamdulillah!</h2>
                    <p className="text-emerald-200 mb-4">Zakat Anda telah diterima.</p>
                    <p className="text-xs text-white/60">Bukti transaksi telah dikirim ke WhatsApp Anda.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <div className="glass-card w-full max-w-lg rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl relative my-auto">
                <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition"><X size={20} /></button>

                <div className="mb-6">
                    <h2 className="text-2xl font-black flex items-center gap-2"><CreditCard className="text-emerald-400" /> Bayar Zakat</h2>
                    <p className="text-xs text-[var(--text-muted)]">Isi formulir di bawah ini untuk membayar zakat/infaq.</p>
                </div>

                <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-2 scrollbar-hide">
                    {/* Nama */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Nama Lengkap</label>
                        <input value={form.muzakki} onChange={e => setForm({ ...form, muzakki: e.target.value })} className="w-full glass-input p-3 rounded-xl" placeholder="Nama Bapak/Ibu" />
                    </div>

                    {/* No HP */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">WhatsApp (Untuk Bukti)</label>
                        <input value={form.noHP} onChange={e => handlePhoneChange(e.target.value)} className="w-full glass-input p-3 rounded-xl" placeholder="08..." />
                    </div>

                    {/* Jenis Zakat */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Pilih Jenis Pembayaran</label>
                        <div className="flex flex-wrap gap-2">
                            {(safeSettings.jenisPenerimaan || ['Zakat Fitrah', 'Zakat Mal', 'Infaq', 'Sedekah']).map(j => (
                                <button key={j} onClick={() => toggleJenis(j)} className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${form.jenis.includes(j) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-surface)] hover:border-emerald-500/50'}`}>
                                    {form.jenis.includes(j) && '✓ '}{j}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Zakat Fitrah Auto Calc */}
                    {form.jenis.includes('Zakat Fitrah') && (
                        <div className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-surface)]">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-bold">Jumlah Jiwa</span>
                                <input type="number" value={form.jumlahKeluarga || ''} onChange={e => setForm({ ...form, jumlahKeluarga: e.target.value })} className="w-16 text-center glass-input p-1 rounded-lg text-sm" placeholder="0" />
                            </div>
                            <label className="flex items-center gap-2 text-xs">
                                <input type="checkbox" checked={form.hitungOtomatis} onChange={e => setForm({ ...form, hitungOtomatis: e.target.checked })} className="accent-emerald-500" />
                                <span>Hitung Otomatis: <strong className="text-emerald-400">{formatRupiah(hitungZakatFitrah())}</strong></span>
                            </label>
                        </div>
                    )}

                    {/* Input Nominal */}
                    {form.jenis.map(j => (
                        <div key={j} className="space-y-1">
                            <label className="text-xs font-bold text-[var(--text-muted)]">{j} (Rp)</label>
                            <input
                                type="number"
                                value={form.jumlah[j] || ''}
                                onChange={e => setForm({ ...form, jumlah: { ...form.jumlah, [j]: parseFloat(e.target.value) || 0 } })}
                                disabled={j === 'Zakat Fitrah' && form.hitungOtomatis}
                                className="w-full glass-input p-3 rounded-xl font-mono"
                                placeholder="0"
                            />
                        </div>
                    ))}

                    {/* Metode Pembayaran */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Metode Pembayaran</label>
                        <select value={form.metodePembayaran} onChange={e => setForm({ ...form, metodePembayaran: e.target.value })} className="w-full glass-input p-3 rounded-xl">
                            <option value="Transfer" className="text-black">Transfer Bank</option>
                            <option value="QRIS" className="text-black">QRIS</option>
                            <option value="Tunai" className="text-black">Tunai (Datang ke Masjid)</option>
                        </select>
                    </div>

                    {/* Info Rekening */}
                    {(form.metodePembayaran === 'Transfer' || form.metodePembayaran === 'QRIS') && safeSettings.rekening && (
                        <div className="bg-blue-500/10 p-4 rounded-xl border border-blue-500/20 text-sm">
                            <p className="font-bold text-blue-400 mb-1">Silahkan transfer ke:</p>
                            <p className="font-mono text-lg">{safeSettings.rekening.bank} {safeSettings.rekening.norek}</p>
                            <p className="text-xs opacity-70">a.n {safeSettings.rekening.atasNama}</p>
                        </div>
                    )}

                    {/* Upload Bukti */}
                    {(form.metodePembayaran === 'Transfer' || form.metodePembayaran === 'QRIS') && (
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--text-muted)] uppercase">Upload Bukti Transfer</label>
                            {!form.buktiTransfer ? (
                                <div className="flex items-center gap-2">
                                    <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} className="text-xs w-full" />
                                    {selectedFile && (
                                        <button onClick={handleUploadFile} disabled={uploadingFile} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1">
                                            {uploadingFile ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Upload
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-2"><CheckCircle size={14} /> File Terupload</span>
                                    <button onClick={() => setForm({ ...form, buktiTransfer: null })} className="p-1 text-red-400 hover:bg-red-500/10 rounded"><Trash2 size={14} /></button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-white/10">
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black text-lg shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <><Loader2 className="animate-spin" /> {statusMsg}</> : 'BAYAR ZAKAT SEKARANG'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PublicPaymentModal;

