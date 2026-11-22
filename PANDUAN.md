# Panduan Fitur 1, 2, 6, dan 7 — Aku Mw Magang

Proyek praktikum Modul 5 menggunakan React 19, TypeScript `strict: true`, Vite, CSS, React Hooks bawaan, dan custom hooks. Tidak menggunakan library form atau state management eksternal.

Pengerjaan ini mencakup empat fitur yang diminta. Fitur 3–5 (pipeline lengkap, transisi status, pengelolaan checklist/log, dan timer latihan interview) disiapkan untuk integrasi anggota kelompok lain. Daftar lamaran sederhana disediakan agar hapus dan Undo dapat digunakan. Tipe data, persistensi, dan Undo sudah mendukung checklist serta activity log utuh.

## 1. Menjalankan proyek

1. Buka PowerShell atau terminal VS Code.
2. Masuk ke lokasi proyek:

   ```powershell
   Set-Location 'D:\Tugas\Semester 3\PemWeb\pweb-react-a02-2026'
   ```

3. Cek Node dan npm. Proyek diuji dengan Node 24.12.0; gunakan Node 24 LTS agar sesuai lingkungan pengujian.

   ```powershell
   node --version
   npm.cmd --version
   ```

4. Instal dependency sesuai lockfile saat pertama kali atau setelah lockfile berubah:

   ```powershell
   npm.cmd ci
   ```

5. Jalankan development server:

   ```powershell
   npm.cmd run dev
   ```

6. Buka URL terminal, biasanya `http://localhost:5173`. Jika port terpakai, Vite memilih port berikutnya.
7. Hentikan server dengan `Ctrl+C`.

`npm.cmd` menghindari kendala execution policy PowerShell pada `npm.ps1`. LocalStorage terpisah per origin: `localhost`, `127.0.0.1`, serta port berbeda tidak berbagi data.

Repository awal hanya berisi README. Aplikasi diinisiasi memakai template resmi `react-ts` lewat `npm create vite@latest`, kemudian diintegrasikan ke checkout repository. Linter native bawaan template diblokir Application Control Windows, sehingga diganti ESLint. TypeScript menggunakan versi 6.0 yang kompatibel dengan parser ESLint.

## 2. Struktur dan urutan implementasi

```text
public/
  magang-fallback.json         # 15 lowongan contoh
  demo-applications.json       # Fixture 2 OFFER dan 1 APPLIED
src/
  components/
    SkillProfile.tsx           # Tambah/hapus skill
    JobExplorer.tsx            # Fetch, search, filter, sort, Wishlist
    MatchBadge.tsx             # Badge warna skor
    ManualApplicationForm.tsx  # Form terkontrol + focus error
    ApplicationList.tsx        # Daftar sederhana untuk hapus/Undo
    Dashboard.tsx              # Lima statistik derived state
    OfferComparator.tsx       # Perbandingan dua offer
  hooks/
    useLocalStorage.ts         # State persisten generik
    useDebounce.ts             # Jeda pencarian generik
    useJobs.ts                 # Lifecycle fetch
    useUndoDelete.ts           # Snapshot dan timer 5 detik
  services/jobService.ts       # Request dan validasi payload
  types/index.ts               # Application, JobListing, status/mode
  utils/application.ts         # Match, duplikat, statistik, skor
  utils/validation.ts          # Validasi JSON saat runtime
  App.tsx                     # Pemilik state utama
  App.css                     # Layout responsif
  index.css                   # Tipografi dan style dasar
tests/features.test.ts        # Unit test domain dan hooks
e2e/features.spec.ts          # Tes alur browser Chrome
```

Urutan untuk mempelajari atau menjelaskan pengerjaan:

