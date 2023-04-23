// Implied as seconds in the doc, but seems to be scaled by Transport bpm.
// Thus, 40 'seconds' at 60bpm is 80 seconds in clock time, etc.
const SO_CALLED_SECONDS_FOR_REPLACING_PARTS = 2;
const performances = [];
var grammar;

function startbuttonfunction() {
    Tone.Transport.toggle();
    Tone.Transport.bpm.value = 50;
    Tone.Context.latencyHint = "balanced";
}

/**
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
* Returns a random number between min (inclusive) and max (exclusive)
*/
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function generateEventData() {
  var pattern = grammar.expand('#pattern#');

  var eventPatternJSON = "[" + pattern.childText.substring(0, pattern.childText.length - 1) + "]";
  //console.log("eventPatternJSON: " + eventPatternJSON);
  var eventPatternArray = JSON.parse(eventPatternJSON);
  eventPatternArray.forEach(function(e){
    console.log(`p:${e.pitch}, d:${e.duration}, v:${e.velocity}`);
  });

  var events = [];
  var time = 0;

  eventPatternArray.forEach(function visit(eventPattern) {

    if(eventPatternArray.velocity != 'r') {
      events.push({time, note:eventPattern.pitch, dur:eventPattern.duration});
    }
    
    time += Tone.Time(eventPattern.duration).toSeconds();
  });

  var eventData = {events, totalDuration:time};

  return eventData;
}

function applyOctaveAdjustment(events, octaveAdjustment, octaveRange) {
  octaveRangeModifier = getRandomInt(0, octaveRange);

  newEvents = [];

  events.forEach(function(event) {
    var newNote = event.note;
    var octave = newNote.slice(newNote.length - 1);
    var newOctave = parseInt(octave) + octaveAdjustment + octaveRangeModifier;
    newNote = newNote.slice(0, newNote.length -1) + newOctave;  
    
    newEvents.push({time:event.time, note:newNote, dur:event.dur});
  });

  return newEvents;
}

function createPerformance(instrument, startTime, loopRepeatDelay, name, octaveAdjustment = 0, octaveRange = 0) {
  var eventData = generateEventData();
  part = new Tone.Part();
  performance = {name, part, instrument, octaveAdjustment, octaveRange, eventData};

  console.log(`created performance: ${performance.name}`);
  return updatePerformance(performance, startTime, loopRepeatDelay);
}

function updatePerformance(performance, startTime, loopRepeatDelay) {
  events = applyOctaveAdjustment(
    performance.eventData.events, performance.octaveAdjustment, performance.octaveRange);

  newPart = new Tone.Part(function(time, event){
    //the events will be given to the callback with the time they occur
    performance.instrument.triggerAttackRelease(event.note, event.dur, time);
  }, events);
  
  newPart.loop = true;
  newPart.loopEnd = performance.eventData.totalDuration + loopRepeatDelay;
  newPart.humanize = true;
  newPart.probability = 1;

  oldPart = performance.part;
  oldPart.stop(Tone.now());
  oldPart.dispose();

  newPart.start(startTime);
  performance.part = newPart;
  
  return performance;
}

function mutatePerformance() {
  var perfIdx = getRandomInt(0, performances.length - 1);
  perf = performances[perfIdx];
    
  console.log('mutating performance ' + perf.name + ' at ' + new Date().toLocaleString());

  startTime = Tone.now() + getRandomArbitrary(0, 3);
  loopRepeatDelay = getRandomArbitrary(0, 10);

  //TODO: There might be a more elegant way to write this choice structure
  var mutationIdx = getRandomInt(0, 2);
  // var mutationIdx = 0;

  if(mutationIdx > 0) {
    console.log(`updating ${perf.name} with new events`);
    var newEventData = generateEventData(perf.octaveAdjustment, perf.octaveRange);  
    perf.eventData = newEventData;
    perf = updatePerformance(perf, startTime, loopRepeatDelay);
  } else {
    var sourcePerfIdx = getRandomInt(0, performances.length - 1);
    sourcePerf = performances[sourcePerfIdx];
    console.log(`replacing ${perf.name} events with events from ${sourcePerf.name}`);
    perf.eventData = JSON.parse(JSON.stringify(sourcePerf.eventData));
    perf = updatePerformance(perf, startTime, loopRepeatDelay);
  }
}

