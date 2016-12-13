require('mootools');
var url = require('url');
var fs = require('fs');
var Q = require('q');
var CONFIG = require('./config').CONFIG;
var path = require('path');
var Session = require('./session');
var apps = {};
noop = function() {};
var thisDir = __dirname;
var preload = [
	'/assets/js/app/controller.js',
	'/assets/js/app/view.js',
	'/assets/js/app/model.js',
	'/assets/js/app/application.js',
	'/assets/js/app/page-manager.js',
	'/assets/js/app/loader.js',
	'/assets/js/app/eventer.js',
	'/assets/js/app/package.js',
	'/assets/js/3rdparty/q.js',
	'/assets/js/3rdparty/mootools-more-1.4.0.1.js',
	'/assets/js/3rdparty/mootools-core-1.4.5.js',
	'/assets/js/3rdparty/jquery.address.js',
	'/assets/js/3rdparty/jquery-1.11.3.js'
];

function getApp(root, path, callback)
{
	var file = path.split('/').pop();
	var file = root + path + '/' + file + '.js';
	if (apps[path])
	{
		return callback(apps[path], file);
	}
	else
	{
		exists = fs.existsSync(file)
			if (exists)
			{
				try
				{
					apps[path] = require(file);
				}
				catch (e)
				{
					console.log(e);
					console.log(e.stack);
				}
				return callback(apps[path], file);
			}
			else
				callback(null, '');
	}
}

function initSapphire(logger, preprocessors, basePath, proxies, options, files, config)
{
	var log = logger.create('framework.sapphire');
	var cookies = {get: noop, set: noop};

	CONFIG.req.cookies = cookies;
	CONFIG.res.cookies = cookies;
	CONFIG.req.headers = {};

	var session = new Session(CONFIG.req, CONFIG.res, './mockStore');
	CONFIG.req.session = session;
	CONFIG.res.session = session;

	var appPath = options.app;
	if (appPath == null) return;

	files.unshift({pattern: CONFIG.basePath + '/node_modules/sapphire-express/public/**/*', included: false, served: true, watched: false});
	proxies['/assets/'] = '/base/node_modules/sapphire-express/public/assets/';
	files.unshift({pattern: CONFIG.basePath + '/apps/**/assets/**/*', included: false, served: true, watched: false});

	function addFile(name)
	{
		files.unshift({pattern: CONFIG.basePath + '/node_modules/sapphire-express/public/' + name, included: true, served: true, watched: false});
	}

	getApp(CONFIG.basePath + '/apps/', appPath, function(app, appPath)
	{
        var pre =  path.normalize(thisDir + '/../files/pre.js');
        var karma =  path.normalize(thisDir + '/../files/karma.js');
        var body =  path.normalize(thisDir + '/../files/body.js');

		preprocessors[body] = ['sapphire'];
		files.unshift({pattern: body, included: true, served: true, watched: false});
		files.unshift({pattern: karma, included: true, served: true, watched: false});

		preload.each(function(file)
		{
			addFile(file);
		});
		preprocessors[pre] = ['sapphire'];
		files.unshift({pattern: pre, included: true, served: true, watched: false});
	});
}

initSapphire.$inject = ['logger', 'config.preprocessors', 'config.basePath', 'config.proxies', 'config.sapphire', 'config.files', 'config'];

function buildApp(logger, basePath, options)
{
	var appPath = options.app;
	return function(content, file, done)
	{
		var cookies = {get: noop, set: noop};
		CONFIG.req.cookies = cookies;
		CONFIG.res.cookies = cookies;
		CONFIG.req.headers = {};

		var session = new Session(CONFIG.req, CONFIG.res, './mockStore');
		CONFIG.req.session = session;
		CONFIG.res.session = session;

		getApp(CONFIG.basePath + '/apps/', appPath, function(app, appPath)
		{
			app.getApplication(CONFIG.req, CONFIG.res)
				.then(function(app)
				{
					var js = [];
					var css = [];

					app.headerJSFiles.each(function(file) {
						js.push(file);
					});

					app.rawJavascriptFiles.each(function(file) {
						js.push(file);
					});

					app.javascriptFiles.each(function(file) {
						if (preload.indexOf(file) === -1)
							js.push(file);
					});

					app.CSSFiles.each(function(file) {
						css.push(file);
					});

					app.getHTML(function(content)
					{
						var pre = app.makeConfigJavaScript();
						var post = app.makePostJavaScript();
						var jsJson = JSON.stringify(js);
						var cssJson = JSON.stringify(css);
						var body = app.body;
						var which = file.path.split('/').pop();

						var states = app.states.join(' ') || '';
						var replacements = {};

//		this.rawCSSFiles = [];

						app.replacements.each(function(value, name)
						{
							replacements[name] = value
						}, this);

					// do this three levels deep (totally arbitrary)
						body = app.replace(body, replacements);
						body = app.replace(body, replacements);
						body = app.replace(body, replacements);

						if (which === 'pre.js')
							done(null, pre);
						else
						{
							var output = 'SAPPHIRE.karma.body = $(' + JSON.stringify(body) + ');\n';
							output += 'SAPPHIRE.karma.states = ' + JSON.stringify(states) + ';\n';
							output += 'SAPPHIRE.karma.container.append(SAPPHIRE.karma.body)\n';
							output += '$(document.body).addClass(' + JSON.stringify(states) + ');\n';
							output += 'SAPPHIRE.loader.loadCSS(' + cssJson + ')\n';
							output += 'SAPPHIRE.loader.loadScripts(' + jsJson + ')\n';
							output += '	.then(function()\n';
							output += '	{\n';
							post = post.replace('$(function(){SAPPHIRE.application.start()})', '');
							output += post;
							output += '		SAPPHIRE.application.fire(\'karma-ready\');';
							output += '\n	}).done();\n';
							done(null, output);
						}
					});
				}).done();
		});
	};
}
buildApp.$inject = ['logger', 'config.basePath', 'config.sapphire'];

module.exports = {
	'framework:sapphire': ['factory', initSapphire],
	'preprocessor:sapphire': ['factory', buildApp],
}

