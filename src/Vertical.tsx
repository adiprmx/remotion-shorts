import React from 'react';
import {
  AbsoluteFill,
  Audio,
  interpolate,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Video,
} from 'remotion';
import voiceMeta from './voice-meta.json';
import wordTimings from './word-timings.json';

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

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';
const BG = '#0a0a0e';
const DIM = 'rgba(255,255,255,0.30)';
const CARD = '#14141c';

const voiceDurs: number[] = (voiceMeta as {voice: number[]}).voice ?? [];
const wordTimes: Record<string, {w: string; s: number; e: number}[]> =
  wordTimings as Record<string, {w: string; s: number; e: number}[]>;

/* ---------- EGG BACKGROUND (tema Steal An Egg) ---------- */

function EggBackground({
  frame,
  fps,
  accent,
}: {
  frame: number;
  fps: number;
  accent: string;
}) {
  // 12 telur melayang dengan posisi & kecepatan beda
  const eggs = Array.from({length: 12}, (_, i) => {
    const seed = i * 137.5;
    const x = (seed * 7919) % 1080;
    const speed = 0.3 + ((i * 37) % 40) / 100;
    const y = ((frame * speed + i * 400) % 2200) - 150;
    const size = 24 + ((i * 53) % 40);
    const rot = Math.sin(frame * 0.02 + i) * 15;
    const opacity = 0.08 + ((i * 29) % 10) / 100;
    return {x, y, size, rot, opacity, i};
  });
  return (
    <div style={{position: 'absolute', inset: 0, overflow: 'hidden'}}>
      {eggs.map((e) => (
        <div
          key={e.i}
          style={{
            position: 'absolute',
            left: e.x,
            top: e.y,
            width: e.size,
            height: e.size * 1.3,
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
            background: `linear-gradient(135deg, ${accent}22, ${accent}11)`,
            border: `2px solid ${accent}33`,
            transform: `rotate(${e.rot}deg)`,
            opacity: e.opacity,
          }}
        />
      ))}
    </div>
  );
}

/* ---------- scene visuals (ganti tiap caption) ---------- */

function SceneShell({
  frame,
  fps,
  startF,
  children,
}: {
  frame: number;
  fps: number;
  startF: number;
  children: React.ReactNode;
}) {
  const pop = spring({frame: frame - startF, fps, config: {damping: 200}});
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        transform: `scale(${Math.max(pop, 0.01)})`,
      }}
    >
      {children}
    </div>
  );
}

function MiniWave({
  frame,
  accent,
  seed,
  n,
  h,
}: {
  frame: number;
  accent: string;
  seed: number;
  n: number;
  h: number;
}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 7}}>
      {Array.from({length: n}).map((_, i) => {
        const bh =
          8 + h * Math.abs(Math.sin(i * 1.7 + seed + frame * 0.22));
        return (
          <div
            key={i}
            style={{
              width: 8,
              height: bh,
              borderRadius: 4,
              background: accent,
            }}
          />
        );
      })}
    </div>
  );
}