1. Definisikan interface di `types/index.ts`. `Application` mengikuti skema soal, termasuk nested `checklist` dan `activityLogs`. `NewApplication` membatasi status awal menjadi WISHLIST/APPLIED.
2. Buat fungsi murni di `utils/application.ts`. Fungsi murni mudah diuji karena menerima input dan menghasilkan output tanpa mengubah data asal.
3. Buat `useLocalStorage<T>` dan `useDebounce<T>`. Generic `T` membuat hook dapat menangani beberapa tipe data.
4. Pisahkan fetch ke `jobService.ts` dan pengaturan lifecycle ke `useJobs.ts`.
5. Tempatkan state `applications` dan `kaptenSkills` di `App.tsx`; teruskan data dan callback lewat props.
6. Hubungkan profil skill dan eksplorasi lowongan ke state tersebut.
7. Tambahkan form manual dengan validasi serta referensi input.
8. Hubungkan daftar lamaran dengan hook hapus/Undo.
9. Hitung dashboard dan comparator langsung dari props terbaru, tanpa state tambahan untuk hasil perhitungan.

## 3. Fitur 1 — Profil skill dan eksplorasi lowongan

### Alur kode

1. `App` membaca `kaptenSkills` dari localStorage, dengan default React, TypeScript, CSS.
2. `SkillProfile` memakai input terkontrol. Skill di-trim; nama kosong dan duplikat case-insensitive ditolak. Tambah memakai array baru, hapus memakai `filter`.
3. `useJobs` menjalankan fetch melalui `useEffect` dan `AbortController`. Cleanup membatalkan request saat sumber/retry berubah atau komponen unmount. Hasil request lama tidak menimpa request terbaru.
4. Sumber utama: `https://remotive.com/api/remote-jobs?category=software-dev&limit=30`. Ada batas waktu 12 detik agar loading tidak terus menggantung.
5. Saat API gagal, UI menampilkan error, **Coba Lagi**, dan **Fallback Lokal**. Fallback dicoba otomatis jika request belum dibatalkan. Dropdown sumber juga dapat langsung memilih lokal.
6. `useDebounce(keyword, 400)` mengubah kata kunci efektif setelah 400 ms tanpa ketikan; timer ketikan sebelumnya dibersihkan.
7. Daftar difilter berdasarkan judul/perusahaan/skill serta kategori, kemudian diurutkan dari match tertinggi.
8. `skillMatch` membandingkan skill tanpa kapitalisasi dan menghasilkan matched, missing, serta `Math.round(jumlahCocok / totalRequired * 100)`. Required skills dideduplikasi. Jika kosong, skor 0% untuk menghindari pembagian nol.
9. Badge hijau untuk ≥70%, kuning 40–69%, merah <40%. Menambah skill langsung menghitung ulang semua skor.
10. Wishlist membuat objek lengkap dengan ID, timestamp, checklist kosong, dan log pembuatan. Pasangan company/role yang sama setelah trim/lowercase ditolak. Tombol menjadi **Sudah Dilamar** dan disabled.

### Langkah demo

1. Pilih sumber **Fallback Lokal** agar data konsisten.
2. Cari **Fullstack Intern — Ruang Digital**. Match awal 75%: React, TypeScript, CSS cocok; Docker missing.
3. Tambahkan Docker. Match menjadi 100%.
4. Tambahkan `docker` lagi: ditolak sebagai duplikat. Hapus Docker dengan ×: skor kembali 75%.
5. Ketik cepat di pencarian; hasil berubah setelah jeda 400 ms. Coba kategori Data.
6. Klik Simpan ke Wishlist dan periksa tombol menjadi disabled.
7. Cari teks yang tidak ada untuk melihat empty state.
8. Untuk uji error, pilih Live API → DevTools → Network → Offline → Muat ulang. Error dan tombol retry/fallback tetap tersedia.
9. Kembalikan jaringan ke Online sebelum menggunakan fallback jika file lokal belum dapat dilayani.

Fallback merupakan berkas pada server Vite, bukan service worker/cache offline. Saat browser benar-benar Offline, localhost juga dapat gagal diakses. File fallback asli tidak dilampirkan, jadi 15 lowongan di proyek ini merupakan data contoh buatan sesuai skema soal, bukan lowongan aktual yang dijamin tersedia.

