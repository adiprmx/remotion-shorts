import React from 'react';
import {Composition} from 'remotion';
import {Vertical, VerticalProps} from './Vertical';
import raw from './content.json';

const content = raw as VerticalProps & {durationSec: number};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Vertical"
        component={Vertical}
        durationInFrames={Math.max(30, Math.round(content.durationSec * 30))}
        fps={60}
        width={1080}
        height={1920}
        defaultProps={{
          title: content.title,
          titleHighlight: content.titleHighlight,
          handle: content.handle,
          accent: content.accent,
          captions: content.captions,
        }}
      />
    </>
  );
};
