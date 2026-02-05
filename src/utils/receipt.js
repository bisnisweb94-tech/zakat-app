import html2canvas from 'html2canvas';
import { calculateTotalJiwa, getTotal, getTotalBeras } from './format';

// Fungsi untuk download struk sebagai gambar PNG (untuk thermal printer)
export const cetakKwitansi = async (item, settings) => {
    const fmt = (n) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n);

    const totalJiwa = calculateTotalJiwa(item);
    const totalUang = getTotal(item);
    const totalBeras = getTotalBeras(item);

    // Buat HTML untuk struk
    const receiptHTML = `
        <div id="thermal-receipt" style="
            width: 302px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            background: white;
            color: black;
        ">
            <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                ${settings?.namaMasjid || 'MASJID JAMI'}
            </div>
            <div style="text-align: center; font-size: 11px; margin-bottom: 10px;">
                Bukti Penerimaan Zakat/Infaq/Sedekah
            </div>
            <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

            <div style="font-size: 12px; margin: 5px 0;">
                <span>No: ${item.id}</span>
                <span style="float: right;">${new Date(item.tanggal).toLocaleDateString('id-ID')}</span>
                <div style="clear: both;"></div>
            </div>

            <div style="font-weight: bold; font-size: 12px; margin-top: 10px;">Diterima Dari:</div>
            <div style="font-size: 13px; font-weight: bold; margin: 3px 0;">
                ${item.muzakki || item.donatur || 'Hamba Allah'}
            </div>
            ${item.alamat ? `<div style="font-size: 11px; margin: 3px 0;">${item.alamat}</div>` : ''}

            ${totalJiwa > 1 || (item.anggotaKeluarga && item.anggotaKeluarga.length > 0) ? `
                <div style="font-weight: bold; font-size: 12px; margin-top: 8px;">
                    Untuk (${totalJiwa} Jiwa):
                </div>
                <div style="font-size: 11px; margin-left: 5px;">
                    1. ${item.muzakki || item.donatur} (KK)<br>
                    ${item.anggotaKeluarga ? item.anggotaKeluarga.filter(n => n && n.trim()).map((nama, idx) =>
                        `${idx + 2}. ${nama}`
                    ).join('<br>') : ''}
                </div>
            ` : ''}

            <div style="border-top: 1px solid #000; margin: 10px 0;"></div>

            <div style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">
                <span>Rincian</span>
                <span style="float: right;">Jumlah</span>
                <div style="clear: both;"></div>
            </div>

            ${item.jenis && Array.isArray(item.jenis) ? item.jenis.map(j => {
                const uang = item.jumlah?.[j] || 0;
                const beras = item.beratBeras?.[j] || 0;
                if (uang > 0 || beras > 0) {
                    let valStr = '';
                    if (uang > 0) valStr = fmt(uang);
                    if (beras > 0) valStr = (valStr ? valStr + ' + ' : '') + beras + ' Kg';
                    return `
                        <div style="font-size: 11px; margin: 3px 0;">
                            <span>${j}</span>
                            <span style="float: right;">${valStr}</span>
                            <div style="clear: both;"></div>
                        </div>
                    `;
                }
                return '';
            }).join('') : ''}

            <div style="border-top: 2px solid #000; margin: 10px 0;"></div>

            ${totalUang > 0 ? `
                <div style="font-size: 14px; font-weight: bold; margin: 8px 0;">
                    <span>TOTAL UANG</span>
                    <span style="float: right;">${fmt(totalUang)}</span>
                    <div style="clear: both;"></div>
                </div>
            ` : ''}

            ${totalBeras > 0 ? `
                <div style="font-size: 14px; font-weight: bold; margin: 8px 0;">
                    <span>TOTAL BERAS</span>
                    <span style="float: right;">${totalBeras} Kg</span>
                    <div style="clear: both;"></div>
                </div>
            ` : ''}

            <div style="font-size: 11px; margin-top: 15px;">
                <span>Petugas: ${item.petugas || '-'}</span>
                <span style="float: right;">${item.metodePembayaran || 'Tunai'}</span>
                <div style="clear: both;"></div>
            </div>

            <div style="text-align: center; font-size: 10px; margin-top: 15px;">
                Semoga Allah menerima amal ibadah Bapak/Ibu<br>
                dan memberkahi harta yang tersisa. Aamiin.
            </div>
        </div>
    `;

    // Buat temporary div untuk render HTML
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = receiptHTML;
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

        // Convert canvas ke blob
        canvas.toBlob((blob) => {
            // Download image
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const nama = item.muzakki || item.donatur || 'Receipt';
            link.download = `Struk_${nama.replace(/[^a-zA-Z0-9]/g, '')}_${String(item.id).slice(-6)}.png`;
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 'image/png');

    } catch (error) {
        console.error('Error generating image:', error);
        alert('Gagal membuat gambar struk. Silakan coba lagi.');
    } finally {
        // Cleanup
        document.body.removeChild(tempDiv);
    }
};

