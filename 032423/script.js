function play() {
  Tone.Transport.start();
}

function stop() {
  Tone.Transport.stop();
}

const synth = new Tone.Synth().toDestination();
// use an array of objects as long as the object has a "time" attribute
const part = new Tone.Part(((time, value) => {
	// the value is an object which contains both the note and the velocity
	synth.triggerAttackRelease(value.note, "8n", time, value.velocity);
}), [{ time: 0, note: "C3", velocity: 0.9 },
	{ time: "0:2", note: "C4", velocity: 0.5 }
]).start(0);
