// child_process.exec example

(function () {
	'use strict';

	try {
		var PromiseThunk = require('promise-thunk');
	} catch (e) {
		var PromiseThunk = require('../promise-thunk');
	}

	var child_process = require('child_process');
	var execThunk = PromiseThunk.thunkify(child_process.exec);
	var execPromise = PromiseThunk.promisify(child_process.exec);

	function color(x) {
		return typeof window !== 'undefined' ? '' : '\x1b[' + (x ? x : '') + 'm';
	}

	var cmd = process.platform === 'win32' ? 'cmd /c dir /b *.js' : 'ls -l *.js';

	console.log('---- start');
	var n = 0;

	++n;
	execThunk(cmd)(function (err, val) {
		console.log(color(32) + '---- thunk   type:%s, class:%s', typeof val, val && val.constructor.name);
		console.log(val);
		console.log('---- thunk' + color());
		end();
	});
	++n;
	execThunk(cmd)(function (err, stdout, stderr) {
		console.log(color(32) + '---- thunk   type:%s, stdout:%j', typeof stdout, stdout);
		console.log('---- thunk   type:%s, stderr:%j', typeof stderr, stderr);
		console.log('---- thunk' + color());
		end();
	});

	++n;
	execPromise(cmd).then(function (val) {
		console.log(color(36) + '---- promise type:%s, class:%s', typeof val, val && val.constructor.name);
		console.log(val);
		console.log('---- promise' + color());
	},
	function (err) {
		console.log(color(36) + '---- promise error', err);
		console.log('---- promise' + color());
	}).then(end);

	++n;
	execPromise(cmd)(function (err, val) {
		console.log(color(35) + '---- promise type:%s, class:%s',typeof val, val && val.constructor.name);
		console.log(err ? err : '', val);
		console.log('---- promise' + color());
		end();
	});
	++n;
	execPromise(cmd)(function (err, stdout, stderr) {
		console.log(color(35) + '---- promise  type:%s, stdout:%j', typeof stdout, stdout);
		console.log('---- promise type:%s, stderr:%j', typeof stderr, stderr);
		console.log('---- promise' + color());
		end();
	});

	function end() {
		if (--n === 0) console.log('---- end');
	}

})();