function startPianoParts(piano) {
  var reverb = new Tone.Reverb(8);
  reverb.generate();

  var compressor = new Tone.Compressor({threshold: -10, ratio: 2, attack: 0.001, release: 0.00115});
  var delay = new Tone.FeedbackDelay(0.375, 0.7);
  var autoPanner = new Tone.AutoPanner('12m').start();
  
  piano.volume.value = -6;
  piano.chain(compressor, delay, reverb, autoPanner, Tone.Master);

  // console.log('starting piano1');
  console.log('starting piano2');
  performances.push(
    // createPerformance(piano, getRandomArbitrary(10, 15), getRandomArbitrary(0, 10), 'piano2', 3));
    createPerformance(piano, 13, getRandomArbitrary(0, 10), 'piano2', 3));
}

function startClarinetParts(clarinet) {
  var reverb = new Tone.Reverb(5).toMaster();
  reverb.generate();

  var compressor = new Tone.Compressor({threshold: -10, ratio: 2, attack: 0.001, release: 0.00115});
  
  clarinet.volume.value = -6;
  clarinet.chain(compressor, reverb);

  console.log('starting clarinet1');
  // performances.push(
  //   createPerformance(
  //     clarinet,
  //     getRandomArbitrary(5, 10),
  //     getRandomArbitrary(0, 10),
  //     'clarinet1',
  //     0,
  //     2));

  performances.push(
    createPerformance(
      clarinet,
      9,
      getRandomArbitrary(0, 10),
      'clarinet1',
      0,
      2));
}

function startCelloParts(cello) {
  var reverb = new Tone.Reverb(3).toMaster();
  reverb.generate();
  var compressor = new Tone.Compressor({threshold: -10, ratio: 2, attack: 0.001, release: 0.00115});
  var delay = new Tone.FeedbackDelay(1, 0.5);

  var autoFilter = new Tone.AutoFilter('4n');
  autoFilter.wet.value = 0.6;
  autoFilter.start();
  
  cello.volume.value = -8;
  cello.chain(compressor, autoFilter, delay, reverb);

  console.log('starting cello1');
  performances.push(
    createPerformance(cello, 0, getRandomArbitrary(0, 5), 'cello1', 3));
  console.log('starting cello2');
  performances.push(
    // createPerformance(cello, getRandomArbitrary(3, 8), getRandomArbitrary(0, 10), 'cello2', 3));
    createPerformance(cello, 7, getRandomArbitrary(0, 10), 'cello2', 3));
}

