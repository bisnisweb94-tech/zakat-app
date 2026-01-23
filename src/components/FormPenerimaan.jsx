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

        const cleanedJumlah = {};
        const cleanedBerat = {};
        form.jenis.forEach(j => {
            if (form.jumlah[j] !== undefined && form.jumlah[j] !== null) cleanedJumlah[j] = form.jumlah[j];
            if (form.beratBeras[j] !== undefined && form.beratBeras[j] !== null) cleanedBerat[j] = form.beratBeras[j];
        });

        const totalNominal = Object.values(cleanedJumlah).reduce((a, b) => a + (Number(b) || 0), 0);
        const totalBeras = Object.values(cleanedBerat).reduce((a, b) => a + (Number(b) || 0), 0);

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

        const transactionData = {
            ...form,
            jumlah: cleanedJumlah,
            beratBeras: cleanedBerat,
            muzakki: nama,
            petugas: user?.nama || 'System'
        };
        onSave(transactionData);

        const phoneNumber = form.noHP ? String(form.noHP).trim() : '';
        // WA sending logic moved to ReceiptSuccessModal
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
        const isSelected = form.jenis.includes(j);
        const newJenis = isSelected
            ? form.jenis.filter(x => x !== j)
            : [...form.jenis, j];

        const newJumlah = { ...form.jumlah };
        const newBerat = { ...form.beratBeras };

        if (isSelected) {
            // When deselecting, explicitly remove or set to 0
            delete newJumlah[j];
            delete newBerat[j];
        }

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

    const totalTransaksi = form.jenis.reduce((sum, j) => sum + (parseFloat(form.jumlah[j]) || 0), 0);
    const totalJiwa = 1 + (parseInt(form.jumlahKeluarga) || 0);

    return (
        <div className="space-y-4 text-left">
            {/* Nama Kepala Keluarga */}
            <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-muted)] font-medium">Nama Kepala Keluarga *</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <span className="text-emerald-400 text-xs">👤</span>
                    </div>
                    <input
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-emerald-500/50 focus:outline-none transition"
                        placeholder="Ketik nama..."
                        value={form.muzakki}
                        onChange={e => handleMuzakkiChange(e.target.value)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    />
                    {showSuggestions && (
                        <div className="absolute z-50 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border-surface)] rounded-xl overflow-hidden shadow-xl">
                            {suggestions.map((m, idx) => (
                                <div key={idx} onClick={() => handleSelectSuggestion(m)} className="p-3 hover:bg-emerald-500/10 cursor-pointer transition border-b border-[var(--border-surface)] last:border-b-0">
                                    <div className="font-semibold text-sm text-emerald-400">{m.nama}</div>
                                    <div className="text-xs text-[var(--text-muted)]">{m.noHP && `📱 ${m.noHP}`} {m.alamat && `📍 ${m.alamat}`}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Kepala Keluarga Count */}
            <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-muted)] font-medium">Kepala Keluarga *</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                        <span className="text-blue-400 text-xs">👥</span>
                    </div>
                    <input
                        type="number"
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-blue-500/50 focus:outline-none transition"
                        placeholder="Jumlah anggota (selain KK)"
                        value={form.jumlahKeluarga || ''}
                        onChange={e => handleJumlahKeluargaChange(e.target.value)}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-[var(--text-muted)]">
                        Total: {totalJiwa} jiwa
                    </div>
                </div>
            </div>

            {/* Anggota Keluarga List */}
            {form.anggotaKeluarga.length > 0 && (
                <div className="space-y-2 pl-2">
                    {form.anggotaKeluarga.map((nama, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <span className="w-5 h-5 bg-blue-500/30 rounded-full flex items-center justify-center text-[10px] font-bold text-blue-300">{idx + 1}</span>
                            <input
                                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                                value={nama}
                                onChange={e => handleAnggotaChange(idx, e.target.value)}
                                placeholder={`Nama anggota ke-${idx + 1}`}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Wallet / Metode Pembayaran */}
            <div className="space-y-1.5">
                <label className="text-xs text-[var(--text-muted)] font-medium">Wallet *</label>
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                        <span className="text-purple-400 text-xs">💳</span>
                    </div>
                    <select
                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-surface)] text-[var(--text-primary)] focus:border-purple-500/50 focus:outline-none transition appearance-none cursor-pointer"
                        value={form.metodePembayaran}
                        onChange={e => setForm({ ...form, metodePembayaran: e.target.value })}
                    >
                        <option value="Tunai" className="bg-[var(--bg-page)]">Tunai</option>
                        <option value="Transfer" className="bg-[var(--bg-page)]">Transfer</option>
                        <option value="QRIS" className="bg-[var(--bg-page)]">QRIS</option>
                    </select>
                </div>
            </div>

            {/* Collapsible: Detail Tambahan */}
            <details className="group">
                <summary className="cursor-pointer text-xs font-medium text-[var(--text-muted)] py-2 flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    Detail Tambahan (Tanggal, Lokasi, Kontak)
                </summary>
                <div className="space-y-3 pt-2">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] text-[var(--text-muted)]">Tanggal</label>
                            <input type="date" className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm text-[var(--text-primary)]" value={form.tanggal} onChange={e => setForm({ ...form, tanggal: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] text-[var(--text-muted)]">Lokasi</label>
                            <select className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm text-[var(--text-primary)]" value={form.lokasi} onChange={e => setForm({ ...form, lokasi: e.target.value })}>
                                {(safeSettings.daftarLokasi || ['Masjid']).map(l => <option key={l} className="bg-[var(--bg-page)]">{l}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-[var(--text-muted)]">No HP/WhatsApp</label>
                        <input className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm text-[var(--text-primary)]" placeholder="628..." value={form.noHP} onChange={e => handlePhoneChange(e.target.value)} />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] text-[var(--text-muted)]">Alamat</label>
                        <textarea className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm text-[var(--text-primary)]" placeholder="Alamat lengkap" value={form.alamat} onChange={e => setForm({ ...form, alamat: e.target.value })} rows="2" />
                    </div>
                </div>
            </details>

            {/* Jenis Transaksi */}
            <div className="space-y-2">
                <label className="text-xs text-[var(--text-muted)] font-medium">Pilih Jenis Transaksi *</label>
                <div className="flex flex-wrap gap-2">
                    {(safeSettings.jenisPenerimaan || ['Zakat Fitrah', 'Zakat Mal', 'Fidyah', 'Infaq', 'Sedekah']).map(j => (
                        <button
                            key={j}
                            onClick={() => toggleJenis(j)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${form.jenis.includes(j) ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-[var(--border-surface)] text-[var(--text-secondary)] hover:border-emerald-500/50'}`}
                        >
                            {form.jenis.includes(j) && '✓ '}{j}
                        </button>
                    ))}
                </div>
            </div>

            {/* Hitung Otomatis for Zakat Fitrah */}
            {form.jenis.includes('Zakat Fitrah') && (
                <label className="flex items-center gap-2 text-xs bg-[var(--bg-surface)] p-3 rounded-lg border border-[var(--border-surface)]">
                    <input type="checkbox" checked={form.hitungOtomatis} onChange={e => setForm({ ...form, hitungOtomatis: e.target.checked })} className="accent-emerald-500" />
                    <span className="text-[var(--text-secondary)]">Hitung Otomatis ({totalJiwa} × {formatRupiah(safeSettings.nilaiZakatFitrah)}) = <strong className="text-emerald-400">{formatRupiah(hitungZakatFitrah())}</strong></span>
                </label>
            )}

            {/* Nominal per Jenis */}
            {form.jenis.map(j => (
                <div key={j} className="bg-[var(--bg-surface)] p-3 rounded-xl border border-[var(--border-surface)] space-y-2">
                    <p className="text-xs font-semibold text-emerald-400">{j}</p>
                    <input
                        type="number"
                        value={form.jumlah[j] || ''}
                        onChange={e => setForm({ ...form, jumlah: { ...form.jumlah, [j]: parseFloat(e.target.value) || 0 } })}
                        disabled={j === 'Zakat Fitrah' && form.hitungOtomatis}
                        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-surface)] text-[var(--text-primary)] disabled:opacity-50"
                        placeholder="Nominal (Rp)"
                    />
                    {['Zakat Fitrah', 'Fidyah', 'Sedekah', 'Infaq'].includes(j) && (
                        <input
                            type="number"
                            step="0.1"
                            value={form.beratBeras[j] || ''}
                            onChange={e => setForm({ ...form, beratBeras: { ...form.beratBeras, [j]: parseFloat(e.target.value) || 0 } })}
                            className="w-full px-3 py-2 rounded-lg bg-[var(--bg-page)] border border-[var(--border-surface)] text-[var(--text-primary)] text-sm"
                            placeholder="Berat Beras (Kg)"
                        />
                    )}
                </div>
            ))}

            {/* Total */}
            {totalTransaksi > 0 && (
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 rounded-xl">
                    <p className="text-xs text-white/70">TOTAL TRANSAKSI</p>
                    <p className="text-2xl font-black text-white">{formatRupiah(totalTransaksi)}</p>
                </div>
            )}

            {/* Bukti Upload (for Transfer/QRIS) */}
            {(form.metodePembayaran === 'Transfer' || form.metodePembayaran === 'QRIS') && (
                <div className="space-y-2">
                    <label className="text-xs text-[var(--text-muted)] font-medium">Upload Bukti Transfer</label>
                    {!form.buktiTransfer ? (
                        <div className="flex items-center gap-2">
                            <input type="file" accept="image/*" onChange={e => setSelectedFile(e.target.files[0])} className="text-xs text-[var(--text-muted)]" />
                            {selectedFile && <button onClick={handleUploadFile} disabled={uploadingFile} className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium">{uploadingFile ? '⏳...' : '📤 Upload'}</button>}
                        </div>
                    ) : (
                        <div className="flex justify-between items-center bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                            <span className="text-xs text-emerald-400">✅ {form.buktiTransfer.fileName}</span>
                            <button onClick={handleDeleteFile} className="p-1 text-red-400 hover:text-red-300"><Trash2 size={14} /></button>
                        </div>
                    )}
                </div>
            )}

            {/* Catatan */}
            <div className="space-y-1">
                <label className="text-xs text-[var(--text-muted)] font-medium">Catatan</label>
                <textarea className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-surface)] text-sm text-[var(--text-primary)]" placeholder="Catatan tambahan..." value={form.keterangan} onChange={e => setForm({ ...form, keterangan: e.target.value })} rows="2" />
            </div>

            {/* Simpan Button */}
            <button
                onClick={handleSaveWithLoading}
                disabled={isSaving}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm disabled:opacity-50 transition shadow-lg shadow-emerald-500/20"
            >
                {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>

            {/* WA Status */}
            {waStatus && (
                <div className={`p-3 rounded-xl text-center text-xs font-medium ${waStatus === 'sending' ? 'bg-blue-500/10 text-blue-400' : waStatus === 'sent' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                    {waStatus === 'sending' ? 'Mengirim Kwitansi WA...' : waStatus === 'sent' ? '✓ WA Terkirim' : '❌ Gagal Kirim WA'}
                </div>
            )}
        </div>
    );
}

export default FormPenerimaan;
