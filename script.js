var noteInterval;

function play() {
  Tone.Transport.start();
  // play a note every 4 seconds
  noteInterval = setInterval(playNote, 4000);
}

function stop() {
  clearInterval(noteInterval);
}

// Define the root URL of the sample files
const sampleRootUrl = 'https://tonejs.github.io/audio/salamander/';

// Define the note names and corresponding file names
const noteFiles = {
  'C1': 'C3.mp3',
  'C2': 'C3.mp3',
  'C3': 'C3.mp3',
  'C4': 'C4.mp3',
  'C5': 'C5.mp3',
  'C6': 'C6.mp3'
};

// create a reverb effect
const reverb = new Tone.Reverb({
  decay: 15,
  wet: 1
}).toDestination();

// const freeverb = new Tone.Freeverb({
//   roomSize: 0.5
// }).toDestination();
// const freeverb = new Tone.Freeverb().toDestination();
// freeverb.roomSize = 1;

const pianoSampler = new Tone.Sampler({
	urls: noteFiles,
	baseUrl: sampleRootUrl
}).connect(reverb);

// // create a synth to play the notes
// const synth = new Tone.PolySynth({
//   oscillator: {
//     type: "triangle"
//   },
//   envelope: {
//     attack: 2,
//     decay: 2,
//     sustain: 1,
//     release: 4
//   }
// }).connect(reverb);

// generate an array of notes
function generateNotes() {
  const notes = ["C", "F#", "G", "B"];
  const octaves = [3, 4, 5];
  const result = [];

  for (let i = 0; i < octaves.length; i++) {
    for (let j = 0; j < notes.length; j++) {
      result.push(notes[j] + octaves[i]);
    }
  }

  return result;
}

const notes = generateNotes();

// play a note randomly from the generated array of notes
function playNote() {
  const note = notes[Math.floor(Math.random() * notes.length)];
  console.log('note: ' + note);
  pianoSampler.triggerAttackRelease(note, "1n");
}

  
