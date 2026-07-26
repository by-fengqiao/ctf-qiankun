import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const STATUS_CODES: Record<string, { name: string; desc: string; category: string }> = {
  '100': { name: 'Continue', desc: '客户端应继续发送请求', category: '1xx 信息' },
  '101': { name: 'Switching Protocols', desc: '服务器同意切换协议', category: '1xx 信息' },
  '102': { name: 'Processing', desc: '服务器正在处理请求（WebDAV）', category: '1xx 信息' },
  '103': { name: 'Early Hints', desc: '预加载提示', category: '1xx 信息' },
  '200': { name: 'OK', desc: '请求成功', category: '2xx 成功' },
  '201': { name: 'Created', desc: '资源已创建', category: '2xx 成功' },
  '202': { name: 'Accepted', desc: '请求已接受，待处理', category: '2xx 成功' },
  '203': { name: 'Non-Authoritative Information', desc: '非权威信息', category: '2xx 成功' },
  '204': { name: 'No Content', desc: '无返回内容', category: '2xx 成功' },
  '205': { name: 'Reset Content', desc: '重置内容', category: '2xx 成功' },
  '206': { name: 'Partial Content', desc: '部分内容返回', category: '2xx 成功' },
  '207': { name: 'Multi-Status', desc: '多状态响应（WebDAV）', category: '2xx 成功' },
  '208': { name: 'Already Reported', desc: '已报告（WebDAV）', category: '2xx 成功' },
  '226': { name: 'IM Used', desc: '已使用实例操作', category: '2xx 成功' },
  '300': { name: 'Multiple Choices', desc: '多项选择', category: '3xx 重定向' },
  '301': { name: 'Moved Permanently', desc: '永久重定向', category: '3xx 重定向' },
  '302': { name: 'Found', desc: '临时重定向', category: '3xx 重定向' },
  '303': { name: 'See Other', desc: '参见其他', category: '3xx 重定向' },
  '304': { name: 'Not Modified', desc: '资源未修改，使用缓存', category: '3xx 重定向' },
  '305': { name: 'Use Proxy', desc: '使用代理', category: '3xx 重定向' },
  '307': { name: 'Temporary Redirect', desc: '临时重定向（保持方法）', category: '3xx 重定向' },
  '308': { name: 'Permanent Redirect', desc: '永久重定向（保持方法）', category: '3xx 重定向' },
  '400': { name: 'Bad Request', desc: '请求语法错误', category: '4xx 客户端错误' },
  '401': { name: 'Unauthorized', desc: '未认证', category: '4xx 客户端错误' },
  '402': { name: 'Payment Required', desc: '需要付款', category: '4xx 客户端错误' },
  '403': { name: 'Forbidden', desc: '无权限访问', category: '4xx 客户端错误' },
  '404': { name: 'Not Found', desc: '资源不存在', category: '4xx 客户端错误' },
  '405': { name: 'Method Not Allowed', desc: '方法不允许', category: '4xx 客户端错误' },
  '406': { name: 'Not Acceptable', desc: '不可接受', category: '4xx 客户端错误' },
  '407': { name: 'Proxy Authentication Required', desc: '需要代理认证', category: '4xx 客户端错误' },
  '408': { name: 'Request Timeout', desc: '请求超时', category: '4xx 客户端错误' },
  '409': { name: 'Conflict', desc: '请求冲突', category: '4xx 客户端错误' },
  '410': { name: 'Gone', desc: '资源已永久消失', category: '4xx 客户端错误' },
  '411': { name: 'Length Required', desc: '需要 Content-Length', category: '4xx 客户端错误' },
  '412': { name: 'Precondition Failed', desc: ' precondition 失败', category: '4xx 客户端错误' },
  '413': { name: 'Payload Too Large', desc: '请求体过大', category: '4xx 客户端错误' },
  '414': { name: 'URI Too Long', desc: 'URI 过长', category: '4xx 客户端错误' },
  '415': { name: 'Unsupported Media Type', desc: '不支持的媒体类型', category: '4xx 客户端错误' },
  '416': { name: 'Range Not Satisfiable', desc: '范围不可满足', category: '4xx 客户端错误' },
  '417': { name: 'Expectation Failed', desc: 'Expect 头失败', category: '4xx 客户端错误' },
  '418': { name: 'I\'m a Teapot', desc: '我是茶壶（彩蛋）', category: '4xx 客户端错误' },
  '421': { name: 'Misdirected Request', desc: '请求被错误路由', category: '4xx 客户端错误' },
  '422': { name: 'Unprocessable Entity', desc: '不可处理实体（WebDAV）', category: '4xx 客户端错误' },
  '423': { name: 'Locked', desc: '资源已锁定（WebDAV）', category: '4xx 客户端错误' },
  '424': { name: 'Failed Dependency', desc: '依赖失败（WebDAV）', category: '4xx 客户端错误' },
  '425': { name: 'Too Early', desc: '请求过早', category: '4xx 客户端错误' },
  '426': { name: 'Upgrade Required', desc: '需要升级协议', category: '4xx 客户端错误' },
  '428': { name: 'Precondition Required', desc: '需要 precondition', category: '4xx 客户端错误' },
  '429': { name: 'Too Many Requests', desc: '请求过多，限流', category: '4xx 客户端错误' },
  '431': { name: 'Request Header Fields Too Large', desc: '请求头字段过大', category: '4xx 客户端错误' },
  '451': { name: 'Unavailable For Legal Reasons', desc: '因法律原因不可用', category: '4xx 客户端错误' },
  '500': { name: 'Internal Server Error', desc: '服务器内部错误', category: '5xx 服务端错误' },
  '501': { name: 'Not Implemented', desc: '服务器不支持该功能', category: '5xx 服务端错误' },
  '502': { name: 'Bad Gateway', desc: '网关错误', category: '5xx 服务端错误' },
  '503': { name: 'Service Unavailable', desc: '服务不可用', category: '5xx 服务端错误' },
  '504': { name: 'Gateway Timeout', desc: '网关超时', category: '5xx 服务端错误' },
  '505': { name: 'HTTP Version Not Supported', desc: 'HTTP 版本不支持', category: '5xx 服务端错误' },
  '506': { name: 'Variant Also Negotiates', desc: '变体协商', category: '5xx 服务端错误' },
  '507': { name: 'Insufficient Storage', desc: '存储不足（WebDAV）', category: '5xx 服务端错误' },
  '508': { name: 'Loop Detected', desc: '检测到循环（WebDAV）', category: '5xx 服务端错误' },
  '510': { name: 'Not Extended', desc: '未扩展', category: '5xx 服务端错误' },
  '511': { name: 'Network Authentication Required', desc: '需要网络认证', category: '5xx 服务端错误' },
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const code = input.trim();
      if (!code) {
        const all = Object.entries(STATUS_CODES).map(
          ([c, info]) => `${c} ${info.name} [${info.category}] - ${info.desc}`,
        );
        return `请输入状态码查询。\n\n完整列表:\n\n${all.join('\n')}`;
      }
      const info = STATUS_CODES[code];
      if (!info) {
        const num = parseInt(code, 10);
        if (isNaN(num) || num < 100 || num > 599) {
          throw new Error('状态码应在 100-599 之间');
        }
        const range =
          num < 200 ? '1xx 信息'
          : num < 300 ? '2xx 成功'
          : num < 400 ? '3xx 重定向'
          : num < 500 ? '4xx 客户端错误'
          : '5xx 服务端错误';
        return `状态码 ${code} 不在常见列表中。\n\n分类: ${range}`;
      }
      return [
        `状态码: ${code}`,
        `名称: ${info.name}`,
        `分类: ${info.category}`,
        `描述: ${info.desc}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
