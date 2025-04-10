// Default AI response templates
module.exports = {
  // Network issue templates
  network: {
    offline: {
      title: 'Gangguan Koneksi',
      template: "Mohon maaf atas ketidaknyamanannya. Berdasarkan pemeriksaan sistem, koneksi internet Anda sedang mengalami gangguan. {{diagnosis}}\n\nTim teknisi kami akan segera menangani masalah ini. Nomor tiket Anda: {{ticketNumber}}"
    },
    online: {
      title: 'Koneksi Aktif',
      template: "Berdasarkan pemeriksaan sistem, koneksi internet Anda terdeteksi aktif. Silakan coba langkah-langkah berikut:\n1. Restart perangkat router Anda\n2. Periksa kabel jaringan\n3. Pastikan tidak ada perangkat yang menggunakan bandwidth berlebihan\n\nJika masalah masih berlanjut, teknisi kami akan menghubungi Anda.\nNomor tiket Anda: {{ticketNumber}}"
    },
    intermittent: {
      title: 'Koneksi Tidak Stabil',
      template: "Kami mendeteksi koneksi internet Anda mengalami ketidakstabilan. {{diagnosis}}\n\nTim teknisi kami akan melakukan pemeriksaan lebih lanjut. Nomor tiket Anda: {{ticketNumber}}"
    }
  },

  // Payment-related templates
  payment: {
    overdue: {
      title: 'Tagihan Terlambat',
      template: "Kami menemukan tagihan yang belum dibayar:\nNomor Invoice: {{invoiceNumber}}\nTotal: Rp {{amount}}\nJatuh Tempo: {{dueDate}}\n\nMohon segera lakukan pembayaran untuk menghindari pemutusan layanan."
    },
    isolated: {
      title: 'Layanan Terisolir',
      template: "Mohon maaf, layanan internet Anda saat ini terisolir karena terdapat tagihan yang belum dibayar:\nNomor Invoice: {{invoiceNumber}}\nTotal: Rp {{amount}}\nJatuh Tempo: {{dueDate}}\n\nUntuk mengaktifkan kembali layanan, mohon segera lakukan pembayaran."
    },
    reminder: {
      title: 'Pengingat Pembayaran',
      template: "Ini adalah pengingat pembayaran untuk tagihan internet Anda:\nNomor Invoice: {{invoiceNumber}}\nTotal: Rp {{amount}}\nJatuh Tempo: {{dueDate}}\n\nAbaikan pesan ini jika sudah melakukan pembayaran."
    }
  },

  // General customer service templates
  general: {
    greeting: {
      title: 'Salam Pembuka',
      template: "Halo {{customerName}}, terima kasih telah menghubungi layanan pelanggan kami. Ada yang bisa kami bantu?"
    },
    verification: {
      title: 'Verifikasi Pelanggan',
      template: "Untuk membantu Anda, mohon berikan informasi berikut untuk verifikasi:\n1. Nama lengkap\n2. Alamat email\n3. Alamat pemasangan"
    },
    ticketCreated: {
      title: 'Tiket Dibuat',
      template: "Tiket Anda telah dibuat dengan nomor: {{ticketNumber}}. Tim kami akan segera menindaklanjuti permintaan Anda."
    },
    closing: {
      title: 'Salam Penutup',
      template: "Terima kasih telah menghubungi layanan pelanggan kami. Jika ada pertanyaan lain, jangan ragu untuk menghubungi kami kembali."
    }
  }
};