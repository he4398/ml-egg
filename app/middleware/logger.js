'use strict';
const _ = require('lodash');
module.exports = (options = {}, app) => {
    let { ignoreRouter = [] } = options;
    const plugin = _.get(app.config, 'MlEgg.ignoreRouter', null);

    ignoreRouter = plugin ? plugin : ignoreRouter;

    return async (ctx, next) => {
        try {
            const startTime = Date.now();
            await next();
            let body = {};
            try {
                body = JSON.stringify(ctx.body);
            } catch (error) {
                body = {};
            }
            if (!ignoreRouter.includes(ctx.url)) {
                ctx.logger.info(
                    ctx.url,
                    ctx.method,
                    ctx.headers,
                    ctx.request.query || ctx.request.body || {},
                    body,
                    ctx.status,
                    `Spend time: ${Date.now() - startTime}`
                );
            }
        } catch (err) {
            const { code = -1, status = 400, message = '', stack } = err;
            ctx.logger.error(
                ctx.url,
                ctx.method,
                ctx.headers,
                ctx.request.query || ctx.request.body || {},
                status,
                message,
                stack
            );

            ctx.status = 200;
            ctx.body = { code, status, message };
        }
    };
};
