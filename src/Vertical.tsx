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
} from 'remotion';
import voiceMeta from './voice-meta.json';

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
              height: 132,
              borderRadius: '50%',
              background: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 54,
              fontWeight: 900,
              color: '#0a0a0e',
            }}
          >
            AI
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
            <div style={{fontSize: 38, fontWeight: 800}}>ElevenLabs</div>
            <div
              style={{
                fontSize: 52,
                fontWeight: 900,
                marginTop: 14,
                textDecoration: 'line-through',
                color: 'rgba(255,255,255,0.5)',
              }}
            >
              $$$
            </div>
            <div style={{fontSize: 28, color: 'rgba(255,255,255,0.45)', marginTop: 10}}>
              bayar / bulan
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
            <div style={{fontSize: 38, fontWeight: 800}}>Voicebox</div>
            <div
              style={{fontSize: 64, fontWeight: 900, marginTop: 8, color: accent}}
            >
              $0
            </div>
            <div style={{fontSize: 28, color: 'rgba(255,255,255,0.6)', marginTop: 10}}>
              gratis selamanya
            </div>
          </div>
        </div>,
      );
    }
    case 'repo': {
      const stars = Math.round(
        interpolate(frame - startF, [0, 70], [0, 57763], {
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
              github.com/jamiepine/voicebox
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
              <div style={{fontSize: 52, fontWeight: 900}}>voicebox</div>
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
            100% LOKAL
          </div>
          <div
            style={{
              fontSize: 32,
              color: 'rgba(255,255,255,0.6)',
              marginTop: 12,
            }}
          >
            jalan di komputer lu sendiri
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
          <div
            style={{
              fontSize: 120,
              fontWeight: 900,
              color: accent,
              textShadow: `0 0 70px ${accent}66`,
            }}
          >
            $0
          </div>
          <CheckRow label="Tanpa langganan" delay={14} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Tanpa kuota" delay={30} frame={frame} fps={fps} startF={startF} accent={accent} />
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
            DATA NGGAK KELUAR
          </div>
          <div
            style={{fontSize: 32, color: 'rgba(255,255,255,0.6)', marginTop: 12}}
          >
            suara lu tetap di perangkat lu
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
            SAMPLE SUARA
          </div>
          <div style={{margin: '18px 0 26px'}}>
            <MiniWave frame={frame} accent="rgba(255,255,255,0.75)" seed={3} n={34} h={44} />
          </div>
          <div style={{fontSize: 44, color: accent, textAlign: 'center', fontWeight: 900}}>↓</div>
          <div style={{fontSize: 30, letterSpacing: 6, color: accent, fontWeight: 700, marginTop: 18}}>
            HASIL KLONING
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
          <CheckRow label="Emosi dapet" delay={10} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Artikulasi natural" delay={26} frame={frame} fps={fps} startF={startF} accent={accent} />
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
          <CheckRow label="Voice over konten" delay={8} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Narasi panjang" delay={24} frame={frame} fps={fps} startF={startF} accent={accent} />
          <CheckRow label="Dialog dua orang" delay={40} frame={frame} fps={fps} startF={startF} accent={accent} />
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
            <div style={{fontSize: 32, fontWeight: 800, letterSpacing: 4}}>VOICEBOX</div>
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
              ▶
            </div>
            <div>
              <div style={{fontSize: 40, fontWeight: 800}}>Tinggal pakai.</div>
              <div style={{fontSize: 30, color: 'rgba(255,255,255,0.55)', marginTop: 8}}>
                nggak perlu ngoding
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
          <div style={{fontSize: 84, fontWeight: 900, color: accent}}>{'</>'}</div>
          <div style={{fontSize: 56, fontWeight: 900, marginTop: 20}}>OPEN SOURCE</div>
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
            MIT LICENSE
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
  const dur = voiceDurs[index] ?? cap.end - cap.start;
  const startF = cap.start * fps;
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
        const ws = startF + (j / words.length) * dur * fps;
        const we = startF + ((j + 1) / words.length) * dur * fps;
        const isCur = frame >= ws && frame < we;
        const isDone = frame >= we;
        return (
          <span
            key={j}
            style={{
              display: 'inline-block',
              color: isCur ? accent : isDone ? '#ffffff' : DIM,
              transform: isCur ? 'scale(1.14)' : 'scale(1)',
              textShadow: isCur ? `0 0 34px ${accent}66` : 'none',
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
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

  return (
    <AbsoluteFill style={{background: BG, fontFamily: FONT, color: '#ffffff'}}>
      {/* radial glow */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(ellipse 95% 55% at 50% ${
            36 + drift * 0.12
          }%, ${accent}2e, transparent 70%)`,
        }}
      />
      {/* grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
          backgroundSize: '76px 76px',
          maskImage:
            'radial-gradient(ellipse 90% 70% at 50% 45%, black 30%, transparent 75%)',
          WebkitMaskImage:
            'radial-gradient(ellipse 90% 70% at 50% 45%, black 30%, transparent 75%)',
        }}
      />

      {/* audio layers */}
      {captions.map((cap, i) => (
        <Sequence key={`v${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile(`audio/voice-${i}.mp3`)} />
        </Sequence>
      ))}
      {captions.map((cap, i) => (
        <Sequence key={`p${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile('audio/pop.mp3')} volume={0.22} />
        </Sequence>
      ))}
      <Audio src={staticFile('audio/music.mp3')} volume={0.1} />

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
        if (frame < startF || frame >= endF) {
          return null;
        }
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
            <div style={{fontSize: 72, fontWeight: 900, lineHeight: 1.32}}>
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
    </AbsoluteFill>
  );
};
