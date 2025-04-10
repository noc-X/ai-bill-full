# CSV Knowledge Base

Direktori ini digunakan untuk menyimpan data terstruktur dalam format CSV yang berkaitan dengan perangkat jaringan.

## Jenis Data

- Log perangkat
- Data kinerja
- Catatan masalah dan resolusi
- Riwayat pemeliharaan
- Statistik penggunaan

## Format Penamaan

Gunakan format penamaan yang konsisten untuk memudahkan pengelolaan:

```
<jenis>-<nama-perangkat>-<periode>.csv

Contoh:
log-router-mikrotik-rb3011-202401.csv
perf-switch-cisco-2960-202401.csv
issue-antenna-ubiquiti-m5-202401.csv
```

## Struktur Data

Setiap file CSV harus memiliki:
- Header yang jelas dan deskriptif
- Format data yang konsisten
- Timestamp untuk setiap entri
- ID perangkat yang terkait
- Metadata yang relevan

## Panduan Format

### Log Perangkat
```csv
timestamp,device_id,event_type,severity,message
2024-01-15T10:00:00Z,RB3011-01,CONNECTION,WARNING,"Link down on ether1"
```

### Data Kinerja
```csv
timestamp,device_id,cpu_load,memory_usage,temperature,uptime
2024-01-15T10:00:00Z,RB3011-01,45.2,68.5,42.3,86400
```

### Catatan Masalah
```csv
timestamp,device_id,issue_type,description,resolution,status
2024-01-15T10:00:00Z,RB3011-01,HARDWARE,"Fan noise abnormal","Replaced fan unit",RESOLVED
```