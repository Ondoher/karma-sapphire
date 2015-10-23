
var config = require('sapphire-express').CONFIG;

var dir = process.env.node_config?process.env.node_config:undefined;

var testConfig = {
	req: {query: {}},
	res: {}
};

try { if (dir) testConfig = require(dir + 'config.test');}
catch (e) {}

config = Object.merge(config, testConfig);

module.exports.CONFIG = config

