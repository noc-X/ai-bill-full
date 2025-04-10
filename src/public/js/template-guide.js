// Template Guide Generator untuk PDF Download

const pdfMake = window.pdfMake;

// Mendefinisikan konten panduan template
const templateGuideContent = {
    verifikasi: {
        title: 'Template Verifikasi Pelanggan',
        example: 'Halo {nama_pelanggan},\n\nTerima kasih telah menghubungi layanan pelanggan kami. Mohon konfirmasi data berikut:\n\nID Pelanggan: {id_pelanggan}\nPaket Internet: {nama_paket}\nAlamat Pemasangan: {alamat}\n\nApakah data tersebut sudah benar?',
        variables: ['nama_pelanggan', 'id_pelanggan', 'nama_paket', 'alamat']
    },
    gangguan: {
        title: 'Template Laporan Gangguan',
        example: 'Laporan Gangguan #{nomor_tiket}\n\nPelanggan: {nama_pelanggan}\nLokasi: {lokasi}\nJenis Gangguan: {jenis_gangguan}\nStatus: {status_penanganan}\n\nTim teknisi kami sedang menangani gangguan Anda. Estimasi waktu penyelesaian: {estimasi_selesai}.\n\nKami akan memberikan update progress penanganan secara berkala.',
        variables: ['nomor_tiket', 'nama_pelanggan', 'lokasi', 'jenis_gangguan', 'status_penanganan', 'estimasi_selesai']
    },
    pembayaran: {
        title: 'Template Pengingat Pembayaran',
        example: 'Yth. {nama_pelanggan},\n\nIni adalah pengingat untuk pembayaran tagihan internet Anda:\n\nTotal Tagihan: Rp {jumlah_tagihan}\nPeriode: {periode_tagihan}\nJatuh Tempo: {tanggal_jatuh_tempo}\n\nSilakan lakukan pembayaran melalui {metode_pembayaran}.\nAbaikan pesan ini jika sudah melakukan pembayaran.\n\nInfo lebih lanjut hubungi: {kontak_support}',
        variables: ['nama_pelanggan', 'jumlah_tagihan', 'periode_tagihan', 'tanggal_jatuh_tempo', 'metode_pembayaran', 'kontak_support']
    },
    upgrade: {
        title: 'Template Konfirmasi Upgrade Paket',
        example: 'Halo {nama_pelanggan},\n\nTerima kasih atas pengajuan upgrade paket internet Anda:\n\nPaket Saat Ini: {paket_lama}\nPaket Baru: {paket_baru}\nBiaya Upgrade: Rp {biaya_upgrade}\nTanggal Aktif: {tanggal_aktif}\n\nMohon konfirmasi apakah Anda setuju dengan perubahan paket ini?',
        variables: ['nama_pelanggan', 'paket_lama', 'paket_baru', 'biaya_upgrade', 'tanggal_aktif']
    },
    maintenance: {
        title: 'Template Pemberitahuan Maintenance',
        example: 'PEMBERITAHUAN MAINTENANCE\n\nKepada Yth. {nama_pelanggan}\n\nKami informasikan akan ada maintenance jaringan di area {area_maintenance}:\n\nTanggal: {tanggal_maintenance}\nWaktu: {waktu_maintenance}\nDurasi: {durasi_maintenance}\nDampak: {dampak_layanan}\n\nMohon maaf atas ketidaknyamanannya.\nTim support: {kontak_support}',
        variables: ['nama_pelanggan', 'area_maintenance', 'tanggal_maintenance', 'waktu_maintenance', 'durasi_maintenance', 'dampak_layanan', 'kontak_support']
    }
};

// Generate PDF document definition
function generateTemplateGuide() {
    const docDefinition = {
        content: [
            { text: 'AI Template Usage Guide', style: 'header' },
            '\n',
            { text: 'This guide demonstrates how to effectively use AI templates for various scenarios.', style: 'subheader' },
            '\n',
            ...Object.entries(templateGuideContent).map(([category, template]) => [
                { text: template.title, style: 'categoryHeader' },
                { text: 'Example Template:', style: 'label' },
                { text: template.example, style: 'example' },
                { text: 'Variables Used:', style: 'label' },
                { ul: template.variables },
                '\n'
            ]).flat(),
            { text: 'Best Practices:', style: 'sectionHeader' },
            { ul: [
                'Use clear and professional language',
                'Include all necessary variables in curly braces {variable}',
                'Test templates before implementing them',
                'Keep templates concise but informative',
                'Update templates regularly based on feedback'
            ]}
        ],
        styles: {
            header: {
                fontSize: 22,
                bold: true,
                alignment: 'center',
                margin: [0, 0, 0, 10]
            },
            subheader: {
                fontSize: 16,
                margin: [0, 10, 0, 5]
            },
            categoryHeader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 5]
            },
            label: {
                fontSize: 12,
                bold: true,
                margin: [0, 5, 0, 5]
            },
            example: {
                fontSize: 11,
                margin: [0, 0, 0, 10],
                color: '#666666'
            },
            sectionHeader: {
                fontSize: 14,
                bold: true,
                margin: [0, 10, 0, 5]
            }
        }
    };

    return docDefinition;
}

// Download PDF guide
function downloadTemplateGuide() {
    const docDefinition = generateTemplateGuide();
    pdfMake.createPdf(docDefinition).download('ai-template-guide.pdf');
}

// Add download button to template management page
function addDownloadGuideButton() {
    const container = document.querySelector('.d-flex.justify-content-between');
    if (!container) return;

    const downloadButton = document.createElement('button');
    downloadButton.className = 'btn btn-info me-2';
    downloadButton.innerHTML = '<i class="bi bi-download"></i> Download Template Guide';
    downloadButton.onclick = downloadTemplateGuide;

    container.insertBefore(downloadButton, container.lastElementChild);
}

// Initialize guide functionality
document.addEventListener('DOMContentLoaded', () => {
    addDownloadGuideButton();
});