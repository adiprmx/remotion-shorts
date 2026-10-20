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
import {loadFont as loadLuckiest} from '@remotion/google-fonts/LuckiestGuy';
import {loadFont as loadBungee} from '@remotion/google-fonts/Bungee';

const {fontFamily: LUCKIEST} = loadLuckiest('normal', {
  subsets: ['latin'],
  weights: ['400'],
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

// v29 ARCADE HEIST — kebalikan v28 sinematik: TERANG, RAME, SERU kayak game.
// HUD score/combo, teks komik bounce, burst onomatopoeia, boss bar, coin rain.
// Background tetap 16 segmen art resmi Steal An Egg (konsisten naskah).

const SEG_FILES = [
  's00_hook_egg.mp4',
  's01_hook_egg2.mp4',
  's02_langka_egg.mp4',
  's03_langka_icon.mp4',
  's04_yeti.mp4',
  's05_yeti2.mp4',
  's06_run.mp4',
  's07_run2.mp4',
  's08_panik_dragon.mp4',
  's09_panik_dragon2.mp4',
  's10_wtf_yeti.mp4',
  's11_wtf_run.mp4',
  's12_jackpot.mp4',
  's13_jackpot_egg.mp4',
  's14_follow_icon.mp4',
  's15_follow_egg.mp4',
];

const GOLD = '#FFD23F';
const RED = '#FF4757';
const CYAN = '#2ED3FF';
const GREEN = '#3DFF88';
const PURPLE = '#B388FF';
const INK = '#141414';

// kata "power" per caption (index kata) + warnanya
const POWER: {idx: number; color: string}[] = [
  {idx: 3, color: GOLD},
  {idx: 3, color: PURPLE},
  {idx: 2, color: RED},
  {idx: 0, color: RED},
  {idx: 2, color: RED},
  {idx: 1, color: CYAN},
  {idx: 2, color: GOLD},
  {idx: 4, color: GREEN},
];

// rotasi blok teks per caption (derajat)
const TILTS = [-2.5, 2, -1.5, 2.5, -2, 1.5, -2, 2];

// target uang (score) di akhir tiap caption
const MONEY = [150, 600, 900, 2400, 3900, 5400, 1000000, 1000000];

// hash deterministik (render harus stabil antar frame)
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

const fmtMoney = (v: number) =>
  Math.max(0, Math.round(v))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');

/* ---------- burst komik (bintang SVG + teks) ---------- */

function Burst({
  text,
  color,
  size,
  frame,
  startF,
  style,
}: {
  text: string;
  color: string;
  size: number;
  frame: number;
  startF: number;
  style?: React.CSSProperties;
}) {
  const p = interpolate(frame - startF, [0, 7], [0, 1], {
    easing: Easing.out(Easing.back(2.2)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const out = interpolate(frame - startF, [26, 34], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const o = Math.min(p, out);
  if (o <= 0) {
    return null;
  }
  const pts: string[] = [];
  const spikes = 12;
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? 100 : 62;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${100 + r * Math.cos(a)},${100 + r * Math.sin(a)}`);
  }
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        transform: `scale(${p}) rotate(${interpolate(p, [0, 1], [-24, 8])}deg)`,
        opacity: o,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <svg viewBox="0 0 200 200" width={size} height={size}>
        <polygon
          points={pts.join(' ')}
          fill={color}
          stroke={INK}
          strokeWidth={5}
          strokeLinejoin="round"
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: LUCKIEST,
          fontSize: size * 0.21,
          color: '#ffffff',
          WebkitTextStroke: `2px ${INK}`,
          textShadow: `3px 3px 0 ${INK}`,
          transform: 'rotate(-6deg)',
        }}
      >
        {text}
      </div>
    </div>
  );
}

/* ---------- speed lines (lari / dikejar) ---------- */

function SpeedLines({frame, local}: {frame: number; local: number}) {
  const fade = interpolate(local, [0, 8], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div style={{position: 'absolute', inset: 0, opacity: 0.32 * fade, pointerEvents: 'none'}}>
      {Array.from({length: 14}).map((_, i) => {
        const y = hash(i * 3 + 1) * 1750 + 60;
        const w = 130 + hash(i * 7 + 2) * 240;
        const speed = 34 + hash(i * 5 + 3) * 26;
        const x = 1150 - ((hash(i * 11 + 4) * 1700 + frame * speed) % 1750);
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: y,
              left: x,
              width: w,
              height: 5 + hash(i * 13) * 4,
              background: '#ffffff',
              borderRadius: 99,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- hujan koin (jackpot) ---------- */

function CoinRain({frame, startF}: {frame: number; startF: number}) {
  const local = frame - startF;
  if (local < 0) {
    return null;
  }
  return (
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none'}}>
      {Array.from({length: 24}).map((_, i) => {
        const x = 40 + hash(i * 3 + 21) * 980;
        const size = 26 + hash(i * 7 + 22) * 24;
        const delay = hash(i * 11 + 23) * 30;
        const dur = 62 + hash(i * 13 + 24) * 55;
        const t = (local - delay) % dur;
        if (local < delay) {
          return null;
        }
        const y = -70 + (t / dur) * 2050;
        const rot = (t * (2 + hash(i * 17) * 3)) % 360;
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
              background: 'radial-gradient(circle at 35% 32%, #ffe98a, #FFD23F 55%, #e0a800)',
              border: '3px solid #8a5a00',
              transform: `rotate(${rot}deg)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#8a5a00',
              fontFamily: BUNGEE,
              fontSize: size * 0.5,
            }}
          >
            {size > 36 ? '★' : ''}
          </div>
        );
      })}
    </div>
  );
}

