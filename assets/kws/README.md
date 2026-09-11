# Keyword spotting model

On-device English KWS for the fridge tablet. No Picovoice, no AccessKey, no network wake service.

## Engine

[sherpa-onnx](https://k2-fsa.github.io/sherpa/onnx/kws/pretrained_models/index.html) zipformer
`sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01` (GigaSpeech XL, English, ~3.3M params).

This folder ships the **int8** encoder / decoder / joiner plus `tokens.txt` and `bpe.model`.

Upstream archive (if you need to re-fetch):

https://github.com/k2-fsa/sherpa-onnx/releases/download/kws-models/sherpa-onnx-kws-zipformer-gigaspeech-3.3M-2024-01-01.tar.bz2

```sh
npm run fetch-kws-model
```

## Keyword file format

One phrase per line, sherpa-onnx tokens (BPE pieces) plus optional score / threshold / id:

```
▁NE S T OR :1.0 #0.42 @nestor
▁GOOD B Y E ▁NE S T OR :1.5 #0.22 @goodbye_nestor
```

| Marker | Meaning |
| --- | --- |
| `:1.0` | boosting score (higher = easier to match) |
| `#0.42` | trigger threshold (higher = **less** sensitive / fewer false wakes) |
| `@nestor` | id returned when the phrase is spotted |

`keywords.nestor.txt` is the default wake (`Nestor`). `keywords.hey_nestor.txt` is the fallback (`Hey Nestor`) if the single word is jumpy. Switch with `WAKE_PHRASE` in `src/config.ts` — no new phase, just a config change and an APK/JS rebuild.

## Re-encode a phrase

Phrases must be **UPPERCASE** before BPE (this model’s training convention):

```sh
python3 -c "
import sentencepiece as spm
sp = spm.SentencePieceProcessor(model_file='assets/kws/bpe.model')
print(' '.join(sp.encode('HEY NESTOR', out_type=str)))
"
```

Install `sentencepiece` once (`pip install sentencepiece`). Then paste the pieces into a keywords file with `:score #threshold @id`.
