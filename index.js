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
				// Timeout handling {{{
				// Since Ping relies on the system DNS table it can go for quite a while before eventually timing out
				// This function watches ping and forces a timeout if it lasts longer than the timeoutDanger rating
				var hasTimeout = false;
				var timeoutHandle = setTimeout(function() {
					hasTimeout = true;
					return next(null, {
						status: 'danger',
						value: service.options.timeoutDanger,
						response: 'timeout',
					});
				}, service.options.timeoutDanger);
				// }}}
				ping(service.address || service.server.address)
					.on('error', function(err) {
						return next(err);
					})
					.on('data', function(data) {
						if (timeoutHandle) clearTimeout(timeoutHandle);
						timeouts.push(data.time);
					})
					.on('exit', function() {
						if (hasTimeout) return; // Already timed out
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
