# Knowledge Base Storage

Direktori ini digunakan untuk menyimpan file-file knowledge base yang digunakan oleh sistem RAG (Retrieval Augmented Generation).

## Struktur Direktori

- `pdf/`: Menyimpan dokumen PDF yang berisi informasi perangkat, manual, dan dokumentasi teknis
- `csv/`: Menyimpan data terstruktur dalam format CSV seperti log perangkat, data kinerja, dan catatan masalah

## Penggunaan

File-file yang disimpan di sini akan diproses oleh RAG service untuk:
1. Mengekstrak informasi penting tentang perangkat
2. Membangun basis pengetahuan untuk analisis masalah
3. Memberikan konteks yang relevan untuk generasi respons

## Panduan

- Pastikan file PDF yang ditambahkan memiliki format yang konsisten
- File CSV harus memiliki header yang jelas dan format yang sesuai
- Gunakan penamaan file yang deskriptif (contoh: device-manual-v1.pdf, network-issues-2024.csv)
- Update .env dengan path yang sesuai ke direktori ini