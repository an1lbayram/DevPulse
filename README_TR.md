# DevPulse 🔍🖥️

> Geliştirici ortamınızın nabzını tutar.

DevPulse, sisteminizde yüklü olan yazılım geliştirme araçlarını otomatik olarak tespit eden, sürüm kontrolü yapan ve tek tıklamayla güvenli bir şekilde güncelleyen modern bir Windows masaüstü uygulamasıdır.

**Electron**, **React** ve **Vite** kullanılarak geliştirilen DevPulse, şık bir karanlık mod arayüzüne ve sağlam bir araç tespit motoruna sahiptir.

İngilizce versiyon için [tıklayın](README.md).

## Özellikler ✨
- **Otomatik Tespit**: Python, Node.js, Java, .NET, npm, yarn, pip ve Chocolatey gibi popüler araçları otomatik algılar.
- **Sürüm Kontrolü**: Resmi API'lere bağlanarak en son kararlı (stable/LTS) sürümleri kontrol eder.
- **Görsel Kontrol Paneli**: React ve özel CSS ile hazırlanmış profesyonel arayüz (Glassmorphism & Dark Mode).
- **Tek Tıkla Güncelleme**: Güvenilir paket yöneticilerini (winget, npm, choco) kullanarak araçlarınızı güvenle günceller.
- **Önce Güvenlik**: Yalnızca izin verilen komutların ve izinli alt-komut desenlerinin çalıştırılmasına izin verir (whitelist).
- **Canlı Loglar**: Güncelleme sırasındaki terminal çıktılarını uygulama içinden anlık olarak takip edebilirsiniz.
- **Harici Linkler**: Resmi indirme sayfalarını varsayılan tarayıcınızda açar.

## Kurulum 🚀

### Gereksinimler
- Windows 10 veya 11
- Node.js (kaynaktan derlemek için)

### Kaynaktan Kurulum
1. Repoyu klonlayın:
   ```bash
   git clone https://github.com/an1lbayram/DevPulse.git
   cd DevPulse
   ```
2. Bağımlılıkları yükleyin:
   ```bash
   npm install
   ```
3. Uygulamayı geliştirici modunda başlatın:
   ```bash
   npm start
   ```

### Derleme & Paketleme (.exe oluşturma)
Taşınabilir bir `.zip` veya Windows yükleyici `.exe` dosyası oluşturmak için:
```bash
npm run make
```
Çıktı dosyaları `out/` klasöründe bulunacaktır.

## Güvenlik Notu 🔐
DevPulse, sisteminizde komut çalıştırmak için `child_process.spawn` kullanır. Güvenliği sağlamak için:
- **Koruma**: Güncelleme komutları önceden tanımlanmış bir registry içindedir (`src/config/tools.js`), kullanıcı serbest metin komut giremez.
- **Whitelist + alt-komutlar**: Yalnızca izin verilen komutlar ve izinli alt-komut desenleri çalıştırılabilir.
- **Yönetici İzni (UAC)**: Bazı güncellemeler UAC isteyebilir. Uygulama UAC'yi atlatmaz; kullanıcı onayı ister.
- **Renderer izolasyonu**: UI tarafında `contextIsolation` açıktır ve Node entegrasyonu kapalıdır.

## Notlar
- **Loglar**: UI, bellek şişmesini engellemek için yaklaşık son 1000 log kaydını tutar.
- **Ağ**: Sürüm kontrol isteklerinde takılmayı önlemek için timeout kullanılır.
- **Bağımlılıklar**: `npm audit --omit=dev` temizdir; `npm audit` geliştirme araçlarının bağımlılıklarında uyarı gösterebilir.
