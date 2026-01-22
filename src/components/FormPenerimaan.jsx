import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { formatRupiah } from '../utils/format';
import gasClient from '../api/gasClient';

function FormPenerimaan({ initial, settings, data, setData, save, onSave, user }) {
    const safeSettings = settings || {};
    const [form, setForm] = useState(initial ? { ...initial, muzakki: initial.muzakki || initial.donatur } : {
        tanggal: new Date().toISOString().split('T')[0],
        muzakki: '',
        noHP: '',
        alamat: '',
        jumlahKeluarga: 0,
        anggotaKeluarga: [],
        jenis: [],
        jumlah: {},
        beratBeras: {},
        metodePembayaran: 'Tunai',
        lokasi: safeSettings?.daftarLokasi?.[0] || 'Masjid',
        buktiTransfer: null,
        hitungOtomatis: true,
        keterangan: ''
    });

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const muzakkiDB = data?.muzakkiDB || [];

    const handleMuzakkiChange = (value) => {
        setForm({ ...form, muzakki: value });
        if (value.trim().length >= 2) {
            const filtered = muzakkiDB.filter(m => (m.nama || '').toLowerCase().includes(value.toLowerCase())).slice(0, 5);
            setSuggestions(filtered);
            setShowSuggestions(filtered.length > 0);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const handleSelectSuggestion = (muzakki) => {
        const getProp = (obj, key) => obj[key] || obj[key.toLowerCase()] || obj[key.toUpperCase()] || '';
        const rawHP = getProp(muzakki, 'noHP') || getProp(muzakki, 'NoHP') || getProp(muzakki, 'no_hp');
        let cleanHP = String(rawHP).replace(/\D/g, '');
        if (cleanHP.startsWith('0')) cleanHP = '62' + cleanHP.substring(1);

        setForm(prev => ({
            ...prev,
            muzakki: getProp(muzakki, 'nama') || getProp(muzakki, 'Nama'),
            noHP: cleanHP,
            alamat: getProp(muzakki, 'alamat') || getProp(muzakki, 'Alamat'),
            jumlahKeluarga: (muzakki.anggotaKeluarga || []).length || 0,
            anggotaKeluarga: muzakki.anggotaKeluarga || []
        }));
        setShowSuggestions(false);
        setSuggestions([]);
    };

    const handleSaveValidation = async () => {
        const nama = form.muzakki || form.donatur;
        if (!nama || !nama.trim()) {
            return alert('⚠️ Nama Kepala Keluarga wajib diisi!');
        }

        const totalNominal = Object.values(form.jumlah || {}).reduce((a, b) => a + (Number(b) || 0), 0);
        const totalBeras = Object.values(form.beratBeras || {}).reduce((a, b) => a + (Number(b) || 0), 0);

        if (totalNominal === 0 && totalBeras === 0) {
            return alert('⚠️ Wajib mengisi minimal satu jenis transaksi!');
        }

        try {
            const autoCheckInResult = await gasClient.request('autoCheckInOnTransaction', { officerName: user?.nama || 'System' });
            if (autoCheckInResult && autoCheckInResult.autoCheckedIn) {
                const roleMsg = autoCheckInResult.role === 'SUPPORT' ? ' (SUPPORT - 50% XP)' : '';
                alert(`ℹ️ Anda belum absen!\n\nOtomatis check-in ke shift: ${autoCheckInResult.shift}${roleMsg}`);
            }
        } catch (e) {
            console.error('AUTO-CHECK-IN Error:', e);
        }

        const existingMuzakkiIndex = (muzakkiDB || []).findIndex(m => m && m.nama && nama && m.nama.toLowerCase() === nama.toLowerCase());
        let updatedMuzakkiDB = [...muzakkiDB];
        if (existingMuzakkiIndex >= 0) {
            updatedMuzakkiDB[existingMuzakkiIndex] = {
                ...updatedMuzakkiDB[existingMuzakkiIndex],
                nama,
                noHP: form.noHP || updatedMuzakkiDB[existingMuzakkiIndex].noHP,
                alamat: form.alamat || updatedMuzakkiDB[existingMuzakkiIndex].alamat,
                anggotaKeluarga: form.anggotaKeluarga || [],
                lastTransaction: new Date().toISOString()
            };
        } else {
            updatedMuzakkiDB.push({
                id: Date.now().toString(),
                nama,
                noHP: form.noHP || '',
                alamat: form.alamat || '',
                anggotaKeluarga: form.anggotaKeluarga || [],
                createdAt: new Date().toISOString(),
                lastTransaction: new Date().toISOString()
            });
        }

        const cleanMuzakkiDB = updatedMuzakkiDB.filter(m => m && m.nama && m.nama.trim().length > 0);
        if (save) save('muzakki', cleanMuzakkiDB);
        setData({ ...data, muzakkiDB: cleanMuzakkiDB });

        const transactionData = { ...form, muzakki: nama, petugas: user?.nama || 'System' };
        onSave(transactionData);

        const phoneNumber = form.noHP ? String(form.noHP).trim() : '';
        if (phoneNumber && confirm(`Apakah Anda ingin mengirim bukti transaksi ke WhatsApp ${phoneNumber}?`)) {
            setSendingWA(true);
            setWaStatus('sending');
            try {
                const result = await gasClient.request('sendTransactionReceipt', { transaction: transactionData, settings: safeSettings });
                if (result && result.success) {
                    setWaStatus('sent');
                } else {
                    setWaStatus('failed');
                    alert('⚠️ WA gagal terkirim: ' + (result?.error || 'Unknown error'));
                }
            } catch {
                setWaStatus('failed');
                alert('⚠️ Error komunikasi dengan backend');
            } finally {
                setSendingWA(false);
                setTimeout(() => setWaStatus(null), 5000);
            }
        }
    };

    const [uploadingFile, setUploadingFile] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [, setSendingWA] = useState(false);
    const [waStatus, setWaStatus] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveWithLoading = async () => {
        setIsSaving(true);
        try {
            await handleSaveValidation();
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhoneChange = (value) => {
        let formatted = value.replace(/\D/g, '');
        if (formatted.startsWith('0') && formatted.length > 1) formatted = '62' + formatted.substring(1);
        setForm({ ...form, noHP: formatted });
    };

    const toggleJenis = (j) => {
        if (form.jenis.includes(j)) {
            const newJenis = form.jenis.filter(x => x !== j);
            const newJumlah = { ...form.jumlah }; delete newJumlah[j];
            const newBerat = { ...form.beratBeras }; delete newBerat[j];
            setForm({ ...form, jenis: newJenis, jumlah: newJumlah, beratBeras: newBerat });
        } else {
            setForm({ ...form, jenis: [...form.jenis, j] });
        }
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

    const handleJumlahKeluargaChange = (value) => {
        const numValue = value === '' ? 0 : parseInt(value) || 0;
        let newAnggota = [...form.anggotaKeluarga];
        if (numValue > newAnggota.length) {
            newAnggota = [...newAnggota, ...Array(numValue - newAnggota.length).fill('')];
        } else {
            newAnggota = newAnggota.slice(0, numValue);
        }
        setForm({ ...form, jumlahKeluarga: value, anggotaKeluarga: newAnggota });
    };

    const handleAnggotaChange = (index, value) => {
        const newAnggota = [...form.anggotaKeluarga];
        newAnggota[index] = value;
        setForm({ ...form, anggotaKeluarga: newAnggota });
    };

    const handleUploadFile = async () => {
        if (!selectedFile) return alert('⚠️ Pilih file terlebih dahulu!');
        if (!form.muzakki?.trim()) return alert('⚠️ Isi nama muzakki terlebih dahulu!');

        setUploadingFile(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const base64Data = e.target.result.split(',')[1];
            const fileName = `bukti_${form.muzakki.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${selectedFile.name.split('.').pop()}`;
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

    const handleDeleteFile = async () => {
        if (!form.buktiTransfer || !confirm('🗑️ Hapus file?')) return;
        try {
            const res = await gasClient.request('deleteBuktiTransfer', { fileId: form.buktiTransfer.fileId });
            if (res.success) {
                setForm({ ...form, buktiTransfer: null });
                setSelectedFile(null);
                alert('✅ File berhasil dihapus!');
            }
        } catch {
            alert('❌ Gagal menghapus file!');
        }
    };

    const totalTransaksi = Object.values(form.jumlah).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const totalJiwa = 1 + (parseInt(form.jumlahKeluarga) || 0);

    return (
        <div className="space-y-5 text-left">
            <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/20">
                <h4 className="text-sm font-bold text-emerald-300 mb-3">👤 Info Kepala Keluarga</h4>
                <div className="space-y-3">
                    <div className="relative">
                        <input className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" placeholder="Nama Kepala Keluarga *" value={form.muzakki} onChange={e => handleMuzakkiChange(e.target.value)} onBlur={() => setTimeout(() => setShowSuggestions(false), 200)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} />
                        {showSuggestions && (
                            <div className="absolute z-50 w-full mt-1 glass-card bg-gray-900 border border-emerald-500/30 overflow-hidden shadow-xl rounded-xl">
                                {suggestions.map((m, idx) => (
                                    <div key={idx} onClick={() => handleSelectSuggestion(m)} className="p-3 hover:bg-emerald-500/20 cursor-pointer transition border-b border-white/5 last:border-b-0">
                                        <div className="font-bold text-sm text-emerald-400">{m.nama}</div>
                                        <div className="text-xs text-gray-400">{m.noHP && `📱 ${m.noHP}`} {m.alamat && `📍 ${m.alamat}`}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <input className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" placeholder="No HP/WhatsApp" value={form.noHP} onChange={e => handlePhoneChange(e.target.value)} />
                    <textarea className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" placeholder="Alamat lengkap" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows="2" />
                </div>
            </div>

            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-bold text-blue-300">👨‍👩‍👧‍👦 Anggota Keluarga</h4>
                    <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">Total: {totalJiwa} jiwa</div>
                </div>
                <div className="space-y-3">
                    <label className="block text-xs font-bold text-gray-400 mb-1">Jumlah Anggota (selain KK)</label>
                    <input type="number" className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] font-semibold" value={form.jumlahKeluarga || ''} onChange={e => handleJumlahKeluargaChange(e.target.value)} />
                    {form.anggotaKeluarga.map((nama, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                            <input className="glass-input flex-1 p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm" value={nama} onChange={e => handleAnggotaChange(idx, e.target.value)} placeholder={`Nama anggota ke-${idx + 1}`} />
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/20">
                <h4 className="text-sm font-bold text-purple-300 mb-3">💰 Detail Transaksi</h4>
                <div className="space-y-3">
                    <input type="date" className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
                    <select className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })}>
                        {(safeSettings.daftarLokasi || ['Masjid']).map(l => <option key={l} className="bg-gray-900">{l}</option>)}
                    </select>
                    <select className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" value={form.metodePembayaran} onChange={e => setForm({ ...form, metodePembayaran: e.target.value })}>
                        <option className="bg-gray-900">Tunai</option>
                        <option className="bg-gray-900">Transfer</option>
                        <option className="bg-gray-900">QRIS</option>
                    </select>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2">Pilih Jenis *</label>
                        <div className="flex flex-wrap gap-2">
                            {(safeSettings.jenisPenerimaan || ['Zakat Fitrah', 'Zakat Mal', 'Fidyah', 'Infaq', 'Sedekah']).map(j => (
                                <button key={j} onClick={() => toggleJenis(j)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${form.jenis.includes(j) ? 'bg-purple-600 border-purple-600' : 'border-white/20 hover:border-purple-400'}`}>
                                    {form.jenis.includes(j) && '✓ '}{j}
                                </button>
                            ))}
                        </div>
                    </div>
                    {form.jenis.includes('Zakat Fitrah') && (
                        <label className="flex items-center gap-2 text-sm bg-gray-900/50 p-2 rounded-lg">
                            <input type="checkbox" checked={form.hitungOtomatis} onChange={e => setForm({ ...form, hitungOtomatis: e.target.checked })} />
                            <span>Hitung Otomatis ({totalJiwa} × {formatRupiah(safeSettings.nilaiZakatFitrah)}) = {formatRupiah(hitungZakatFitrah())}</span>
                        </label>
                    )}
                    {form.jenis.map(j => (
                        <div key={j} className="bg-gray-900/50 p-3 rounded-xl space-y-2">
                            <p className="text-xs font-bold text-purple-300">{j}</p>
                            <input type="number" value={form.jumlah[j] || ''} onChange={e => setForm({ ...form, jumlah: { ...form.jumlah, [j]: parseFloat(e.target.value) || 0 } })} disabled={j === 'Zakat Fitrah' && form.hitungOtomatis} className="glass-input w-full p-2 rounded-lg bg-black/20" placeholder="Rp" />
                            {['Zakat Fitrah', 'Fidyah', 'Sedekah', 'Infaq'].includes(j) && (
                                <input type="number" step="0.1" value={form.beratBeras[j] || ''} onChange={e => setForm({ ...form, beratBeras: { ...form.beratBeras, [j]: parseFloat(e.target.value) || 0 } })} className="glass-input w-full p-2 rounded-lg bg-black/20 text-sm" placeholder="Berat Beras (Kg)" />
                            )}
                        </div>
                    ))}
                    {totalTransaksi > 0 && (
                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-xl shadow-lg">
                            <p className="text-xs text-white/70">TOTAL TRANSAKSI</p>
                            <p className="text-2xl font-black text-white">{formatRupiah(totalTransaksi)}</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/20">
                <h4 className="text-sm font-bold text-amber-300 mb-3">📎 Bukti & Catatan</h4>
                <div className="space-y-3">
                    {(form.metodePembayaran === 'Transfer' || form.metodePembayaran === 'QRIS') && (
                        <div className="bg-gray-900/50 p-3 rounded-xl text-left">
                            <label className="block text-xs font-bold text-gray-400 mb-2">Upload Bukti</label>
                            {!form.buktiTransfer ? (
                                <div className="space-y-2">
                                    <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} />
                                    {selectedFile && <button onClick={handleUploadFile} disabled={uploadingFile} className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold">{uploadingFile ? '⏳ Uploading...' : '📤 Upload'}</button>}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center bg-green-500/10 p-2 rounded-lg">
                                    <span className="text-xs text-green-400">✅ {form.buktiTransfer.fileName}</span>
                                    <button onClick={handleDeleteFile} className="p-1 text-red-400"><Trash2 size={16} /></button>
                                </div>
                            )}
                        </div>
                    )}
                    <textarea className="glass-input w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)]" placeholder="Catatan tambahan..." value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} rows="2" />
                </div>
            </div>

            <button onClick={handleSaveWithLoading} disabled={isSaving} className="w-full py-4 rounded-xl bg-white text-black font-bold text-lg disabled:opacity-50">
                {isSaving ? 'Menyimpan...' : '💾 Simpan Data'}
            </button>
            {waStatus && <div className={`p-4 rounded-xl text-center text-sm font-bold ${waStatus === 'sending' ? 'bg-blue-500/20 text-blue-400' : waStatus === 'sent' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{waStatus === 'sending' ? 'Mengirim Kwitansi WA...' : waStatus === 'sent' ? '✓ WA Terkirim' : '❌ Gagal Kirim WA'}</div>}
        </div>
    );
}

export default FormPenerimaan;
