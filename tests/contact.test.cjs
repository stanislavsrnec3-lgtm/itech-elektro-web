const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');

function element(value = '') {
  const classes = new Set();
  return {
    value, textContent: '', innerHTML: 'Odeslat', hidden: true, disabled: false,
    files: [], error: '', attrs: {}, listeners: {},
    classList: { add: c => classes.add(c), remove: c => classes.delete(c) },
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setCustomValidity(error) { this.error = error; },
    setAttribute(name, value) { this.attrs[name] = value; },
    removeAttribute(name) { delete this.attrs[name]; },
    focus() { this.focused = true; },
    closest() { return this.details ||= {open: false}; }
  };
}

function setup({fetchResult, search = ''} = {}) {
  const inputs = {email: element(), phone: element(), message: element('Poptavka DEHN'), location: element('Brno'), attachments: element(), name: element(), inquiryType: element('HVI hromosvod')};
  const select = inputs.inquiryType;
  select.options = [{value: 'HVI hromosvod'}, {value: 'Loxone'}];
  const button = element();
  const controls = Object.assign([...Object.values(inputs), button], inputs);
  const form = Object.assign(element(), {
    elements: controls, action: 'https://formspree.io/f/xgornoor',
    querySelector: () => button,
    reportValidity: () => controls.every(c => !c.error),
    reset() { Object.values(inputs).forEach(i => { i.value = ''; i.files = []; }); this.resets = (this.resets || 0) + 1; },
    dispatchEvent(event) { this.sentEvent = event; },
    contains: () => false
  });
  const feedback = element(), contactError = element(), attachmentError = element();
  const nodes = {'#contact-form':form,'#form-feedback':feedback,'#inquiryType':select,'#contact-error':contactError,'#attachment-error':attachmentError,'.mobile-cta':element()};
  const requests = [];
  class FakeFormData extends Map {
    constructor() { super(Object.entries(inputs).map(([k,v]) => [k, k === 'attachments' ? v.files : v.value])); }
  }
  vm.runInNewContext(source, {
    document: {documentElement:element(), querySelector: s => nodes[s] || null, querySelectorAll: () => [], getElementById: () => null},
    window: {location: {pathname:'/index.html',search,hash:''}, addEventListener: () => {}},
    URLSearchParams, FormData:FakeFormData, AbortController, setTimeout, clearTimeout,
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options.detail; } },
    fetch: async (url, options) => { requests.push({url, options}); return fetchResult ? fetchResult() : {ok:true,status:200}; }
  });
  return {inputs,form,button,feedback,contactError,attachmentError,requests, submit: () => form.listeners.submit({preventDefault(){}})};
}

test('requires one contact and rejects whitespace-only message', async () => {
  const s = setup();
  await s.submit();
  assert.equal(s.requests.length, 0);
  assert.equal(s.contactError.hidden, false);
  s.inputs.phone.value = '+420 000 000 000';
  s.inputs.phone.listeners.input();
  s.inputs.message.value = '   ';
  await s.submit();
  assert.equal(s.requests.length, 0);
  assert.ok(s.inputs.message.error);
});

test('phone-only success omits empty reply-to and file parts', async () => {
  const s = setup({search:'?inquiryType=HVI%20hromosvod'});
  s.inputs.phone.value = '+420 000 000 000';
  await s.submit();
  assert.equal(s.requests.length, 1);
  const data = s.requests[0].options.body;
  assert.equal(data.has('email'), false);
  assert.equal(data.has('attachments'), false);
  assert.equal(data.get('phone'), '+420 000 000 000');
  assert.match(data.get('_subject'), /HVI hromosvod/);
  assert.equal(s.form.resets, 1);
  assert.equal(s.inputs.inquiryType.value, 'HVI hromosvod');
  assert.equal(s.form.sentEvent.type, 'itech:inquiry-sent');
  assert.equal(s.button.disabled, false);
  assert.match(s.feedback.className, /success/);
});

test('email-only submission retains reply-to', async () => {
  const s = setup();
  s.inputs.email.value = 'test@example.invalid';
  await s.submit();
  assert.equal(s.requests[0].options.body.get('email'), 'test@example.invalid');
});

test('invalid phone does not leave stale error after editing', async () => {
  const s = setup();
  s.inputs.phone.value = '123----';
  await s.submit();
  assert.equal(s.requests.length, 0);
  assert.match(s.contactError.textContent, /telefon/);
  s.inputs.phone.value = '';
  s.inputs.phone.listeners.input();
  await s.submit();
  assert.match(s.contactError.textContent, /e-mail nebo telefon/);
});

test('network failure preserves values and restores controls', async () => {
  const s = setup({fetchResult: () => {throw new Error('offline');}});
  s.inputs.email.value = 'test@example.invalid';
  await s.submit();
  assert.equal(s.form.resets, undefined);
  assert.equal(s.inputs.message.value, 'Poptavka DEHN');
  assert.equal(s.inputs.email.value, 'test@example.invalid');
  assert.match(s.feedback.className, /error/);
  assert.equal(s.button.disabled, false);
  assert.equal(s.feedback.focused, true);
});

test('valid attachments are kept; invalid counts, sizes and types are blocked', async () => {
  for (const files of [Array(6).fill({name:'a.pdf',size:1}), [{name:'a.pdf',size:21*1024*1024}], [{name:'a.exe',size:1}], [{name:'a.pdf',size:0}]]) {
    const s = setup(); s.inputs.email.value = 'test@example.invalid'; s.inputs.attachments.files = files;
    await s.submit();
    assert.equal(s.requests.length, 0);
    assert.equal(s.attachmentError.hidden, false);
    assert.equal(s.inputs.attachments.details.open, true);
  }
  const s = setup(); s.inputs.email.value = 'test@example.invalid'; s.inputs.attachments.files = [{name:'projekt.pdf',size:100}];
  await s.submit();
  assert.equal(s.requests[0].options.body.get('attachments')[0].name, 'projekt.pdf');
});

test('server rejection and quota errors preserve the inquiry', async () => {
  for (const status of [422,429,500]) {
    const s = setup({fetchResult: () => ({ok:false,status})});
    s.inputs.email.value = 'test@example.invalid'; s.inputs.attachments.files = [{name:'projekt.pdf',size:100}];
    await s.submit();
    assert.match(s.feedback.className, /error/);
    assert.equal(s.inputs.attachments.files.length, 1);
    assert.equal(s.form.resets, undefined);
  }
});

test('a repeated click cannot send the form twice', async () => {
  let finish;
  const s = setup({fetchResult: () => new Promise(resolve => {finish = resolve;})});
  s.inputs.email.value = 'test@example.invalid';
  const first = s.submit();
  assert.equal(s.button.disabled, true);
  await s.submit();
  assert.equal(s.requests.length, 1);
  finish({ok:true,status:200});
  await first;
  assert.equal(s.button.disabled, false);
});