## 4. Fitur 2 — Form tambah lamaran manual

### Alur kode

1. Semua nilai disimpan dalam satu object state `form`. Setiap input memiliki `value` dan `onChange`.
2. Update memakai `{ ...current, [field]: value }`, bukan mutasi object lama.
3. Status awal terbatas WISHLIST/APPLIED. APPLIED menampilkan dan mewajibkan versi CV serta tanggal melamar.
4. Jika status kembali WISHLIST, field CV/tanggal tidak disertakan dalam objek lamaran yang dibuat.
5. Required skills dipisah dengan koma, di-trim, dibuang yang kosong, dan dideduplikasi. Minimal satu skill wajib diisi.
6. Submit memvalidasi perusahaan, posisi, skills, serta CV/tanggal jika diperlukan. Pasangan perusahaan/posisi duplikat ditolak tanpa membedakan kapitalisasi.
7. `fieldRefs` dalam `useRef` menyimpan DOM input. Input pertama yang error diberi `.focus()`.
8. Jika valid, callback di App menambah objek lamaran immutable, lalu form direset.

### Langkah demo

1. Buka **Lamaran saya**, submit form kosong: fokus berpindah ke Perusahaan.
2. Isi perusahaan `Contoh Teknologi`, posisi `Frontend Intern`, skills `React, TypeScript, CSS`.
3. Pilih APPLIED lalu submit tanpa CV/tanggal: fokus berpindah ke Versi CV.
4. Isi `CV-Frontend-v2.pdf` dan tanggal; submit. Daftar menampilkan APPLIED serta versi CV.
5. Coba buat `contoh teknologi` dengan posisi `FRONTEND INTERN`: ditolak dan fokus ke Perusahaan.

## 5. Fitur 6 — Undo Delete dan persistensi

### Alur kode

1. `useLocalStorage<T>` membaca JSON saat inisialisasi dan memvalidasi formatnya. `useEffect` menyimpan setiap perubahan state.
2. Pembacaan/penulisan menggunakan try/catch. Jika storage rusak, nilai default digunakan dan disimpan kembali disertai peringatan. Jika storage penuh/tidak tersedia, UI memperingatkan bahwa perubahan belum tersimpan.
3. `useUndoDelete` menyimpan seluruh objek lamaran beserta indeks asal sebelum menghapusnya memakai `filter`.
4. `timerRef` menyimpan ID `setTimeout`. Hapus berikutnya menjalankan `clearTimeout` sebelum memulai timer baru 5.000 ms.
5. Undo membersihkan timer dan mengembalikan snapshot utuh di posisi sebelumnya dengan spread/slice. Checklist dan log ikut kembali.
6. Dua penghapusan beruntun berarti **hanya penghapusan terakhir** yang dapat di-Undo; penghapusan sebelumnya tetap berlaku.
7. Cleanup unmount membersihkan timer. Toast tidak dipersistenkan; refresh saat menunggu Undo mempertahankan hasil penghapusan yang sudah disimpan.
8. Selama toast aktif, pasangan perusahaan/posisi yang dihapus tetap dipesan sementara agar tidak konflik dengan penambahan ulang.

### Langkah demo

1. Buat atau simpan dua lamaran.
2. Hapus satu, klik Undo sebelum 5 detik: data kembali.
3. Hapus A, tunggu sekitar 4 detik, lalu hapus B.
4. Tunggu 1–2 detik: toast B masih tersedia karena timer A dibersihkan.
5. Klik Undo: hanya B kembali.
6. Hapus lagi dan tunggu lewat 5 detik: toast hilang dan lamaran tetap terhapus.
7. Tambah skill/lamaran lalu tekan F5: semua data tersimpan masih ada.

## 6. Fitur 7 — Dashboard dan Offer Comparator

### Statistik

Soal tidak menetapkan denominator Response Rate/Interview Rate. Definisi berikut ditampilkan melalui **Cara menghitung statistik** di dashboard:

