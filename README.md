[promise-thunk](https://www.npmjs.org/package/promise-thunk) - npm
====

  ES6 Promise + Thunk = PromiseThunk!

  `promise-thunk` is standard ES6 Promise implementation + thunk.<br/>
  it supports browsers and node.js.

  it throws unhandled rejection error.


# INSTALL:

[![NPM](https://nodei.co/npm/promise-thunk.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/promise-thunk/)
[![NPM](https://nodei.co/npm-dl/promise-thunk.png?height=2)](https://nodei.co/npm/promise-thunk/)

for node.js:

```bash
$ npm install promise-thunk --save
```

or

for browsers:

[https://lightspeedworks.github.io/promise-thunk/promise-thunk.js](https://lightspeedworks.github.io/promise-thunk/promise-thunk.js)

```html
<script src="https://lightspeedworks.github.io/promise-thunk/promise-thunk.js"></script>
```

# PREPARE:

you can use PromiseThunk.

in node.js

```js
var PromiseThunk = require('promise-thunk');
```

in browsers

```js
(function (PromiseThunk) {
  'use strict';
  // you can use PromiseThunk
})(this.PromiseThunk || require('promise-thunk'));
```

or

```js
var PromiseThunk = this.PromiseThunk || require('promise-thunk');
```


# QUICK EXAMPLE:

```js
var PromiseThunk = require('promise-thunk');

function sleepNodeStyle(msec, val, cb) {
  console.log(val + ' timer start: ' + msec);
  setTimeout(function () {
    console.log(val + ' timer end  : ' + msec);
    cb(null, val);
  }, msec);
}

var sleepPromiseThunk = PromiseThunk.wrap(sleepNodeStyle);

// promise type
sleepPromiseThunk(1000, 'a1')
.then(
  function (val) {
    console.log('a2 val: ' + val);
    return sleepPromiseThunk(1000, 'a2'); },
  function (err) { console.log('err:' + err); })
.catch(
  function (err) { console.log('err:' + err); }
);

// thunk type
sleepPromiseThunk(1000, 'b1')
(function (err, val) {
  console.log('b2 val: ' + val + (err ? ' err: ' + err : ''));
  return sleepPromiseThunk(1000, 'b2'); })
(function (err, val) {
  console.log('b3 val: ' + val + (err ? ' err: ' + err : '')); });

// mixed promise and thunk type
sleepPromiseThunk(1000, 'c1')
(function (err, val) {
  console.log('c2 val: ' + val + (err ? ' err: ' + err : ''));
  return sleepPromiseThunk(1000, 'c2'); })
.then(
  function (val) {
    console.log('c3 val: ' + val);
    return sleepPromiseThunk(1000, 'c3'); },
  function (err) { console.log('err:' + err); });

//output:
// a1 timer start: 1000
// b1 timer start: 1000
// c1 timer start: 1000
// a1 timer end  : 1000
// a2 val: a1
// a2 timer start: 1000
// b1 timer end  : 1000
// b2 val: b1
// b2 timer start: 1000
// c1 timer end  : 1000
// c2 val: c1
// c2 timer start: 1000
// a2 timer end  : 1000
// b2 timer end  : 1000
// b3 val: b2
// c2 timer end  : 1000
// c3 val: c2
// c3 timer start: 1000
// c3 timer end  : 1000
```

# USAGE:

PromiseThunk Specification
----

### new PromiseThunk(setup)

how to make promise.

```js
p = new PromiseThunk(
  function setup(resolve, reject) {
    // async process -> resolve(value) or reject(error)
    try { resolve('value'); }
    catch (error) { reject(error); }
  }
);
// setup(
//  function resolve(value) {},
//  function reject(error) {})
```

example

```js
var p = new PromiseThunk(
  function setup(resolve, reject) {
    setTimeout(function () {
      if (Math.random() < 0.5) resolve('value');
      else reject(new Error('error'));
    }, 100);
  }
);

// promise
p.then(
  function (val) { console.info('val:', val); },
  function (err) { console.error('err:', err); });

// thunk
p(function (err, val) { console.info('val:', val, 'err:', err); });

// mixed chainable
p(function (err, val) { console.info('val:', val, 'err:', err); })
(function (err, val) { console.info('val:', val, 'err:', err); })
(function (err, val) { console.info('val:', val, 'err:', err); })
.then(
  function (val) { console.info('val:', val); },
  function (err) { console.error('err:', err); })
.then(
  function (val) { console.info('val:', val); },
  function (err) { console.error('err:', err); })
(function (err, val) { console.info('val:', val, 'err:', err); })
.then(
  function (val) { console.info('val:', val); },
  function (err) { console.error('err:', err); });
```

### PromiseThunk.convert(p)

  `convert()` converts standard promise to promise-thunk.

  + `p`: standard promise or thenable object.

### PromiseThunk.promisify([ctx,] fn, [options])

  `promisify()` converts node style function into a function returns promise-thunk. <br>
  you can use `fs.exists()` and `child_process.exec()` also.

  + `ctx`: context object. default: this or undefined.
  + `fn`: node-style normal function.
  + `options`: options object.
    + `context`: context object.

  also thenable, yieldable, callable.

#### postgres `pg` example:

```js
var pg = require('pg');
var pg_connect = promisify(pg, pg.connect);         // -> yield pg_connect()
var client_query = promisify(client, client.query); // -> yield client_query()
```

### PromiseThunk.promisify(object, method, [postfix])

  `promisify()` defines method promisified function returns promise-thunk.

  + `object`: target object.
  + `method`: method name string.
  + `postfix`: method name postfix or suffix. default: 'A'.

#### postgres `pg` example:

```js
var pg = require('pg');
promisify(pg, 'connect');                  // -> yield pg.connectA()
promisify(pg.Client.prototype, 'connect'); // -> yield client.connectA()
promisify(pg.Client.prototype, 'query');   // -> yield client.queryA()
```

### PromiseThunk.thunkify([ctx,] fn, [options])

  `thunkify()` converts node style function into a thunkified function. <br>
  you can use `fs.exists()` and `child_process.exec()` also.

  + `ctx`: context object. default: this or undefined.
  + `fn`: node-style normal function with callback.
  + `options`: options object.
    + `context`: context object.

  also yieldable, callable.

#### postgres `pg` example:

```js
var pg = require('pg');
var pg_connect = thunkify(pg, pg.connect);         // -> yield pg_connect()
var client_query = thunkify(client, client.query); // -> yield client_query()
```

### PromiseThunk.thunkify(object, method, [postfix])

  `thunkify()` defines method thunkified function returns thunk.

  + `object`: target object.
  + `method`: method name string.
  + `postfix`: method name postfix or suffix. default: 'A'.

#### postgres `pg` example:

```js
var pg = require('pg');
thunkify(pg, 'connect');                  // -> yield pg.connectA()
thunkify(pg.Client.prototype, 'connect'); // -> yield client.connectA()
thunkify(pg.Client.prototype, 'query');   // -> yield client.queryA()
```

### promise.then(onFulfilled, onRejected)

how to use promise.

```js
p = p.then(
  function resolved(value) {},
  function rejected(error) {});
```

example

```js
p = p.then(
  function resolved(value) {
    console.info(value);
  },
  function rejected(error) {
    console.error(error);
  });
```

### promise.catch(onRejected)

how to catch error from promise.

```js
p = p.catch(
  function rejected(error) {});
```

or

when you use old browser
```js
p = p['catch'](
  function rejected(error) {});
```

### PromiseThunk.all(iterable or array)

wait for all promises.

```js
p = PromiseThunk.all([promise, ...]);
```

### PromiseThunk.race(iterable or array)

get value or error of first finished promise.

```js
p = PromiseThunk.race([promise, ...]);
```

### PromiseThunk.resolve(value or promise)

get resolved promise.

```js
p = PromiseThunk.resolve(value or promise);
```

### PromiseThunk.reject(error)

get rejected promise.

```js
p = PromiseThunk.reject(error);
```

### PromiseThunk.accept(value)

get resolved (accepted) promise.

```js
p = PromiseThunk.accept(value);
```

### PromiseThunk.defer()

make deferred object with promise.

```js
dfd = PromiseThunk.defer();
// -> {promise, resolve, reject}
```


# SEE ALSO:

  npm promise-light

  npm aa

  npm co


# LICENSE:

  MIT
