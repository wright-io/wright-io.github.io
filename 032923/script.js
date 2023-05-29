function play() {
  if(Tone.context.state === "suspended") {
    Tone.Transport.bpm.value = 80;
    //Tone.Context.latencyHint = "balanced";
    Tone.Transport.start(1);
  }
  playMusic();
}

function stop() {
  Tone.Transport.cancel();
}

function playMusic () {
  instrument =  getPiano();  
  console.log("piano volume: " + instrument.volume.value);
  
  //startStaticEnoNoteLoops(instrument);
  //startNoteLoops(instrument, ["C4", "Eb4", "F4", "G4","Bb5", "G5"]);
  
  // midLowOstinato and melody are intended to be paired together
  // midLowOstinato(instrument, "F2");
  // melody(instrument);

  phasingOstinatoFifths(instrument);
}
 
function midLowOstinato(instrument, previousNote) { 

  //Choose note weighted
  var noteChoice = "F2";
  var phraseLength = 0;
  

  var note = new Tone.Loop(function(time){
      if (phraseLength == 0) {
        phraseLength = getWeightedRandom([{item: 8, weight: 7}, {item: 5, weight: 3}]);
        console.log("phrase length: " + phraseLength);

        if(noteChoice = "F2"){
          noteChoice = getWeightedRandom([
            {item: "F2", weight: 6}, {item: "Eb2", weight: 2}, {item: "Db2", weight: 1}
          ])
        } else if (noteChoice = "Eb2") {
          noteChoice = getWeightedRandom([
            {item: "F2", weight: 4}, {item: "Eb2", weight: 4}, {item: "Db2", weight: 2}
          ]);
        } else {
          // previousNote = "Db2"
          noteChoice = getWeightedRandom([
            {item: "F2", weight: 2}, {item: "Eb2", weight: 5}, {item: "Db2", weight: 3}
          ]);
        }
      }
      phraseLength -= 1;
      instrument.triggerAttackRelease(noteChoice, "1m", time, getRandomArbitrary(0.25, 0.5));
    }, "4n");
  
  note.set({
    "probability": 0.99,
    "humanize": true,
  });

  note.start(1);
}

function melody(instrument) {

  var noteWeights = [
    {item: null, weight: 3},
    {item: "F5", weight: 3},
    {item: "G5", weight: 3},
    {item: "A5", weight: 6},
    {item: "Bb5", weight: 3},
    {item: "C5", weight: 3},
    {item: "Db5", weight: 1},
    {item: "Eb5", weight: 3},
    {item: "F6", weight: 2}
  ]

  var events = [];
  for (var i = 0; i < 32; i++) {
    //const subEvents = new Array(getRandomInt(1, 4));
    const subEvents = new Array(getRandomInt(1, 4));
    console.log('subEvents length: ' + subEvents.length);

    for (let j = 0; j < subEvents.length; j++) {
      subEvents[j] = getWeightedRandom(noteWeights);
    }
    
    console.log("subevents: " + subEvents);

    events.push(subEvents);
  }

  console.log("Events: " + events);

  var choice1 = ["F4", "Bb4", "C5"];
  var choice2 = ["F6", "Db5", "G5", "C5"]; 
  

  var note = new Tone.Sequence(function(time, pitch){
    //play the note
    instrument.triggerAttackRelease(pitch, "2n", time, getRandomArbitrary(0.75, 1));
  }, events, "2n");

  note.set({
    "probability": .85,
    "humanize": "128n",
  });

  noteLength = getRandomInt(1, 3);

  note.start(1);
}

function playNote(time, instrument, noteChoice) {
  instrument.triggerAttackRelease(noteChoice, 15, time, getRandomArbitrary(0.1, 0.3));
}

