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
import {loadFont} from '@remotion/google-fonts/Anton';

const {fontFamily: ANTON} = loadFont('normal', {
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

// v28 CINEMATIC HEIST — 8 scene lambat, SATU per caption.
// Kebalikan total dari v27: tanpa fast-cut, tanpa whip-pan, tanpa pill/card.
const SCENES: {src: string; move: 'push' | 'pull' | 'panR' | 'panL'}[] = [
  {src: 'bg/v27/s00_hook_egg.mp4', move: 'push'}, // 0 hook
  {src: 'bg/v27/s02_langka_egg.mp4', move: 'pull'}, // 1 langka
  {src: 'bg/v27/s04_yeti.mp4', move: 'push'}, // 2 bahaya
  {src: 'bg/v27/s06_run.mp4', move: 'panR'}, // 3 kabur
  {src: 'bg/v27/s08_panik_dragon.mp4', move: 'push'}, // 4 panik
  {src: 'bg/v27/s10_wtf_yeti.mp4', move: 'panL'}, // 5 wtf
  {src: 'bg/v27/s12_jackpot.mp4', move: 'push'}, // 6 jackpot
  {src: 'bg/v27/s14_follow_icon.mp4', move: 'pull'}, // 7 follow
];

/* ---------- film grain animasi ---------- */

function Grain({frame}: {frame: number}) {
  const seed = frame % 8;
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'>` +
    `<filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='${seed}'/>` +
    `<feColorMatrix type='saturate' values='0'/></filter>` +
    `<rect width='300' height='300' filter='url(%23n)' opacity='0.55'/></svg>`;
  return (
    <div
      style={{
        position: 'absolute',
        inset: -60,
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
        opacity: 0.09,
        mixBlendMode: 'overlay',
        pointerEvents: 'none',
      }}
    />
  );
}

/* ---------- judul trailer: kata-per-kata slam ---------- */

function TrailerTitle({
  cap,
  index,
  frame,
  fps,
  accent,
}: {
  cap: Caption;
  index: number;
  frame: number;
  fps: number;
  accent: string;
}) {
  const words = cap.text.split(' ');
  const startF = cap.start * fps;
  const endF = cap.end * fps;
  // keluar: fade halus di 8 frame terakhir
  const outOp = interpolate(frame, [endF - 8, endF], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (outOp <= 0) {
    return null;
  }
  const lastIdx = words.length - 1;
  return (
    <div style={{textAlign: 'center', padding: '0 56px', opacity: outOp}}>
      {cap.kicker ? (
        <div
          style={{
            fontFamily: 'system-ui, sans-serif',
            fontSize: 30,
            fontWeight: 600,
            letterSpacing: 18,
            color: 'rgba(255,255,255,0.55)',
            marginBottom: 34,
            textTransform: 'uppercase',
          }}
        >
          {cap.kicker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: ANTON,
          fontSize: words.length > 4 ? 108 : 138,
          lineHeight: 1.04,
          letterSpacing: 3,
          textTransform: 'uppercase',
        }}
      >
        {words.map((w, j) => {
          const ws = startF + j * 4; // stagger 4 frame per kata
          const p = interpolate(frame - ws, [0, 11], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          if (p <= 0) {
            return (
              <span key={j} style={{display: 'inline-block', opacity: 0, marginRight: 26}}>
                {w}
              </span>
            );
          }
          const isPower = j === lastIdx; // kata terakhir = power word
          return (
            <span
              key={j}
              style={{
                display: 'inline-block',
                opacity: p,
                transform: `scale(${interpolate(p, [0, 1], [1.6, 1])}) translateY(${interpolate(
                  p,
                  [0, 1],
                  [46, 0],
                )}px)`,
                color: isPower ? accent : '#ffffff',
                marginRight: 26,
                textShadow: '0 12px 70px rgba(0,0,0,0.85)',
              }}
            >
              {w}
            </span>
          );
        })}
      </div>
      {/* garis aksen tipis di bawah kicker */}
      <div
        style={{
          width: interpolate(frame - startF, [0, 20], [0, 120], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
          height: 5,
          background: accent,
          margin: '34px auto 0',
        }}
      />
    </div>
  );
}

/* ---------- main ---------- */

export const Vertical: React.FC<VerticalProps> = ({accent, captions}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  // Ducking: music bed turun saat voiceover bicara
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
  const musicVol = interpolate(duckAmount, [0, 1], [0.16, 0.06]);

  return (
    <AbsoluteFill style={{background: '#000000', color: '#ffffff'}}>
      {/* scene sinematik: dip-to-black antar scene */}
      {SCENES.map((scene, i) => {
        const cap = captions[i];
        if (!cap) {
          return null;
        }
        const startF = cap.start * fps;
        const endF = cap.end * fps;
        const dipF = 14; // durasi dip-to-black
        if (frame < startF - dipF || frame >= endF + dipF) {
          return null;
        }
        const op = interpolate(
          frame,
          [startF - dipF, startF, endF - dipF, endF],
          [0, 1, 1, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        const t = interpolate(frame, [startF - dipF, endF + dipF], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        let cam = '';
        if (scene.move === 'push') {
          cam = `scale(${1.02 + t * 0.1})`;
        } else if (scene.move === 'pull') {
          cam = `scale(${1.12 - t * 0.1})`;
        } else if (scene.move === 'panR') {
          cam = `scale(1.18) translateX(${-34 + t * 68}px)`;
        } else {
          cam = `scale(1.18) translateX(${34 - t * 68}px)`;
        }
        return (
          <div
            key={`sc${i}`}
            style={{position: 'absolute', inset: -80, opacity: op, overflow: 'hidden'}}
          >
            <Video
              src={staticFile(scene.src)}
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: cam,
                // color grade sinematik: desaturasi + kontras + gelap
                filter: 'saturate(0.45) contrast(1.35) brightness(0.68)',
              }}
            />
          </div>
        );
      })}

      {/* tint dingin */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: '#0d1b22',
          opacity: 0.26,
          mixBlendMode: 'multiply',
          pointerEvents: 'none',
        }}
      />
      {/* vignette berat */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse 90% 62% at 50% 46%, transparent 32%, rgba(0,0,0,0.82) 100%)',
          pointerEvents: 'none',
        }}
      />
      {/* film grain */}
      <Grain frame={frame} />

      {/* letterbox */}
      <div style={{position: 'absolute', top: 0, left: 0, right: 0, height: 128, background: '#000'}} />
      <div style={{position: 'absolute', bottom: 0, left: 0, right: 0, height: 128, background: '#000'}} />

      {/* audio: voice */}
      {captions.map((cap, i) => (
        <Sequence key={`v${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile(`audio/voice-${i}.mp3`)} />
        </Sequence>
      ))}
      {/* audio: bass hit dalam di tiap awal caption */}
      {captions.map((cap, i) => (
        <Sequence key={`b${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile('audio/sfx/bass-hit.mp3')} volume={0.75} />
        </Sequence>
      ))}
      {/* audio: dark riser sebelum RUN (cap 3) dan JACKPOT (cap 6) */}
      {[3, 6].map((i) => (
        <Sequence
          key={`r${i}`}
          from={Math.round(captions[i].start * fps) - Math.round(1.4 * fps)}
        >
          <Audio src={staticFile('audio/dark-riser.mp3')} volume={0.5} />
        </Sequence>
      ))}
      {/* audio: dark music bed */}
      <Audio src={staticFile('audio/dark-bed.mp3')} volume={musicVol} loop />

      {/* judul trailer per caption */}
      {captions.map((cap, i) => {
        const startF = cap.start * fps;
        const endF = cap.end * fps;
        if (frame < startF - 14 || frame >= endF) {
          return null;
        }
        return (
          <div
            key={`t${i}`}
            style={{
              position: 'absolute',
              top: 128,
              bottom: 128,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TrailerTitle cap={cap} index={i} frame={frame} fps={fps} accent={accent} />
          </div>
        );
      })}
    </AbsoluteFill>
  );
};
