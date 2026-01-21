import { formatRupiah, getTotal, getTotalBeras, calculateTotalJiwa } from './format';

export const generateWhatsAppMessage = (item, settings) => {
    const totalUang = getTotal(item);
    const totalBeras = getTotalBeras(item);
    const date = new Date(item.tanggal || new Date());
    const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    const listAnggota = (item.anggotaKeluarga || [])
        .filter(n => n && n.trim())
        .map((n, i) => `${i + 1}. ${n}`)
        .join('\n');

    const adminWa = settings?.nomorKonsultasi || '6285694449192';

    return `📢 *Konfirmasi Penerimaan Zakat*

⏰ ${dateStr}
Bagi Bapak/ibu yang ingin menjadi Donatur bulanan tetap untuk memberikan mustahiq (orang yang membutuhkan) sekitar duta bintaro silahkan hubungi nomer ini,

👤 *Nama Kepala Keluarga:* ${item.muzakki || item.nama || '-'}
📍 *Alamat:* ${item.alamat || '-'}
👥 *Jumlah Keluarga:* ${calculateTotalJiwa(item)} orang

👨👩👧👦 *Anggota Keluarga:*
${listAnggota || '-'}

💵 *Metode Pembayaran:* ${item.metodePembayaran || 'Tunai'}
💰 *Total Uang:* ${formatRupiah(totalUang)}
🌾 *Total Beras:* ${totalBeras} Kg

Jazakumullahu Khairan Katsiran.
Semoga zakat/infak/sedekah yang Bapak/Ibu tunaikan diterima oleh Allah SWT dan menjadi keberkahan bagi keluarga. Aamiin.

Info & Konsultasi: wa.me/${adminWa}`;
};
