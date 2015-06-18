try {
var PromiseThunk = require('../promise-thunk');
} catch (e) {
  console.log('err: ' + e);
  var PromiseThunk = require('promise-thunk');
}

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