| Kartu          | Rumus                                                                     |
| -------------- | ------------------------------------------------------------------------- |
| Total Lamaran  | Seluruh lamaran, termasuk WISHLIST                                        |
| Response Rate  | (SCREENING + INTERVIEW + OFFER + REJECTED) ÷ semua selain WISHLIST × 100% |
| Interview Rate | (INTERVIEW + OFFER) ÷ semua selain WISHLIST × 100%                        |
| Rawan Ghosting | APPLIED/SCREENING dengan lastUpdatedAt lebih dari 14 hari yang lalu       |
| Total Offer    | Jumlah status OFFER                                                       |

Persentase dibulatkan ke bilangan bulat; denominator 0 menghasilkan 0%. GHOSTED tidak termasuk numerator respons/interview. Statistik memakai status saat ini, bukan riwayat funnel kumulatif. Semuanya derived state yang dihitung saat render, bukan disimpan dalam useState.

### Comparator

1. Filter applications menjadi status OFFER. Kurang dari dua offer menampilkan empty state yang jelas.
2. Pengguna memilih Offer A dan Offer B. Offer pada sisi lain dinonaktifkan agar tidak membandingkan objek yang sama.
3. Normalisasi gaji terhadap gaji tertinggi **dari dua offer terpilih**.
4. Skor mode: Remote 100, Hybrid 75, Onsite 50.
5. Hitung rumus:

   ```text
   normalisasiGaji = gaji / maksimum(gajiA, gajiB) × 100
   total = normalisasiGaji × 0,50 + skorMode × 0,25 + skillMatch × 0,25
   ```

6. Perbandingan memakai presisi penuh; tampilan skor memakai dua desimal. Skor tertinggi mendapat **Rekomendasi Terbaik**. Jika seri, keduanya mendapat badge dengan keterangan seri.
7. Jika offer terpilih dihapus, komponen memilih offer valid yang tersisa. Jika kurang dari dua, kembali ke empty state.

### Menguji OFFER sebelum Fitur 4 terintegrasi

Form manual tidak boleh langsung membuat OFFER. Fixture disediakan untuk uji developer tanpa menambah jalur UI yang melompati state machine.

1. Jalankan aplikasi dan buka DevTools → Console pada halaman aplikasi.
2. Jalankan kode berikut. Data awal dibackup sekali; fixture ditambahkan tanpa duplikat perusahaan/posisi:

   ```js
   const rawBeforeDemo = localStorage.getItem("applications") ?? "[]";
   if (localStorage.getItem("applications.beforeDemo") === null) {
     localStorage.setItem("applications.beforeDemo", rawBeforeDemo);
   }
   const existingDemoApps = JSON.parse(rawBeforeDemo);
   const demoResponse = await fetch("/demo-applications.json");
   const demoApps = await demoResponse.json();
   const demoKey = (app) =>
     JSON.stringify([
       app.company.trim().toLowerCase(),
       app.role.trim().toLowerCase(),
     ]);
   const knownDemoKeys = new Set(existingDemoApps.map(demoKey));
   const additions = demoApps.filter((app) => !knownDemoKeys.has(demoKey(app)));
   localStorage.setItem(
     "applications",
     JSON.stringify([...existingDemoApps, ...additions]),
   );
   location.reload();
   ```

3. Buka Offer Comparator. Pilih Demo Nusantara dan Demo Ruang Digital. Dengan skill React, TypeScript, CSS, hasilnya:

   | Offer              | Gaji        | Mode   | Match | Skor  |
   | ------------------ | ----------- | ------ | ----- | ----- |
   | Demo Nusantara     | Rp5.000.000 | Remote | 100%  | 91,67 |
   | Demo Ruang Digital | Rp6.000.000 | Hybrid | 75%   | 87,50 |

