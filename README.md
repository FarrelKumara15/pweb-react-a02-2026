# Panduan Fitur 1, 2, 6, dan 7 — Aku Mw Magang

## 1. Menjalankan proyek

1. Cek Node dan npm. Proyek diuji dengan Node 24.12.0; gunakan Node 24 LTS agar sesuai lingkungan pengujian.

   ```powershell
   node --version
   npm.cmd --version
   ```

2. Instal dependency sesuai lockfile saat pertama kali atau setelah lockfile berubah:

   ```powershell
   npm.cmd ci
   ```

3. Jalankan development server:

   ```powershell
   npm.cmd run dev
   ```

4. Buka URL terminal, biasanya `http://localhost:5173`. Jika port terpakai, Vite memilih port berikutnya.
5. Hentikan server dengan `Ctrl+C`.

`npm.cmd` menghindari kendala execution policy PowerShell pada `npm.ps1`. LocalStorage terpisah per origin: `localhost`, `127.0.0.1`, serta port berbeda tidak berbagi data.