function startAllParts() {
    
  var piano = new Tone.Sampler({
    //'A0': './samples/piano/A0.mp3',
    //'A1': './samples/piano/A1.mp3',
    //'A2': './samples/piano/A2.mp3',
    //'A3': './samples/piano/A3.mp3',
    'A4': './samples/piano/A4.mp3',
    'A5': './samples/piano/A5.mp3',
    //'A6': './samples/piano/A6.mp3',
    //'A#0': './samples/piano/As0.mp3',
    // 'A#1': './samples/piano/As1.mp3',
    // 'A#2': './samples/piano/As2.mp3',
    // 'A#3': './samples/piano/As3.mp3',
    // 'A#4': './samples/piano/As4.mp3',
    // 'A#5': './samples/piano/As5.mp3',
    // 'A#6': './samples/piano/As6.mp3',
    // 'B0': './samples/piano/B0.mp3',
    // 'B1': './samples/piano/B1.mp3',
    // 'B2': './samples/piano/B2.mp3',
    // 'B3': './samples/piano/B3.mp3',
    // 'B4': './samples/piano/B4.mp3',
    // 'B5': './samples/piano/B5.mp3',
    // 'B6': './samples/piano/B6.mp3',
    // 'C0': './samples/piano/C0.mp3',
    // 'C1': './samples/piano/C1.mp3',
    // 'C2': './samples/piano/C2.mp3',
    // 'C3': './samples/piano/C3.mp3',
    'C4': './samples/piano/C4.mp3',
    'C5': './samples/piano/C5.mp3',
    // 'C6': './samples/piano/C6.mp3',
    // 'C7': './samples/piano/C7.mp3',
    // 'C#0': './samples/piano/Cs0.mp3',
    // 'C#1': './samples/piano/Cs1.mp3',
    // 'C#2': './samples/piano/Cs2.mp3',
    // 'C#3': './samples/piano/Cs3.mp3',
    // 'C#4': './samples/piano/Cs4.mp3',
    // 'C#5': './samples/piano/Cs5.mp3',
    // 'C#6': './samples/piano/Cs6.mp3',
    // 'D0': './samples/piano/D0.mp3',
    // 'D1': './samples/piano/D1.mp3',
    // 'D2': './samples/piano/D2.mp3',
    // 'D3': './samples/piano/D3.mp3',
    'D4': './samples/piano/D4.mp3',
    'D5': './samples/piano/D5.mp3',
    // 'D6': './samples/piano/D6.mp3',
    // 'D#0': './samples/piano/Ds0.mp3',
    // 'D#1': './samples/piano/Ds1.mp3',
    // 'D#2': './samples/piano/Ds2.mp3',
    // 'D#3': './samples/piano/Ds3.mp3',
    // 'D#4': './samples/piano/Ds4.mp3',
    // 'D#5': './samples/piano/Ds5.mp3',
    // 'D#6': './samples/piano/Ds6.mp3',
    // 'E0': './samples/piano/E0.mp3',
    // 'E1': './samples/piano/E1.mp3',
    // 'E2': './samples/piano/E2.mp3',
    // 'E3': './samples/piano/E3.mp3',
    'E4': './samples/piano/E4.mp3',
    'E5': './samples/piano/E5.mp3',
    // 'E6': './samples/piano/E6.mp3',
    // 'F0': './samples/piano/F0.mp3',
    // 'F1': './samples/piano/F1.mp3',
    // 'F2': './samples/piano/F2.mp3',
    // 'F3': './samples/piano/F3.mp3',
    'F4': './samples/piano/F4.mp3',
    'F5': './samples/piano/F5.mp3',
    // 'F6': './samples/piano/F6.mp3',
    // 'F#0': './samples/piano/Fs0.mp3',
    // 'F#1': './samples/piano/Fs1.mp3',
    // 'F#2': './samples/piano/Fs2.mp3',
    // 'F#3': './samples/piano/Fs3.mp3',
    // 'F#4': './samples/piano/Fs4.mp3',
    // 'F#5': './samples/piano/Fs5.mp3',
    // 'F#6': './samples/piano/Fs6.mp3',
    // 'G0': './samples/piano/G0.mp3',
    // 'G1': './samples/piano/G1.mp3',
    // 'G2': './samples/piano/G2.mp3',
    // 'G3': './samples/piano/G3.mp3',
    'G4': './samples/piano/G4.mp3',
    'G5': './samples/piano/G5.mp3',
    // 'G6': './samples/piano/G6.mp3',
    // 'G#0': './samples/piano/Gs0.mp3',
    // 'G#1': './samples/piano/Gs1.mp3',
    // 'G#2': './samples/piano/Gs2.mp3',
    // 'G#3': './samples/piano/Gs3.mp3',
    // 'G#4': './samples/piano/Gs4.mp3',
    // 'G#5': './samples/piano/Gs5.mp3',
    // 'G#6': './samples/piano/Gs6.mp3'
  }, function() {
    startPianoParts(piano);
  });

  // TODO: clean up the sample based on the samples available for cello
  // TODO: also, fix this mismatched sampler otave hack by using two grammars or a configurable octave
  //per part or something
  var cello = new Tone.Sampler({
    //'A0': './samples/cello/A0.mp3',
    //'A1': './samples/cello/A1.mp3',
    //'A2': './samples/cello/A2.mp3',
    //'A3': './samples/cello/A3.mp3',
    'A4': './samples/cello/A3.mp3',
    'A5': './samples/cello/A4.mp3',
    //'A6': './samples/cello/A6.mp3',
    //'A#0': './samples/cello/As0.mp3',
    // 'A#1': './samples/cello/As1.mp3',
    // 'A#2': './samples/cello/As2.mp3',
    // 'A#3': './samples/cello/As3.mp3',
    // 'A#4': './samples/cello/As4.mp3',
    // 'A#5': './samples/cello/As5.mp3',
    // 'A#6': './samples/cello/As6.mp3',
    // 'B0': './samples/cello/B0.mp3',
    // 'B1': './samples/cello/B1.mp3',
    // 'B2': './samples/cello/B2.mp3',
    // 'B3': './samples/cello/B3.mp3',
    // 'B4': './samples/cello/B4.mp3',
    // 'B5': './samples/cello/B5.mp3',
    // 'B6': './samples/cello/B6.mp3',
    // 'C0': './samples/cello/C0.mp3',
    // 'C1': './samples/cello/C1.mp3',
    // 'C2': './samples/cello/C2.mp3',
    // 'C3': './samples/cello/C3.mp3',
    'C4': './samples/cello/C3.mp3',
    'C5': './samples/cello/C4.mp3',
    // 'C6': './samples/cello/C6.mp3',
    // 'C7': './samples/cello/C7.mp3',
    // 'C#0': './samples/cello/Cs0.mp3',
    // 'C#1': './samples/cello/Cs1.mp3',
    // 'C#2': './samples/cello/Cs2.mp3',
    // 'C#3': './samples/cello/Cs3.mp3',
    // 'C#4': './samples/cello/Cs4.mp3',
    // 'C#5': './samples/cello/Cs5.mp3',
    // 'C#6': './samples/cello/Cs6.mp3',
    // 'D0': './samples/cello/D0.mp3',
    // 'D1': './samples/cello/D1.mp3',
    // 'D2': './samples/cello/D2.mp3',
    // 'D3': './samples/cello/D3.mp3',
    'D4': './samples/cello/D3.mp3',
    'D5': './samples/cello/D4.mp3',
    // 'D6': './samples/cello/D6.mp3',
    // 'D#0': './samples/cello/Ds0.mp3',
    // 'D#1': './samples/cello/Ds1.mp3',
    // 'D#2': './samples/cello/Ds2.mp3',
    // 'D#3': './samples/cello/Ds3.mp3',
    // 'D#4': './samples/cello/Ds4.mp3',
    // 'D#5': './samples/cello/Ds5.mp3',
    // 'D#6': './samples/cello/Ds6.mp3',
    // 'E0': './samples/cello/E0.mp3',
    // 'E1': './samples/cello/E1.mp3',
    // 'E2': './samples/cello/E2.mp3',
    // 'E3': './samples/cello/E3.mp3',
    'E4': './samples/cello/E3.mp3',
    'E5': './samples/cello/E4.mp3',
    // 'E6': './samples/cello/E6.mp3',
    // 'F0': './samples/cello/F0.mp3',
    // 'F1': './samples/cello/F1.mp3',
    // 'F2': './samples/cello/F2.mp3',
    // 'F3': './samples/cello/F3.mp3',
    'F4': './samples/cello/F3.mp3',
    'F5': './samples/cello/F4.mp3',
    // 'F6': './samples/cello/F6.mp3',
    // 'F#0': './samples/cello/Fs0.mp3',
    // 'F#1': './samples/cello/Fs1.mp3',
    // 'F#2': './samples/cello/Fs2.mp3',
    // 'F#3': './samples/cello/Fs3.mp3',
    // 'F#4': './samples/cello/Fs4.mp3',
    // 'F#5': './samples/cello/Fs5.mp3',
    // 'F#6': './samples/cello/Fs6.mp3',
    // 'G0': './samples/cello/G0.mp3',
    // 'G1': './samples/cello/G1.mp3',
    // 'G2': './samples/cello/G2.mp3',
    // 'G3': './samples/cello/G3.mp3',
    'G4': './samples/cello/G3.mp3',
    'G5': './samples/cello/G4.mp3',
    // 'G6': './samples/cello/G6.mp3',
    // 'G#0': './samples/cello/Gs0.mp3',
    // 'G#1': './samples/cello/Gs1.mp3',
    // 'G#2': './samples/cello/Gs2.mp3',
    // 'G#3': './samples/cello/Gs3.mp3',
    // 'G#4': './samples/cello/Gs4.mp3',
    // 'G#5': './samples/cello/Gs5.mp3',
    // 'G#6': './samples/cello/Gs6.mp3'
  }, function() {
    startCelloParts(cello);
  });
  
  var clarinet = new Tone.Sampler({
    'A#2': './samples/clarinet/As2.mp3',
    'A#3': './samples/clarinet/As3.mp3',
    'A#4': './samples/clarinet/As4.mp3',
    'D2': './samples/clarinet/D2.mp3',
    'D3': './samples/clarinet/D3.mp3',
    'D4': './samples/clarinet/D4.mp3',
    'D5': './samples/clarinet/D5.mp3',
    'F2': './samples/clarinet/F2.mp3',
    'F3': './samples/clarinet/F3.mp3',
    'F4': './samples/clarinet/F4.mp3',
  }, function() {
    startClarinetParts(clarinet);
  });
  
  Tone.Transport.scheduleRepeat(function() {
    mutatePerformance();
  }, SO_CALLED_SECONDS_FOR_REPLACING_PARTS, SO_CALLED_SECONDS_FOR_REPLACING_PARTS);
}

