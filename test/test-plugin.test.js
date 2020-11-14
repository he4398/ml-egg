'use strict';

const mock = require('egg-mock');

describe('test/test-plugin.test.js', () => {
  let app;
  before(() => {
    app = mock.app({
      baseDir: 'apps/test-plugin-test',
    });
    return app.ready();
  });

  after(() => app.close());
  afterEach(mock.restore);

  it('should GET /', () => {
    return app.httpRequest()
      .get('/')
      .expect('hi, testPlugin')
      .expect(200);
  });
});
