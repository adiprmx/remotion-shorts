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

const voiceDurs: number[] = (voiceMeta as {voice: number[]}).voice ?? [];

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
          top: '10%',
          left: 64,
          right: 64,
          fontSize: 94,
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
              bottom: '25%',
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
                  fontSize: 34,
                  fontWeight: 700,
                  letterSpacing: 10,
                  color: 'rgba(255,255,255,0.55)',
                  marginBottom: 30,
                }}
              >
                {cap.kicker}
              </div>
            ) : null}
            <div style={{fontSize: 78, fontWeight: 900, lineHeight: 1.32}}>
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
          bottom: 96,
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
