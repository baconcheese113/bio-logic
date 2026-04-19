# Playtest Feedback — April 18, 2026

## Issues Found

### 1. Sanger Sequencer UX — Column selection is clunky

**Current:** Player moves a selection cursor left/right with arrow keys to pick a lane (A/T/G/C), then presses up/enter to call the base. Each base requires two inputs: select lane, then confirm.

**Problem:** The interaction model is unnecessarily indirect. You're scanning bottom-to-top through the gel and each row has exactly one band — which lane it's in IS the base. Having to move a selection cursor to that lane before calling it adds friction without adding challenge.

**Proposed fix — Rhythm-style keypress:**
Each column maps to a key: A, T, G, C. The player looks at where the next band is and presses the corresponding key. One keypress per base. Fast readers can type at speed; the challenge is *reading the gel correctly*, not fighting the input method.

Optional enhancement: bands fade from bottom to top over time, adding time pressure. Misreading costs you (wrong base entered). This turns sequencing into a skill check — pattern recognition under mild pressure — rather than a tedious arrow-key shuffle.

**Implementation:** The existing `handleGelKeydown` already accepts direct A/T/G/C keypresses — they just also move the selection cursor first. Remove the `selectedBaseIndex` concept entirely. The keys should directly call the base at `nextPosition` if it matches. Keep undo/clear. If they type the wrong letter then that is what they get in their output.

### 2. PCR doesn't show bp — but L5 briefing says "PCR shows ~1180 bp"

**Current:** The PCR tube desk card just says "Amplified DNA" (success) or "✗ No amplification" (fail). The gel shows bands at positions, but the player has to eyeball the size by comparing to the ladder.

**Problem:** The L5 briefing says *"PCR shows a ~1180 bp insert"* — but the player never actually sees bp on any PCR result. The briefing is telling the player information they can derive from their own instruments, which would add additional depth to the level.

**Two options:**
- **(a) Remove the bp claim from the L5 briefing.** Change it to: *"PCR confirms there IS an insert, but the gel band sits right where both p53 (1180 bp) and malE (1180 bp) would land. They're the same size — gel alone can't tell them apart."* This way the player's own gel observation matches the story. They see one band near 1180 on the ladder and check the gene table themselves.
- **(b) Add bp estimation to the PCR tube / gel.** The gel could show approximate bp labels on hover or on the band itself (estimated from ladder position). This is actually realistic — scientists eyeball gel bands against the ladder to estimate size.

**Recommendation:** Option (a) for now. The gel already has a ladder; the player can (and should) learn to read it. Adding numeric labels removes one of the skill-building moments.

### 3. "Restriction Digest" as an instrument is conceptually off

**Current:** It's presented as its own instrument tab (✂️ Digest) alongside PCR, Gel, Sequencer.

**Problem:** Restriction digest isn't an instrument — it's a *bench protocol*. You add enzyme to a tube of DNA, incubate, and then run the result on a gel. It's more like "a thing you do to a tube" than "a machine you load a sample into."

**No code change needed yet.** But worth noting that if we ever add more "bench techniques" (ligation, transformation, miniprep), they should all work the same way — you do something to a tube, it produces a new tube, and you load THAT on an instrument. The current "digest as instrument" is fine for now because it works mechanically. Just keep the terminology clean: maybe rename the tab from "✂️ Digest" to "✂️ Bench" or keep it as-is since the player understands what it does.

### 4. L5 — Restriction digest results are confusing, no reasoning scaffold

**Current flow:** Player picks an enzyme (e.g. EcoRI), clicks "Run Digest," gets a digest-tube on the desk. Drags it to gel. Sees fragment bands. Then… what?

**The problem is the player has no reference for what the result SHOULD look like.** They see 3 bands (say: 500, 1100, 2100 for EcoRI on malE) but they have no way to know:
- How many fragments p53 would produce with EcoRI
- How many fragments malE would produce with EcoRI
- Which pattern matches which gene

The reference book shows enzyme cut sites (`G↓AATTC`) but NOT *where* those sites fall inside each candidate gene. Without a reference pattern to compare against, the gel result is meaningless. The player is just staring at bands with no basis for interpretation.

**Proposed fix — Add expected digest patterns to reference book:**

Add a new book section or extend the enzyme entries with a comparison table:

```
EcoRI (G↓AATTC):
  p53:  2 fragments → [1180, 2520]  (no internal EcoRI site — cuts backbone only)
  malE: 3 fragments → [300, 880, 2520]  (1 internal site — cuts insert + backbone)

BamHI (G↓GATCC):
  p53:  3 fragments → [480, 700, 2520]  (1 internal site)
  malE: 2 fragments → [1180, 2520]  (no internal BamHI site — cuts backbone only)
```

