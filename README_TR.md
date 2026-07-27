# DevPulse 🔍🖥️

![Electron](https://img.shields.io/badge/Electron-Latest-47848F?logo=electron)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Vite](https://img.shields.io/badge/Vite-Ready-646CFF?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

> **Geliştirici ortamınızın nabzını tutar.**

DevPulse, sisteminizde yüklü olan yazılım geliştirme araçlarını (Python, Node.js, Java, .NET, npm, yarn, pip, Chocolatey vb.) otomatik olarak tespit eden, sürümlerini kontrol eden ve tek tıklamayla güvenli bir şekilde güncelleyen modern bir Windows masaüstü uygulamasıdır.

**Electron**, **React** ve **Vite** kullanılarak geliştirilen DevPulse, şık bir karanlık mod arayüzüne ve sağlam bir araç tespit motoruna sahiptir.

🌐 *Read this in [English](README.md).*

---

## ✨ Özellikler

- 🔍 **Otomatik Tespit:** Python, Node.js, Java, .NET, npm, yarn, pip ve Chocolatey gibi popüler araçları otomatik algılar.
- 🔄 **Sürüm Kontrolü:** Resmi API'lere bağlanarak en son kararlı (stable/LTS) sürümleri kontrol eder.
- 🎨 **Görsel Kontrol Paneli:** React ve özel CSS ile hazırlanmış profesyonel arayüz (Glassmorphism & Dark Mode).
- 🚀 **Tek Tıkla Güncelleme:** Güvenilir paket yöneticilerini (winget, npm, choco) kullanarak araçlarınızı güvenle günceller.
- 🛡️ **Önce Güvenlik:** Yalnızca izin verilen komutların ve izinli alt-komut desenlerinin çalıştırılmasına izin verir (whitelist).
- 📜 **Canlı Loglar:** Güncelleme sırasındaki terminal çıktılarını uygulama içinden anlık olarak takip edebilirsiniz.
- 🔗 **Harici Linkler:** Resmi indirme sayfalarını varsayılan tarayıcınızda açar.

---

## 💻 Sistem Gereksinimleri

1. **Windows 10 veya Windows 11**
2. **Node.js** (v18.0.0 veya üzeri): [Node.js İndir](https://nodejs.org/)
3. **Git**: [Git İndir](https://git-scm.com/)

---

## 🚀 Kurulum ve Çalıştırma

### ⚡ Tek Satırda Kurulum ve Çalıştırma (Hızlı Başlangıç)

Terminalinizde (PowerShell / CMD) aşağıdaki komutu çalıştırarak projeyi indirebilir, bağımlılıkları kurabilir ve DevPulse'u anında başlatabilirsiniz:

```bash
git clone https://github.com/an1lbayram/DevPulse.git && cd DevPulse && npm install && npm start
```

---

### 📋 Adım Adım Kurulum (Hiç Bilmeyenler İçin)

#### 1️⃣ Terminal / Komut Satırını Açın
Windows Başlat menüsüne `PowerShell` veya `CMD` yazıp çalıştırın.

#### 2️⃣ Repoyu Klonlayın
Aşağıdaki komutu yazıp **Enter** tuşuna basın:
```bash
git clone https://github.com/an1lbayram/DevPulse.git
```

#### 3️⃣ Proje Klasörüne Geçin
```bash
cd DevPulse
```

#### 4️⃣ Bağımlılıkları (Gerekli Paketleri) Yükleyin
```bash
npm install
```

#### 5️⃣ Uygulamayı Geliştirici Modunda Başlatın
```bash
npm start
```
Electron penceresi otomatik açılacak ve sisteminizdeki araçları taramaya başlayacaktır.

---

## 📦 Masaüstü Kurulum Dosyası (.exe) Oluşturma

DevPulse uygulamasını bir yükleyici `.exe` veya taşınabilir `.zip` dosyasına dönüştürmek için:

```bash
npm run make
```

Oluşturulan derleme dosyaları **`out/`** klasörünün içine kaydedilir.

---

## 🔐 Güvenlik Notu

DevPulse, sisteminizde komut çalıştırırken maksimum güvenlik standartlarını uygular:
- **Serbest Metin Koruması:** Güncelleme komutları önceden tanımlanmış bir liste (`src/config/tools.js`) içindedir, kullanıcı serbest komut giremez.
- **Whitelist Kontrolü:** Yalnızca onaylı komut kalıpları çalıştırılır.
- **UAC Yönetimi:** Yönetici yetkisi gerektiren işlemlerde standart Windows UAC onay ekranı gelir.
- **Renderer İzolasyonu:** UI katmanında `contextIsolation` açıktır ve Node entegrasyonu kapalı tutulur.

---

## 📄 Lisans

Bu proje [MIT Lisansı](LICENSE) ile lisanslanmıştır.

**Geliştirici:** [Anıl Bayram](https://github.com/an1lbayram)
