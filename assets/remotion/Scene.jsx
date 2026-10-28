import React, {useMemo} from 'react';
import {AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {simulateSlab, stateAt} from './physics.cjs';

const clamp = (value) => Math.max(0, Math.min(1, value));
const progress = (time, start, duration) => clamp((time - start) / duration);

// Use word times, not equal durations. Page boundaries stay fixed while seeking.
export function captionPages(captions, maxCharacters = 36) {
  const pages = [];
  let page = [];
  for (const word of captions) {
    const joined = [...page, word].map((item) => item.text).join('');
    if (page.length && (joined.length > maxCharacters ||
        word.startMs - page.at(-1).endMs > 500)) {
      pages.push(page);
      page = [];
    }
    page.push(word);
    if (/[.!?]$/.test(word.text.trim())) {
      pages.push(page);
      page = [];
    }
  }
  if (page.length) pages.push(page);
  return pages;
}

export function Captions({captions, time, color, accent, fontSize, compact}) {
  const pages = useMemo(() => captionPages(captions, compact ? 31 : 44), [captions, compact]);
  const page = pages.find((words, index) => time * 1000 >= words[0].startMs &&
    time * 1000 < (pages[index + 1]?.[0].startMs ?? words.at(-1).endMs + 100));
  if (!page) return null;
  return <div style={{color, fontSize, fontWeight: 700, lineHeight: 1.27,
    textAlign: 'center', letterSpacing: '-0.025em', textWrap: 'balance'}}>
    {page.map((word, index) => <React.Fragment key={`${word.clip_index}:${word.startMs}:${index}`}>
      {index > 0 && !word.text.startsWith('-') ? ' ' : ''}
      <span style={{color: time * 1000 >= word.startMs && time * 1000 < word.endMs ? accent : color}}>
        {word.text.trim()}
      </span>
    </React.Fragment>)}
  </div>;
}

function Diagram({time, duration, actions, paper, palette}) {
  const states = useMemo(() => simulateSlab({duration, releaseAt: actions.slab}), [duration, actions.slab]);
  const slab = stateAt(states, time);
  const drop = progress(time, actions.fall, 1.25);
  const volume = progress(time, actions.volume, 1.1);
  const reveal = progress(time, 0.05, 1.35);
  const chartPath = 'M90 600 L160 550 L220 565 L280 480 L350 500 L410 405 L475 430 L535 360 L610 395 L675 363 L745 398 L800 365';
  const xPoints = [300, 430, 560, 690];
  return <svg viewBox="0 0 1000 760" style={{width: '100%', height: '100%', overflow: 'visible'}}>
    <defs>
      <pattern id="grid" width="65" height="65" patternUnits="userSpaceOnUse">
        <path d="M65 0H0V65" fill="none" stroke={palette.ink} strokeOpacity="0.055" strokeWidth="1.5"/>
      </pattern>
      <pattern id="paper" width="17" height="23" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="4" r="0.65" fill={palette.ink} opacity="0.1"/>
        <circle cx="12" cy="17" r="0.7" fill={palette.ink} opacity="0.06"/>
      </pattern>
      <filter id="shadow" x="-30%" y="-40%" width="160%" height="190%">
        <feDropShadow dx="0" dy="12" stdDeviation="9" floodColor={palette.ink} floodOpacity="0.12"/>
      </filter>
    </defs>
    <rect x="25" y="15" width="950" height="700" rx={paper ? 4 : 28} fill="url(#grid)"/>
    {paper && <rect x="25" y="15" width="950" height="700" fill="url(#paper)"/>}
    <path d="M80 100V650H925" stroke={palette.ink} strokeOpacity="0.2" strokeWidth="2" fill="none"/>
    {time < actions.slab - 0.15 && <g>
      <path d={chartPath} pathLength="1" stroke={palette.green} strokeWidth="10" fill="none"
        strokeDasharray="1" strokeDashoffset={1 - reveal} strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M205 343H880" pathLength="1" stroke={palette.red} strokeWidth="5" strokeDasharray="0.02 0.015"
        strokeOpacity={progress(time, 0.5, 0.6)}/>
      <circle cx="800" cy={365 - 13 * Math.sin(time * 5) ** 2} r="13" fill={palette.green}
        opacity={progress(time, 1.2, 0.3)}/>
    </g>}
    <g opacity={progress(time, actions.slab - 0.35, 0.3)}>
      {xPoints.map((x, i) => <g key={x} transform={`translate(0 ${drop * (110 + i * 28)})`}>
        <line x1={x} x2={x} y1="340" y2="666" stroke={palette.green} strokeWidth="5"/>
        <rect x={x - 26} y="360" width="52" height="290" rx={paper ? 1 : 6}
          fill={palette.green} stroke={paper ? palette.background : 'none'} strokeWidth="8"/>
      </g>)}
      <g transform={`translate(${slab.x},${slab.y}) rotate(${slab.angle * 180 / Math.PI})`}
        filter="url(#shadow)" opacity={1 - drop * 0.85}>
        <rect x="-365" y="-41" width="730" height="82" rx={paper ? 3 : 12}
          fill={palette.red} stroke={paper ? palette.background : palette.red} strokeWidth={paper ? 11 : 2}/>
        {[-270, -130, 10, 150, 290].map((x) => <path key={x} d={`M${x} -28l-25 56`}
          stroke={paper ? '#f4e4c9' : '#ffffff'} strokeOpacity="0.28" strokeWidth="6"/>)}
      </g>
    </g>
    {Array.from({length: 22}, (_, i) => {
      const x = 230 + i * 28;
      const y = 285 - (i % 3) * 23;
      const enter = progress(time, 0.8 + i * 0.055, 0.28);
      return <circle key={i} cx={x} cy={y} r={6 + (i % 3) * 2.5} fill={palette.red}
        opacity={enter * 0.5 * (1 - progress(time, actions.slab - 0.45, 0.3))}/>;
    })}
    {Array.from({length: 16}, (_, i) => <rect key={i} x={185 + i * 45} y={690 - (14 + ((i * 37) % 60)) * volume}
      width="26" height={(14 + ((i * 37) % 60)) * volume} rx="3" fill={palette.red} opacity={volume * 0.55}/>)}
    {drop > 0 && <g>
      <path d="M410 380L500 430L585 420L650 510L725 525L810 620" pathLength="1"
        fill="none" stroke={palette.red} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round"
        strokeDasharray="1" strokeDashoffset={1 - drop}/>
      <path d="M780 615L815 627L818 590" fill="none" stroke={palette.red} strokeWidth="12"
        strokeLinecap="round" strokeLinejoin="round" opacity={progress(drop, 0.85, 0.15)}/>
    </g>}
  </svg>;
}

// This is one editable explanatory scene, not a style imposed on every project.
export function Scene({captions, audio, duration, actions, style = 'paper', title,
  subtitleSize, palette: suppliedPalette = {}}) {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const time = frame / fps;
  const portrait = height > width;
  const paper = style === 'paper';
  const palette = {...(paper ? {background: '#f3e8d4', ink: '#262d2a', red: '#bc4b39', green: '#2b7861'} :
    {background: '#eef3f6', ink: '#203549', red: '#c45246', green: '#167c75'}), ...suppliedPalette};
  return <AbsoluteFill style={{background: palette.background, color: palette.ink,
    fontFamily: 'Arial, sans-serif', overflow: 'hidden'}}>
    <div style={{position: 'absolute', left: '8%', right: '8%', top: portrait ? '11%' : '8%',
      fontWeight: 800, fontSize: portrait ? width * 0.075 : width * 0.043,
      lineHeight: 1.03, letterSpacing: '-0.05em', maxWidth: portrait ? '84%' : '60%'}}>{title}</div>
    <div style={{position: 'absolute', left: portrait ? '2%' : '28%', right: portrait ? '2%' : '3%',
      top: portrait ? '26%' : '15%', bottom: portrait ? '27%' : '19%'}}>
      <Diagram time={time} duration={duration} actions={actions} paper={paper} palette={palette}/>
    </div>
    {!portrait && <div style={{position: 'absolute', left: '8%', top: '36%', width: '21%',
      fontSize: width * 0.026, fontWeight: 600, lineHeight: 1.38, opacity: 0.8}}>
      {time < actions.slab ? 'Объём у границы' : time < actions.fall ? 'Рост остановился' : 'Цена идёт ниже'}
    </div>}
    <div style={{position: 'absolute', left: portrait ? '8%' : '12%', right: portrait ? '11%' : '12%',
      bottom: portrait ? '13%' : '7%', minHeight: portrait ? '11%' : '12%',
      padding: portrait ? '20px 14px' : '12px 28px', boxSizing: 'border-box',
      borderTop: `2px solid ${palette.ink}22`}}>
      <Captions captions={captions} time={time} color={palette.ink} accent={palette.red}
        fontSize={subtitleSize ?? (portrait ? width * 0.05 : width * 0.028)} compact={portrait}/>
    </div>
    {audio && <Audio src={staticFile(audio)}/>}
  </AbsoluteFill>;
}
