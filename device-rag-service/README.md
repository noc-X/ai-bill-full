# Device RAG Service

Layanan RAG (Retrieval Augmented Generation) untuk analisis perangkat dan generasi respons AI.

## Fitur

- Analisis perangkat jaringan menggunakan RAG
- Generasi respons kontekstual
- Integrasi dengan Ollama untuk pemrosesan AI lokal
- Penyimpanan dan pengindeksan data menggunakan ChromaDB
- API endpoint yang aman dengan autentikasi JWT

## Endpoint API

### Analisis Perangkat
`POST /api/device/analyze`
- Menganalisis masalah perangkat berdasarkan data historis dan konteks

### Generasi Respons
`POST /api/device/response`
- Menghasilkan respons yang sesuai berdasarkan hasil analisis

## Konfigurasi

Salin `.env.example` ke `.env` dan sesuaikan pengaturan:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
API_KEY=your_api_key
```

## Instalasi

```bash
npm install
npm run dev # untuk development
npm start # untuk production
```

## Integrasi

Gunakan API key untuk mengakses endpoint:

```javascript
const response = await fetch('http://localhost:5000/api/device/analyze', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your_api_key',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    deviceId: 'device_id',
    issue: 'deskripsi_masalah'
  })
});
```