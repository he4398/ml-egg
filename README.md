# 配置:

```js
// config/plugin.js
'use strict';

exports.routerPlus = {
    enable: true,
    package: 'egg-router-plus',
};

exports.cors = {
    enable: true,
    package: 'egg-cors',
};

exports.tracer = {
    enable: true,
    package: 'egg-tracer',
};

exports.prometheus = {
    enable: true,
    package: 'egg-prometheus',
};

exports.MlEgg = {
    enable: true,
    package: 'MlEgg',
};
```

# Context:

### 1. 重写 curl 方法，在 response headers 中自动写入网关请求的 x-request-id,实现链路追踪;

### 2. 添加 isLogin 方法，调用公司的 sso 接口，验证用户登陆。本方法应在 Controller 中的业务逻辑之前调用才能拦截请求，防止未登陆用户进行操作。例如

```js
class HomeController extends Controller {
    async index() {
        const { ctx } = this;
        //验证登陆，未登陆则直接响应401，不处理后续逻辑
        await ctx.isLogin();
        ctx.body = 'hi, egg';
    }

    //this.session.userInfo = userInfo; 存在 ctx.session中
}
```

### 3.添加 validate 方法，使用[async-validator](https://www.npmjs.com/package/async-validator)做参数校验，用法如下:

在 app/shemas 中添加相应规则，一般是一个 controller 对应一个文件夹，文件夹下一个 js 文件对应 controller 的一个方法。规则配置如下:

```js
{
  id: [
    { required: true, message: 'id必传' },
    { type: 'number', message: 'id必须为数字'},
    ...
  ]
  ...
}
```

