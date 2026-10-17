# remotion-shorts 🎬

Bikin video vertikal 9:16 (1080×1920, 30fps) ala TikTok/Reels/Shorts pakai Remotion — render GRATIS via GitHub Actions, full dari HP.

## Cara bikin video dari HP

1. **Edit naskah**: buka `src/content.json` → ikon pensil ✏️ → ubah `title`, `captions` (teks + detik mulai/selesai), `durationSec` → Commit.
2. **Render**: tab **Actions** → **Render video** → **Run workflow** → (opsional) ganti nama file → **Run workflow** (tombol hijau).
3. **Tunggu** ±2–5 menit sampai centang hijau ✅.
4. **Download**: buka run-nya → scroll ke **Artifacts** → download `video.mp4`. Langsung upload ke TikTok/Reels/Shorts.

## Format content.json

- `title`: teks hook besar di bagian atas
- `handle`: watermark bawah (mis. @adiprmx)
- `durationSec`: total durasi dalam detik (samakan dengan caption terakhir)
- `captions`: array berisi `{start, end, text}` — detik mulai & selesai tiap caption
- `bgFrom`, `bgTo`: warna gradient background · `accent`: warna progress bar atas

Tips: caption pendek-pendek (1 kalimat), biar enak dibaca di layar HP.

## Kenapa gratis?

Repo ini **PUBLIK** → GitHub Actions tidak memakan menit sama sekali (unlimited untuk repo publik). Jangan ubah jadi privat kecuali siap dengan batas 2.000 menit/bulan.
