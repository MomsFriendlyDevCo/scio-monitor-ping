var ping = require('ping');

module.exports = {
	_scio: true,
	_name: 'Ping',
	monitors: [
		{
			ref: 'ping',
			type: 'boolean',
			callback: function(next, service) {
				ping.promise.probe(service.address || service.server.address, {
					timeout: service.timeout || 30,
				}).then(function(res) {
					next(null, res.alive);
				});
			},
		},
	],
};
