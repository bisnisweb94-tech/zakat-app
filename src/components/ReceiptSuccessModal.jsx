import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, Download, MessageCircle, Loader2 } from 'lucide-react';
import gasClient from '../api/gasClient';

function ReceiptSuccessModal({ data, settings, onClose }) {
    const [animState, setAnimState] = useState({ active: false, closing: false });
    const [waStatus, setWaStatus] = useState(null); // 'sending', 'sent', 'failed'

    useEffect(() => {
        requestAnimationFrame(() => setAnimState({ active: true, closing: false }));
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleClose = () => {
        setAnimState({ active: true, closing: true });
        setTimeout(onClose, 500);
    };

    const handleSendWA = async () => {
        if (!data.noHP) return;
        setWaStatus('sending');
        try {
            const result = await gasClient.request('sendTransactionReceipt', {
                transaction: data,
                settings: settings
            });
            if (result && result.success) {
                setWaStatus('sent');
            } else {
                setWaStatus('failed');
                alert('⚠️ WA gagal terkirim: ' + (result?.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('WA Error:', error);
            setWaStatus('failed');
            alert('⚠️ Terjadi kesalahan saat mengirim WA');
        }
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${data.pdfBase64}`;
        link.download = data.filename || `Receipt_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return ReactDOM.createPortal(
        <div
            className={`profile-modal-overlay z-[10000] flex items-center justify-center p-4 ${animState.active && !animState.closing ? 'profile-modal-overlay-enter' : 'profile-modal-overlay-exit'}`}
            onClick={handleClose}
        >
            <div
                onClick={e => e.stopPropagation()}
                className={`relative glass-card w-full max-w-sm p-8 rounded-3xl text-center shadow-2xl border border-emerald-500/20 profile-modal-panel ${animState.active && !animState.closing ? 'profile-modal-panel-enter' : 'profile-modal-panel-exit'}`}
            >
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]">
                    <CheckCircle size={40} className="text-emerald-500" />
                </div>
                <h2 className="text-2xl font-black mb-2 text-white">Zakat Diterima!</h2>
                <p className="text-sm text-[var(--text-muted)] mb-8">
                    {data.pdfLoading ? 'Data tersimpan! Membuat PDF...' : data.pdfError ? 'Data tersimpan! (PDF gagal)' : 'Data telah disimpan & PDF berhasil digenerate.'}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleDownload}
                        disabled={data.pdfLoading || !data.pdfBase64}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {data.pdfLoading ? (
                            <><Loader2 size={20} className="animate-spin" /> Membuat PDF...</>
                        ) : data.pdfError ? (
                            <><Download size={20} /> PDF Gagal</>
                        ) : (
                            <><Download size={20} /> Download PDF</>
                        )}
                    </button>
                    {data.noHP && (
                        <button
                            onClick={handleSendWA}
                            disabled={waStatus === 'sending' || waStatus === 'sent'}
                            className={`w-full py-3 rounded-xl font-bold border transition flex items-center justify-center gap-2 ${waStatus === 'sent'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 cursor-default'
                                : waStatus === 'failed'
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-green-500/10 text-green-400 border-green-500/20 hover:bg-green-500/20 disabled:opacity-50'
                                }`}
                        >
                            {waStatus === 'sending' ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Mengirim...
                                </>
                            ) : waStatus === 'sent' ? (
                                <>
                                    <CheckCircle size={18} />
                                    WA Terkirim
                                </>
                            ) : (
                                <>
                                    <MessageCircle size={18} />
                                    Kirim WA (Fonnte)
                                </>
                            )}
                        </button>
                    )}
                    <button
                        onClick={handleClose}
                        className="w-full py-3 rounded-xl bg-white/5 text-[var(--text-secondary)] font-bold hover:bg-white/10 transition"
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

export default ReceiptSuccessModal;