function phasingOstinatoFifths(instrument) {
  
  // Starting with F2, play every 14 seconds, starting immediately
  var low1_noteChoice = "F2";
  var low1 = new Tone.Loop(function(time){
    // trigger for allotted time at the chosen velocity
    instrument.triggerAttackRelease(low1_noteChoice, 15, time, getRandomArbitrary(0.3, 0.6));
  }, beatsToSecs(12)).start(0); //had loop time at 14 beats (in seconds) for a long time
  low1.set({
    "probability": 0.9,
    "humanize": true,
  });

  // Starting with C3, play every 13.75 seconds, starting after 8 beats
  var low2_noteChoice = "C3";
  var low2 = new Tone.Loop(function(time){
    // trigger for allotted time at the chosen velocity
    instrument.triggerAttackRelease(low2_noteChoice, 15, time, getRandomArbitrary(0.3, 0.6));
  }, beatsToSecs(11.75)).start(7); //had loop time at 13.75 beats (in seconds) for a long time
  low2.set({
    "probability": 0.9,
    "humanize": "128n",
  });

  // Starting at 11 beats, every 12 beats, 
  // get a random chance of changing the low notes (independently)
  Tone.Transport.scheduleRepeat(function(time) {
    low1_noteChoice = getWeightedRandom([{item: "F2", weight: 2}, {item: "Eb2", weight: 1}]);
    low2_noteChoice = getWeightedRandom([{item: "C3", weight: 2}, {item: "Db3", weight: 1}]);
  }, beatsToSecs(12), beatsToSecs(11));

  // Set some note loops in motion
  // createNoteLoop(instrument, "F5", 19.75, 4);
  // createNoteLoop(instrument, "G5", 17.75, 8.25);
  // createNoteLoop(instrument, "A5", 21.25, 5.5);
  // createNoteLoop(instrument, "Bb5", 22, 12.5);
  // createNoteLoop(instrument, "C5", 18.5, 9);
  // createNoteLoop(instrument, "Db5", 20, 14);
  // createNoteLoop(instrument, "Eb5", 18.75, 3.5);
  // createNoteLoop(instrument, "F6", 17.75, 3);

  // Another more active part to layer in after some time
  var noteWeights = [
    {item: "F5", weight: 6},
    {item: "G5", weight: 6},
    {item: "A5", weight: 7},
    {item: "Bb5", weight: 6},
    {item: "C5", weight: 6},
    {item: "Db5", weight: 1},
    {item: "Eb5", weight: 6},
    {item: "F6", weight: 2}
  ]

  Tone.Transport.scheduleRepeat((time) => {
    // use the callback time to schedule events
    var seq = new Tone.Sequence(function(time, note){
      instrument.triggerAttackRelease(note, beatsToSecs(8), time, getRandomArbitrary(0.2, 0.7));
    }, generateFastMelodySequence(noteWeights), "2n").start();

    //var prob = Math.random();

    // Some crazy-ass shit from ChatGPT to adjust the probability over a beat cycle!
    let prob = 0.25;
    // Calculate the beat number within the current 288-beat cycle
    let cycleBeat = Tone.Transport.ticks / Tone.Transport.PPQ % 288;

    let baseProb;
    // For the first 256 beats, increase from 0.25 to 1
    if (cycleBeat < 256) {
      baseProb = 0.25 + Math.min(cycleBeat / 256 * 0.75, 0.75);
    } else {
      // For the last 32 beats, decrease back to 0.25
      baseProb = 1 - ((cycleBeat - 256) / 32 * 0.75);
    }

    // Add a random offset within a 0.25 range either above or below the baseProb. Make sure prob stays within [0, 1]
    // prob = Math.min(Math.max(baseProb + (Math.random() * 0.5 - 0.25), 0), 1);

    // Add a random offset within a 0.125 range either above or below the baseProb. Make sure prob stays within [0, 1]
    prob = Math.min(Math.max(baseProb + (Math.random() * 0.25 - 0.125), 0), 1);

    console.log("phrase probability: " + prob);
    console.log("beat (of 128 beat cycle): " + cycleBeat);
    seq.set({
      "probability": prob,
      "humanize": "128n",
      "loop": false
    }); 
  }, beatsToSecs(16));

  
}

/**
 * Generates a group of 6 beats worth of random notes, each with 1-4 notes.
 * To be used as a sequence for a Tone.js instrument.
 */
function generateFastMelodySequence(noteWeights) {
  let arrays = [];
  // let prev = null;
  // let current = null;

  for(let i = 0; i < 6; i++) {
      // By putting these in the inner loop, there should be a chance that the same note will
      // play twice in a row between the inner arrays
      // I like that it happens a little, but not too often
      let prev = null;
      let current = null;

      let subArray = [];
      let numOfElements = Math.floor(Math.random() * 6) + 1; // Random number between 1 and 4
    
      for(let j = 0; j < numOfElements; j++) {
        let maxAttempts = 1000;  // maximum number of attempts to get a different result
        let attempts = 0;        // current number of attempts
        
        // Make sure the same note doesn't play twice in a row
        // Not sure if this is the best way to do this, but it works
        while (true) {
          current = getWeightedRandom(noteWeights);
          if (current !== prev || attempts >= maxAttempts) {
            prev = current;
            break;
          }
          attempts++;
        }  
        subArray.push(current);

      }

      arrays.push(subArray);
  }
  console.log(arrays);
  return arrays;
}

function beatsToSecs(numberOfQuarterNotes) {
  return Tone.Time("4n").toSeconds() * numberOfQuarterNotes;
}

