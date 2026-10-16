# Polashi — Sound Prompts

The latest version of every sound prompt from our chat, in one place.

**Where the files go:** `C:\Projects\polashi\client\public\assets\sounds\`
**Format:** `.mp3`, named exactly as shown below. The game picks each one up automatically. Until a file exists, that moment is just silent.

**In Suno:** paste the prompt into **Styles**, leave **Lyrics** empty, and turn **Instrumental** ON.

**Two notes from checking the game code:**
- `clash-ambience.mp3` (#10) now plays during the rain at Palashi (the full-screen battle the waiting players see while the team picks its cards) and stops dead when the last card is in. `cannon-boom.mp3` (#15) is new: one cannon shot for each card played.
- The night phase also has a slot called `tent-ambience.mp3` (quiet looping background). It was never on the list of 14, so there's no prompt for it yet.

---

## 14. bg-music.mp3 — DONE

Loops from the landing screen through the whole session. It's already made and sits in `client\public\assets\sounds\`.

---

## 1. nawab-reveal.mp3

**Plays:** when a Nawab player's role card is revealed. About 4 seconds.

**Latest version (for an AI that takes a written description):**

> The vibe is the feeling of being in the presence of someone born to rule. Ancient inherited power that fills a room without effort. Silk robes, marble floors, gold everywhere, the smell of oud and sandalwood. A man who speaks softly because everyone leans in to hear him. Absolute calm confidence, the kind that only comes from generations of royalty. Warm but untouchable. Regal but human. The specific emotion of a king who loves his kingdom deeply and would die before surrendering it. Like standing inside a palace at golden hour, light streaming through carved stone windows, and feeling that this place and this moment and this ruler are eternal and magnificent and worth fighting for. Pride without arrogance. Strength without violence. The sound of a crown being placed on a head that was always meant to wear it.

**Suno version (fits the 1000-character Styles box). Song title: `Authority`**

> single massive orchestral chord, full trombone and bass trombone section sustaining fortissimo on D2, French horns holding harmony on A2, contrabass bowing slow sustained root note, cello section adding depth, concert bass drum slow quiet roll underneath, chord fades in from silence over 1 second sustains 1.5 seconds then slowly decays, no melody no solo instruments no violins no flute no percussion hits no high notes, pure low brass and string sustained chord, dark cold powerful dominant authoritative, not sad not triumphant just heavy and commanding, D minor, Hans Zimmer style low brass texture, 4 seconds, instrumental only no vocals

---

## 2. eic-reveal.mp3

**Plays:** when an EIC player's role card is revealed. About 4 seconds.

> A 4-second dark cinematic sting. Imagine a well-dressed nobleman smiling warmly at his king while secretly signing a deal with the enemy behind his back — charming on the surface, rotten underneath. The sound should feel elegant but deeply wrong. Begin at 0.0s with near silence, then at 0.6s drop a single cold isolated harpsichord note with long reverb, the kind of note that sounds almost beautiful but slightly off — like a smile that doesn't reach the eyes. At 1.2s bring in slow creeping low cello and double bass playing a quiet dissonant minor line that crawls upward by half steps, understated and sinister, never loud. Layer a faint high violin harmonic above, thin and unsettling like a whispered secret. Around 2.5s add a single quiet low piano note, deep and resonant, and a barely-audible metallic shimmer — like a coin being placed on a table. No drums, no percussion, no big swell, no horror movie sounds. Keep everything restrained, refined, and quietly menacing — the sound of calculated betrayal, not violence. End at 3.6s on a single unresolved dissonant chord that hangs and slowly fades into silence, leaving a feeling of unease rather than fear. Mood: a backstabber, a charming traitor, a conspiracy hatched over fine wine. Sophisticated, cold, quietly dangerous. No vocals.

---

## 3. vote-yes.mp3

**Plays:** when a player taps Approve. About 0.3 seconds.

> I am building a multiplayer social deduction game set in 1757 colonial Bengal during the Battle of Palashi. Players sit around a virtual war council table as historical commanders and vote on whether to approve a team for a secret mission. When a player taps the Approve button, I need a short satisfying confirmation sound that plays instantly. The sound should feel like it belongs in that world — ancient, physical, weighty, like a decision being made in a candlelit war tent. I need a 0.3-second short percussive UI confirmation sound, single hit, no melody, no music. Imagine a carved wooden approval token being placed firmly down on a heavy oak table. A deep satisfying woody knock with warm low-mid resonance, layered with a faint wax seal press underneath for officialness. Quick woody attack, fast natural decay, slight short reverb tail that dies within the sound itself. Close-mic'd, dry, tactile. Not a click, not digital, not modern. Organic, heavy, warm, final. Single clean impact, done in 0.3 seconds.

---

## 4. vote-no.mp3

**Plays:** when a player taps Reject. About 0.3 seconds.

> I am building a multiplayer social deduction game set in 1757 colonial Bengal during the Battle of Palashi. Players sit around a virtual war council table as historical commanders and vote on whether to approve a team for a secret mission. When a player taps the Reject button, I need a short sharp rejection sound that plays instantly and feels distinctly different from the approval sound — heavier, darker, more final. The sound should feel like it belongs in that world — ancient, physical, blunt, like a refusal delivered in a candlelit war tent. I need a 0.3-second short percussive UI rejection sound, single hit, no melody, no music. Imagine a general placing his flat hand firmly down on a thick oak table in quiet controlled refusal — not angry, not explosive, just final. A heavy dull blunt thud with strong low-end impact, slightly muffled damped attack, very short sharp reverb that cuts off abruptly. Notably darker and heavier than the approval sound. A faint low rumble underneath for gravity. Close-mic'd, dry, dense. Not a click, not digital, not modern. Single decisive impact, done in 0.3 seconds.

---

## 5. vote-pass.mp3

**Plays:** when the vote result shows Team Approved. About 1.5 seconds.

> A 1.5-second short triumphant resolution sting in a heroic Indian cinematic style. Key of G major, bright and affirming. Begin at 0.0s with a quick uplifting upward sweep of legato strings rising in pitch, layered with a light tabla flourish. At 0.5s land on a warm, full major chord from strings and a soft brass section, glowing and confident. Add a gentle bansuri flute note on top for warmth and a subtle tanpura drone underneath. At 1.0s let a single bright bell or chime ring out as the chord sustains and decays. Dynamics rise quickly then settle into a satisfying glow. Mood: relief, momentum, a plan coming together, quiet victory. Warm, hopeful, cinematic. No vocals. Fade to silence by 1.5s.

---

## 6. vote-fail.mp3

**Plays:** when the vote result shows Team Rejected. About 1.5 seconds.

> A 1.5-second short tense, deflating sting in a dark cinematic style. Key of A minor, unresolved and uneasy. Begin at 0.0s with a downward sliding low string glissando, sinking in pitch, accompanied by a single muted low piano note. At 0.5s introduce a dissonant minor cluster from cellos and double bass that tightens and darkens. Add a faint discordant high violin harmonic for unease. No percussion, no swell to loud — keep it tense and restrained. At 1.0s let everything sag and decay on a hanging, sour, unresolved note. Dynamics drop and deflate, like the air leaving a room. Mood: suspicion, distrust, a council fracturing, a setback. Cold, tense, uneasy. No vocals. Fade to darkness by 1.5s.

---

## 7. card-pick.mp3

**Plays:** when a player picks the Loyal or Betray card. About 0.4 seconds.

> A 0.4-second short tactile UI sound, single action, no melody. The crisp sound of a heavy playing card being firmly placed and pressed onto a wooden surface, layered with the subtle slide of cardstock and a soft wax-seal press underneath. Quick papery attack with a warm woody resonance and a fast natural decay. A faint metallic shimmer at the very start for a sense of importance, like a secret being committed. Dry, close, tactile, satisfying. Slight short reverb tail. No music, no tonal melody, no sustain. Single clean placement sound.

---

## 8. mission-success.mp3

**Plays:** when a chapter goes to the Nawab. About 2 seconds.

> A 2-second triumphant victory sting in a heroic Indian cinematic style. Key of D major, bold and bright. Begin at 0.0s with a confident dhol drum hit and a rising fanfare of brass and strings climbing in pitch and volume. Layer in celebratory tabla and a soaring bansuri flute line over the top. At 1.0s reach a full, glorious major chord swell, warm and powerful, with a shimmering cymbal and tanpura drone underneath. Let the chord sustain and ring out proudly. Dynamics build quickly to a strong, victorious peak. Mood: a battle won, honor upheld, the Nawab's banner held high. Regal, uplifting, cinematic. No vocals. Decay to silence by 2s.

---

## 9. mission-fail.mp3

**Plays:** when a chapter is sabotaged by the EIC. About 2 seconds.

> A 2-second dark, dreadful sting in a sinister cinematic style. Key of C minor, heavy and foreboding. Begin at 0.0s with a deep ominous low drum hit and a sinking, dissonant brass cluster that growls in the low end. At 0.6s bring in slow, descending low strings and a cold harpsichord note, building a sense of creeping doom. Add a faint metallic scrape and a low rumble for menace. No bright tones, no resolution. At 1.3s let everything sink into a heavy, dark, dissonant chord that looms and slowly fades. Dynamics are heavy and oppressive throughout. Mood: betrayal succeeded, sabotage, shadow falling over Bengal, dread. Cold, menacing, cinematic. No vocals. Decay into darkness by 2s.

---

## 10. clash-ambience.mp3

**Plays:** as a loop during the rain at Palashi, for the players waiting while the team picks its cards. It stops the moment the last card is in. About a 15-second loop.

> A 15-second seamlessly looping ambient soundscape with no melody. Heavy monsoon rain is the main layer: a dense, steady downpour on open ground and canvas tents, with water running and dripping. Behind it, distant battlefield atmosphere: low rumbling cannon fire far away, muffled war drums, the occasional far-off elephant trumpet and horse whinny, faint shouts lost in the rain. Underneath everything, a constant low sub-bass rumble like the earth trembling. Nothing sharp or sudden in the foreground; every battle sound is far away, blurred by rain and distance. The loop must start and end on exactly the same texture so it repeats invisibly. Mood: a battle raging in the rain, waiting for news, dread. Ambient, cinematic, immersive. No music, no melody, no vocals.

---

## 11. assassination.mp3

**Plays:** when the Assassination phase begins. About 3 seconds.

> A 3-second dramatic tension build in a dark cinematic thriller style. Key of D minor. Begin at 0.0s in complete silence, then at 0.3s introduce a single barely-audible low string tremolo, almost imperceptible, like a heartbeat. Slowly add a second dissonant string layer underneath, growing in volume. At 1.5s a quiet but firm low brass note enters, cold and threatening, sustained. At 2.0s layer in a distant low drum pulse, slow and deliberate, one hit. At 2.5s everything reaches a tense, dark, unresolved peak — strings trembling, brass sustaining, a faint high violin harmonic cutting through like a knife. Do not resolve. End abruptly or fade on that peak. Dynamics start near-silent and build to a restrained but menacing climax. Mood: a blade being drawn, a final decision, a man's fate being decided. Tense, slow, inevitable, cinematic. No vocals.

---

## 12. nawab-wins.mp3

**Plays:** on the end screen when the Nawab side wins. About 5 seconds.

> A 5-second full heroic victory theme in a grand Indian cinematic orchestral style. Key of D major, triumphant and majestic. Begin at 0.0s with a powerful dhol and taiko drum strike followed immediately by a sweeping brass and string fanfare rising in pitch and grandeur. Layer in celebratory tabla and a bold bansuri flute soaring above the orchestra. At 2.0s reach a full orchestral swell — all instruments together — warm brass, full strings, shimmering cymbals, tanpura drone holding the foundation. At 3.5s land on a glorious, sustained major chord that rings out proudly, full and bright, with a final dhol hit underneath for weight. Let the chord bloom and slowly decay. Dynamics build from powerful to overwhelming and majestic. Mood: Bengal survives, the Nawab stands, honor and loyalty rewarded, a kingdom preserved. Grand, regal, emotional, cinematic. No vocals. Fade to silence by 5s.

---

## 13. eic-wins.mp3

**Plays:** on the end screen when the EIC wins. About 5 seconds.

> A 5-second dark sinister victory theme in a cold cinematic orchestral style. Key of C minor, triumphant but menacing. Begin at 0.0s with a single deep ominous low brass stab, cold and blunt. At 0.5s introduce a slow, deliberate low string march — measured, inevitable, like a military procession. Layer in a harpsichord counter-melody above the strings, precise and calculated. At 2.0s bring in the full low brass section with a powerful dissonant chord that surges forward — overwhelming, imperial, crushing. Add a low war drum pulse underneath, steady and relentless. At 3.5s reach a dark, massive, dissonant orchestral swell — all instruments together but dark, no warmth, no brightness. Land on a heavy minor chord that sustains and echoes. Dynamics are heavy and imposing throughout, building to something oppressive and total. Mood: empire established, Bengal fallen, a conspiracy victorious, history changed forever. Cold, powerful, sinister, cinematic. No vocals. Decay to silence by 5s.

---

## 15. cannon-boom.mp3

**Plays:** once for each card played during the rain at Palashi, with a flash of cannon fire and a shake of the screen. About 2 seconds.

> A single 18th-century field cannon firing in heavy rain, close but not in your face. A deep, heavy black-powder boom with a sharp crack at the front and a thick low-end thump you feel in the chest, then a rolling echo that rumbles away across open fields for about a second and a half, with the rain still audible underneath. One shot only. No music, no voices, no metallic or sci-fi tones. Realistic, cinematic, weighty. About 2 seconds, fading back to the sound of rain.

---

## 16. thunder.mp3

**Plays:** a moment after each lightning flash during the rain at Palashi (every 6 to 15 seconds). About 4 seconds.

> Distant monsoon thunder over an open plain in heavy rain. A deep, rolling rumble that starts with a soft crack far away, swells into a long low roll that you feel more than hear, and slowly breaks up and fades over about four seconds, with steady rain audible underneath the whole time. Far away, not overhead: no sharp close crack, no echoing city reverb. No music, no voices, no cannon sounds. Realistic, cinematic, heavy. About 4 seconds, fading back to rain.
