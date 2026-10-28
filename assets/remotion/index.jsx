import React from 'react';
import {Composition, registerRoot} from 'remotion';
import {Scene} from './Scene.jsx';

const Root = () => <Composition id="Main" component={Scene} width={1080} height={1920}
  fps={30} durationInFrames={180}
  calculateMetadata={({props}) => ({width: props.width ?? 1080, height: props.height ?? 1920,
    fps: props.fps ?? 30, durationInFrames: Math.ceil(props.duration * (props.fps ?? 30))})}
  defaultProps={{duration: 6, captions: [], audio: null, title: '',
    actions: {slab: 1, volume: 3.6, fall: 4.4}}}/>;

registerRoot(Root);