4. Demo Nusantara direkomendasikan. Tambahkan Docker pada profil lalu kembali ke comparator: skor Demo Ruang Digital naik.
5. Pada Lamaran saya, hapus salah satu data demo lalu Undo. Progress checklist tetap 1/2 dan jumlah aktivitas tetap 1. Tes otomatis juga membandingkan seluruh objek sebelum/sesudah Undo.
6. Untuk kembali ke snapshot awal, gunakan kode berikut. Perubahan lain yang dibuat setelah backup ikut digantikan oleh snapshot:

   ```js
   const savedBeforeDemo = localStorage.getItem("applications.beforeDemo");
   if (savedBeforeDemo !== null) {
     localStorage.setItem("applications", savedBeforeDemo);
     localStorage.removeItem("applications.beforeDemo");
     location.reload();
   }
   ```

## 7. Integrasi dengan Fitur 3–5

- Pertahankan satu state applications di App. Komponen pipeline/detail menerima data dan callback melalui props.
- Impor tipe Application dari src/types. Gunakan `setApplications(current => current.map(...))` untuk pembaruan immutable.
- Fitur 4 harus memvalidasi transisi dan syarat field sebelum update. OFFER wajib memiliki salaryOffer >0 dan workMode valid.
- Update lastUpdatedAt dan activityLogs sesuai aturan transisi. Checklist diperbarui sebagai array/object baru.
- Dashboard dan comparator langsung mengikuti state applications terbaru; tidak perlu efek sinkronisasi statistik.
- Fixture hanya untuk uji developer, bukan pengganti state machine di UI.

## 8. Memeriksa proyek dan build

Jalankan dari folder proyek:

```powershell
npx.cmd tsc --noEmit
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

- `tsc --noEmit` memeriksa kode aplikasi melalui konfigurasi root.
- `typecheck` memeriksa aplikasi, konfigurasi tool, dan kode tes.
- `lint` menjalankan ESLint, termasuk aturan hooks dan larangan explicit any.
- `test` menguji rumus, anti-duplikat, debounce, persistensi, dan timer Undo.
- `test:e2e` menjalankan Vite dan Chrome terpasang (`channel: chrome`). Pastikan port 5173 tersedia atau menjalankan proyek yang sama.
- `build` memeriksa tipe dan menghasilkan folder dist.

Tes browser memakai API terkontrol supaya hasil tidak tergantung Remotive. Keberhasilan tes tidak menjamin layanan pihak ketiga selalu tersedia; UI tetap menyediakan error/retry/fallback.

Untuk mencoba hasil build:

```powershell
npm.cmd run preview
```

Buka URL terminal. Origin preview berbeda dari dev sehingga data localStorage-nya juga terpisah.

## 9. Git dan pengumpulan

Implementasi ini disimpan lokal; belum di-commit atau di-push. Setelah ditinjau dan sesuai alur kelompok, langkah yang dapat dijalankan:

```powershell
git status
git diff
git add .
git commit -m "Implement features 1 2 6 7 for internship tracker"
git push origin main
```

Jika kelompok memakai branch/pull request, ikuti alur tersebut. Dependency, dist, dan hasil tes browser sudah dikecualikan dari Git.

## 10. Poin penting untuk demo dan live coding

- useState menyimpan input, tab, pilihan offer, serta state interaksi.
- useEffect menangani fetch, penyimpanan, timer debounce, dan cleanup.
- useRef mempertahankan DOM input untuk focus dan ID timer Undo tanpa memicu render.
- Custom hooks membungkus logika yang dapat digunakan ulang.
- Match, daftar terfilter, statistik, dan skor offer adalah derived state dari sumber data terbaru.
- Spread/map/filter/slice menghasilkan pembaruan immutable.
- TypeScript membantu pemeriksaan saat pengembangan. JSON API/localStorage tetap perlu validasi runtime.
- StrictMode dipertahankan agar masalah cleanup lebih mudah terlihat.

Referensi resmi: [Vite Getting Started](https://vite.dev/guide/) untuk template/penggunaan Vite, dan [React useEffect](https://react.dev/reference/react/useEffect) untuk lifecycle serta cleanup efek.
