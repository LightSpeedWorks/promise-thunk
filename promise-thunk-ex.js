// promise-thunk-ex.js

// aa.fork(function *() {}) -> returns p : thenable promise thunk
// aa(function *() {}) -> returns p : thenable promise thunk
//   p(function (err, val) {}) -> returns p : thenable promise thunk
//   p.then(function (val) {}, function (err) {}) -> returns p : thenable promise thunk
//   p.catch(function (err) {}) -> returns p : thenable promise thunk
// aa(iterator)
// aa(generator)

// aa.wrap(function () {}) -> returns wrapped function
// aa(function () {}) -> returns wrapped function

// aa([e,...]) -> ?

// aa.Promise -> Promise constructor function

// aa.Channel -> Channel constructor function
// aa.Channel() -> returns ch : channel function
// aa.Channel(n : number) -> returns ch : channel function
// aa.Channel(n : number, Type : function) -> returns ch : channel function
// aa() -> returns ch : channel function
// aa(n : number) -> returns ch : channel function
// aa(n : number, Type : function) -> returns ch : channel function

(function () {
  'use strict';

  var PromiseThunk = require('./promise-thunk');

  var slice = [].slice;

  // normal node style callback
  // returns: undefined
  // format: sleep1(ms, ...args, cb)
  function sleep1(ms) {
    if (typeof ms !== 'number')
      throw new TypeError('ms must be a number');

    var args = slice.call(arguments, 1);
    var cb = args.pop();
    if (typeof cb !== 'function')
      throw new TypeError('cb must be a function');

    setTimeout.apply(null, [cb, ms, null].concat(args));
  }

  // returns thunk
  // bug: no safety guard for duplicate calls and duplicate callbacks
  // format: sleep2(ms, ...args)
  function sleep2(ms) {
    if (typeof ms !== 'number')
      throw new TypeError('ms must be a number');
    var args = arguments;
    return function thunk(cb) {
      args[args.length++] = cb;
      sleep1.apply(null, args);
    };
  }

  // returns thunk
  // has safety guard for duplicate calls and duplicate callbacks
  // format: sleep3(ms, ...args)
  function sleep3(ms) {
    if (typeof ms !== 'number')
      throw new TypeError('ms must be a number');

    arguments[arguments.length++] = cb;
    sleep1.apply(null, arguments);

    var callback, args;

    function cb() {
      if (args) return; // already fired (callbacked)
      args = arguments;
      if (!callback) return;
      callback.apply(null, args);
    }

    return function thunk(cb) {
      if (callback) return; // already set callback function
      callback = cb;
      if (!args) return;
      callback.apply(null, args)
    };
  }

  // returns promise/thenable
  // format: sleep4(ms, ...args)
  function sleep4(ms) {
    if (typeof ms !== 'number')
      throw new TypeError('ms must be a number');

    var args = slice.call(arguments);

    return new PromiseThunk(function (res, rej) {
      sleep1.apply(null, args.concat(
        function (err, val) {
          if (err) rej(err);
          else res(val); }));
    });
  }

  var sleep5 = PromiseThunk.wrap(sleep1);

  sleep1(1000, 'sleep1 ', function (err, val) { console.log('sleep1 ', err, val, 101); });
  sleep2(1000, 'sleep2 ')(function (err, val) { console.log('sleep2 ', err, val, 201); });
  sleep3(1000, 'sleep3 ')(function (err, val) { console.log('sleep3 ', err, val, 301); });

  sleep4(1000, 'sleep4 ').then(
    function (val) { console.log('sleep4 ', null, val, 401); },
    function (err) { console.log('sleep4  err =', err, 402); });

  sleep5(1000, 'sleep5a')(function (err, val) { console.log('sleep5a', err, val, 501); });

  sleep5(1000, 'sleep5b').then(
    function (val) { console.log('sleep5b', null, val, 502); },
    function (err) { console.log('sleep5b err =', err, 503); });

  var p5 = sleep5(1000, 'sleep5 ')
  (function (err, val) { console.log('sleep5u', err, val, 510); return 'sleep5u'; })
  (function (err, val) { console.log('sleep5v', err, val, 520); return 'sleep5v'; })
  (function (err, val) { console.log('sleep5w', err, val, 530); return 'sleep5w'; })
  .then(
    function (val) { console.log('sleep5x', null, val, 570); return 'sleep5x'; },
    function (err) { console.log('sleep5x err =', err, 571); return 'sleep5xe'; })
  .then(
    function (val) { console.log('sleep5y', null, val, 580); return 'sleep5y'; },
    function (err) { console.log('sleep5y err =', err, 581); return 'sleep5ye'; })
  (function (err, val) { console.log('sleep5z', err, val, 599); return 'sleep5z'; })
  ;

  if (typeof Promise !== 'undefined') {
    console.log('', Promise.resolve('Promise.resolve'));
    console.log('', new Promise(function (res, rej) { res('Promise.resolve'); }));
    console.log('', Promise.reject(new Error('Promise.reject')));
    console.log('', new Promise(function (res, rej) { rej(new Error('Promise.reject')); }));
    console.log('', new Promise(function (res, rej) {}));
  }

  function callback(err, val) {
    if (err)
      console.error('Catch: \x1b[41m%s\x1b[m', err);
    else
      console.info('Value: %s', val);
  }

  if (typeof PromiseThunk !== 'undefined') {
    console.log('', PromiseThunk.resolve('PromiseThunk.resolve'));
    console.log('', new PromiseThunk(function (res, rej) { res('PromiseThunk.resolve'); }));
    console.log('', PromiseThunk.reject(new Error('PromiseThunk.reject'))(callback));
    console.log('', new PromiseThunk(function (res, rej) { rej(new Error('PromiseThunk.reject')); })(callback));
    console.log('', PromiseThunk(function (res, rej) { res('PromiseThunk()'); }));
    console.log('', new PromiseThunk(function (res, rej) {}));
  }

})();
