import { calculateTotalJiwa, getTotal, getTotalBeras } from './format';

// Fungsi untuk print langsung sebagai image (untuk thermal printer)
export const cetakKwitansi = (item, settings) => {
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

    // Buat window baru untuk print
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Struk</title>
            <style>
                @media print {
                    @page {
                        size: 80mm auto;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                    }
                }
                body {
                    margin: 0;
                    padding: 0;
                    display: flex;
                    justify-content: center;
                }
            </style>
        </head>
        <body>
            ${receiptHTML}
            <script>
                window.onload = function() {
                    window.print();
                    // Close window setelah print dialog muncul
                    setTimeout(function() { window.close(); }, 100);
                }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

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