/* ---------- teks utama gaya komik ---------- */

function ComicText({
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
  const words = cap.text.split(' ');
  const startF = cap.start * fps;
  const endF = cap.end * fps;
  const outP = interpolate(frame, [endF - 6, endF], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (outP <= 0) {
    return null;
  }
  const power = POWER[index] ?? {idx: words.length - 1, color: GOLD};
  const fontSize = words.length <= 3 ? 148 : words.length === 4 ? 126 : 108;
  const chipP = interpolate(frame - startF, [0, 9], [0, 1], {
    easing: Easing.out(Easing.back(1.8)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  // shake kecil khusus cap 5 (WTF) di 10 frame pertama
  const shake =
    index === 5 && frame - startF < 12
      ? `translateX(${Math.sin(frame * 2.4) * 9}px) translateY(${Math.cos(frame * 3.1) * 6}px)`
      : '';
  return (
    <div
      style={{
        position: 'relative',
        textAlign: 'center',
        padding: '0 48px',
        opacity: outP,
        transform: `rotate(${TILTS[index] ?? 0}deg) ${shake}`,
      }}
    >
      {cap.kicker ? (
        <div
          style={{
            display: 'inline-block',
            fontFamily: BUNGEE,
            fontSize: 30,
            letterSpacing: 2,
            color: '#ffffff',
            background: '#ff6a3d',
            border: `3px solid ${INK}`,
            boxShadow: `5px 5px 0 ${INK}`,
            padding: '8px 20px 5px',
            marginBottom: 30,
            opacity: chipP,
            transform: `translateY(${interpolate(chipP, [0, 1], [-26, 0])}px)`,
          }}
        >
          STAGE {index + 1} • {cap.kicker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: LUCKIEST,
          fontSize,
          lineHeight: 1.06,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {words.map((w, j) => {
          const ws = startF + 4 + j * 3;
          const p = interpolate(frame - ws, [0, 10], [0, 1], {
            easing: Easing.out(Easing.back(2)),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (p <= 0) {
            return (
              <span key={j} style={{display: 'inline-block', opacity: 0, marginRight: 24}}>
                {w}
              </span>
            );
          }
          const isPower = j === power.idx;
          return (
            <span
              key={j}
              style={{
                display: 'inline-block',
                opacity: p,
                transform: `scale(${interpolate(p, [0, 1], [0.3, isPower ? 1.14 : 1])}) translateY(${interpolate(p, [0, 1], [64, 0])}px)`,
                color: isPower ? power.color : '#ffffff',
                WebkitTextStroke: `3px ${INK}`,
                textShadow: `6px 6px 0 ${INK}`,
                marginRight: 24,
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- banner peringatan boss (cap 2) ---------- */

function WarningBanner({frame, startF}: {frame: number; startF: number}) {
  const local = frame - startF;
  if (local < 0 || local > 66) {
    return null;
  }
  const blink = local % 16 < 9 ? 1 : 0.2;
  const slide = interpolate(local, [0, 8], [-90, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 168,
        left: 0,
        right: 0,
        height: 68,
        transform: `translateY(${slide}px)`,
        background:
          'repeating-linear-gradient(45deg, #FFD23F 0 26px, #141414 26px 52px)',
        borderTop: `4px solid ${INK}`,
        borderBottom: `4px solid ${INK}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          fontFamily: BUNGEE,
          fontSize: 34,
          color: GOLD,
          background: INK,
          padding: '7px 26px 4px',
          opacity: blink,
          letterSpacing: 2,
        }}
      >
        !! BOSS ALERT !!
      </div>
    </div>
  );
}

/* ---------- boss bar naga (cap 4) ---------- */

function BossBar({frame, startF}: {frame: number; startF: number}) {
  const p = interpolate(frame - startF, [2, 12], [0, 1], {
    easing: Easing.out(Easing.back(1.6)),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (p <= 0) {
    return null;
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: -168,
        left: '50%',
        transform: `translateX(-50%) scale(${p})`,
        width: 600,
        opacity: p,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontFamily: BUNGEE,
          fontSize: 27,
          color: '#ffffff',
          WebkitTextStroke: `1.5px ${INK}`,
          textShadow: `3px 3px 0 ${INK}`,
          marginBottom: 8,
        }}
      >
        <span>NAGA COSMIC</span>
        <span style={{color: RED}}>LV.99</span>
      </div>
      <div
        style={{
          height: 34,
          background: '#2b2b2b',
          border: `4px solid ${INK}`,
          boxShadow: `5px 5px 0 rgba(0,0,0,0.55)`,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: '94%',
            background:
              'repeating-linear-gradient(45deg, #FF4757 0 22px, #d63047 22px 44px)',
            backgroundPosition: `${frame * 2}px 0`,
          }}
        />
      </div>
    </div>
  );
}

/* ---------- HUD: score + combo ---------- */

function Hud({
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
  const prev = idx === 0 ? 0 : MONEY[idx - 1];
  const target = MONEY[idx] ?? prev;
  const local = interpolate(
    frame,
    [cap.start * fps, cap.end * fps],
    [0, 1],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );
  const eased = 1 - Math.pow(1 - local, 3);
  const money = prev + (target - prev) * eased;
  const comboPop = interpolate(frame - cap.start * fps, [0, 8], [1.65, 1], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        position: 'absolute',
        top: 58,
        left: 40,
        right: 40,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div style={{display: 'flex', alignItems: 'center', gap: 14}}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 32%, #ffe98a, #FFD23F 55%, #e0a800)',
            border: '3px solid #8a5a00',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8a5a00',
            fontSize: 26,
            boxShadow: '3px 3px 0 rgba(0,0,0,0.5)',
          }}
        >
          ★
        </div>
        <div
          style={{
            fontFamily: BUNGEE,
            fontSize: 44,
            color: '#ffffff',
            WebkitTextStroke: `2px ${INK}`,
            textShadow: `4px 4px 0 ${INK}`,
          }}
        >
          ${fmtMoney(money)}
        </div>
      </div>
      <div
        style={{
          fontFamily: BUNGEE,
          fontSize: 32,
          color: '#ffffff',
          background: RED,
          border: `3px solid ${INK}`,
          boxShadow: `5px 5px 0 ${INK}`,
          padding: '9px 18px 6px',
          transform: `scale(${comboPop}) rotate(2deg)`,
        }}
      >
        COMBO ×{idx + 1}
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
  const musicVol = interpolate(duckAmount, [0, 1], [0.15, 0.055]);

  // segmen aktif (0..15): 2 per caption, split di tengah caption
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
      {/* background: 16 segmen fast-cut, grade CERAH */}
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
        const punch = interpolate(frame - fromF, [0, 9], [1.24, 1.07], {
          easing: Easing.out(Easing.cubic),
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const even = seg.segIdx % 2 === 0;
        const cam = even
          ? `scale(${punch + t * 0.05})`
          : `scale(1.22) translateX(${seg.segIdx % 4 === 1 ? -40 + t * 80 : 40 - t * 80}px)`;
        return (
          <div key={`bg${seg.segIdx}`} style={{position: 'absolute', inset: -70, overflow: 'hidden'}}>
            <Video
              src={staticFile(`bg/v27/${SEG_FILES[seg.segIdx]}`)}
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: cam,
                filter: 'saturate(1.38) contrast(1.09) brightness(1.07)',
              }}
            />
          </div>
        );
      })}

      {/* flash putih singkat di tiap awal caption */}
      {captions.map((cap, i) => {
        if (i === 0 || frame < cap.start * fps) {
          return null;
        }
        const o = interpolate(frame - cap.start * fps, [0, 3], [0.45, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        if (o <= 0) {
          return null;
        }
        return (
          <div
            key={`fl${i}`}
            style={{position: 'absolute', inset: 0, background: '#ffffff', opacity: o}}
          />
        );
      })}

      {/* gradasi bawah tipis buat keterbacaan teks */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 760,
          background: 'linear-gradient(to top, rgba(5,8,14,0.62), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* speed lines saat kabur & dikejar */}
      {activeCapIdx === 3 || activeCapIdx === 4 ? (
        <SpeedLines frame={frame} local={frame - captions[activeCapIdx].start * fps} />
      ) : null}

      {/* hujan koin saat jackpot */}
      {activeCapIdx === 6 ? (
        <CoinRain frame={frame} startF={captions[6].start * fps} />
      ) : null}

      {/* audio: voice */}
      {captions.map((cap, i) => (
        <Sequence key={`v${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile(`audio/voice-${i}.mp3`)} />
        </Sequence>
      ))}
      {/* audio: musik upbeat */}
      <Audio src={staticFile('audio/music.mp3')} volume={musicVol} loop />
      {/* audio: SFX arcade per caption */}
      <Sequence from={0}>
        <Audio src={staticFile('audio/sfx/powerup.mp3')} volume={0.55} />
      </Sequence>
      <Sequence from={0}>
        <Audio src={staticFile('audio/sfx/impact-boom.mp3')} volume={0.5} />
      </Sequence>
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Sequence key={`wf${i}`} from={Math.round(captions[i].start * fps)}>
          <Audio src={staticFile('audio/sfx/whoosh-fast.mp3')} volume={0.16} />
        </Sequence>
      ))}
      <Sequence from={Math.round(captions[1].start * fps) + 6}>
        <Audio src={staticFile('audio/sfx/coin.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(captions[2].start * fps)}>
        <Audio src={staticFile('audio/sfx/alarm.mp3')} volume={0.55} />
      </Sequence>
      <Sequence from={Math.round(captions[2].start * fps)}>
        <Audio src={staticFile('audio/sfx/impact-deep.mp3')} volume={0.5} />
      </Sequence>
      <Sequence from={Math.round(captions[3].start * fps)}>
        <Audio src={staticFile('audio/sfx/jump.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(captions[3].start * fps) + 3}>
        <Audio src={staticFile('audio/sfx/whoosh-rocket.mp3')} volume={0.4} />
      </Sequence>
      <Sequence from={Math.round(captions[4].start * fps)}>
        <Audio src={staticFile('audio/sfx/alarm.mp3')} volume={0.45} />
      </Sequence>
      <Sequence from={Math.round(captions[4].start * fps)}>
        <Audio src={staticFile('audio/sfx/impact-deep.mp3')} volume={0.45} />
      </Sequence>
      <Sequence from={Math.round(captions[5].start * fps)}>
        <Audio src={staticFile('audio/sfx/notify-pop.mp3')} volume={0.6} />
      </Sequence>
      <Sequence from={Math.round(captions[6].start * fps)}>
        <Audio src={staticFile('audio/sfx/fanfare.mp3')} volume={0.6} />
      </Sequence>
      {[3, 16, 29].map((off, k) => (
        <Sequence key={`cn${k}`} from={Math.round(captions[6].start * fps) + off}>
          <Audio src={staticFile('audio/sfx/coin.mp3')} volume={0.6} />
        </Sequence>
      ))}
      {[34, 43, 52].map((off, k) => (
        <Sequence key={`dg${k}`} from={Math.round(captions[6].start * fps) + off}>
          <Audio src={staticFile('audio/sfx/notify-ding.mp3')} volume={0.45} />
        </Sequence>
      ))}
      <Sequence from={Math.round(captions[7].start * fps)}>
        <Audio src={staticFile('audio/sfx/powerup.mp3')} volume={0.5} />
      </Sequence>

      {/* HUD */}
      <Hud frame={frame} fps={fps} captions={captions} />

      {/* banner peringatan boss */}
      <WarningBanner frame={frame} startF={captions[2].start * fps} />

      {/* banner MISSION START (cap 0) */}
      {frame < 54
        ? (() => {
            const p = interpolate(frame, [2, 11], [0, 1], {
              easing: Easing.out(Easing.back(2)),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            const o = interpolate(frame, [44, 54], [1, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 330,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  opacity: o,
                }}
              >
                <div
                  style={{
                    fontFamily: BUNGEE,
                    fontSize: 54,
                    color: INK,
                    background: GOLD,
                    border: `5px solid ${INK}`,
                    boxShadow: `9px 9px 0 ${INK}`,
                    padding: '16px 38px 12px',
                    transform: `scale(${p}) rotate(-3deg)`,
                  }}
                >
                  ★ MISSION START ★
                </div>
              </div>
            );
          })()
        : null}

      {/* teks utama + elemen per-caption */}
      {captions.map((cap, i) => {
        const startF = cap.start * fps;
        const endF = cap.end * fps;
        if (frame < startF || frame >= endF) {
          return null;
        }
        return (
          <div
            key={`t${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 330,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <div style={{position: 'relative'}}>
              {i === 4 ? <BossBar frame={frame} startF={startF} /> : null}
              <ComicText cap={cap} index={i} frame={frame} fps={fps} />
              {i === 0 ? (
                <Burst text="BOOM!" color={RED} size={235} frame={frame} startF={startF + 8} style={{top: -215, right: -105}} />
              ) : null}
              {i === 1 ? (
                <Burst text="RARE!" color={PURPLE} size={215} frame={frame} startF={startF + 8} style={{top: -205, left: -95}} />
              ) : null}
              {i === 3 ? (
                <Burst text="WOOSH!" color={CYAN} size={225} frame={frame} startF={startF + 5} style={{top: -210, right: -100}} />
              ) : null}
              {i === 5 ? (
                <Burst text="CLOSE!!" color="#ff6a3d" size={225} frame={frame} startF={startF + 8} style={{top: -210, left: -100}} />
              ) : null}
              {i === 6 ? (
                <Burst text="JACKPOT!" color={GOLD} size={300} frame={frame} startF={startF + 10} style={{top: -300, right: -60}} />
              ) : null}
              {i === 7 ? (
                <div
                  style={{
                    position: 'absolute',
                    top: -215,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div
                    style={{
                      fontFamily: BUNGEE,
                      fontSize: 43,
                      color: INK,
                      background: GREEN,
                      border: `5px solid ${INK}`,
                      boxShadow: `8px 8px 0 ${INK}`,
                      padding: '13px 30px 10px',
                      transform: `scale(${interpolate(frame - startF, [14, 23], [0, 1], {
                        easing: Easing.out(Easing.back(2)),
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      })}) rotate(-2deg)`,
                    }}
                  >
                    ★ MISSION COMPLETE ★
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      {/* ajakan follow berkedip (cap 7) */}
      {activeCapIdx === 7
        ? (() => {
            const local = frame - captions[7].start * fps;
            const blink = local < 24 || local % 34 < 19 ? 1 : 0.15;
            return (
              <div
                style={{
                  position: 'absolute',
                  bottom: 208,
                  left: 0,
                  right: 0,
                  textAlign: 'center',
                  fontFamily: BUNGEE,
                  fontSize: 35,
                  color: GOLD,
                  WebkitTextStroke: `2px ${INK}`,
                  textShadow: `4px 4px 0 ${INK}`,
                  opacity: blink,
                }}
              >
                {'>> FOLLOW = NEXT MISSION >>'}
              </div>
            );
          })()
        : null}

      {/* tag pemain */}
      <div
        style={{
          position: 'absolute',
          left: 40,
          bottom: 42,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          fontFamily: BUNGEE,
          fontSize: 25,
        }}
      >
        <span
          style={{
            background: accent,
            color: '#ffffff',
            border: `3px solid ${INK}`,
            padding: '4px 10px 2px',
            boxShadow: `4px 4px 0 ${INK}`,
          }}
        >
          P1
        </span>
        <span style={{color: '#ffffff', WebkitTextStroke: `1.5px ${INK}`, textShadow: `3px 3px 0 ${INK}`}}>
          {handle}
        </span>
      </div>

      {/* progress bar level */}
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 13, background: 'rgba(0,0,0,0.5)'}}>
        <div
          style={{
            height: '100%',
            width: `${(frame / durationInFrames) * 100}%`,
            background: `linear-gradient(90deg, ${GOLD}, ${accent})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
