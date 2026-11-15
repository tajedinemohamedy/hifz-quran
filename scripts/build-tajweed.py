"""Builds public/data/tajweed.json: the expected Warsh tajweed of every verse, from the official HisnLabs tajweed-v2
Warsh adapter (warsh.py) and rule engine (imam.py, Apache-2.0) over the quran-transcript phonetizer (MIT).

usage: python -I scripts/build-tajweed.py <dir with warsh.py + imam.py> public/data/quran.json public/data/tajweed.json
needs: pip install quran-transcript Levenshtein

A verse is recited straight through, or with stops at its stop marks (ۖ). Stored per verse:
  [phonemes, starts, units, cuts]  the whole verse read without stopping (its last word in pausal form)
    starts: where each word's sounds begin; word k is phonemes[starts[k]:starts[k+1]]
    units:  flat UNIT fields per tajweed point, positions absolute in phonemes
    cuts:   per stop mark [k, end, start]: word k as said when stopping on it and word k+1 as said when starting
            again, each [phonemes, units] with positions relative to that word (null when unreadable)
A verse the phonetizer cannot read is null: it is still followed word by word, without tajweed remarks."""
import json, sys

sys.stdout.reconfigure(encoding="utf-8")
sys.path.insert(0, sys.argv[1])
import warsh, imam  # noqa: E402
from quran_transcript import Aya  # noqa: E402

# KFGQPC Warsh v10 writes the open tanween with these marks; the adapter reads the Unicode open-tanween letters
OPEN_TANWEEN = str.maketrans({"ٗ": "ࣰ", "ٞ": "ࣱ", "ٖ": "ࣲ"})
# «امرئٍ»: hamza below a final ے with open tanween → hamza on its yāʾ seat, which the adapter reads
SPELLING = {"ےࣲٕ": "ئࣲ"}
KINDS = ["madd", "qalqalah", "ikhfa", "iqlab", "ghunnah", "idgham_ghunnah", "idgham", "shadda"]
RULES = ["", *imam.MADD]
UNIT = "s e kind golden allowedMask rule".split()  # the flat unit layout


def units_of(ref, lo, hi):
    """the units starting in phonemes[lo:hi], positions relative to lo"""
    out = []
    for u in ref.units:
        if lo <= u.s < hi:
            out += [u.s - lo, u.e - lo, KINDS.index(u.kind), u.golden, sum(1 << n for n in u.allowed), RULES.index(u.rule)]
    return out


def word(ref, k):
    """word k of `ref` alone: its sounds up to the next word's, and its units"""
    starts = [s for s, _ in ref.spans]
    lo, hi = starts[k], starts[k + 1] if k + 1 < len(starts) else len(ref.phonemes)
    return [ref.phonemes[lo:hi], units_of(ref, lo, hi)]


def expected(words, where, failed):
    try:
        return imam.expected(words, riwaya="warsh")
    except Exception as e:  # noqa: BLE001 - one unreadable passage must not stop the build
        failed.append(f"{where} ({type(e).__name__})")
        return None


def phonetizer_words(s, a, words):
    text = " ".join(w.translate(OPEN_TANWEEN) for w in words)
    for x, y in SPELLING.items():
        text = text.replace(x, y)
    toks = warsh.words(text)
    if len(toks) != len(words):
        raise SystemExit(f"{s}:{a}: {len(toks)} tokens for {len(words)} words")
    ph = warsh.phrase([w for w, _ in toks])
    if (a == 1 and s in warsh.MUQATTAAT) or (s, a) == (42, 2):  # the opening letters, read the Hafs way
        ph[0] = Aya(s, a).get().uthmani.split()[0]
    if (s, a) == (42, 1):  # Warsh 42:1 opens with both groups (حمٓ عٓسٓقٓ): its 2nd word is Hafs 42:2's
        ph[1] = Aya(42, 2).get().uthmani.split()[0]
    return ph, [k for k, (_, stop) in enumerate(toks) if stop and k < len(toks) - 1]


def main():
    V = json.load(open(sys.argv[2], encoding="utf-8"))["V"]
    out, vocab, failed = [], set(), []
    for i, (s, a, _page, words, _marks) in enumerate(V):
        ph, marks = phonetizer_words(s, a, words)
        full = expected(ph, f"{s}:{a}", failed)
        if not full:
            out.append(None)
            continue
        # the breaths between stop marks, then each mark from the breaths on either side of it
        bounds = list(zip([0] + [k + 1 for k in marks], marks + [len(ph) - 1]))
        breaths = [expected(ph[x:y + 1], f"{s}:{a} words {x}-{y}", failed) for x, y in bounds]
        cuts = [[k, word(breaths[j], k - bounds[j][0]) if breaths[j] else None, word(breaths[j + 1], 0) if breaths[j + 1] else None]
                for j, k in enumerate(marks)]
        out.append([full.phonemes, [x for x, _ in full.spans], units_of(full, 0, len(full.phonemes)), cuts])
        vocab.update(full.phonemes)
        if i % 1000 == 0:
            print(f"{i}/{len(V)}", flush=True)
    json.dump({"v": 2, "kinds": KINDS, "rules": RULES, "unit": UNIT, "verses": out},
              open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("symbols:", "".join(sorted(vocab)))
    print("done", len(out), "verses;", len(failed), "not readable:", failed)


main()