function getPiano() {
  // Define the root URL of the sample files
  sampleRootUrl = '../lib/samples/bainter/vsco2-piano-mf/'

  noteFiles = {
    'C#1': 'csharp1.wav',
    'C#2': 'csharp2.wav',
    'C#3': 'csharp3.wav',
    'C#4': 'csharp4.wav',
    'C#5': 'csharp5.wav',
    'C#6': 'csharp6.wav',
    'C#7': 'csharp7.wav'
  };

  var sampler = new Tone.Sampler({
    urls: noteFiles,
    baseUrl: sampleRootUrl,
    onload: () => {
      console.log("Sampler loaded");
    } 
  }).toDestination();

  // Don't know why, but if I don't take an action like creating an effect
  // the sampler returns too soon and notes don't work. 
  // Connecting an effect (or even just creating one) seems to allow the time neeeded to have 
  // the sampler ready. I think this might only be a problem with large note files.
  const reverb = new Tone.Reverb({
    decay: 5,
    preDelay: 0.1
  })

  var compressor = new Tone.Compressor({threshold: -10, ratio: 2, attack: 0.001, release: 0.00115});
  var delay = new Tone.FeedbackDelay(beatsToSecs(0.333), beatsToSecs(0.75));
  var autoPanner = new Tone.AutoPanner('12m').start();
  
  return sampler.chain(compressor, delay, reverb, autoPanner, Tone.Master);
  //return sampler.connect(reverb);
}

function getSynthWithEffects () {
  // Define a custom synth class that extends Tone.Synth
  class CustomSynth extends Tone.Synth {
    constructor() {
      super();
      // Custom synth settings go here
      // For example, to set the envelope attack time:
      this.envelope.attack = 0.2;
    }
  }

  // Create a new PolySynth with the CustomSynth class as the default voice
  polySynth = new Tone.PolySynth({
    voice: CustomSynth
  }).toDestination();  

  basicPolySynth = new Tone.PolySynth().toDestination();

  // const reverb = new Tone.Reverb({
  //   decay: 7,
  //   preDelay: 0.1
  // }).toDestination();

  // var compressor = new Tone.Compressor({threshold: -10, ratio: 2, attack: 0.001, release: 0.00115});
  // var delay = new Tone.FeedbackDelay(0.375, 0.7);
  // var autoPanner = new Tone.AutoPanner('12m').start();
  
  // return basicPolySynth.chain(compressor, delay, autoPanner, Tone.Master);
  return basicPolySynth;
}

function createNoteLoop (instrument, note, loopLengthSeconds, delaySeconds) {
  var noteEvent = new Tone.ToneEvent(function(time, pitch){
    instrument.triggerAttackRelease(pitch, 15 , time, getRandomArbitrary(0.5, 1));
  }, note);
  
  noteEvent.set({
    "loop" : true,
    "loopEnd" : beatsToSecs(loopLengthSeconds)
  });
  //console.log("playing " + note);
  noteEvent.start(beatsToSecs(delaySeconds));
  
  noteEvent.set({
    "probability": 0.9,
    "humanize": true,
  });

}

function startStaticEnoNoteLoops(instrument) {
  createNoteLoop(instrument, "F4", 19.7, 4);
  createNoteLoop(instrument, "Ab4", 17.8, 8.1);
  createNoteLoop(instrument, "C5", 21.3, 5.6);
  createNoteLoop(instrument, "Db5", 22.1, 12.6);
  createNoteLoop(instrument, "Eb5", 18.4, 9.2);
  createNoteLoop(instrument, "F5", 20.0, 14.1);
  createNoteLoop(instrument, "Ab5", 17.7, 3.1);
}

function startNoteLoops(instrument, notes) {
  loopLength = 0;
  loopDelay = 0;

  notes.forEach(note => {
    //pick random loop length per note
    loopLength = getRandomArbitrary(15, 23);
    //pick random loop delay per note  
    loopDelay = getRandomArbitrary(3, 10);

    console.log("added note loop: note: " + note + " loopLength: " + loopLength + " loopDelay: " + loopDelay);

    createNoteLoop(instrument, note, loopLength, loopDelay);
  });  
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getWeightedRandom(options) {
  var i;

  var weights = [options[0].weight];

  for (i = 1; i < options.length; i++)
      weights[i] = options[i].weight + weights[i - 1];
  
  var random = Math.random() * weights[weights.length - 1];
  
  for (i = 0; i < weights.length; i++)
      if (weights[i] > random)
          break;
  
  return options[i].item;
}


// Ideas
//
// Try doing some variations in the fast melody (reflection, inversion, etc.)
  // Remember some of the variations and come back to them peridically
  // Sometimes chose a new sequence, sometimes permute the current one, 
  // sometimes repeat the current one, sometimes go back to a previous one
// Try adding lower notes at some period

// Try asking ChatGPT for some ideas
// Length/Delay values from functions like sine, cosine
// Chords typically used in ambient music
// APIs to use as input for choosing seconds or notes values
