# Task Reminder System

Bu proje, MERN stack (MongoDB, Express.js, React.js, Node.js) kullanılarak geliştirilmiş bir görev hatırlatma sistemidir.

## Teknolojiler

### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### Frontend
- React.js
- Material-UI
- Axios
- React Router

## Özellikler

### Kullanıcı Yönetimi
- Kullanıcı kaydı ve girişi
- JWT tabanlı kimlik doğrulama
- Kullanıcı oturumu yönetimi

### Görev Yönetimi
- Görev oluşturma
- Görev düzenleme
- Görev silme
- Görev detaylarını görüntüleme
- Görev kartları görünümü

### Hatırlatma Sistemi
- Görevler için hatırlatma zamanı ayarlama
- Zamanı geldiğinde otomatik hatırlatma
- Hatırlatma seçenekleri:
  - Tamamla (Complete)
  - İptal et (Cancel)
  - Ertele (Postpone)
    - 5 dakika
    - 10 dakika
    - 15 dakika
    - 30 dakika
    - 1 saat
    - Yarın
    - Özel tarih/saat

### Aktivite Takibi
- Sağ panelde aktivite geçmişi
- Farklı aktivite türleri için ikonlar:
  - Hatırlatma bildirimleri
  - Görev oluşturma
  - Görev tamamlama
  - Görev erteleme
  - Hatırlatma iptali

### Zaman Yönetimi
- Sağ üst köşede canlı saat gösterimi
- Dakika bazlı hatırlatma sistemi
- Timezone uyumlu çalışma

## Teknik Detaylar

### Backend Yapısı
- Models:
  - User Model (kullanıcı bilgileri)
  - Task Model (görev detayları)
- Routes:
  - User Routes (kimlik doğrulama)
  - Task Routes (CRUD işlemleri)

### Frontend Yapısı
- Pages:
  - Login
  - Dashboard
- Components:
  - Task Cards
  - Task Creation Modal
  - Task Detail Modal
  - Reminder Dialog
  - Activity Log Sidebar

## Kurulum

1. Backend'i başlatmak için:
```bash
cd TaskRemainder
node server.js
```

2. Frontend'i başlatmak için:
```bash
cd TaskRemainder/client
npm start
```

3. MongoDB'nin çalıştığından emin olun:
- Windows Services'den MongoDB'nin çalışır durumda olduğunu kontrol edin

4. Tarayıcıda uygulamayı açın:
- Otomatik açılmazsa: http://10.102.37.150:3000

## Geliştirme Sürecinde Çözülen Sorunlar

1. Timezone Sorunları:
- Saat farkından kaynaklanan gösterim problemleri
- Hatırlatma zamanlaması sorunları

2. Hatırlatma Sistemi İyileştirmeleri:
- Saniye hassasiyeti kaldırıldı
- Dakika bazlı kontrol sistemi eklendi
- Çoklu görev hatırlatma sorunları çözüldü

3. UI/UX İyileştirmeleri:
- Activity log sidebar'ı eklendi
- Dinamik saat gösterimi eklendi
- Görev kartları görünümü geliştirildi

## Notlar

- Backend çalışmadan frontend'in tam fonksiyonel çalışmayacağını unutmayın
- MongoDB bağlantısı olmadan backend başlatılamaz
- Her iki servis de (backend ve frontend) çalışır durumda olmalı 