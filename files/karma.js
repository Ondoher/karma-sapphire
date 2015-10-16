SAPPHIRE.karma = {};
SAPPHIRE.karma.container = $('<div id="karma-body">');
SAPPHIRE.karma.body = $('<span>');

$(document.body).append(SAPPHIRE.karma.container);

SAPPHIRE.karma.reset = function() {
	SAPPHIRE.karma.container.empty();
	SAPPHIRE.karma.container.append(SAPPHIRE.karma.body);
	$(document.body).removeClass();
	$(document.body).addClass(SAPPHIRE.karma.states);
	SAPPHIRE.application.ready();
	SAPPHIRE.application.fire('reset');
};
