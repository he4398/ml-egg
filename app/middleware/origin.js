'use strict';
const _ = require('lodash');
module.exports = (options = {}, app) => {
    let { cors = [] } = options;
    const plugin = _.get(app.config, 'MlEgg.cors', null);

    cors = plugin ? plugin : cors;
    return async function setOrigin(ctx, next) {
        const { origin = '' } = ctx.request.headers;
        if (origin && (cors.some((domain) => origin.endsWith(domain)) || cors.includes('*'))) {
            if (ctx.request.method === 'OPTIONS') {
                ctx.set('Access-Control-Allow-Credentials', true);
                ctx.set('Access-Control-Allow-Methods', '*');
                ctx.set('Access-Control-Allow-Headers', 'Content-Type,Access-Token');
                ctx.set('Access-Control-Expose-Headers', '*');
                ctx.set('Access-Control-Allow-Origin', origin);
                ctx.status = 204;
            } else {
                ctx.set('Access-Control-Allow-Credentials', true);
                ctx.set('Access-Control-Allow-Methods', '*');
                ctx.set('Access-Control-Allow-Headers', 'Content-Type,Access-Token');
                ctx.set('Access-Control-Expose-Headers', '*');
                ctx.set('Access-Control-Allow-Origin', origin);
            }
        }
        await next();
    };
};
