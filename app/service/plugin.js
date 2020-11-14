'use strict';

const { Service } = require('egg');

class PluginService extends Service {
    async validateToken(token) {
        const {
            app: { config },
        } = this;
        const { url, appkey, appSecret } = config.ssoIdentity;
        const data = this.ctx.helper.sign({ token }, appkey, appSecret);

        const result = await this.ctx.curl(url, {
            method: 'POST',
            dataType: 'json',
            data,
        });

        return result;
    }
    async email(options) {
        const {
            app: { config },
        } = this;
        const { url, appkey, appSecret } = config.email;
        const data = this.ctx.helper.sign(options, appkey, appSecret);

        const result = await this.ctx.curl(url, {
            method: 'POST',
            dataType: 'json',
            data,
        });

        return result;
    }
}

module.exports = PluginService;