$(document).ready(function() {
  /**
   * Add velocity (high, med, low)?
   */
  grammar = tracery.createGrammar({
    "pattern":["#cell# #pattern#","#cell#"],
    "cell":["#two#","#three#"],
    "two":["#eighth#,#eighth#,","#quarter#,"],
    "three":["#eighth#, #eighth#, #eighth#,","#quarter#, #eighth#,","#eighth#, #quarter#,"],
    "quarter": ['{"duration":"2n","pitch":"#pitchCluster#","velocity":"#velocity#"}'],
    "eighth": ['{"duration":"4n","pitch":"#pitchCluster#","velocity":"#velocity#"}'],
    "pitchCluster": ["#cluster1#", "#cluster2#", "#cluster3#"],
    "cluster1":["C1","D1","F1"],
    "cluster2":["E1","G1","C2"],
    "cluster3":["A1","D2"],
    "velocity":["h", "m", "l", "r"]
  });

  startAllParts();
});

/*TODO
-Fix the rhythm - was so much better before. And make a more interesting grammar(s)
-Samples
  -Find a better way to load the whole sample (or even just do it manually)
  -Host them online (e.g. S3, firebase, etc) or find them already hosted
  -Maybe automate the build so that I publish them and also have them locally (better CD loop)
  -Find ones with velocity?
-Interactivity
  -Add links/buttons to stop/start or regen parts
  -Lock a part
-Add velocity / dynamics
-When swapping parts
  -Try changing instruments or their effects/characteristics when swapping parts
  -Maybe fade out/in old/new parts
  -Play a different, subtle sound when part is swapped (different for each part?)
    -Maybe something that leads up in last 20 sec or so and then plays indicator (same or different sounds)
  -Maybe remember last part swapped and swap a different one? Or at least make that more likely
-Try different grammars (name them so I don't have to comment out)
-Try different notes (maybe name them so I don't have to comment out)
  -Maybe some generative way of chosing notes
  -Try using chords / scales (the music theory library Bainter uses)
-Try using sine and other continuous functions like GalaxyKate mentions when talking about using "arrays of floats"
  -Nature functions seem attactive conceptually (e.g. fractals? actual patterns from nature/environment)?
  -Real systems data? Live?
-Try same simple inputs but with instruments that evolve (either effects or the actual samples?)
  -Maybe the processing evolves over time too
-Try adding evolution / sectionality / drones, etc. (this be a different piece)
-Think about setting parts with different melodic/rhythmic characteristics (e.g. part1 works best when it's a more repetitive motive)
-Maybe have a complexity function and increase it up to a peak and then decrease again (and then repeat the big cycle?)
  -Maybe complexity of parts and/or reducing number of parts
-You can schedule Parts as events in Parts!!!!! (Part is an Event). Wonder if that would do anything cool...
-Maybe play with humanize values in the parts
-Visualization
  -General visualizer that is somewhat aesthetically neutral and informative about the audio
  -More specific visualizer that really conveys what the different dimensions of the parts are doing and how they are interacting
-Once I can save good ones maybe put all node permutations into a grammar (or multiple grammars for different scales or chord/harmonic context types). Maybe even all 7 notes in a full scale. Could pare these down or weight to a sweet spot (3-4?) if it’s too much to weed through or if certain parts are consistently bad.
-Think about a story element to the grammar that gives a shape (like the “origin” in the text examples with tracery)
-Think about adding tagging soon too (see film score idea (E: Generative film scoring)
-Try improvising over some of it with melodica and then using some as samples in different ways?
-Build saver soon - save one or a combo of parts
-Eventually put them in a DB and add a likelihood of successful babies showing up
-Get it really hosted
*/