请求参数不符合规则时将返回 200 和错误 code 码-1，以及所有的不合法参数的 message 信息。  
 定制高级规则可参考[async-validator](https://www.npmjs.com/package/async-validator)文档。  
 使用时在 controller 中业务逻辑前调用 ctx.validate 方法验证参数，例如:

```js
class UserController extends Controller {
  async index() {
    const { ctx, { ctx: { request:  { query } } } } = this;
    //验证登陆，未登陆则直接响应401，不处理后续逻辑
    await ctx.isLogin();
    //验证参数，参数不合法则直接响应400，不处理后续逻辑
    await ctx.validate('user.user', query);
    ctx.body = 'hi, egg';
  }
}
```

# Helper

### 1. 添加 sign 方法，公司统一[签名算法](http://cwiki.guazi.com/pages/viewpage.action?pageId=81626701)的 nodejs 实现，使用方法

```js
const signedData = ctx.helper.sign(data, appkey, appSecret);
```

### 2. 添加 success error 统一输出

```js
    success({ code, status, message, data }) {
        this.ctx.status = status || 200;
        this.ctx.body = {
            code: code || 0,
            message: message || '请求成功',
            data: data || {},
        };
    },
```

### 2.添加 excel 工具函数和基本的文件流操作函数:

(1).jsonToSheet: 用于将 json 转换为 excel 的 sheet 格式;  
(2).jsontoWb: 用于有 json 生成 workbook。  
实际使用案例如下:

```js
// npm i xlsx
// https://www.npmjs.com/package/xlsx
// in controller
const XLSX = require('xlsx');
//... 路由方法中
const excelHeader = { id: '仓库ID', name: '仓库名称', lng: '经度', lat: '纬度', address: '详细地址' };
const excelData = [
    { id: '100', name: '北京仓库', lng: '100', lat: '99', address: '诺金中心' },
    { id: '200', name: '上海仓库', lng: '200', lat: '88', address: '东方明珠' },
];
const wb = helper.jsonToWb(excelHeader, excelData);
const excelBuf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx', compression: true });
ctx.attach('仓库信息表.xlsx', excelBuf);
```

\*_注: 两个方法均接受 excelheader,excelData 两个参数，分别表示 excel 表头和数据_  
(3).attach: 用于接口返回文件附件，如上的 excel 文件。接受文件名(最好包含格式后缀,如.xlsx), 文件 stream 或 buffer 两个参数

# Middleware

### 1.logger:

统一处理后续 middleware 的中的 reponse 和 error,并统一写入日志。 并且可配置特殊 router 不打印日志，配置和 eggjs 内置 logger 不冲突。如下:

```js
// 自定义日志路径及文件名称
config.logger = {
    // 忽略路由日志
    ignoreRouter: ['/healthCheck', '/readinessCheck'],
    level: 'INFO',
    dir: '/med/log/apps',
    // 应用相关日志
    appLogName: 'egg-plugin-test-web.log',
    // 框架、插件相关日志
    coreLogName: 'egg-plugin-test-core.log',
    // agent进程日志
    agentLogName: 'egg-plugin-test-agent.log',
    // logger.error输出位置
    errorLogName: 'egg-plugin-test-error.log',
};
```

### 2.cors:

```js
// config.dev.js
config.MlEgg = {
    cors: ['.guazi-cloud.conm'],
};
```

# Schedule

日志定时切割模块，每日固定时间将日志文件进行切割，防止文件过大。引入就行，无需关注。

# Service

### 1. validateToken 方法调用公司 sso 接口

### 2. event_logger:

(1).http_client: 添加 app.httpclient 的事件监听，实现调用 ctx.curl 方法时自动打印日志, 默认启用。  
(2).rpc_client: 添加 app.rpcClient 的事件监听，实现调用 ctx.proxy 的 rpc 方法时自动打印日志, 默认不启用，当使用 egg rpc 时自动启用。

### 3. tracer:

自动处理网关请求 header 中 x-request-id 实现链路追踪

# App 感谢少东

### 接入[prometheus](http://cwiki.guazi.com/display/aftermarket/prometheus)，当启用[egg-prometheus](https://www.npmjs.com/package/egg-prometheus)插件时，自动加入特定的 metrics 供 promtheus 收集。主要支持且较具参考价值的 metrics 有:

1.http*response_time_ms: 路由请求处理时间  
 2.http_request_total: 路由请求计数  
 3.http_request_rate: 路由请求计数  
 4.http_request_error_total: 错误请求计数 5.rpc_consumer_request_rate: rpc consumer 调用计数  
 6.rpc_consumer_request_total: rpc consumer 调用计数  
 7.rpc_consumer_fail_response_time_ms: rpc consumer 调用响应时间  
 8.rpc_provider_request_rate: rpc provider 调用计数  
 9.rpc_provider_request_total: rpc provider 调用计数  
 10.rpc_provider_fail_response_time_ms: rpc provider 调用响应时间  
 11.nodejs_eventloop_lag_seconds: 事件循环时钟  
 12.nodejs_heap_size*[used|total]_bytes,nodejs_external_memory_bytes: 堆内存使用情况  
 13.nodejs_heap_space_size_[total|used|available]_bytes: 堆空间使用情况  
 14.process_cpu_[use|system]\_seconds_total: Cpu 使用情况  
 15.process_open_fds: 文件句柄数统计

初步接入[prometheus](http://cwiki.guazi.com/display/aftermarket/prometheus)的[grafana](https://grafana.com/grafana/)([公司地址](http://grafana.guazi-apps.com/))看板雏形效果如下:  
![](http://git.guazi-corp.com/scp-fe/egg-plugin-guazi/raw/master/public/egg-prometheus.png)  
定制指标请根据实际需求使用以上 metrics,参考[promql](https://prometheus.io/docs/prometheus/latest/querying/basics/)文档进行配置。

\*_注:_ _可参考[egg-prometheus](https://www.npmjs.com/package/egg-prometheus)定制特殊需求的 metrics 并在 app.js 上挂载；_  
_若要实现路由标签的统计，在写 router 时须传入标签参数，如:_

```js
// router/home.js
// 分文件夹路由须启用egg-router-plus插件
module.exports = (app) => {
    const { controller } = app;
    const subRouter = app.router.namespace('/test');

    subRouter.get('主页', '/home', controller.home.index);
};
```

# Config

### default

1.启用 lib/tracer; 2.logger: medusa 日志规范配置;  
接入[kibana](http://kibana.guazi-apps.com/)后效果如下:  
 ![](https://image1.guazistatic.com/qn1912171809345c33babeb4bae2f5857704a01deb6f02.png)  
\*\_注:logger 中 app 字段默认读取 package.json 里的 name，如 egg-demo

3.prometheus 配置:

```js
config.prometheus = {
    // prometheus协议监听端口
    scrapePort: 7008,
    // prometheus协议uri
    scrapePath: '/prometheus',
    // prometheus cluster模式监听端口，可以不传，默认6789
    aggregatorPort: 7009,
    // 写入metrics的标签，便于做业务过滤
    defaultLabels: { biz: 'tracker 版控' },
};
```
