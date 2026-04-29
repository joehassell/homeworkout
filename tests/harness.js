/**
 * Test harness — loads the app's JS modules in Node without a browser.
 * Provides DOM stubs and exposes globals so tests can call app functions.
 */

// ── DOM stubs ─────────────────────────────────────────
const _stubEl = () => ({
  textContent: '', innerHTML: '', value: '', className: '',
  classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
  dataset: {}, style: { display: '', setProperty(){} },
  disabled: false, files: [], offsetWidth: 0,
  querySelectorAll() { return []; },
  appendChild(){}, removeChild(){},
});

global.window = global;
global.localStorage = {
  _d: {},
  getItem(k) { return this._d[k] || null; },
  setItem(k, v) { this._d[k] = String(v); },
  removeItem(k) { delete this._d[k]; },
  clear() { this._d = {}; },
};
global.document = {
  addEventListener() {},
  documentElement: {
    setAttribute(){}, removeAttribute(){},
    classList: { add(){}, remove(){} },
    style: { setProperty(){} },
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  getElementById() { return _stubEl(); },
  body: { appendChild(){}, removeChild(){} },
  fullscreenElement: null,
};
global.navigator = { userAgent: 'node', standalone: false };
global.speechSynthesis = { speak(){}, cancel(){} };
global.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; } };
global.AudioContext = class {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {}; }
  resume() {}
  createBuffer() { return {}; }
  createBufferSource() { return { connect(){}, start(){} }; }
  createOscillator() { return { connect(){}, frequency: { value: 0 }, start(){}, stop(){}, type: '' }; }
  createGain() { return { connect(){}, gain: { value: 0, exponentialRampToValueAtTime(){} } }; }
};
global.URL = { createObjectURL() { return ''; }, revokeObjectURL() {} };
global.FileReader = class { readAsText() {} };
global.Blob = class { constructor() {} };
global.alert = () => {};
global.confirm = () => true;
global.crypto = { randomUUID: () => 'test-' + Math.random().toString(36).slice(2, 10) };
global.setTimeout = (fn) => { fn(); };
global.setInterval = () => 0;
global.clearInterval = () => {};
global.requestAnimationFrame = () => {};

// ── Load modules ──────────────────────────────────────
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const root = path.join(__dirname, '..');

function loadModule(file) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  vm.runInThisContext(src, { filename: file });
}

// Load in dependency order
loadModule('js/builder.js');
loadModule('js/yoga.js');
loadModule('js/capability.js');
loadModule('js/templates.js');
loadModule('js/storage.js');

// Load inline script from index.html
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const m = html.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/);
if (!m) throw new Error('Could not find inline script in index.html');
vm.runInThisContext(m[1], { filename: 'index.html:inline' });

// ── Test runner ───────────────────────────────────────
let _passed = 0, _failed = 0, _currentSuite = '';

function describe(name, fn) {
  _currentSuite = name;
  console.log(`\n  ${name}`);
  fn();
  _currentSuite = '';
}

function it(name, fn) {
  try {
    fn();
    _passed++;
    console.log(`    ✓ ${name}`);
  } catch (e) {
    _failed++;
    console.log(`    ✗ ${name}`);
    console.log(`      ${e.message}`);
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'Assertion failed');
}

function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

function assertInRange(val, min, max, msg) {
  if (val < min || val > max) throw new Error(msg || `Expected ${val} to be in [${min}, ${max}]`);
}

function summary() {
  console.log(`\n  ${_passed} passing, ${_failed} failing\n`);
  if (_failed > 0) process.exit(1);
}

global.describe = describe;
global.it = it;
global.assert = assert;
global.assertEqual = assertEqual;
global.assertInRange = assertInRange;
global.summary = summary;
