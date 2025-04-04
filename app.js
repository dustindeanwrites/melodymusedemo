// Keep track of the melody sequences we've already generated (we'll use a Set for simplicity)
let melodyCounter = 1;
const savedMelodies = new Set();

document.getElementById("generate").addEventListener("click", function() {
    const key = document.getElementById("key").value;
    const bpm = parseInt(document.getElementById("bpm").value);
    const measures = parseInt(document.getElementById("measures").value);
    let melodyName = document.getElementById("melody-name").value.trim();

    // If the Melody Name is still the default value, increment the filename
    if (melodyName === "Melody") {
        melodyName = `Melody_${melodyCounter}`;
        melodyCounter++;  // Increment the counter for next time
    }

    // Check if the input values are valid
    if (!key || !bpm || !measures || !melodyName) {
        alert("Please fill all the fields before generating the melody.");
        return;
    }

    // Get the scale for the selected key
    const scale = getScale(key);
    const melody = generateMelody(scale, measures, bpm);

    // Generate a unique identifier for this melody sequence
    const melodyIdentifier = JSON.stringify(melody);

    // Check if this melody has already been saved
    if (savedMelodies.has(melodyIdentifier)) {
        // If melody is already saved, use the same name
        document.getElementById("status").textContent = `This melody has already been generated and saved as '${melodyName}'!`;
    } else {
        // If it's a new melody, add it to the saved set and increment the counter if needed
        savedMelodies.add(melodyIdentifier);

        // Play the melody using Tone.js
        playMelody(melody, bpm);

        // Update the status message
        document.getElementById("status").textContent = `Playing the melody for '${melodyName}' at ${bpm} BPM!`;
    }
});

// Function to generate a random melody within the scale
function generateMelody(scale, numMeasures, bpm) {
    const melody = [];
    const totalNotes = numMeasures * 4; // 4 beats per measure (simplification)

    // Generate random notes from the scale
    for (let i = 0; i < totalNotes; i++) {
        const note = scale[Math.floor(Math.random() * scale.length)];
        melody.push(note);
    }

    return melody;
}

// Function to map the key to a scale (for simplicity, using only major/minor)
function getScale(key) {
    const majorScale = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"]; // C major scale
    const minorScale = ["C4", "D4", "D#4", "F4", "G4", "G#4", "A#4"]; // C minor scale

    if (key.includes("Major")) {
        return majorScale;
    } else if (key.includes("Minor")) {
        return minorScale;
    }

    return majorScale; // Default to C Major if unknown
}

// Function to play the melody using Tone.js
function playMelody(melody, bpm) {
    const synth = new Tone.Synth().toDestination();
    const now = Tone.now(); // Get the current time from Tone.js

    // Set the BPM using Tone.js Transport (this will control the tempo of the notes)
    Tone.Transport.bpm.value = bpm;

    // Calculate the time interval between each note based on the BPM
    const interval = Tone.Time("4n").toSeconds(); // Each note is an eighth note

    let time = now; // Start at the current time

    // Add each note to the Tone.js Transport at the correct time
    melody.forEach(note => {
        // Schedule the note to be played at the given time
        synth.triggerAttackRelease(note, "8n", time); // "8n" is an eighth note duration
        time += interval; // Move to the next note in time
    });

    // Start the Transport to play the notes
    Tone.Transport.start();
}

// Create the MIDI file and allow the user to download it
document.getElementById("download").addEventListener("click", function() {
    const key = document.getElementById("key").value;
    const bpm = parseInt(document.getElementById("bpm").value);
    const measures = parseInt(document.getElementById("measures").value);
    let melodyName = document.getElementById("melody-name").value.trim();

    // If the Melody Name is still the default value, increment the filename
    if (melodyName === "Melody") {
        melodyName = `Melody_${melodyCounter}`;
        melodyCounter++;  // Increment the counter for next time
    }

    // Check if the input values are valid
    if (!key || !bpm || !measures || !melodyName) {
        alert("Please fill all the fields before generating the melody.");
        return;
    }

    // Get the scale for the selected key
    const scale = getScale(key);
    const melody = generateMelody(scale, measures, bpm);

    // Generate a unique identifier for this melody sequence
    const melodyIdentifier = JSON.stringify(melody);

    // Check if this melody has already been saved
    if (savedMelodies.has(melodyIdentifier)) {
        // If melody is already saved, use the same name
        document.getElementById("status").textContent = `This melody has already been generated and saved as '${melodyName}'!`;
    } else {
        // If it's a new melody, add it to the saved set and increment the counter if needed
        savedMelodies.add(melodyIdentifier);

        // Create a new MIDI file using @tonejs/midi
        const midi = new Midi();

        // Add a track
        const track = midi.addTrack();

        // Add each note to the MIDI track
        let time = 0; // Start time
        const interval = Tone.Time("4n").toSeconds(); // Each note is an eighth note

        melody.forEach(note => {
            const midiNote = Tone.Frequency(note).toMidi(); // Convert the note to MIDI
            track.addNote({
                midi: midiNote,
                time: time, // Schedule at the current time
                duration: interval, // Duration of the note
            });
            time += interval; // Move to the next note in time
        });

        // Generate the MIDI file as a blob and create a download link
        const midiData = midi.toArray(); // Convert the MIDI object to an array of bytes
        const midiBlob = new Blob([midiData], { type: 'audio/midi' });
        const midiUrl = URL.createObjectURL(midiBlob);

        // Create a download link
        const a = document.createElement('a');
        a.href = midiUrl;
        a.download = `${melodyName}.mid`;
        a.click();

        // Update the status message
        document.getElementById("status").textContent = `MIDI file for '${melodyName}' is ready for download!`;
    }
});

// Close the window (in browser, we can just hide or do nothing)
document.getElementById("close").addEventListener("click", function() {
    window.close();
});
