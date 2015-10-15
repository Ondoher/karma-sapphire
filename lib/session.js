var events = require('events');

var Session = new Class(
{
	initialize : function(req, res, storeName)
	{
		var store = require(storeName);
		this.sessionId = req.cookies.get('sessionId');

	// if it is not in the cookies, try the headers
		if (!this.sessionId)
		{
			if (req.headers['x-sapphire-session'] !== undefined)
				this.sessionId = req.headers['x-sapphire-session'];
		}

		this.req = req;
		this.res = res;
		this.cookieSent = false;

		this.store = store(req, res, this.sessionId);
	},

	setSessionId : function()
	{
		this.res.cookies.set('sessionId', this.store.getSessionId(), {httpOnly: false, overwrite: true});
		this.res.setHeader('X-Sapphire-Session', this.store.getSessionId());
	},

	load : function()
	{
		return this.store.load()
			.then(function(data)
			{
				this.data = data;
			}.bind(this));
	},

	get : function()
	{
		return this.data;
	},

	set : function(name, value)
	{
		this.store.set(name, value);

		if (!this.cookieSent) this.setSessionId();
		this.cookieSent = true;
	},

	save : function()
	{
		return this.store.save();
	}
});
Session.implement(events.EventEmitter.prototype);

module.exports = Session;
