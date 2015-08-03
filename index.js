var ping = require('ping-wrapper2');

module.exports = {
	_scio: true,
	_name: 'Ping',
	monitors: [
		{
			ref: 'ping',
			description: 'Test a ping response',
			type: 'boolean',
			options: [
				{
					id: 'count',
					description: 'Number of packets to monitor, the response time are the averages of these',
					type: 'number',
					default: 10,
				},
				{
					id: 'timeoutWarning',
					type: 'duration',
					default: 500,
				},
				{
					id: 'timeoutDanger',
					type: 'timeout',
					default: 1000,
				},
			],
			callback: function(next, service) {
				var timeouts = [];
				ping(service.address || service.server.address)
					.on('error', function(err) {
						return next(err);
					})
					.on('data', function(data) {
						timeouts.push(data.time);
					})
					.on('exit', function() {
						var totalTime = 0;
						timeouts.forEach(function(time) { totalTime += time });
						var averageTime = totalTime / timeouts.length;

						if (averageTime > service.options.timeoutDanger) {
							return next(null, {
								status: 'danger',
								value: averageTime,
							});
						} else if (averageTime > service.options.timeoutWarning) {
							return next(null, {
								status: 'warning',
								value: averageTime,
							});
						} else {
							return next(null, {
								status: 'ok',
								value: averageTime,
							});
						}
					});
			},
		},
	],
};
