'use strict';

const moment = require('moment');
module.exports = (appInfo) => ({
    // 链路追踪
    tracer: {
        Class: require('../lib/tracer/tracer'),
    },
    email: {
        url: 'http://misc-commapi.hean.com/misc/contact/sendMail',
        appkey: '582557788',
        appSecret: 'AhJie3Phei9l',
    },
    session: {
        key: 'EGG_SESS_MD',
        httpOnly: true,
        encrypt: true,
    },
    logger: {
        ignoreRouter: ['healthCheck', 'readinessCheck'],
        contextFormatter(meta) {
            return [
                moment(meta.date).format('YYYY-MM-DDTHH:mm:ss.SSSZZ'),
                `[${meta.level}]`,
                `${appInfo.name.replace('_', '/')}`,
                '---',
                (meta.paddingMessage.match(/\s(\/\S*)]$/) || '')[1],
                '---',
                (meta.paddingMessage.match(/^\[-\/[0-9.]+\/([0-9a-z-]+)\//) || '')[1],
                '---',
                meta.message,
            ].join(' ');
        },
    },
    prometheus: {
        scrapePort: 7008,
        scrapePath: '/prometheus',
    },
});
