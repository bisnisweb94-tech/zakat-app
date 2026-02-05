import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle, Download, MessageCircle, Loader2 } from 'lucide-react';
import gasClient from '../api/gasClient';
import html2canvas from 'html2canvas';

function ReceiptSuccessModal({ data, settings, onClose }) {
    const [animState, setAnimState] = useState({ active: false, closing: false });
    const [waStatus, setWaStatus] = useState(null); // 'sending', 'sent', 'failed'
    const [isDownloading, setIsDownloading] = useState(false);

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

    const handleDownloadImage = async () => {
        if (!data.receiptHTML) return;

        setIsDownloading(true);

        // Buat temporary div untuk render HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.receiptHTML;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);

        try {
            // Convert HTML ke canvas dengan html2canvas
            const canvas = await html2canvas(tempDiv.firstElementChild, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                width: 302,
            });

            // Convert canvas ke blob dan download
            canvas.toBlob((blob) => {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = data.filename || `Struk_${Date.now()}.png`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                setIsDownloading(false);
            }, 'image/png');

        } catch (error) {
            console.error('Error generating image:', error);
            alert('Gagal membuat gambar struk. Silakan coba lagi.');
            setIsDownloading(false);
        } finally {
            // Cleanup
            document.body.removeChild(tempDiv);
        }
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
                    {data.pdfLoading ? 'Data tersimpan! Membuat struk...' : data.pdfError ? 'Data tersimpan! (Struk gagal)' : 'Data telah disimpan & struk siap diunduh.'}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={handleDownloadImage}
                        disabled={data.pdfLoading || !data.receiptHTML || isDownloading}
                        className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:scale-[1.02] active:scale-95 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {isDownloading ? (
                            <><Loader2 size={20} className="animate-spin" /> Downloading...</>
                        ) : data.pdfLoading ? (
                            <><Loader2 size={20} className="animate-spin" /> Membuat Gambar...</>
                        ) : data.pdfError ? (
                            <><Download size={20} /> Gambar Gagal</>
                        ) : (
                            <><Download size={20} /> Download Gambar Struk</>
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
