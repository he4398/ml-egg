'use strict';

const uuid = require('uuid');

const TRACE_ID = Symbol('traceId');

class Tracer {
    constructor(ctx) {
        this.ctx = ctx;
        this[TRACE_ID] = ctx.headers['x-request-id'] ? ctx.headers['x-request-id'] : undefined;
    }
    get traceId() {
        if (!this[TRACE_ID]) {
            this[TRACE_ID] = uuid.v1();
        }
        this.ctx.set('x-request-id', this[TRACE_ID]);
        return this[TRACE_ID];
    }
}

module.exports = Tracer;
