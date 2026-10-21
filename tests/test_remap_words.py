"""Caption timing regressions; no Whisper installation is needed."""
import copy
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts'))
from remap_words import remap


class RemapWordsTests(unittest.TestCase):
    def test_eof_tolerance_preserves_source_and_caps_output(self):
        for end in (10, 10.02, 10.05):
            with self.subTest(end=end):
                source = {'duration': 10, 'words': [
                    {'text': 'last', 'start': 9.5, 'end': end}]}
                original = copy.deepcopy(source)
                output = remap(source, {'clips': [{'start': 0, 'end': 10}]})
                self.assertEqual(output['duration'], 10)
                self.assertEqual(output['captions'][0]['endMs'], 10000)
                self.assertEqual(output['captions'][0]['source_end'], end)
                self.assertEqual(source, original)

    def test_cutting_inside_a_word_is_rejected(self):
        source = {'duration': 10, 'words': [
            {'text': 'last', 'start': 9.5, 'end': 10.02}]}
        for clip in ({'start': 0, 'end': 9.7}, {'start': 9.7, 'end': 10}):
            with self.subTest(clip=clip), self.assertRaises(ValueError):
                remap(source, {'clips': [clip]})

    def test_reordering_and_rate_use_output_time(self):
        source = {'duration': 50, 'words': [
            {'text': 'A', 'start': 12, 'end': 13},
            {'text': 'B', 'start': 36, 'end': 37}]}
        output = remap(source, {'clips': [
            {'start': 35, 'end': 38, 'rate': 2},
            {'start': 12, 'end': 14},
            {'start': 35, 'end': 38}]})
        self.assertEqual(output['duration'], 6.5)
        self.assertEqual([c['text'] for c in output['captions']], ['B', 'A', 'B'])
        self.assertEqual([c['startMs'] for c in output['captions']], [500, 1500, 4500])
        self.assertEqual([c['endMs'] for c in output['captions']], [1000, 2500, 5500])

    def test_eof_after_another_clip_and_at_double_speed(self):
        source = {'duration': 10, 'words': [
            {'text': 'first', 'start': 0.5, 'end': 1},
            {'text': 'last', 'start': 9.5, 'end': 10.02}]}
        output = remap(source, {'clips': [
            {'start': 0, 'end': 2}, {'start': 8, 'end': 10, 'rate': 2}]})
        self.assertEqual(output['duration'], 3)
        self.assertEqual(output['captions'][-1]['startMs'], 2750)
        self.assertEqual(output['captions'][-1]['endMs'], 3000)

    def test_invalid_input_is_rejected(self):
        source = {'duration': 10, 'words': [
            {'text': 'last', 'start': 9.5, 'end': 10}]}
        for clip in (
            {'start': -1, 'end': 10},
            {'start': 0, 'end': 11},
            {'start': 0, 'end': 10, 'rate': float('nan')},
            {'start': 0, 'end': 10, 'source': 'other'},
        ):
            with self.subTest(clip=clip), self.assertRaises(ValueError):
                remap(source, {'clips': [clip]})
        source['words'][0]['end'] = 10.051
        with self.assertRaises(ValueError):
            remap(source, {'clips': [{'start': 0, 'end': 10}]})


if __name__ == '__main__':
    unittest.main()