// Fungsi untuk download struk sebagai gambar PNG (alias dari cetakKwitansi untuk konsistensi)
export const printReceipt = cetakKwitansi;

// Generate receipt HTML for preview (used by ReceiptSuccessModal)
export const generateReceiptPDFBase64 = async (item, settings) => {
    const fmt = (n) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(n);

    const totalJiwa = calculateTotalJiwa(item);
    const totalUang = getTotal(item);
    const totalBeras = getTotalBeras(item);

    // Generate HTML untuk struk (sama seperti fungsi cetakKwitansi)
    const receiptHTML = `
        <div style="
            width: 302px;
            padding: 10px;
            font-family: 'Courier New', monospace;
            background: white;
            color: black;
        ">
            <div style="text-align: center; font-weight: bold; font-size: 16px; margin-bottom: 5px;">
                ${settings?.namaMasjid || 'MASJID JAMI'}
            </div>
            <div style="text-align: center; font-size: 11px; margin-bottom: 10px;">
                Bukti Penerimaan Zakat/Infaq/Sedekah
            </div>
            <div style="border-top: 1px dashed #000; margin: 5px 0;"></div>

            <div style="font-size: 12px; margin: 5px 0;">
                <span>No: ${item.id}</span>
                <span style="float: right;">${item.tanggal ? new Date(item.tanggal).toLocaleDateString('id-ID') : new Date().toLocaleDateString('id-ID')}</span>
                <div style="clear: both;"></div>
            </div>

            <div style="font-weight: bold; font-size: 12px; margin-top: 10px;">Diterima Dari:</div>
            <div style="font-size: 13px; font-weight: bold; margin: 3px 0;">
                ${item.muzakki || item.donatur || 'Hamba Allah'}
            </div>
            ${item.alamat ? `<div style="font-size: 11px; margin: 3px 0;">${item.alamat}</div>` : ''}

            ${totalJiwa > 1 || (item.anggotaKeluarga && item.anggotaKeluarga.length > 0) ? `
                <div style="font-weight: bold; font-size: 12px; margin-top: 8px;">
                    Untuk (${totalJiwa} Jiwa):
                </div>
                <div style="font-size: 11px; margin-left: 5px;">
                    1. ${item.muzakki || item.donatur} (KK)<br>
                    ${item.anggotaKeluarga ? item.anggotaKeluarga.filter(n => n && n.trim()).map((nama, idx) =>
                        `${idx + 2}. ${nama}`
                    ).join('<br>') : ''}
                </div>
            ` : ''}

            <div style="border-top: 1px solid #000; margin: 10px 0;"></div>

            <div style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">
                <span>Rincian</span>
                <span style="float: right;">Jumlah</span>
                <div style="clear: both;"></div>
            </div>

            ${item.jenis && Array.isArray(item.jenis) ? item.jenis.map(j => {
                const uang = item.jumlah?.[j] || 0;
                const beras = item.beratBeras?.[j] || 0;
                if (uang > 0 || beras > 0) {
                    let valStr = '';
                    if (uang > 0) valStr = fmt(uang);
                    if (beras > 0) valStr = (valStr ? valStr + ' + ' : '') + beras + ' Kg';
                    return `
                        <div style="font-size: 11px; margin: 3px 0;">
                            <span>${j}</span>
                            <span style="float: right;">${valStr}</span>
                            <div style="clear: both;"></div>
                        </div>
                    `;
                }
                return '';
            }).join('') : ''}

            <div style="border-top: 2px solid #000; margin: 10px 0;"></div>

            ${totalUang > 0 ? `
                <div style="font-size: 14px; font-weight: bold; margin: 8px 0;">
                    <span>TOTAL UANG</span>
                    <span style="float: right;">${fmt(totalUang)}</span>
                    <div style="clear: both;"></div>
                </div>
            ` : ''}

            ${totalBeras > 0 ? `
                <div style="font-size: 14px; font-weight: bold; margin: 8px 0;">
                    <span>TOTAL BERAS</span>
                    <span style="float: right;">${totalBeras} Kg</span>
                    <div style="clear: both;"></div>
                </div>
            ` : ''}

            <div style="font-size: 11px; margin-top: 15px;">
                <span>Petugas: ${item.petugas || '-'}</span>
                <span style="float: right;">${item.metodePembayaran || 'Tunai'}</span>
                <div style="clear: both;"></div>
            </div>

            <div style="text-align: center; font-size: 10px; margin-top: 15px;">
                Semoga Allah menerima amal ibadah Bapak/Ibu<br>
                dan memberkahi harta yang tersisa. Aamiin.
            </div>
        </div>
    `;

    const nama = item.muzakki || item.donatur || 'Receipt';
    const filename = `Struk_${nama.replace(/[^a-zA-Z0-9]/g, '')}_${String(item.id).slice(-6)}.png`;

    // Return HTML sebagai base64 untuk preview
    // AdminLayout akan render ini sebagai preview
    return {
        base64: btoa(unescape(encodeURIComponent(receiptHTML))),
        filename: filename,
        html: receiptHTML
    };
};
