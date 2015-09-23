// promise-thunk.js

this.PromiseThunk = function () {
  'use strict';

  var STATE_UNRESOLVED = -1;
  var STATE_REJECTED = 0;
  var STATE_RESOLVED = 1;
  var STATE_THUNK = 2;
  var ARGS_ERR = 0;
  var ARGS_VAL = 1;

  var COLOR_OK     = typeof window !== 'undefined' ? '' : '\x1b[32m';
  var COLOR_ERROR  = typeof window !== 'undefined' ? '' : '\x1b[35m';
  var COLOR_NORMAL = typeof window !== 'undefined' ? '' : '\x1b[m';

  var slice = [].slice;

  // defProp
  var defProp = function (obj) {
    if (!Object.defineProperty) return null;
    try {
      Object.defineProperty(obj, 'prop', {value: 'str'});
      return obj.prop === 'str' ? Object.defineProperty : null;
    } catch (err) { return null; }
  } ({});

  // setConst(obj, prop, val)
  var setConst = defProp ?
    function setConst(obj, prop, val) {
      defProp(obj, prop, {value: val}); } :
    function setConst(obj, prop, val) { obj[prop] = val; };

  // setValue(obj, prop, val)
  var setValue = defProp ?
    function setValue(obj, prop, val) {
      defProp(obj, prop, {value: val,
        writable: true, configurable: true}); } :
    function setValue(obj, prop, val) { obj[prop] = val; };

  // getProto(obj)
  var getProto = Object.getPrototypeOf || {}.__proto__ ?
    function getProto(obj) { return obj.__proto__; } : null;

  // setProto(obj, proto)
  var setProto = Object.setPrototypeOf || {}.__proto__ ?
    function setProto(obj, proto) { obj.__proto__ = proto; } : null;

  // Queue
  function Queue() {
    this.tail = this.head = null;
  }
  // Queue#push(x)
  setValue(Queue.prototype, 'push', function push(x) {
    if (this.tail)
      this.tail = this.tail[1] = [x, null];
    else
      this.tail = this.head = [x, null];
    return this;
  });
  // Queue#shift()
  setValue(Queue.prototype, 'shift', function shift() {
    if (!this.head) return null;
    var x = this.head[0];
    this.head = this.head[1];
    if (!this.head) this.tail = null;
    return x;
  });

  // nextTick(fn)
  var nextTickDo = typeof setImmediate === 'function' ? setImmediate :
    typeof process === 'object' && process && typeof process.nextTick === 'function' ? process.nextTick :
    function nextTick(fn) { setTimeout(fn, 0); };

  var tasksHighPrio = new Queue();
  var tasksLowPrio = new Queue();

  var nextTickProgress = false;

  // nextTick(ctx, fn, fnLow)
  function nextTick(ctx, fn, fnLow) {
    if (typeof fn === 'function')
      tasksHighPrio.push({ctx:ctx, fn:fn});

    if (typeof fnLow === 'function')
      tasksLowPrio.push({ctx:ctx, fn:fnLow});

    if (nextTickProgress) return;

    nextTickProgress = true;

    nextTickDo(function () {
      var task;

      for (;;) {
        while (task = tasksHighPrio.shift())
          task.fn.call(task.ctx);

        if (task = tasksLowPrio.shift())
          task.fn.call(task.ctx);
        else break;
      }

      nextTickProgress = false;
    });
  }

  function PROMISE_RESOLVE() {}
  function PROMISE_REJECT() {}
  function PROMISE_THEN() {}

  // PromiseThunk(setup(resolve, reject))
  function PromiseThunk(setup, val) {
    if (setup && typeof setup.then === 'function')
      return $$convert(setup);

    $this.$callbacks = new Queue();
    $this.$state = STATE_UNRESOLVED;
    $this.$args = undefined;
    $this.$handled = false;

    if (setProto)
      setProto($this, PromiseThunk.prototype);
    else {
      if ($this.then     !== $$then)
          $this.then     =   $$then;
      if ($this['catch'] !== $$catch)
          $this['catch'] =   $$catch;
      if ($this.toString !== $$toString)
          $this.toString =   $$toString;
    }

    if (typeof setup === 'function') {
      if (setup === PROMISE_RESOLVE)
        $$resolve.call($this, val);
      else if (setup === PROMISE_REJECT)
        $$reject.call($this, val);
      else {
        // setup(resolve, reject)
        try {
          setup.call($this,
            function resolve(v) { return $$resolve.call($this, v); },
            function reject(e)  { return $$reject.call($this, e); });
        } catch (err) {
          $$reject.call($this, err);
        }
      }
    } // PromiseThunk

    // $this(cb) === thunk
    function $this(cb) {
      if (typeof cb !== 'function')
        cb = function () {};

      var p = PromiseThunk();
      $this.$callbacks.push([undefined, undefined,
        function (err, val) {
          try {
            $$resolve.call(p, cb(err, val));
          } catch (e) {
            if (!err) return $$reject.call(p, e);
            console.log(COLOR_ERROR + 'Unhandled callback error: ' + err2str(e) + COLOR_NORMAL);
            $$reject.call(p, err);
          }
        }
      ]);
      nextTick($this, $$fire);
      return p;
    }

    return $this;
  }

  // $$callback(err, val) or $callback(...$args)
  function $$callback() {
    if (this.$args) {
      var err = arguments[ARGS_ERR];
      if (err) {
        console.info(COLOR_OK + this + COLOR_NORMAL);
        console.error(COLOR_ERROR + 'Unhandled 2nd rejection ' + err2str(err) + COLOR_NORMAL);
      }
      return; // already fired
    }
    this.$args = arguments;
    this.$state = arguments[ARGS_ERR] ? STATE_REJECTED : STATE_RESOLVED;
    nextTick(this, $$fire);
  }

  // $$resolve(val)
  function $$resolve(val) {
    if (this.$args) return; // already resolved
    var $this = this;

    // val is promise?
    if (isPromise(val)) {
      val.then(
        function (v) { $$callback.call($this, null, v); },
        function (e) { $$callback.call($this, e); });
      return;
    }

    // val is function? must be thunk.
    if (typeof val === 'function') {
      val(function (e, v) { $$callback. call($this, e, v); });
      return;
    }

    $$callback.call($this, null, val);
  } // $$resolve

  // $$reject(err)
  var $$reject = $$callback;

  // $$fire()
  function $$fire() {
    var elem;
    var $args = this.$args;
    var $state = this.$state;
    var $callbacks = this.$callbacks;
    if (!$args) return; // not yet fired
    while (elem = $callbacks.shift()) {
      if (elem[STATE_THUNK]) {
        this.$handled = true;
        elem[STATE_THUNK].apply(null, $args);
      }
      else if (elem[$state]) {
        if ($state === STATE_REJECTED) this.$handled = true;
        elem[$state]($args[$state]);
      }
    }
    nextTick(this, null, $$checkUnhandledRejection);
  } // $$fire

  // $$checkUnhandledRejection()
  function $$checkUnhandledRejection() {
    var $args = this.$args;
    if (this.$state === STATE_REJECTED && !this.$handled) {
      console.info(COLOR_OK + this + COLOR_NORMAL);
      console.error(COLOR_ERROR + 'Unhandled rejection ' + err2str($args[ARGS_ERR]) + COLOR_NORMAL);
      // or throw $args[0];
      // or process.emit...
    }
  } // $$checkUnhandledRejection

  // PromiseThunk#then(res, rej)
  var $$then = then;
  setValue(PromiseThunk.prototype, 'then', then);
  function then(res, rej) {
    if (res && typeof res !== 'function')
      throw new TypeError('resolved must be a function');
    if (rej && typeof rej !== 'function')
      throw new TypeError('rejected must be a function');

    var p = PromiseThunk();
    this.$callbacks.push([
      function (err) {
        try { // then err
          if (rej) $$resolve.call(p, rej(err));
          else     $$reject.call(p, err);
        } catch (e) {
          $$reject.call(p, err);
          console.error(COLOR_ERROR + 'Unhandled callback error: ' + err2str(e) + COLOR_NORMAL);
          $$reject.call(p, e);
        }
      },
      function (val) {
        try { // then val
          if (res) $$resolve.call(p, res(val));
          else     $$resolve.call(p, val)
        } catch (e) {
          $$reject.call(p, e);
        }
      }
    ]);
    nextTick(this, $$fire);
    return p;
  } // then

  // PromiseThunk#catch(rej)
  var $$catch = caught;
  setValue(PromiseThunk.prototype, 'catch', caught);
  function caught(rej) {
    if (typeof rej !== 'function')
      throw new TypeError('rejected must be a function');

    var p = PromiseThunk();
    this.$callbacks.push([
      function (err) {
        try { // catch err
          $$resolve.call(p, rej(err));
        } catch (e) {
          $$reject.call(p, err);
          console.log('\x1b[41m' + e + '\x1b[m');
        }
      }
    ]);
    nextTick(this, $$fire);
    return p;
  } // catch

  // PromiseThunk#toString()
  setValue(PromiseThunk.prototype, 'toString', toString);
  var $$toString = toString;
  function toString() {
    return 'PromiseThunk { ' + (
      this.$state === STATE_UNRESOLVED ? '<pending>' :
      this.$state === STATE_RESOLVED ? JSON.stringify(this.$args[ARGS_VAL]) :
      '<rejected> ' + this.$args[ARGS_ERR]) + ' }';
  } // toString

  // PromiseThunk.wrap(fn)
  function wrap(fn) {
    if (typeof fn !== 'function')
      throw new TypeError('wrap: fn must be a function');

    return function () {
      var $args = slice.call(arguments);
      return PromiseThunk(function (res, rej) {
        fn.apply(null, $args.concat(
          function (err, val) {
            try {
              if (err) rej(err);
              else     res(val);
            } catch (e) {
              rej(e);
            }
        }));
      });
    }
  } // wrap
  setValue(PromiseThunk, 'wrap',     wrap);
  setValue(PromiseThunk, 'thunkify', wrap);

  // PromiseThunk.resolve(val)
  setValue(PromiseThunk, 'resolve', function resolve(val) {
    return PromiseThunk(PROMISE_RESOLVE, val);
  });

  // PromiseThunk.reject(err)
  setValue(PromiseThunk, 'reject', function reject(err) {
    return PromiseThunk(PROMISE_REJECT, err);
  });

  // PromiseThunk.convert(promise or thunk)
  setValue(PromiseThunk, 'convert', function convert(promise) {
    if (isPromise(promise)) {
      var p = PromiseThunk();
      promise.then(
        function (v) { $$resolve.apply(p, arguments); },
        function (e) { $$reject.apply(p, arguments); });
      return p;
    }
    return PromiseThunk(PROMISE_RESOLVE, promise);
  });
  var $$convert = PromiseThunk.convert;

  // PromiseThunk.all([p, ...])
  setValue(PromiseThunk, 'all', all);
  function all(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');

    return PromiseThunk(
      function promiseAll(resolve, reject) {
        var n = promises.length;
        if (n === 0) return resolve([]);
        var res = Array(n);
        promises.forEach(function (p, i) {
          function complete(val) {
            res[i] = val; if (--n === 0) resolve(res); }
          function error(err) {
            if (n > 0) reject(err); n = 0; }
          if (p instanceof PromiseThunk || isPromise(p))
            return p.then(complete, error);
          complete(p);
        }); // promises.forEach
      }
    ); // return PromiseThunk
  } // all

  // PromiseThunk.race([p, ...])
  setValue(PromiseThunk, 'race', race);
  function race(promises) {
    if (isIterator(promises)) promises = makeArrayFromIterator(promises);
    if (!(promises instanceof Array))
      throw new TypeError('promises must be an array');

    return PromiseThunk(
      function promiseRace(resolve, reject) {
        promises.forEach(function (p) {
          if (p instanceof PromiseThunk || isPromise(p))
            return p.then(resolve, reject);
          resolve(p);
        }); // promises.forEach
      }
    ); // return PromiseThunk
  } // race

  // isPromise(p)
  setValue(PromiseThunk, 'isPromise', isPromise);
  function isPromise(p) {
    return !!p && typeof p.then === 'function';
  }

  // PromiseThunk.accept(val)
  setValue(PromiseThunk, 'accept', PromiseThunk.resolve);

  // PromiseThunk.defer()
  setValue(PromiseThunk, 'defer', defer);
  function defer() {
    var p = PromiseThunk();
    return {promise: p,
            resolve: function resolve() { $$resolve.apply(p, arguments); },
            reject:  function reject()  { $$reject.apply(p, arguments); }};
  }

  // isIterator(iter)
  setValue(PromiseThunk, 'isIterator', isIterator);
  function isIterator(iter) {
    return iter && (typeof iter.next === 'function' || isIterable(iter));
  }

  // isIterable(iter)
  setValue(PromiseThunk, 'isIterable', isIterable);
  function isIterable(iter) {
    return iter && typeof Symbol === 'function' && Symbol &&
           Symbol.iterator && typeof iter[Symbol.iterator] === 'function';
  }

  // makeArrayFromIterator(iter or array)
  setValue(PromiseThunk, 'makeArrayFromIterator', makeArrayFromIterator);
  function makeArrayFromIterator(iter) {
    if (iter instanceof Array) return iter;
    if (!isIterator(iter)) return [iter];
    if (isIterable(iter)) iter = iter[Symbol.iterator]();
    var array = [];
    try {
      for (;;) {
        var val = iter.next();
        if (val && val.hasOwnProperty('done') && val.done) return array;
        if (val && val.hasOwnProperty('value')) val = val.value;
        array.push(val);
      }
    } catch (error) {
      return array;
    }
  } // makeArrayFromIterator

  function err2str(err) {
    var msg = err.stack || (err + '');
    return msg.split('\n').filter(filterExcludeMocha).join('\n');
  }

  function filterExcludeMocha(s) {
    return !s.match(/node_modules.*mocha/);
  }

  if (typeof module === 'object' && module && module.exports)
    module.exports = PromiseThunk;

  setValue(PromiseThunk, 'PromiseThunk', PromiseThunk);
  setValue(PromiseThunk, 'Promise', PromiseThunk);
  return PromiseThunk;

}();
