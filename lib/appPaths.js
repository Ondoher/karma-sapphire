var fs = require('fs');
var path = require('path');
var url = require('url');
var appPaths = [];
var CONFIG = require('./config').CONFIG;

function getDir(path)
{
	files = fs.readdirSync(path);
	if (!files) return [];
	return files;
}

function isApp(path)
{
	if (!fs.existsSync(path)) return false;
	try
	{
		var module = require(path);
		if (module.getApplication) return true;
		return false;
	}
	catch(err)
	{
//		console.log(err);
//		console.log(err.stack);
		return false;
	}
}

function isDirectory(path)
{
	var stats = fs.statSync(path);
	if (!stats) return false;
	return {path: path, directory: stats.isDirectory()};
}

function checkApp(path)
{
	stats = fs.statSync(path);
	if (!stats) return false;
	if (!stats.isDirectory()) return false;

	var parts = path.split('/');
	var name = parts[parts.length - 1];
	var file = path + '/' + name + '.js';

	if (isApp(file)) appPaths.push(path);

	return true;
}

function findApplications(root)
{
	root = (root === undefined)?CONFIG.basePath + '/apps':root;

	files = getDir(root)

	files.each(function(file)
	{
		if (file.charAt(0) == '.') return;
		if (file == 'assets') return;
		if (file == 'service') return;
		if (file == 'node_modules') return;
		checkApp(root + '/' + file);
		var dir = isDirectory(root + '/' + file);
		if (dir.directory) findApplications(dir.path);
	});
}

findApplications();
appPaths.each(function(path, idx)
{
	var root = CONFIG.basePath + '/apps';
	var newPath = path.slice(root.length);
	appPaths[idx] = newPath;
});
appPaths.sort(function(a, b)
{
	return b.length - a.length;
});


module.exports = appPaths;
