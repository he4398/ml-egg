'use strict';

const crypto = require('crypto');
const excelUtil = require('../../lib/excel_utils');

module.exports = {
    ...excelUtil,
    success({ code, status, message, data }) {
        this.ctx.status = status || 200;
        this.ctx.body = {
            code: code || 0,
            message: message || '请求成功',
            data: data || {},
        };
    },
    error({ code, status, message }) {
        this.ctx.status = status || 200;
        this.ctx.body = {
            code: code || -1,
            message: message || '请求失败',
        };
    },
    _encodeParam(params) {
        const keys = Object.keys(params).sort();
        const str = keys
            .reduce((s, k) => `${s}${k}=${encodeURIComponent(params[k].toString())}&`, '')
            .replace(/%20/g, '+')
            .slice(0, -1);
        return str;
    },
    sign(params, appkey, appSecret) {
        const nonce = Date.now();
        const expires = nonce + 60 * 60 * 1000;
        const paramsEx = { ...params, appkey, expires, nonce };

        const encodeStr = this._encodeParam(paramsEx);
        const base64 = crypto
            .createHmac('sha256', appSecret)
            .update(encodeStr)
            .digest('base64');
        const md5 = crypto
            .createHash('md5')
            .update(base64)
            .digest('hex');
        const signature = md5.slice(5, 15);
        const result = { ...paramsEx, signature };
        return result;
    },
};
