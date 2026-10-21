"""Local production ASR. No model download, source modification or API calls."""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import sys
import tempfile


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def write_new_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(mode='w', encoding='utf-8', dir=path.parent,
                                         prefix='.words-', suffix='.tmp', delete=False) as f:
            temporary = Path(f.name)
            json.dump(data, f, ensure_ascii=False, indent=2, allow_nan=False)
            f.flush()
            os.fsync(f.fileno())
        # Atomic no-clobber publication on the local NTFS runtime.
        os.link(temporary, path)
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def cuda_directories() -> list[object]:
    if os.name != 'nt':
        return []
    root = Path(sys.prefix) / 'Lib' / 'site-packages' / 'nvidia'
    dirs = [root / package / 'bin' for package in ['cublas', 'cudnn', 'cuda_nvrtc', 'cuda_runtime']]
    absent = [str(p) for p in dirs if not p.is_dir()]
    if absent:
        raise RuntimeError('Missing CUDA directories in this Python environment: ' + ', '.join(absent))
    # CTranslate2 also loads CUDA by name; its loader needs these on this process's PATH.
    os.environ['PATH'] = os.pathsep.join([*(str(p) for p in dirs), os.environ.get('PATH', '')])
    return [os.add_dll_directory(str(p)) for p in dirs]


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--language', help='Whisper language code; omitted means autodetect')
    parser.add_argument('--no-vad', action='store_true', help='Disable VAD for a targeted diagnostic/recovery')
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    target = args.output.resolve()
    if not source.is_file() or target == source:
        raise ValueError('Expected an input file and a different JSON output path')
    before = source.stat()
    config = {'model': 'large-v3', 'device': 'cuda', 'compute_type': 'float16',
              'language': args.language, 'beam_size': 5, 'vad_filter': not args.no_vad,
              'word_timestamps': True, 'faster_whisper': importlib.metadata.version('faster-whisper')}
    source_hash = digest(source)
    if target.exists():
        cached = json.loads(target.read_text(encoding='utf-8-sig'))
        if cached.get('schema') == 'media-studio.words.v1' and cached.get('source_sha256') == source_hash and cached.get('config') == config:
            print(json.dumps({'status': 'cached', 'output': str(target), 'words': len(cached['words'])}, ensure_ascii=False))
            return 0
        raise FileExistsError('Output exists with different source/settings; choose a new project output')
    handles = cuda_directories()
    from faster_whisper import WhisperModel
    # local_files_only avoids treating a missing model as permission to download it.
    model = WhisperModel('large-v3', device='cuda', compute_type='float16', local_files_only=True)
    segments, info = model.transcribe(str(source), language=args.language, beam_size=5,
                                      vad_filter=not args.no_vad, word_timestamps=True)
    rows, words, next_progress = [], [], 0.0
    for segment in segments:
        rows.append({'start': segment.start, 'end': segment.end, 'text': segment.text,
                     'no_speech_prob': segment.no_speech_prob})
        for word in segment.words or []:
            words.append({'start': word.start, 'end': word.end, 'text': word.word,
                          'probability': word.probability})
        if segment.end >= next_progress:
            print(f'Processed speech through {segment.end:.1f} / {info.duration:.1f} seconds', file=sys.stderr, flush=True)
            next_progress = segment.end + 30.0
    after = source.stat()
    if (before.st_size, before.st_mtime_ns) != (after.st_size, after.st_mtime_ns) or digest(source) != source_hash:
        raise RuntimeError('Source changed during transcription; output was not published')
    if not words:
        raise RuntimeError('No timed words found; inspect the actual audio/VAD rather than fabricating captions')
    result = {'schema': 'media-studio.words.v1', 'source': str(source), 'source_sha256': source_hash,
              'config': config, 'duration': info.duration, 'language': info.language,
              'language_probability': info.language_probability, 'segments': rows, 'words': words}
    write_new_json(target, result)
    print(json.dumps({'status': 'written', 'output': str(target), 'words': len(words),
                      'language': info.language, 'duration': info.duration}, ensure_ascii=False))
    del handles
    return 0


if __name__ == '__main__':
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError) as error:
        print(f'ERROR: {error}', file=sys.stderr)
        raise SystemExit(1)
