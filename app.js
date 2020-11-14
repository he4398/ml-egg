/*
 * @Description:
 * @version:
 * @Author: hean
 * @Date: 2019-11-15 20:55:51
 * @LastEditors: hean
 * @LastEditTime: 2020-11-14 16:29:41
 */
'use strict';
const path = require('path');

module.exports = (app) => {
    app.config.coreMiddleware.unshift('logger');

    app.config.coreMiddleware.unshift('compress');
    app.config.coreMiddleware.unshift('origin');

    const schemas = path.join(app.config.baseDir, 'app/schemas');
    app.loader.loadToApp(schemas, 'schemas');

    if (app.httpclient) {
        const httpClient = require('./lib/event_logger/http_client');
        httpClient(app);
    }
    if (app.prometheus) {
        const { collectDefaultMetrics } = require('prom-client');
        const onerrorMetrics = require('./lib/metrics/onerror');
        onerrorMetrics(app);
        collectDefaultMetrics(app.prometheus.register);
    }
};
