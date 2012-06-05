var Mocha = require('mocha'),
	path = require('path'),
	fs = require('fs');

var mocha = new Mocha({
	reporter: 'spec',
	ui: 'bdd',
	timeout: 999999
});

var testDir = './tests/';

fs.readdir(testDir, function(err, files) {
	if (err) {
		console.log(err);
		return;
	}
	files.forEach(function (file) {
		if (/-tests\.js$/.test(file)) {
			console.log('adding test file: %s', file);
			mocha.addFile(testDir + file);
		}
	});

	var runner = mocha.run(function () { });

	runner.on('pass', function (test) {
		console.log('... %s passed', test.title);
	});

	runner.on('fail', function (test) {
		console.log('... %s failed', test.title);
	});
});