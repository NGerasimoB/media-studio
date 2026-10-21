"""Map one source's word times through non-overlapping-in-output sequential cuts."""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import sys

from transcribe_words import write_new_json


def number(value, name: str) -> float:
    if isinstance(value, bool) or not isinstance(value, (float, int)) or not math.isfinite(value):
        raise ValueError(f'{name} must be a finite number')
    return float(value)


def remap(transcript: dict, edit: dict) -> dict:
    duration = number(transcript['duration'], 'source duration')
    if duration <= 0:
        raise ValueError('Source duration must be positive')
    clips = edit.get('clips')
    if not isinstance(clips, list) or not clips:
        raise ValueError('clips must be a nonempty list')
    words = transcript['words']
    previous_start = -1.0
    for word in words:
        a, b = number(word['start'], 'word start'), number(word['end'], 'word end')
        if a < 0 or b < a or b > duration + 0.05 or a < previous_start:
            raise ValueError('Invalid or unsorted source word times')
        previous_start = a
    captions, timeline, offset = [], [], 0.0
    for index, clip in enumerate(clips):
        if set(clip) - {'start', 'end', 'rate'}:
            raise ValueError('Only start/end/rate are supported; multitrack/crossfade needs a project mapping')
        start, end = number(clip['start'], 'clip start'), number(clip['end'], 'clip end')
        rate = number(clip.get('rate', 1.0), 'clip rate')
        if not 0 <= start < end <= duration + 1e-6 or not 0 < rate <= 10:
            raise ValueError('Clip outside source or invalid rate')
        length = (end - start) / rate
        timeline.append({'index': index, 'source_start': start, 'source_end': end, 'rate': rate,
                         'output_start': offset, 'output_end': offset + length})
        for word in words:
            a, source_end = float(word['start']), float(word['end'])
            # Clamp only the validated ASR overshoot at source EOF, never at a cut.
            b = min(source_end, duration)
            if b <= start or a >= end:
                continue
            if a < start - 1e-6 or b > end + 1e-6:
                raise ValueError(f'Clip {index} cuts inside word {word["text"]!r} at [{a}, {b}]')
            output_start, output_end = offset + (a - start) / rate, offset + (b - start) / rate
            captions.append({'text': word['text'], 'startMs': round(output_start * 1000),
                             'endMs': round(output_end * 1000), 'timestampMs': round(output_start * 1000),
                             'confidence': word.get('probability'), 'source_start': a, 'source_end': source_end,
                             'clip_index': index})
        offset += length
    return {'schema': 'media-studio.captions.v1', 'source': transcript.get('source'),
            'source_sha256': transcript.get('source_sha256'), 'duration': offset,
            'clips': timeline, 'captions': captions}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('transcript', type=Path)
    parser.add_argument('edit', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise FileExistsError('Output exists; choose a new output or explicitly manage the old project version')
    transcript = json.loads(args.transcript.read_text(encoding='utf-8-sig'))
    edit = json.loads(args.edit.read_text(encoding='utf-8-sig'))
    result = remap(transcript, edit)
    write_new_json(args.output.resolve(), result)
    print(json.dumps({'output': str(args.output), 'duration': result['duration'],
                      'captions': len(result['captions'])}, ensure_ascii=False))
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, KeyError, TypeError, ValueError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        raise SystemExit(1)
