let melodyCounter = 1;
const savedMelodies = new Set();

const durationWeights = {
    quick: { '4n': 0.5, '8n': 0.35, '2n': 0.1, '16n': 0.05 },
    slow: { '1n': 0.1, '2n': 0.2, '4n': 0.6, '8n': 0.1 },
    hyper: { '2n': 0.05, '4n': 0.1, '8n': 0.4, '16n': 0.45 }
};

const vexflowDurations = {
    '1n': 'w',
    '2n': 'h',
    '4n': 'q',
    '8n': '8',
    '16n': '16',
};

document.getElementById("generate").addEventListener("click", function () {
    const key = document.getElementById("key").value;
    const style = document.getElementById("style").value || "quick";
    const bpm = parseInt(document.getElementById("bpm").value);
    const measures = parseInt(document.getElementById("measures").value);
    let melodyName = document.getElementById("melody-name").value.trim();

    if (melodyName === "Melody") {
        melodyName = `Melody_${melodyCounter++}`;
    }

    if (!key || !bpm || !measures || !melodyName) {
        alert("Please fill all the fields before generating the melody.");
        return;
    }

    const scale = getFullScale(key);
    const melody = generateMelody(scale, measures, bpm, style);

    const melodyIdentifier = JSON.stringify(melody);

    if (savedMelodies.has(melodyIdentifier)) {
        document.getElementById("status").textContent = `This melody has already been generated and saved as '${melodyName}'!`;
    } else {
        savedMelodies.add(melodyIdentifier);
        playMelody(melody, bpm);
        renderNotation(melody);
        document.getElementById("status").textContent = `Playing the melody for '${melodyName}' at ${bpm} BPM!`;
    }
});

function getFullScale(key) {
    const baseNote = key.split(" ")[0];
    const isMinor = key.includes("minor");

    const intervals = isMinor
        ? [0, 2, 3, 5, 7, 8, 10]
        : [0, 2, 4, 5, 7, 9, 11];

    const baseMidi = Tone.Frequency(baseNote + "4").toMidi();
    const scale = [];

    [-1, 0, 1].forEach(oct => {
        intervals.forEach(i => {
            scale.push(Tone.Frequency(baseMidi + i + oct * 12, "midi").toNote());
        });
    });

    return scale;
}

function generateMelody(scale, measures, bpm, style) {
    const melody = [];
    const totalBeats = measures * 4;
    let currentNote = scale.find(note => note.includes("4"));
    let currentBeat = 0;

    while (currentBeat < totalBeats) {
        let duration = getWeightedDuration(style);
        let durBeats = Tone.Time(duration).toSeconds() / Tone.Time("4n").toSeconds();

        if (currentBeat + durBeats > totalBeats) continue;

        let note;
        if (Math.random() < 1 / 12) {
            note = "rest";
        } else {
            const move = Math.floor(Math.random() * 10);
            const index = scale.indexOf(currentNote);

            let newIndex = index;
            switch (move) {
                case 1: case 7: newIndex -= 1; break;
                case 2: case 8: newIndex += 1; break;
                case 3: newIndex -= 2; break;
                case 4: newIndex += 2; break;
                case 5: newIndex -= 3; break;
                case 6: newIndex += 3; break;
                case 9: break;
                default:
                    const randStep = Math.floor(Math.random() * 12) + 1;
                    newIndex += Math.random() < 0.5 ? -randStep : randStep;
                    break;
            }

            if (newIndex < 0) newIndex = 0;
            if (newIndex >= scale.length) newIndex = scale.length - 1;
            currentNote = scale[newIndex];
            note = currentNote;
        }

        melody.push({ note, duration });
        currentBeat += durBeats;
    }

    return melody;
}

function getWeightedDuration(style) {
    const weights = durationWeights[style];
    const rand = Math.random();
    let sum = 0;
    for (let [dur, weight] of Object.entries(weights)) {
        sum += weight;
        if (rand < sum) return dur;
    }
    return '4n';
}

function playMelody(melody, bpm) {
    const synth = new Tone.Synth().toDestination();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    let time = Tone.now();

    melody.forEach(({ note, duration }) => {
        if (note !== "rest") {
            synth.triggerAttackRelease(note, duration, time);
        }
        time += Tone.Time(duration).toSeconds();
    });

    Tone.Transport.start();
}

function renderNotation(melody) {
    const VF = Vex.Flow;
    const div = document.getElementById("notation");
    div.innerHTML = "";

    const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);
    renderer.resize(800, 200);
    const context = renderer.getContext();

    const stave = new VF.Stave(10, 40, 780);
    stave.addClef("treble").addTimeSignature("4/4");
    stave.setContext(context).draw();

    const notes = melody.map(({ note, duration }) => {
        let vfDur = vexflowDurations[duration] || 'q';
        if (note === "rest") {
            return new VF.StaveNote({ keys: ["b/4"], duration: vfDur + "r" });
        }

        const noteName = note.replace("#", "#/");
        const staveNote = new VF.StaveNote({
            keys: [noteName],
            duration: vfDur
        });

        if (note.includes("#")) {
            staveNote.addAccidental(0, new VF.Accidental("#"));
        }

        return staveNote;
    });

    const beams = VF.Beam.generateBeams(notes);
    VF.Formatter.FormatAndDraw(context, stave, notes);
    beams.forEach(beam => beam.setContext(context).draw());
}

document.getElementById("download").addEventListener("click", function () {
    const key = document.getElementById("key").value;
    const bpm = parseInt(document.getElementById("bpm").value);
    const measures = parseInt(document.getElementById("measures").value);
    let melodyName = document.getElementById("melody-name").value.trim();

    if (melodyName === "Melody") {
        melodyName = `Melody_${melodyCounter++}`;
    }

    if (!key || !bpm || !measures || !melodyName) {
        alert("Please fill all the fields before generating the melody.");
        return;
    }

    const scale = getFullScale(key);
    const style = document.getElementById("style").value || "quick";
    const melody = generateMelody(scale, measures, bpm, style);
    const melodyIdentifier = JSON.stringify(melody);

    if (!savedMelodies.has(melodyIdentifier)) {
        savedMelodies.add(melodyIdentifier);

        const midi = new Midi();
        const track = midi.addTrack();

        let time = 0;
        melody.forEach(({ note, duration }) => {
            const durSec = Tone.Time(duration).toSeconds();
            if (note !== "rest") {
                track.addNote({
                    midi: Tone.Frequency(note).toMidi(),
                    time,
                    duration: durSec
                });
            }
            time += durSec;
        });

        const midiData = midi.toArray();
        const midiBlob = new Blob([midiData], { type: 'audio/midi' });
        const midiUrl = URL.createObjectURL(midiBlob);

        const a = document.createElement('a');
        a.href = midiUrl;
        a.download = `${melodyName}.mid`;
        a.click();

        renderNotation(melody);
        document.getElementById("status").textContent = `MIDI file for '${melodyName}' is ready for download!`;
    }
});

document.getElementById("close").addEventListener("click", function () {
    window.close();
});
