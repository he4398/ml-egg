'use strict';

module.exports = app => {
    app.httpclient.on('response', result => {
        const {
            req,
            res,
            ctx: { starttime },
            ctx,
        } = result;
        if (res.statusCode === 200) {
            ctx.logger.info(
                req.url,
                ctx.method,
                ctx.headers,
                req.args.data,
                res.statusCode,
                res.data,
                `Spend time: ${Date.now() - starttime}`
            );
        } else {
            ctx.logger.warn(
                req.url,
                ctx.method,
                ctx.headers,
                req.args.data,
                res.statusCode,
                res.data,
                `Spend time: ${Date.now() - starttime}`
            );
        }
    });
};