function CheckRow({
  label,
  delay,
  frame,
  fps,
  startF,
  accent,
}: {
  label: string;
  delay: number;
  frame: number;
  fps: number;
  startF: number;
  accent: string;
}) {
  const o = interpolate(frame - startF - delay, [0, 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const x = interpolate(frame - startF - delay, [0, 14], [50, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        opacity: o,
        transform: `translateX(${x}px)`,
        padding: '14px 0',
      }}
    >
      <div
        style={{
          width: 58,
          height: 58,
          borderRadius: '50%',
          background: accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 34,
          fontWeight: 900,
          color: '#0a0a0e',
        }}
      >
        ✓
      </div>
      <div style={{fontSize: 44, fontWeight: 800}}>{label}</div>
    </div>
  );
}

function Scene({
  scene,
  frame,
  fps,
  startF,
  accent,
}: {
  scene: string;
  frame: number;
  fps: number;
  startF: number;
  accent: string;
}) {
  const shell = (children: React.ReactNode) => (
    <SceneShell frame={frame} fps={fps} startF={startF}>
      {children}
    </SceneShell>
  );

  switch (scene) {
    case 'rings': {
      return shell(
        <div
          style={{
            position: 'relative',
            width: 340,
            height: 340,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {[0, 1, 2].map((i) => {
            const p = ((frame * 1.1 + i * 22) % 66) / 66;
            return (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  width: 130 + p * 210,
                  height: 130 + p * 210,
                  borderRadius: '50%',
                  border: `3px solid ${accent}`,
                  opacity: 0.65 * (1 - p),
                }}
              />
            );
          })}
          <div
            style={{
              width: 132,
              height: 172,
              borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 64,
              boxShadow: `0 0 60px ${accent}66`,
            }}
          >
            🥚
          </div>
        </div>,
      );
    }
    case 'versus': {
      return shell(
        <div style={{display: 'flex', gap: 26, width: '100%'}}>
          <div
            style={{
              flex: 1,
              background: CARD,
              borderRadius: 26,
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '34px 30px',
              opacity: 0.55,
            }}
          >
            <div style={{fontSize: 38, fontWeight: 800}}>Game biasa</div>
            <div style={{fontSize: 52, fontWeight: 900, marginTop: 14}}>
              10rb
            </div>
            <div style={{fontSize: 28, color: 'rgba(255,255,255,0.45)', marginTop: 10}}>
              pemain
            </div>
          </div>
          <div
            style={{
              flex: 1,
              background: CARD,
              borderRadius: 26,
              border: `2px solid ${accent}`,
              padding: '34px 30px',
              boxShadow: `0 0 60px ${accent}44`,
            }}
          >
            <div style={{fontSize: 38, fontWeight: 800}}>Steal An Egg</div>
            <div
              style={{fontSize: 52, fontWeight: 900, marginTop: 8, color: accent}}
            >
              4 JT
            </div>
            <div style={{fontSize: 28, color: 'rgba(255,255,255,0.6)', marginTop: 10}}>
              pemain bareng!
            </div>
          </div>
        </div>,
      );
    }
    case 'repo': {
      const stars = Math.round(
        interpolate(frame - startF, [0, 70], [0, 3], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        }),
      );
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '22px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{display: 'flex', gap: 10}}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <div
                  key={c}
                  style={{width: 20, height: 20, borderRadius: '50%', background: c}}
                />
              ))}
            </div>
            <div
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 999,
                padding: '12px 26px',
                fontSize: 29,
                color: 'rgba(255,255,255,0.6)',
              }}
            >
              📅 Juli 2026
            </div>
          </div>
          <div
            style={{
              padding: '34px 38px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{fontSize: 52, fontWeight: 900}}>Steal An Egg</div>
              <div
                style={{
                  fontSize: 29,
                  color: 'rgba(255,255,255,0.55)',
                  marginTop: 8,
                }}
              >
                open-source AI voice studio
              </div>
              <div
                style={{
                  display: 'inline-block',
                  marginTop: 16,
                  fontSize: 26,
                  fontWeight: 800,
                  color: accent,
                  border: `1px solid ${accent}`,
                  borderRadius: 999,
                  padding: '8px 22px',
                }}
              >
                MIT
              </div>
            </div>
            <div style={{textAlign: 'center'}}>
              <div style={{fontSize: 68, fontWeight: 900, color: accent}}>
                {stars.toLocaleString('id-ID')}
              </div>
              <div
                style={{
                  fontSize: 28,
                  letterSpacing: 6,
                  color: 'rgba(255,255,255,0.55)',
                }}
              >
                ★ STARS
              </div>
            </div>
          </div>
        </div>,
      );
    }
    case 'local': {
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '44px 40px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 110,
              height: 110,
              borderRadius: 26,
              background: `${accent}22`,
              border: `2px solid ${accent}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 52,
              fontWeight: 900,
              color: accent,
              margin: '0 auto',
            }}
          >
            ◈
          </div>
          <div style={{fontSize: 62, fontWeight: 900, marginTop: 26}}>
            WINDAH BASUDARA
          </div>
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.6)',
              marginTop: 12,
            }}
          >
            bilang wajib main!
          </div>
        </div>,
      );
    }
    case 'zero': {
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '40px 44px',
          }}
        >
          <div style={{fontSize: 100}}>🥚</div>
          <div
            style={{
              fontSize: 54,
              fontWeight: 900,
              color: accent,
              marginTop: 16,
            }}
          >
            CURI TELUR
          </div>
          <CheckRow label="Dari sarang" delay={14} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Bawa ke base" delay={30} frame={frame} fps={fps} startF={startF} accent={accent} />
        </div>,
      );
    }
    case 'privacy': {
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '44px 40px',
            textAlign: 'center',
          }}
        >
          <svg width="104" height="104" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2l8 3.5v5.2c0 5-3.4 9.4-8 11.3-4.6-1.9-8-6.3-8-11.3V5.5L12 2z"
              stroke={accent}
              strokeWidth="2"
              fill={`${accent}22`}
            />
            <path
              d="M9 12l2 2 4-4"
              stroke={accent}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{fontSize: 54, fontWeight: 900, marginTop: 24}}>
            🐣 TETASIN
          </div>
          <div
            style={{fontSize: 32, color: 'rgba(255,255,255,0.6)', marginTop: 12}}
          >
            dapet pet langka!
          </div>
        </div>,
      );
    }
    case 'clone': {
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '40px 44px',
          }}
        >
          <div style={{fontSize: 30, letterSpacing: 6, color: 'rgba(255,255,255,0.5)', fontWeight: 700}}>
            PET KERJA
          </div>
          <div style={{margin: '18px 0 26px'}}>
            <MiniWave frame={frame} accent="rgba(255,255,255,0.75)" seed={3} n={34} h={44} />
          </div>
          <div style={{fontSize: 44, color: accent, textAlign: 'center', fontWeight: 900}}>↓</div>
          <div style={{fontSize: 30, letterSpacing: 6, color: accent, fontWeight: 700, marginTop: 18}}>
            AUTO CUAN 💰
          </div>
          <div style={{marginTop: 18}}>
            <MiniWave frame={frame} accent={accent} seed={11} n={34} h={60} />
          </div>
        </div>,
      );
    }
    case 'result': {
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '40px 44px',
          }}
        >
          <div style={{display: 'flex', justifyContent: 'center', marginBottom: 30}}>
            <MiniWave frame={frame} accent={accent} seed={7} n={40} h={72} />
          </div>
          <div style={{fontSize: 80, textAlign: 'center', marginBottom: 20}}>⚠️</div>
          <CheckRow label="Telur lu bisa dicuri!" delay={10} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Jaga base baik-baik" delay={26} frame={frame} fps={fps} startF={startF} accent={accent} />
        </div>,
      );
    }
    case 'usecases': {
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '40px 44px',
          }}
        >
          <div style={{fontSize: 80, textAlign: 'center', marginBottom: 20}}>🏃💨</div>
          <CheckRow label="Upgrade treadmill" delay={8} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Lari makin kenceng" delay={24} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Curi telur langka" delay={40} frame={frame} fps={fps} startF={startF} accent={accent} />
        </div>,
      );
    }
    case 'desktop': {
      return shell(
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '22px 28px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div style={{display: 'flex', gap: 10}}>
              {['#ff5f57', '#febc2e', '#28c840'].map((c) => (
                <div key={c} style={{width: 20, height: 20, borderRadius: '50%', background: c}} />
              ))}
            </div>
            <div style={{fontSize: 32, fontWeight: 800, letterSpacing: 4}}>STEAL AN EGG</div>
          </div>
          <div style={{padding: '36px 40px', display: 'flex', alignItems: 'center', gap: 34}}>
            <div
              style={{
                width: 130,
                height: 130,
                borderRadius: '50%',
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 56,
                color: '#0a0a0e',
                fontWeight: 900,
                flexShrink: 0,
              }}
            >
              👍
            </div>
            <div>
              <div style={{fontSize: 40, fontWeight: 800}}>92% kasih like!</div>
              <div style={{fontSize: 30, color: 'rgba(255,255,255,0.55)', marginTop: 8}}>
                3,5 juta likes
              </div>
            </div>
          </div>
        </div>,
      );
    }
    case 'code': {
      return shell(
        <div
          style={{
            width: '100%',
            background: '#0d0d13',
            borderRadius: 28,
            border: '1px solid rgba(255,255,255,0.12)',
            padding: '44px 40px',
            textAlign: 'center',
          }}
        >
          <div style={{fontSize: 84, fontWeight: 900}}>📱</div>
          <div style={{fontSize: 56, fontWeight: 900, marginTop: 20}}>GRATIS</div>
          <div
            style={{
              display: 'inline-block',
              marginTop: 18,
              fontSize: 28,
              fontWeight: 800,
              color: accent,
              border: `1px solid ${accent}`,
              borderRadius: 999,
              padding: '10px 28px',
            }}
          >
            DI HP BISA
          </div>
        </div>,
      );
    }
    case 'cta': {
      return shell(
        <div
          style={{
            width: '100%',
            background: accent,
            borderRadius: 28,
            padding: '48px 40px',
            textAlign: 'center',
          }}
        >
          <div style={{fontSize: 66, fontWeight: 900, color: '#0a0a0e'}}>
            LINK DI BIO
          </div>
          <div style={{fontSize: 40, fontWeight: 800, color: '#0a0a0e', marginTop: 12, opacity: 0.75}}>
            @adiprmx
          </div>
        </div>,
      );
    }
    default:
      return null;
  }
}

/* ---------- kinetic typography ---------- */

function Title({
  title,
  highlight,
  accent,
  frame,
  fps,
}: {
  title: string;
  highlight: string;
  accent: string;
  frame: number;
  fps: number;
}) {
  const scale = spring({frame, fps, config: {damping: 200}});
  const parts = highlight ? title.split(highlight) : [title];
  return (
    <div style={{transform: `scale(${scale})`}}>
      {parts.map((p, i) => (
        <React.Fragment key={i}>
          <span>{p}</span>
          {i < parts.length - 1 && (
            <span style={{color: accent}}>{highlight}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

function KineticLine({
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
  // TIMING KATA ASLI dari faster-whisper — subtitle kompak dengan voice, bukan tebakan
  const timings = wordTimes[String(index)] ?? [];
  const getWordWindow = (j: number): [number, number] => {
    const t = timings[j];
    if (t) {
      return [startF + t.s * fps, startF + t.e * fps];
    }
    // fallback: bagi rata (kalau timing tidak ada)
    const dur = voiceDurs[index] ?? cap.end - cap.start;
    return [
      startF + (j / words.length) * dur * fps,
      startF + ((j + 1) / words.length) * dur * fps,
    ];
  };
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        columnGap: 20,
        rowGap: 6,
      }}
    >
      {words.map((w, j) => {
        const [wsRaw, we] = getWordWindow(j);
        const ws = wsRaw - Math.round(0.08 * fps);
        const isCur = frame >= ws && frame < we;
        const isDone = frame >= we;
        // SUBTITLE ADEM: tanpa pop, tanpa scale — cuma highlight warna yang smooth
        return (
          <span
            key={j}
            style={{
              display: 'inline-block',
              color: isCur ? '#0a0a0e' : '#ffffff',
              opacity: isDone || isCur ? 1 : 0.45,
              background: isCur ? accent : 'transparent',
              padding: isCur ? '4px 14px' : '4px 2px',
              margin: isCur ? '0 3px' : '0 0',
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
}

function Particles({frame, accent}: {frame: number; accent: string}) {
  const dots = 26;
  return (
    <>
      {Array.from({length: dots}).map((_, i) => {
        const x = (i * 401.3) % 1080;
        const y0 = (i * 719.7) % 1920;
        const speed = 0.6 + ((i * 13.7) % 10) / 14;
        const y = (y0 - frame * speed * 2.2) % 1920;
        const yy = y < 0 ? y + 1920 : y;
        const size = 3 + ((i * 7.3) % 10) / 3;
        const op = 0.12 + ((i * 3.1) % 10) / 45;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: x,
              top: yy,
              width: size,
              height: size,
              borderRadius: size / 2,
              background: i % 4 === 0 ? accent : '#ffffff',
              opacity: op,
            }}
          />
        );
      })}
    </>
  );
}

function Waveform({frame, accent}: {frame: number; accent: string}) {
  const bars = 52;
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 9}}>
      {Array.from({length: bars}).map((_, i) => {
        const h =
          14 +
          66 *
            Math.abs(
              Math.sin(i * 12.9898 + frame * 0.14) * 0.55 +
                Math.sin(i * 78.233 - frame * 0.09) * 0.45,
            );
        return (
          <div
            key={i}
            style={{
              width: 9,
              height: h,
              borderRadius: 5,
              background: accent,
              opacity: 0.8,
            }}
          />
        );
      })}
    </div>
  );
}

/* ---------- main ---------- */

export const Vertical: React.FC<VerticalProps> = ({
  title,
  titleHighlight,
  handle,
  accent,
  captions,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const progress = interpolate(frame, [0, durationInFrames], [0, 100]);
  const drift = interpolate(frame, [0, durationInFrames], [0, 100]);

  // Ducking musik: turun halus saat voiceover bicara, naik lagi di jeda.
  const duckAmount = (() => {
    const fade = 12; // frame untuk fade in/out
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
  const musicVol = interpolate(duckAmount, [0, 1], [0.075, 0.028]);

  // Punch-in zoom HALUS — subtle, profesional (bukan agresif)
  const punch = (() => {
    let p = 0;
    for (const cap of captions) {
      const s = cap.start * fps;
      if (frame >= s && frame < s + 24) {
        const t = (frame - s) / 24;
        p = Math.max(p, Math.sin(t * Math.PI) * 0.012);
      }
    }
    return 1 + p;
  })();

  return (
    <AbsoluteFill style={{background: BG, fontFamily: FONT, color: '#ffffff'}}>
      {/* EGG BACKGROUND — telur melayang sesuai tema Steal An Egg */}
      <EggBackground frame={frame} fps={fps} accent={accent} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${punch})`,
        }}
      >
      {/* b-roll video backgrounds, ganti tiap caption + Ken Burns */}
      {captions.map((cap, i) => {
        const startF = cap.start * fps;
        const endF = cap.end * fps;
        const fadeF = 12;
        if (frame < startF - fadeF || frame >= endF + fadeF) {
          return null;
        }
        const bgOp = interpolate(
          frame,
          [startF - fadeF, startF, endF - fadeF, endF],
          [0, 1, 1, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        const bgMap = [
          'bg/egg-world.mp4', // 0: hook - curi telur raksasa
          'bg/coins.mp4',     // 1: langka
          'bg/egg-world.mp4', // 2: penjaga gede
          'bg/speed.mp4',     // 3: RUN kabur
          'bg/egg-world.mp4', // 4: dikejar naga
          'bg/speed.mp4',     // 5: hampir ketangkep
          'bg/hatching.mp4',  // 6: jackpot legendaris
          'bg/phone.mp4',     // 7: follow CTA
        ];
        const broll = bgMap[i] ?? 'bg/egg-world.mp4';
        const zoom = interpolate(
          frame,
          [startF - fadeF, endF + fadeF],
          [1.02, 1.14],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        return (
          <div
            key={`bg${i}`}
            style={{
              position: 'absolute',
              inset: -120,
              opacity: bgOp,
              overflow: 'hidden',
            }}
          >
            <Video
              src={staticFile(broll)}
              muted
              loop
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: `scale(${zoom})`,
              }}
            />
          </div>
        );
      })}
      {/* dark overlay tipis — b-roll tetap kelihatan */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(rgba(5,5,10,0.52), rgba(5,5,10,0.38) 42%, rgba(5,5,10,0.62))',
        }}
      />
      {/* radial glow tipis */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 95% 55% at 50% ${
            36 + drift * 0.12
          }%, ${accent}14, transparent 70%)`,
        }}
      />
      {/* audio layers */}
      {captions.map((cap, i) => (
        <Sequence key={`v${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile(`audio/voice-${i}.mp3`)} />
        </Sequence>
      ))}
      {/* SFX BERVARIASI — tiap momen beda suara, nggak monoton */}
      {captions.map((cap, i) => {
        // klik teks muncul: giliran 3 varian
        const clicks = [
          'audio/sfx/click-soft.mp3',
          'audio/sfx/click-crisp.mp3',
          'audio/sfx/notify-pop.mp3',
        ];
        return (
          <Sequence key={`p${i}`} from={Math.round(cap.start * fps)}>
            <Audio src={staticFile(clicks[i % clicks.length])} volume={0.18} />
          </Sequence>
        );
      })}
      {/* whoosh ganti caption: giliran 4 varian */}
      {captions.map((cap, i) => {
        if (i === 0) {
          return null;
        }
        const whooshes = [
          'audio/sfx/whoosh-rocket.mp3',
          'audio/sfx/whoosh-air.mp3',
          'audio/sfx/whoosh-fast.mp3',
          'audio/sfx/whoosh-vacuum.mp3',
        ];
        return (
          <Sequence
            key={`w${i}`}
            from={Math.round(cap.start * fps) - Math.round(0.3 * fps)}
          >
            <Audio src={staticFile(whooshes[i % whooshes.length])} volume={0.3} />
          </Sequence>
        );
      })}
      {/* sweep sinematik tiap 3 caption */}
      {captions.map((cap, i) => {
        if (i === 0 || i % 3 !== 0) {
          return null;
        }
        const sweeps = [
          'audio/sfx/sweep-transition.mp3',
          'audio/sfx/sweep-cinematic.mp3',
        ];
        return (
          <Sequence
            key={`sw${i}`}
            from={Math.round(cap.start * fps) - Math.round(0.5 * fps)}
          >
            <Audio
              src={staticFile(sweeps[(i / 3) % sweeps.length | 0])}
              volume={0.22}
            />
          </Sequence>
        );
      })}
      {/* ding tiap ada kicker */}
      {captions.map((cap, i) =>
        !cap.kicker ? null : (
          <Sequence
            key={`d${i}`}
            from={Math.round(cap.start * fps) + Math.round(0.15 * fps)}
          >
            <Audio src={staticFile('audio/sfx/notify-ding.mp3')} volume={0.2} />
          </Sequence>
        ),
      )}
      {/* impact tiap 4 caption buat penekanan */}
      {captions.map((cap, i) => {
        if (i === 0 || i % 4 !== 0) {
          return null;
        }
        const impacts = [
          'audio/sfx/impact-hit.mp3',
          'audio/sfx/impact-boom.mp3',
          'audio/sfx/impact-deep.mp3',
          'audio/sfx/impact-punch.mp3',
        ];
        return (
          <Sequence key={`im${i}`} from={Math.round(cap.start * fps)}>
            <Audio
              src={staticFile(impacts[(i / 4) % impacts.length | 0])}
              volume={0.28}
            />
          </Sequence>
        );
      })}
      {/* riser sebelum CTA terakhir */}
      <Sequence
        from={Math.round(captions[captions.length - 1].start * fps) - Math.round(1.2 * fps)}
      >
        <Audio src={staticFile('audio/riser.mp3')} volume={0.3} />
      </Sequence>
      <Audio src={staticFile('audio/music.mp3')} volume={musicVol} />

      {/* progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 9,
          width: `${progress}%`,
          background: accent,
        }}
      />

      {/* handle pill */}
      <div
        style={{
          position: 'absolute',
          top: 44,
          right: 48,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.14)',
          borderRadius: 999,
          padding: '14px 34px',
          fontSize: 36,
          fontWeight: 700,
        }}
      >
        {handle}
      </div>

      {/* hook title */}
      <div
        style={{
          position: 'absolute',
          top: '9%',
          left: 64,
          right: 64,
          fontSize: 88,
          fontWeight: 900,
          lineHeight: 1.18,
          textShadow: '0 8px 40px rgba(0,0,0,0.6)',
        }}
      >
        <Title
          title={title}
          highlight={titleHighlight}
          accent={accent}
          frame={frame}
          fps={fps}
        />
      </div>

      {/* scene visual per caption */}
      {captions.map((cap, i) => {
        if (!cap.scene) {
          return null;
        }
        const startF = cap.start * fps;
        const endF = cap.end * fps;
        const fadeF = 10; // crossfade antar scene
        if (frame < startF - fadeF || frame >= endF + fadeF) {
          return null;
        }
        const sceneOp = interpolate(
          frame,
          [startF - fadeF, startF, endF - fadeF, endF],
          [0, 1, 1, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        // gerak float/zoom halus selama scene tampil
        const floatScale = interpolate(
          frame,
          [startF - fadeF, endF + fadeF],
          [0.96, 1.04],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        return (
          <div
            key={`s${i}`}
            style={{
              position: 'absolute',
              top: '33%',
              left: 64,
              right: 64,
              display: 'flex',
              justifyContent: 'center',
              opacity: sceneOp,
              transform: `scale(${floatScale})`,
            }}
          >
            <Scene
              scene={cap.scene}
              frame={frame}
              fps={fps}
              startF={startF}
              accent={accent}
            />
          </div>
        );
      })}

      {/* kinetic captions */}
      {captions.map((cap, i) => {
        const startF = cap.start * fps;
        const endF = cap.end * fps;
        const opacity = interpolate(
          frame,
          [startF, startF + 6, endF - 6, endF],
          [0, 1, 1, 0],
          {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
        );
        if (opacity <= 0) {
          return null;
        }
        const pop = spring({
          frame: frame - startF,
          fps,
          config: {damping: 200, stiffness: 260},
        });
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              bottom: '23%',
              left: 70,
              right: 70,
              textAlign: 'center',
              opacity,
              transform: `scale(${Math.max(pop, 0.01)})`,
            }}
          >
            {cap.kicker ? (
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  letterSpacing: 10,
                  color: 'rgba(255,255,255,0.55)',
                  marginBottom: 26,
                }}
              >
                {cap.kicker}
              </div>
            ) : null}
            <div
              style={{
                fontSize: 76,
                fontWeight: 900,
                lineHeight: 1.35,
                WebkitTextStroke: '2px rgba(0,0,0,0.85)',
                paintOrder: 'stroke fill',
                textShadow: '0 4px 18px rgba(0,0,0,0.6)',
              }}
            >
              <KineticLine
                cap={cap}
                index={i}
                frame={frame}
                fps={fps}
                accent={accent}
              />
            </div>
          </div>
        );
      })}

      {/* waveform */}
      <div
        style={{
          position: 'absolute',
          bottom: 92,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          opacity: 0.9,
        }}
      >
        <Waveform frame={frame} accent={accent} />
      </div>
      </div>
    </AbsoluteFill>
  );
};
