'use strict';
const { default: AsyncValidator } = require('async-validator');

module.exports = {
    curl(url, opts) {
        const { headers = {} } = this;
        if (headers['x-request-id']) opts.headers = { ...opts.headers, 'x-request-id': headers['x-request-id'] };
        return this.httpClient.curl(url, opts);
    },
    async isLogin() {
        // const token = this.cookies.get('GUAZISSO', { signed: false });
        // const EGG_SESS_MD = this.cookies.get('EGG_SESS_MD', { signed: false });
        // if (!token) {
        //     this.throw(401, '未登录', { code: 401, status: 401 });
        // }
        // if (!EGG_SESS_MD) {
        //     const {
        //         data: { userInfo, code },
        //     } = await this.service.plugin.validateToken(token);
        //     if (code === 0) {
        //         this.session.userInfo = userInfo;
        //         this.session.maxAge = 50 * 60 * 1000;
        //     } else {
        //         this.throw(401, '未登录', { code: 401, status: 401 });
        //     }
        // }
    },
    async email(options) {
        const data = await this.service.plugin.email(options);
        return data;
    },
    async validate(rule, query) {
        let descriptor = this.app.schemas;
        if (typeof rule === 'string') {
            const paths = rule.split('.');
            paths.forEach((path) => {
                descriptor = descriptor[path];
            });
        } else if (typeof rule === 'object') {
            descriptor = rule;
        }

        const validator = new AsyncValidator(descriptor);
        let validateResult = [];

        validator.validate(query, { firstFields: true }, (errors) => {
            if (errors) {
                validateResult = errors;
            }
        });

        if (validateResult.length > 0) {
            this.throw(422, validateResult.map((e) => e.message).join(' '), { code: -1 });
        }
    },
    attach(filename, bufferOrStream) {
        filename = encodeURIComponent(filename);
        this.set('Access-Control-Expose-Headers', 'Content-Disposition');
        this.set('Content-Disposition', `attachment; filename=${filename}; filename*="UTF-8''${filename}"`);
        this.set('Content-Type', 'application/octet-stream');
        this.body = bufferOrStream;
    },
};
