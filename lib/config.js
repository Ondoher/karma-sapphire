var config =
{
	port : 8080,
	server : 'localhost',
	baseUrl : 'http://localhost:8080/',
	basePath : process.cwd(),
	log : true,

	sapphireEncryptKey: 'iCUrNsmjz0biDfsgKATOKIbExn+yxCeV',
 	sapphireEncryptCipher: 'aes-256-cbc',
};

var dir = process.env.node_config?process.env.node_config:undefined;

var appConfig = {};
if (dir) appConfig = require(dir + 'config');

config = Object.merge(config, appConfig);

var dir = process.env.node_config?process.env.node_config:undefined;

var testConfig = {
	req: {query: {}},
	res: {}
};

try { if (dir) testConfig = require(dir + 'config.test');}
catch (e) {}

config = Object.merge(config, testConfig);

module.exports.CONFIG = config

