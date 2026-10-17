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

export type Caption = {
  start: number;
  end: number;
  text: string;
};

export type VerticalProps = {
  title: string;
  handle: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  captions: Caption[];
};

const FONT = 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export const Vertical: React.FC<VerticalProps> = ({
  title,
  handle,
  bgFrom,
  bgTo,
  accent,
  captions,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const titleScale = spring({frame, fps, config: {damping: 200}});
  const progress = interpolate(frame, [0, durationInFrames], [0, 100]);
  const drift = interpolate(frame, [0, durationInFrames], [0, 140]);

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${
          135 + drift / 3
        }deg, ${bgFrom}, ${bgTo})`,
        fontFamily: FONT,
        color: '#ffffff',
      }}
    >
      {/* voiceover: 1 klip per caption, mulai pas caption muncul */}
      {captions.map((cap, i) => (
        <Sequence key={`v${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile(`audio/voice-${i}.mp3`)} />
        </Sequence>
      ))}
      {/* sfx pop tiap caption muncul */}
      {captions.map((cap, i) => (
        <Sequence key={`p${i}`} from={Math.round(cap.start * fps)}>
          <Audio src={staticFile('audio/pop.mp3')} volume={0.25} />
        </Sequence>
      ))}
      {/* musik latar */}
      <Audio src={staticFile('audio/music.mp3')} volume={0.12} />
      {/* progress bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          height: 10,
          width: `${progress}%`,
          background: accent,
        }}
      />
      {/* hook title */}
      <div
        style={{
          position: 'absolute',
          top: '11%',
          left: 64,
          right: 64,
          transform: `scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontSize: 86,
            fontWeight: 900,
            lineHeight: 1.18,
            textShadow: '0 6px 32px rgba(0,0,0,0.45)',
          }}
        >
          {title}
        </div>
      </div>
      {/* timed captions */}
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
              bottom: '24%',
              left: 64,
              right: 64,
              display: 'flex',
              justifyContent: 'center',
              opacity,
              transform: `scale(${Math.max(pop, 0.01)})`,
            }}
          >
            <div
              style={{
                fontSize: 74,
                fontWeight: 800,
                lineHeight: 1.28,
                textAlign: 'center',
                background: 'rgba(0,0,0,0.55)',
                padding: '26px 40px',
                borderRadius: 26,
              }}
            >
              {cap.text}
            </div>
          </div>
        );
      })}
      {/* watermark */}
      <div
        style={{
          position: 'absolute',
          bottom: 84,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 46,
          fontWeight: 700,
          opacity: 0.92,
          textShadow: '0 4px 18px rgba(0,0,0,0.5)',
        }}
      >
        {handle}
      </div>
    </AbsoluteFill>
  );
};
