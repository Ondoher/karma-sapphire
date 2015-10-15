var events = require('events');
var Q = require('q');
var uuid = require('node-uuid');

var Session = new Class(
{
	initialize : function(res, sessionId)
	{
		this.res = res;
		this.sessionId = sessionId;
		this.session = null;
		data = null;
	},

	load : function()
	{
		var data;

		if (this.session) return Q(this.session);

		this.sessionId = uuid.v4();
		data = JSON.stringify({});

		var md5sum = crypto.createHash('md5');
		md5sum.update(data);
		this.hash = md5sum.digest('hex');

		this.session = {};
		return Q(this.session);

	},

	getSessionId : function()
	{
		return this.sessionId;
	},

	set : function(name, value)
	{
		this.session[name] = value;
	},

	update : function(session)
	{
		this.session = session;
		var sessionJ = JSON.stringify(this.session);
		return Q(sessionJ);
	},

	save : function()
	{
		data = JSON.stringify(this.session);

		var md5sum = crypto.createHash('md5');
		md5sum.update(data);
		var hash = md5sum.digest('hex');

		if (hash != this.hash)
		{
			this.hash = hash;
			return this.update(this.session);
		}
		else
		{
			return Q(true);
		}
	}
});

Session.implement(events.EventEmitter.prototype);

module.exports = function(req, res, sessionId)
{
	return new Session(res, sessionId);
};

