require('mootools');
var url = require('url');
var fs = require('fs');
var Q = require('q');
var CONFIG = require('./config').CONFIG;
var path = require('path');
var Session = require('./session');
var paths = require('./appPaths');
var apps = {};
noop = function() {};

console.log('paths', paths);

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


xinitSapphire = function(app)
{
	var cookies = {get: noop, set: noop};

	CONFIG.req.cookies = cookies;
	CONFIG.res.cookies = cookies;
	CONFIG.req.headers = {};

	var session = new Session(CONFIG.req, CONFIG.res, './mockStore');
	CONFIG.req.session = session;
	CONFIG.res.session = session;

	var appPath = app;
	var ext = path.extname(CONFIG.req.url);

	if (appPath == null) return;

	getApp(CONFIG.basePath + '/apps/', appPath, function(app, appPath)
	{
		if (app)
		{
			app.getApplication(CONFIG.req, CONFIG.res)
				.then(function(app)
				{
					app.getAllContent()
						.then(app.mangle.bind(app, false))
						.then(test.bind(this, app, appPath))
				})
				.done();
		}
	});
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

	config.basePath = CONFIG.basePath;

	files.unshift({pattern: CONFIG.basePath + '/node_modules/sapphire-express/public/**/*', included: false, served: true, watched: false});
	proxies['/assets/'] = '/base/node_modules/sapphire-express/public/';
	files.unshift({pattern: CONFIG.basePath + '/apps/**/assets/**/*', included: false, served: true, watched: false});

//	paths.each(function(path)
//	{
//		proxies[path + '/assets/'] = '/base/apps' + path + '/assets/';
//	});
/*
		proxies: {
			'/assets/': '/base/dist/external/',
			'/sandbox_resources/': '/base/dist/sandbox_resources/',
			'/bundles/': '/base/dist/bundles/',
			'/addons/': '/base/dist/addons/'
		},
*/
	function addFile(name)
	{
		files.unshift({pattern: CONFIG.basePath + '/node_modules/sapphire-express/public/assets/js/' + name, included: true, served: true, watched: false});
	}

	getApp(CONFIG.basePath + '/apps/', appPath, function(app, appPath)
	{
		if (!app) done();

		var pre =  CONFIG.basePath + '/node_modules/karma-sapphire/files/pre.js';
		var body =  CONFIG.basePath + '/node_modules/karma-sapphire/files/body.js';

//		files.unshift({pattern: '/sfe/assets/js/Models/Utils.js', included: true, served: true, watched: false});

		preprocessors[body] = ['sapphire'];
		files.unshift({pattern: body, included: true, served: true, watched: false});

		preprocessors[pre] = ['sapphire'];
		files.unshift({pattern: pre, included: true, served: true, watched: false});

		addFile('app/controller.js');
		addFile('app/view.js');
		addFile('app/model.js');
		addFile('app/application.js');
		addFile('app/page-manager.js');
		addFile('app/loader.js');
		addFile('app/eventer.js');
		addFile('app/package.js');
		addFile('3rdparty/q.js');
		addFile('3rdparty/mootools-more-1.4.0.1.js');
		addFile('3rdparty/mootools-core-1.4.5.js');
		addFile('3rdparty/jquery.address.js');
		addFile('3rdparty/jquery-1.11.3.js');
		preprocessors[pre] = ['sapphire'];


		files.unshift({pattern: pre, included: true, served: true, watched: false});

		console.log(config);
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

					app.javascriptFiles.each(function(file) {
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

						if (which === 'pre.js')
							done(null, pre);
						else
						{
							var output = 'SAPPHIRE.karma = {}\n';
							output += 'SAPPHIRE.karma.body = $(' + JSON.stringify(body) + ');\n';
							output += '$(document.body).append(\'<div id="karma-body">\').append(SAPPHIRE.karma.body)\n';
							output += 'SAPPHIRE.loader.loadCSS(' + cssJson + ')\n';
							output += 'SAPPHIRE.loader.loadScripts(' + jsJson + ')\n';
							output += '	.then(function()\n';
							output += '	{\n';
							output += post;
							output += '\n	});\n';
							//done(null, 'var js = ' + json);
							done(null, output);
						}
					});
				}).done();
		});
	};
}
buildApp.$inject = ['logger', 'config.basePath', 'config.sapphire'];

function serveStatic(logger, basePath, options)
{
	return function(content, file, done)
	{
	}
}


module.exports = {
	'framework:sapphire': ['factory', initSapphire],
	'preprocessor:sapphire': ['factory', buildApp],
}