Now the player can: (1) pick an enzyme, (2) run digest + gel, (3) count their fragments, (4) compare to the table. If they see 3 fragments with EcoRI → that matches malE. If they see 2 fragments → that matches p53. **This is actual deductive reasoning** — the player is choosing a diagnostic test and interpreting results against known expectations.

Also: the briefing should make the goal clearer. Something like: *"The reference book shows how each enzyme cuts each candidate differently. Run a digest, load the result on a gel, and compare the fragment pattern to the reference to determine which gene is actually in the insert slot."*

### 5. L6 — No reasoning required, just busywork

**Current:** 4 tubes × 4 antibodies = 16 possible tests. Budget of 8 wells. Player can test every tube with any 2 antibodies and get definitive answers. Or just test all 4 tubes against one antibody — if one lights up, you know which tube has that protein. Repeat for a second antibody. 8 tests covers it all mechanically.

**The problem:** There's no *wrong* strategy. Every combination of tests gives useful information. The player doesn't need to think about WHICH tests to run — they just run tests until they have enough data. This is laboratory busywork, not a puzzle.

**Proposed redesign — introduce ambiguity that requires reasoning:**

**Option A — Cross-reactive antibodies:**
Some antibodies cross-react. Anti-GFP also weakly binds YFP. Anti-Amylase also weakly binds Lysozyme. Now a "positive" result doesn't always mean what you think. The player has to design tests that disambiguate: use an antibody that CAN'T cross-react to nail down one tube, then use process of elimination.

Reference book would say:
```
Anti-Insulin: binds Insulin only
Anti-GFP: binds GFP (strong), also YFP (weak)
Anti-Amylase: binds Amylase (strong), also Lysozyme (weak)
Anti-Lysozyme: binds Lysozyme only
```

Now testing Tube A with Anti-GFP and getting "positive" doesn't tell you if it's GFP or YFP. You need a second test or a different antibody. Budget pressure forces you to plan.

**Option B — More tubes, same budget (simpler to implement):**
6 tubes, 6 proteins, budget of 8. Brute-force needs 24 tests (6×4 at minimum). With 8 tests, the player MUST use deduction: test all 6 tubes with one antibody (6 wells → identifies one tube). Then has 2 tests left for 5 remaining tubes. Must use process of elimination + strategic antibody choice.

**Option C — Partial information (weakest but easiest):**
ELISA gives "strong positive / weak positive / negative" instead of binary. Strong positive = the tube definitely has that protein. Weak positive = could be that protein or a closely related one. Player has to triangulate.

**Recommendation:** Option A (cross-reactivity) is the most biologically authentic and creates real deductive puzzles. It teaches that *antibody specificity matters* — a real lesson in immunology.

### 6. L7 — Same problem as L6, no reasoning

**Current:** 3 samples × 4 primers. Each species has exactly one unique marker. Test Sample 1 with lacZ primer → no band → not E. coli. Test with mecA → band → it's MRSA. Repeat for the other samples. No wrong strategy exists.

**The problem is the same as L6:** the reference spells out exactly which primer identifies which species. The player just needs to mechanically run each test. There's no ambiguity, no deduction, no interesting decision.

**Proposed redesign — shared genes and partial markers:**

Make the gene presence table more realistic:

```
           lacZ    mecA    toxA    16S    blaZ    oprL
E. coli     ✓       ✗       ✗      ✓       ✗       ✗
MRSA        ✗       ✓       ✗      ✓       ✓       ✗
Pseudo.     ✗       ✗       ✓      ✓       ✗       ✓
```

With 6 primers and a gel-lane budget of 5, the player can't just test everything. They need to pick *discriminating* primers. 16S rRNA is useless (all positive). blaZ only helps confirm MRSA vs the others. The optimal strategy is to pick primers that give unique patterns with minimal tests.

Even better: **don't give the player the full table.** Give them the reference book entries for each gene (which species carry it) and make them build the mental table themselves. The puzzle becomes: "Read the references, plan an experiment, run minimal tests, and deduce the mapping."

Budget of 4-5 gel lanes forces strategy. A player who tests each sample with 16S rRNA first wastes 3 lanes and learns nothing.

## Summary

| Issue | Severity | Fix Effort |
|-------|----------|------------|
| Sanger key UX | Low (polish) | Small — remove `selectedBaseIndex`, direct keypress only |
| PCR bp claim in L5 | Medium (consistency) | Small — rewrite briefing text |
| Digest as instrument | Low (naming) | None for now, just awareness |
| L5 no reference pattern | High (unplayable) | Medium — add digest comparison table to reference book |
| L6 no reasoning | High (busywork) | Medium — add cross-reactive antibodies or expand tube count |
| L7 no reasoning | High (busywork) | Medium — add shared genes + don't show full table upfront |