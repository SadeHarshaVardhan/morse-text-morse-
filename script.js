// scripts.js

// 1) Prevent copy/select/context-menu (but allow paste)
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('keydown', e => {
  if (
    (e.ctrlKey && ['c', 'x', 'u', 's'].includes(e.key.toLowerCase())) ||
    e.keyCode === 123
  ) {
    e.preventDefault();
  }
});

// 2) Morse ↔ Text mappings
const textToMorse = {
  'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.',
  'F': '..-.','G': '--.','H': '....','I': '..','J': '.---',
  'K': '-.-','L': '.-..','M': '--','N': '-.','O': '---',
  'P': '.--.','Q': '--.-','R': '.-.','S': '...','T': '-',
  'U': '..-','V': '...-','W': '.--','X': '-..-','Y': '-.--',
  'Z': '--..','1': '.----','2': '..---','3': '...--',
  '4': '....-','5': '.....','6': '-....','7': '--...',
  '8': '---..','9': '----.','0': '-----',' ': '/'
};
const morseToText = Object.fromEntries(
  Object.entries(textToMorse).map(([k,v])=>[v,k])
);

// 3) Convert function
function convert() {
  const mi = document.getElementById('morseInput').value.trim();
  const ti = document.getElementById('textInput').value.trim();
  if (mi) {
    // Morse → Text
    let result = mi.split(' / ').map(
      w => w.split(' ').map(l => morseToText[l]||'?').join('')
    ).join(' ');
    document.getElementById('textInput').value = result;
  } else if (ti) {
    // Text → Morse
    let result = [...ti.toUpperCase()].map(
      c => textToMorse[c]||'?'
    ).join(' ');
    document.getElementById('morseInput').value = result;
  } else {
    alert('Please enter Morse code or Text to convert!');
  }
}

// 4) Clear helpers
function clearMorse() { document.getElementById('morseInput').value = ''; }
function clearText()  { document.getElementById('textInput').value = ''; }

// 5) Copy helper
function copyText(id) {
  const txt = document.getElementById(id);
  navigator.clipboard.writeText(txt.value).then(() => {
    const btn = document.querySelector(`button[onclick="copyText('${id}')"]`);
    const orig = btn.innerHTML;
    btn.innerHTML = '✅ Copied!';
    setTimeout(() => btn.innerHTML = orig, 1500);
  });
}

// 6) Download text as .txt
function downloadText() {
  const text = document.getElementById('textInput').value;
  if (!text) return alert('Nothing to download!');
  const blob = new Blob([text], {type: 'text/plain'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'morse_text.txt';
  a.click();
  URL.revokeObjectURL(url);
}

// 7) Play/Stop Morse audio toggle
let morseCtx = null, morseSrc = null;
function playMorse() {
  const btn  = document.getElementById('playMorseBtn');
  const code = document.getElementById('morseInput').value.trim();
  if (!code) return alert('Nothing to play!');
  if (morseSrc) {
    morseSrc.stop();
    morseCtx.close();
    morseSrc = null;
    morseCtx = null;
    btn.textContent = 'Play 🔊';
    return;
  }
  morseCtx = new (window.AudioContext||window.webkitAudioContext)();
  const sr = morseCtx.sampleRate, unit = 0.1, freq = 600;
  let t = 0, samples = [];
  function addSeg(d, on) {
    const len = Math.floor(sr * d);
    for (let i=0; i<len; i++, t++) {
      samples.push(on ? Math.sin(2*Math.PI*freq*(t/sr))*0.5 : 0);
    }
  }
  code.split('').forEach(ch=>{
    if (ch==='.')       { addSeg(unit, true);  addSeg(unit, false); }
    else if (ch==='-')  { addSeg(unit*3, true);addSeg(unit, false); }
    else if (ch===' ')  { addSeg(unit*2, false); }
    else if (ch==='/')  { addSeg(unit*6, false); }
  });
  const buf = morseCtx.createBuffer(1, samples.length, sr);
  buf.copyToChannel(new Float32Array(samples), 0);
  morseSrc = morseCtx.createBufferSource();
  morseSrc.buffer = buf;
  morseSrc.connect(morseCtx.destination);
  morseSrc.start();
  btn.textContent = 'Stop 🔇';
  morseSrc.onended = () => {
    morseSrc = null;
    morseCtx.close();
    morseCtx = null;
    btn.textContent = 'Play 🔊';
  };
}

// 8) Dark/Light toggle
document.getElementById('toggle-theme')
  .addEventListener('change', e => {
    document.body.classList.toggle('light', e.target.checked);
  });

// 9) Info button
document.getElementById('modeInfoBtn')
  .addEventListener('click', () => {
    alert(
      '🌙 Dark Mode:\n' +
      '• Dark background + green text → easy on the eyes in low light.\n\n' +
      '☀️ Light Mode:\n' +
      '• Light background + dark text → best for bright environments.'
    );
  });
