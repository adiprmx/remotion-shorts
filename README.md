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

## Audio 🔊

Video otomatis punya 3 lapis suara:
- **Voiceover**: AI (gTTS, suara bahasa Indonesia) — 1 klip per caption di `public/audio/voice-*.mp3`, bunyi pas caption-nya muncul
- **Musik latar**: "Monkeys Spinning Monkeys" — Kevin MacLeod (CC BY 3.0), volume kecil di belakang
- **SFX**: bunyi "pop" tiap caption muncul

Mau ganti? Timpa aja file-nya dengan nama yang sama → commit → render ulang. Mau suara sendiri? Rekam per caption, simpan sebagai `voice-0.mp3`, `voice-1.mp3`, dst.

## Kenapa gratis?

Repo ini **PUBLIK** → GitHub Actions tidak memakan menit sama sekali (unlimited untuk repo publik). Jangan ubah jadi privat kecuali siap dengan batas 2.000 menit/bulan.
