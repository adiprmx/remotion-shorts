import React from 'react';
import {
  AbsoluteFill,
  Audio,
  Easing,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';
import {loadFont as loadMarker} from '@remotion/google-fonts/PermanentMarker';
import {loadFont as loadCaveat} from '@remotion/google-fonts/Caveat';
import {loadFont as loadBungee} from '@remotion/google-fonts/Bungee';

const {fontFamily: MARKER} = loadMarker('normal', {
  subsets: ['latin'],
  weights: ['400'],
});
const {fontFamily: CAVEAT} = loadCaveat('normal', {
  subsets: ['latin'],
  weights: ['700'],
});
const {fontFamily: BUNGEE} = loadBungee('normal', {
  subsets: ['latin'],
  weights: ['400'],
});

export type Caption = {
  start: number;
  end: number;
  kicker?: string;
  scene?: string;
  text: string;
};

export type VerticalProps = {
  title: string;
  titleHighlight: string;
  handle: string;
  accent: string;
  captions: Caption[];
};

// v30 NYAMAR — kebalikan v29 arcade: HUMAN HANDHELD.
// Kamera goyang halus kayak dipegang tangan (sinus frekuensi irasional, tak
// berulang), teks tulisan tangan (Permanent Marker + coretan Caveat), transisi
// tak seragam (wipe kiri/kanan bergantian), partikel debu & telur melayang,
// HUD STEALTH METER naratif (bukan score/combo), SFX hemat & pelan.
// Background: 16 segmen art resmi Steal An Egg (2 per caption, urutan nyamar).

const SEG_FILES = [
  's00_hook_egg.mp4',
  's01_hook_egg2.mp4',
  's03_langka_icon.mp4',
  's04_yeti.mp4',
  's02_langka_egg.mp4',
  's13_jackpot_egg.mp4',
  's10_wtf_yeti.mp4',
  's11_wtf_run.mp4',
  's08_panik_dragon.mp4',
  's09_panik_dragon2.mp4',
  's06_run.mp4',
  's07_run2.mp4',
  's12_jackpot.mp4',
  's13_jackpot_egg.mp4',
  's14_follow_icon.mp4',
  's15_follow_egg.mp4',
];

const GOLD = '#FFD23F';
const RED = '#FF4757';
const GREEN = '#3DFF88';
const INK = '#141414';

// stealth meter per caption (persen) — turun saat ketahuan, pulih di akhir
const STEALTH = [100, 92, 96, 78, 18, 38, 100, 100];
// coretan tangan per caption (null = tanpa coretan)
const SCRIBBLE: {text: string; color: string; rot: number}[] = [
  {text: 'ssst...', color: '#ffd6e8', rot: -9},
  {text: 'pelan-pelan...', color: '#ffffff', rot: 5},
  {text: 'itu dia!', color: GOLD, rot: -6},
  {text: 'angkut!', color: GREEN, rot: 7},
  {text: 'eh?!', color: RED, rot: -11},
  {text: 'CEPET!', color: GOLD, rot: 6},
  {text: 'JACKPOT!', color: GOLD, rot: -5},
  {text: 'gas follow!', color: '#ffffff', rot: 8},
];
// pola masuk teks per caption: 0 slide, 1 pop, 2 ketik
const ENTER = [0, 1, 2, 1, 0, 2, 1, 0];

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// kamera handheld: goyangan tangan manusia (tak berulang, tak mekanis)
function handheld(frame: number, seed: number) {
  const x =
    13 * Math.sin(frame * 0.11 + seed * 1.7) +
    7 * Math.sin(frame * 0.031 + seed * 2.3) +
    4 * Math.sin(frame * 0.53 + seed);
  const y =
    10 * Math.sin(frame * 0.083 + seed * 1.3) +
    6 * Math.sin(frame * 0.047 + seed * 2.9) +
    3 * Math.sin(frame * 0.41 + seed * 0.7);
  const rot = 0.9 * Math.sin(frame * 0.05 + seed) + 0.4 * Math.sin(frame * 0.13 + seed * 1.9);
  return {x, y, rot};
}

/* ---------- partikel debu (udara hidup, sepanjang video) ---------- */

function Dust({frame}: {frame: number}) {
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: 18}).map((_, i) => {
        const speed = 0.5 + hash(i * 3 + 1) * 0.9;
        const y = 1950 - ((hash(i * 7 + 2) * 1900 + frame * speed) % 2000);
        const x = 60 + hash(i * 11 + 3) * 940 + 22 * Math.sin(frame * 0.02 + i);
        const size = 4 + hash(i * 5 + 4) * 7;
        const tw = 0.35 + 0.3 * Math.sin(frame * 0.08 + i * 2.1);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: '50%',
              background: '#ffffff',
              opacity: Math.max(0.05, tw),
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- telur melayang (lintasan melengkung, cap 0 & 6) ---------- */

function FloatingEggs({frame, startF, endF}: {frame: number; startF: number; endF: number}) {
  if (frame < startF || frame >= endF) {
    return null;
  }
  const local = frame - startF;
  const dur = endF - startF;
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {[0, 1, 2].map((k) => {
        const delay = k * 22;
        const t = Math.max(0, local - delay) / dur;
        if (local < delay || t > 1) {
          return null;
        }
        const x = 130 + k * 360 + 70 * Math.sin(t * Math.PI * 2 + k);
        const y = 1750 - t * 1250;
        const rot = -18 + t * 42 + 8 * Math.sin(t * 9 + k);
        const s = 74 + k * 18;
        return (
          <div
            key={k}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: s,
              height: s * 1.25,
              borderRadius: '50% 50% 50% 50% / 58% 58% 42% 42%',
              background:
                k === 1
                  ? 'radial-gradient(circle at 35% 30%, #c9f7ff, #2ED3FF 60%, #0e7fb8)'
                  : 'radial-gradient(circle at 35% 30%, #fff3c4, #FFD23F 60%, #e0a800)',
              border: `3px solid ${INK}`,
              transform: `rotate(${rot}deg)`,
              opacity: 0.95,
              boxShadow: '4px 6px 0 rgba(0,0,0,0.35)',
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- teks tulisan tangan ---------- */

function HandText({
  cap,
  index,
  frame,
  fps,
}: {
  cap: Caption;
  index: number;
  frame: number;
  fps: number;
}) {
  const startF = cap.start * fps;
  const endF = cap.end * fps;
  if (frame < startF || frame >= endF) {
    return null;
  }
  const local = frame - startF;
  const outP = interpolate(frame, [endF - 8, endF], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (outP <= 0) {
    return null;
  }
  const words = cap.text.split(' ');
  const fontSize = words.length <= 3 ? 132 : words.length === 4 ? 116 : 98;
  const mode = ENTER[index] ?? 0;
  const scrib = SCRIBBLE[index];

  const renderWord = (w: string, j: number) => {
    const ws = 4 + j * (mode === 2 ? 6 : 9);
    const p = interpolate(local - ws, [0, 10], [0, 1], {
      easing: mode === 1 ? Easing.out(Easing.back(1.4)) : Easing.out(Easing.cubic),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    if (p <= 0) {
      return (
        <span key={j} style={{display: 'inline-block', opacity: 0, marginRight: 22}}>
          {w}
        </span>
      );
    }
    // rotasi & ukuran per kata TIDAK seragam (tangan manusia tak presisi)
    const rot = (hash(index * 31 + j * 7) - 0.5) * 6;
    const sizeMul = 0.94 + hash(index * 17 + j * 3) * 0.12;
    const isLast = j === words.length - 1;
    return (
      <span
        key={j}
        style={{
          display: 'inline-block',
          opacity: p * outP,
          transform: `rotate(${rot}deg) scale(${interpolate(p, [0, 1], [mode === 1 ? 0.4 : 0.85, 1])}) translateY(${interpolate(p, [0, 1], [mode === 0 ? 54 : 22, 0])}px)`,
          color: isLast ? GOLD : '#ffffff',
          WebkitTextStroke: `2px ${INK}`,
          textShadow: `4px 4px 0 ${INK}`,
          marginRight: 22,
          fontSize: fontSize * sizeMul,
        }}
      >
        {w}
      </span>
    );
  };

  // mode ketik: tampilkan karakter bertahap (bukan kata utuh)
  const typeBody = () => {
    const full = cap.text;
    const shown = Math.max(0, Math.floor((local - 4) / 2.2));
    return (
      <span>
        {full.split('').map((ch, k) => (
          <span
            key={k}
            style={{
              opacity: k < shown ? outP : 0,
              color: k === full.length - 1 ? GOLD : '#ffffff',
            }}
          >
            {ch === ' ' ? '\u00A0' : ch}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div
      style={{
        position: 'relative',
        textAlign: 'center',
        padding: '0 46px',
        opacity: outP,
      }}
    >
      {cap.kicker ? (
        <div
          style={{
            display: 'inline-block',
            fontFamily: BUNGEE,
            fontSize: 28,
            letterSpacing: 2,
            color: '#141414',
            background: '#ffffff',
            border: `3px solid ${INK}`,
            boxShadow: `4px 4px 0 ${INK}`,
            padding: '8px 20px 5px',
            marginBottom: 26,
            transform: `rotate(${(hash(index * 13) - 0.5) * 4}deg)`,
          }}
        >
          {cap.kicker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: MARKER,
          fontSize,
          lineHeight: 1.18,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {mode === 2 ? typeBody() : words.map(renderWord)}
      </div>
      {scrib ? (
        <div
          style={{
            fontFamily: CAVEAT,
            fontSize: 64,
            color: scrib.color,
            transform: `rotate(${scrib.rot}deg)`,
            textShadow: '3px 3px 0 rgba(0,0,0,0.6)',
            marginTop: 18,
            opacity: interpolate(local, [14, 26], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }),
          }}
        >
          {scrib.text}
        </div>
      ) : null}
    </div>
  );
}

/* ---------- HUD: stealth meter naratif ---------- */

function StealthHud({
  frame,
  fps,
  captions,
}: {
  frame: number;
  fps: number;
  captions: Caption[];
}) {
  let idx = 0;
  for (let i = 0; i < captions.length; i++) {
    if (frame >= captions[i].start * fps) {
      idx = i;
    }
  }
  const cap = captions[idx];
  const prev = idx === 0 ? 100 : STEALTH[idx - 1];
  const target = STEALTH[idx] ?? prev;
  const local = interpolate(frame, [cap.start * fps, cap.end * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const val = prev + (target - prev) * (1 - Math.pow(1 - local, 2));
  const danger = val < 40;
  const blink = danger && Math.floor(frame / 12) % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        top: 56,
        left: 40,
        right: 40,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            fontFamily: BUNGEE,
            fontSize: 30,
            color: '#ffffff',
            WebkitTextStroke: `1.5px ${INK}`,
            textShadow: '3px 3px 0 rgba(0,0,0,0.55)',
            letterSpacing: 1,
          }}
        >
          {danger ? '!! KETAUAN !!' : 'STEALTH'}
        </span>
        <span
          style={{
            fontFamily: BUNGEE,
            fontSize: 34,
            color: danger ? RED : '#ffffff',
            WebkitTextStroke: `1.5px ${INK}`,
            textShadow: '3px 3px 0 rgba(0,0,0,0.55)',
            opacity: blink ? 0.35 : 1,
          }}
        >
          {Math.round(val)}%
        </span>
      </div>
      <div
        style={{
          height: 26,
          background: 'rgba(20,20,20,0.72)',
          border: `3px solid ${INK}`,
          borderRadius: 99,
          overflow: 'hidden',
          boxShadow: '3px 3px 0 rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.max(0, Math.min(100, val))}%`,
            background: danger
              ? 'repeating-linear-gradient(45deg, #FF4757 0 18px, #d63047 18px 36px)'
              : 'linear-gradient(90deg, #3DFF88, #FFD23F)',
            borderRadius: 99,
          }}
        />
      </div>
      {/* dots misi */}
      <div style={{display: 'flex', gap: 10, marginTop: 14}}>
        {captions.map((_, i) => (
          <div
            key={i}
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: i <= idx ? GOLD : 'rgba(255,255,255,0.35)',
              border: `2px solid ${INK}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- main ---------- */

export const Vertical: React.FC<VerticalProps> = ({accent, captions, handle}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const duckAmount = (() => {
    const fade = 12;
    let d = 0;
    for (const cap of captions) {
      const s = cap.start * fps;
      const e = cap.end * fps;
      if (frame >= s - fade && frame <= e + fade) {
        const dIn = Math.min(1, (frame - (s - fade)) / fade);
        const dOut = Math.min(1, (e + fade - frame) / fade);
        d = Math.max(d, Math.min(dIn, dOut));
      }
    }
    return d;
  })();
  const musicVol = interpolate(duckAmount, [0, 1], [0.12, 0.045]);

  // segmen aktif: 2 per caption, split di tengah caption
  const segs: {capIdx: number; segIdx: number; from: number; to: number}[] = [];
  captions.forEach((cap, ci) => {
    const mid = (cap.start + cap.end) / 2;
    segs.push({capIdx: ci, segIdx: ci * 2, from: cap.start, to: mid});
    segs.push({capIdx: ci, segIdx: ci * 2 + 1, from: mid, to: cap.end});
  });

  const activeCapIdx = (() => {
    let idx = 0;
    captions.forEach((cap, i) => {
      if (frame >= cap.start * fps) {
        idx = i;
      }
    });
    return idx;
  })();

  return (
    <AbsoluteFill style={{background: '#10131a', color: '#ffffff', overflow: 'hidden'}}>
      {/* background: art resmi + kamera handheld organik */}
      {segs.map((seg) => {
        const fromF = seg.from * fps;
        const toF = seg.to * fps;
        if (frame < fromF || frame >= toF) {
          return null;
        }
        const t = interpolate(frame, [fromF, toF], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const h = handheld(frame, seg.segIdx * 3 + 1);
        const zoom = 1.16 + t * 0.05 + 0.02 * Math.sin(frame * 0.03 + seg.segIdx);
        // segmen kedua tiap caption masuk pakai wipe (arah bergantian)
        const isSecond = seg.segIdx % 2 === 1;
        const wipeDir = seg.capIdx % 2 === 0 ? -1 : 1;
        const wipe = isSecond
          ? interpolate(frame - fromF, [0, 9], [wipeDir * 1080, 0], {
              easing: Easing.out(Easing.cubic),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })
          : 0;
        return (
          <div
            key={`bg${seg.segIdx}`}
            style={{
              position: 'absolute',
              inset: -80,
              overflow: 'hidden',
              transform: `translateX(${wipe}px)`,
            }}
          >
            <Video
              src={staticFile(`bg/v27/${SEG_FILES[seg.segIdx]}`)}
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${zoom}) translate(${h.x}px, ${h.y}px) rotate(${h.rot}deg)`,
                filter: 'saturate(1.18) contrast(1.04) brightness(1.02)',
              }}
            />
          </div>
        );
      })}

      {/* gradasi bawah tipis buat keterbacaan teks */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 820,
          background: 'linear-gradient(to top, rgba(5,8,14,0.55), transparent)',
          pointerEvents: 'none',
        }}
      />

      <Dust frame={frame} />

      {/* telur melayang di cap 0 & 6 */}
      {(activeCapIdx === 0 || activeCapIdx === 6) && (
        <FloatingEggs
          frame={frame}
          startF={captions[activeCapIdx].start * fps}
          endF={captions[activeCapIdx].end * fps}
        />
      )}

      {/* audio: voice */}
      {captions.map((cap, i) => (
        <Sequence key={`v${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile(`audio/voice-${i}.mp3`)} />
        </Sequence>
      ))}

      {/* musik: tempo sedikit beda dari v29, volume pelan */}
      <Audio src={staticFile('audio/music30.mp3')} volume={musicVol} loop />

      {/* SFX hemat: pop tiap awal caption, coin di jackpot, alarm di ketahuan */}
      {captions.map((cap, i) => (
        <Sequence key={`sfx${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile('audio/sfx/notify-pop.mp3')} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={Math.round(captions[6].start * fps)}>
        <Audio src={staticFile('audio/sfx/coin.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(captions[4].start * fps)}>
        <Audio src={staticFile('audio/sfx/alarm.mp3')} volume={0.4} />
      </Sequence>

      {/* teks per caption (guard frame < start di dalam HandText) */}
      {captions.map((cap, i) => (
        <div
          key={`t${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 210,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <HandText cap={cap} index={i} frame={frame} fps={fps} />
        </div>
      ))}

      <StealthHud frame={frame} fps={fps} captions={captions} />

      {/* handle + progress tipis */}
      <div
        style={{
          position: 'absolute',
          bottom: 52,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <div
          style={{
            fontFamily: BUNGEE,
            fontSize: 30,
            color: '#ffffff',
            WebkitTextStroke: `1.5px ${INK}`,
            textShadow: '3px 3px 0 rgba(0,0,0,0.55)',
            letterSpacing: 1,
          }}
        >
          {handle}
        </div>
        <div
          style={{
            width: 640,
            height: 8,
            background: 'rgba(255,255,255,0.28)',
            borderRadius: 99,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(frame / durationInFrames) * 100}%`,
              background: accent,
              borderRadius: 99,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
