import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { X, Eye, Download } from 'lucide-react';
import { formatRupiah, getTotal, getTotalBeras, calculateTotalJiwa } from '../utils/format';
import { generateWhatsAppMessage } from '../utils/whatsapp';

import { cetakKwitansi } from '../utils/receipt';

const InfoRow = ({ label, value, icon }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-white/5 last:border-b-0 text-left">
        <div className="flex items-center gap-3">
            <span className="text-base opacity-70">{icon}</span>
            <span className="text-sm text-gray-400">{label}</span>
        </div>
        <span className="font-medium text-sm text-gray-200 text-right max-w-[60%] break-words">{value || '-'}</span>
    </div>
);

function DetailViewModal({ item, type, settings, onClose }) {
    const [animState, setAnimState] = useState({ active: false, closing: false });
    useEffect(() => {
        requestAnimationFrame(() => setAnimState({ active: true, closing: false }));
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleClose = () => {
        setAnimState({ active: true, closing: true });
        setTimeout(onClose, 350);
    };

    const totalJiwa = calculateTotalJiwa(item);

    const themeConfig = {
        penerimaan: { color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: '📥', label: 'Penerimaan Zakat' },
        pengeluaran: { color: 'text-rose-400', bg: 'bg-rose-500/10', icon: '📤', label: 'Pengeluaran Dana' },
        mustahik: { color: 'text-violet-400', bg: 'bg-violet-500/10', icon: '👥', label: 'Data Mustahik' }
    };

    const config = themeConfig[type] || themeConfig.penerimaan;
    const mainTitle = item.muzakki || item.donatur || item.penerima || item.nama;

    return ReactDOM.createPortal(
        <div className={`profile-modal-overlay z-[9999] flex items-center justify-center p-4 ${animState.active && !animState.closing ? 'profile-modal-overlay-enter' : 'profile-modal-overlay-exit'}`} onClick={handleClose}>
            <div onClick={e => e.stopPropagation()} className={`w-full max-w-sm glass-card bg-gray-900 rounded-[2rem] overflow-hidden flex flex-col max-h-[75vh] shadow-2xl border border-white/10 profile-modal-panel ${animState.active && !animState.closing ? 'profile-modal-panel-enter' : 'profile-modal-panel-exit'}`}>
                <div className="p-4 text-center shrink-0 border-b border-white/10 relative">
                    <button onClick={handleClose} className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full hover:bg-white/10 transition text-gray-400"><X size={20} /></button>
                    <p className={`text-[10px] font-bold uppercase tracking-widest mb-0.5 ${config.color}`}>{config.label}</p>
                    <h2 className="text-base font-bold text-white">Detail Data</h2>
                </div>
                <div className="p-5 pt-0 overflow-y-auto grow space-y-5 custom-scrollbar text-left">
                    <div className="space-y-2 mt-4">
                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1 font-black">Informasi Dasar</h4>
                        <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                            <InfoRow label="Nama" value={mainTitle} icon="👤" />
                            <InfoRow label="Tanggal" value={item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'} icon="📅" />
                            {item.lokasi && <InfoRow label="Lokasi" value={item.lokasi} icon="📍" />}
                            {item.metodePembayaran && <InfoRow label="Metode" value={item.metodePembayaran} icon="💳" />}
                            {item.petugas && <InfoRow label="Petugas" value={item.petugas} icon="🧑‍💼" />}
                            {type === 'penerimaan' && <InfoRow label="Total" value={`${totalJiwa} Jiwa`} icon="👥" />}
                        </div>
                    </div>

                    {type === 'penerimaan' && Array.isArray(item.jenis) && (
                        <div className="space-y-2 text-left">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1 font-black">Rincian</h4>
                            <div className="p-3 rounded-2xl bg-black/20 border border-white/5 space-y-2">
                                {item.jenis.map((j, idx) => {
                                    const nominal = item.jumlah?.[j] || 0;
                                    const beras = item.beratBeras?.[j] || 0;
                                    return (
                                        <div key={idx} className="space-y-1">
                                            {nominal > 0 && (
                                                <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-white/5 border border-white/5">
                                                    <span className="text-sm font-medium">{j}</span>
                                                    <span className={`font-mono font-bold text-sm ${config.color}`}>{formatRupiah(nominal)}</span>
                                                </div>
                                            )}
                                            {beras > 0 && (
                                                <div className="flex justify-between items-center py-2 px-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                                    <span className="text-xs font-bold text-orange-400">🌾 {j} (Beras)</span>
                                                    <span className="font-mono font-bold text-sm text-orange-400">{beras} Kg</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-1">
                                    {getTotal(item) > 0 && <div className="flex justify-between px-2"><span className="text-sm text-gray-400">Total Uang</span><span className="font-bold text-emerald-400">{formatRupiah(getTotal(item))}</span></div>}
                                    {getTotalBeras(item) > 0 && <div className="flex justify-between px-2"><span className="text-sm text-gray-400">Total Beras</span><span className="font-bold text-orange-400">{getTotalBeras(item)} Kg</span></div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {item.buktiTransfer && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider pl-1">Bukti</h4>
                            <a href={item.buktiTransfer.fileUrl} target="_blank" className="block relative group overflow-hidden rounded-2xl border border-white/10 h-32">
                                <img src={item.buktiTransfer.thumbnailUrl || item.buktiTransfer.fileUrl} alt="Bukti" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition" />
                                <div className="absolute inset-0 flex items-center justify-center"><span className="px-3 py-1.5 bg-black/50 backdrop-blur rounded-lg text-xs font-bold text-white flex items-center gap-1.5"><Eye size={12} /> Lihat</span></div>
                            </a>
                        </div>
                    )}

                    <div className="pt-2 flex gap-3">
                        {item.noHP && type === 'penerimaan' && (
                            <button onClick={() => window.open(`https://wa.me/${item.noHP}?text=${encodeURIComponent(generateWhatsAppMessage(item, settings))}`, '_blank')} className="flex-1 bg-green-500/20 text-green-400 py-3 rounded-xl font-bold border border-green-500/20 flex items-center justify-center gap-2 text-sm">WA</button>
                        )}
                        {type === 'penerimaan' && (
                            <button onClick={() => cetakKwitansi(item, settings)} className="flex-1 bg-purple-500/20 text-purple-400 py-3 rounded-xl font-bold border border-purple-500/20 flex items-center justify-center gap-2 text-sm">
                                <Download size={16} /> Cetak
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default DetailViewModal;
