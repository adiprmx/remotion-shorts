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
import {loadFont as loadAnton} from '@remotion/google-fonts/Anton';
import {loadFont as loadBungee} from '@remotion/google-fonts/Bungee';
import wordTimingsRaw from './word-timings.json';

const {fontFamily: ANTON} = loadAnton('normal', {
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

// v31 VIRAL NATIVE — kebalikan total v30 handheld:
// Format TikTok viral yang "normal": caption Anton tebal putih + outline hitam,
// kata-per-kata nyala kuning (karaoke, ikut timing kata beneran), hard cut tanpa
// wipe, punch zoom tiap caption, tanpa coretan tangan / telur melayang / HUD /
// debu / goyang kamera. Background: 16 segmen art resmi Steal An Egg, 2 per
// caption berurutan, Ken Burns pelan (bukan handheld).

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
const INK = '#000000';

type WordTiming = {w: string; s: number; e: number};
const WORD_TIMINGS: Record<string, WordTiming[]> = wordTimingsRaw as Record<
  string,
  WordTiming[]
>;

/* ---------- caption viral: Anton + karaoke per kata ---------- */

function ViralText({
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
  const timeSec = frame / fps;
  const outP = interpolate(frame, [endF - 6, endF], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  if (outP <= 0) {
    return null;
  }
  const words = cap.text.split(' ');
  const fontSize = words.length <= 3 ? 122 : words.length === 4 ? 106 : 90;
  const timings = WORD_TIMINGS[String(index)] ?? [];
  // kata aktif = kata yang waktunya mengandung detik ini (karaoke beneran)
  let active = -1;
  timings.forEach((wt, j) => {
    if (timeSec >= wt.s && timeSec < wt.e) {
      active = j;
    }
  });
  if (active === -1 && timings.length > 0) {
    active = timeSec < timings[0].s ? 0 : timings.length - 1;
  }
  // masuk bersih & profesional: naik halus + fade, tanpa bounce/rotasi acak
  const rise = interpolate(local, [0, 8], [16, 0], {
    easing: Easing.out(Easing.cubic),
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'relative',
        textAlign: 'center',
        padding: '0 40px',
        opacity: outP,
        transform: `translateY(${rise}px)`,
      }}
    >
      {cap.kicker ? (
        <div
          style={{
            display: 'inline-block',
            fontFamily: BUNGEE,
            fontSize: 24,
            letterSpacing: 3,
            color: '#141414',
            background: GOLD,
            borderRadius: 4,
            padding: '8px 18px 6px',
            marginBottom: 24,
          }}
        >
          {cap.kicker}
        </div>
      ) : null}
      <div
        style={{
          fontFamily: ANTON,
          fontSize,
          lineHeight: 1.08,
          letterSpacing: 1,
          textTransform: 'uppercase',
        }}
      >
        {words.map((w, j) => {
          // masuk per kata: naik halus + fade (expo), tanpa scale/rotasi
          const wp = interpolate(local - j * 4, [0, 7], [0, 1], {
            easing: Easing.out(Easing.cubic),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const isActive = j === active;
          return (
            <span
              key={j}
              style={{
                display: 'inline-block',
                opacity: wp * outP,
                transform: `translateY(${interpolate(wp, [0, 1], [14, 0])}px)`,
                color: isActive ? GOLD : '#ffffff',
                textShadow: '0 2px 16px rgba(0,0,0,0.65)',
                marginRight: 20,
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

  // segmen aktif: 2 per caption berurutan, split di tengah caption, HARD CUT
  const segs: {capIdx: number; segIdx: number; from: number; to: number}[] = [];
  captions.forEach((cap, ci) => {
    const mid = (cap.start + cap.end) / 2;
    segs.push({capIdx: ci, segIdx: ci * 2, from: cap.start, to: mid});
    segs.push({capIdx: ci, segIdx: ci * 2 + 1, from: mid, to: cap.end});
  });

  return (
    <AbsoluteFill style={{background: '#10131a', color: '#ffffff', overflow: 'hidden'}}>
      {/* background: art resmi, Ken Burns pelan, hard cut */}
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
        const zoom = 1.08 + t * 0.1;
        return (
          <div
            key={`bg${seg.segIdx}`}
            style={{position: 'absolute', inset: -60, overflow: 'hidden'}}
          >
            <Video
              src={staticFile(`bg/v27/${SEG_FILES[seg.segIdx]}`)}
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${zoom})`,
                filter: 'saturate(1.18) contrast(1.04) brightness(1.02)',
              }}
            />
          </div>
        );
      })}

      {/* gradasi bawah buat keterbacaan teks */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 760,
          background: 'linear-gradient(to top, rgba(5,8,14,0.72), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* audio: voice */}
      {captions.map((cap, i) => (
        <Sequence key={`v${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile(`audio/voice-${i}.mp3`)} />
        </Sequence>
      ))}

      {/* musik upbeat orisinal, volume pelan saat voice */}
      <Audio src={staticFile('audio/music.mp3')} volume={musicVol} loop />

      {/* SFX punchy: pop tiap awal caption, boom di halangan, coin di sikat */}
      {captions.map((cap, i) => (
        <Sequence key={`sfx${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile('audio/sfx/notify-pop.mp3')} volume={0.3} />
        </Sequence>
      ))}
      <Sequence from={Math.round(captions[3].start * fps)}>
        <Audio src={staticFile('audio/sfx/impact-boom.mp3')} volume={0.5} />
      </Sequence>
      <Sequence from={Math.round(captions[5].start * fps)}>
        <Audio src={staticFile('audio/sfx/coin.mp3')} volume={0.6} />
      </Sequence>

      {/* teks per caption (guard frame < start di dalam ViralText) */}
      {captions.map((cap, i) => (
        <div
          key={`t${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 230,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <ViralText cap={cap} index={i} frame={frame} fps={fps} />
        </div>
      ))}

      {/* handle + progress full-width */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 14,
          paddingBottom: 34,
        }}
      >
        <div
          style={{
            fontFamily: BUNGEE,
            fontSize: 28,
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
            width: '100%',
            height: 6,
            background: 'rgba(255,255,255,0.28)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${(frame / durationInFrames) * 100}%`,
              background: accent,
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
