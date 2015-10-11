// child_process.exists example

(function () {
	'use strict';

	try {
		var PromiseThunk = require('promise-thunk');
	} catch (e) {
		var PromiseThunk = require('../promise-thunk');
	}

	var fs = require('fs');
	var existsThunk = PromiseThunk.thunkify(fs.exists);
	var existsPromise = PromiseThunk.promisify(fs.exists);

	function color(x) {
		return typeof window !== 'undefined' ? '' : '\x1b[' + (x ? x : '') + 'm';
	}

	var file = __filename;

	console.log('---- start');
	var n = 0;

	++n;
	existsThunk(file)(function (err, val) {
		console.log(color(32) + '---- thunk   type:%s, value:%s %s %s', typeof val, val, err ? err : '', color());
	});
	++n;
	existsThunk(file)(function (val) {
		console.log(color(32) + '---- thunk   type:%s, value:%s %s', typeof val, val, color());
	});

	++n;
	existsPromise(file).then(function (val) {
		console.log(color(36) + '---- promise type:%s, value:%s', typeof val, val + color());
	},
	function (err) {
		console.log(color(36) + '---- promise error', err);
		console.log('---- promise' + color());
	}).then(end);

	++n;
	existsPromise(file)(function (err, val) {
		console.log(color(35) + '---- promise type:%s, value:%s %s %s', typeof val, val, err ? err : '', color());
	});
	++n;
	existsPromise(file)(function (val) {
		console.log(color(35) + '---- promise type:%s, value:%s %s', typeof val, val, color());
	});

	function end() {
		if (--n === 0) console.log('---- end');
	}

})();
