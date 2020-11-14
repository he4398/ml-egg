'use strict';
const { Counter } = require('prom-client');
module.exports = app => {
    const OnerrorNumber = new Counter({
        name: 'http_request_error_total',
        help: 'http request error total',
        labelNames: [ 'method', 'path', 'routerName', 'matchedRoute', 'status' ],
    });
    app.on('error', (err, ctx) => {
        const { method, path, status, _matchedRoute } = ctx;
        const matchedRoute = _matchedRoute || '';
        const routerName = ctx.routerName || matchedRoute;
        OnerrorNumber.inc({ method, path, routerName, matchedRoute, status }, 1);
    });
};
