import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const STATUS_CODES: Record<string, { name: string; desc: string; category: string }> = {
  '100': { name: 'Continue', desc: '客户端应继续发送请求', category: '1xx 信息' },
  '101': { name: 'Switching Protocols', desc: '服务器同意切换协议', category: '1xx 信息' },
  '200': { name: 'OK', desc: '请求成功', category: '2xx 成功' },
  '201': { name: 'Created', desc: '资源已创建', category: '2xx 成功' },
  '202': { name: 'Accepted', desc: '请求已接受，待处理', category: '2xx 成功' },
  '204': { name: 'No Content', desc: '无返回内容', category: '2xx 成功' },
  '206': { name: 'Partial Content', desc: '部分内容返回', category: '2xx 成功' },
  '301': { name: 'Moved Permanently', desc: '永久重定向', category: '3xx 重定向' },
  '302': { name: 'Found', desc: '临时重定向', category: '3xx 重定向' },
  '304': { name: 'Not Modified', desc: '资源未修改，使用缓存', category: '3xx 重定向' },
  '307': { name: 'Temporary Redirect', desc: '临时重定向（保持方法）', category: '3xx 重定向' },
  '308': { name: 'Permanent Redirect', desc: '永久重定向（保持方法）', category: '3xx 重定向' },
  '400': { name: 'Bad Request', desc: '请求语法错误', category: '4xx 客户端错误' },
  '401': { name: 'Unauthorized', desc: '未认证', category: '4xx 客户端错误' },
  '403': { name: 'Forbidden', desc: '无权限访问', category: '4xx 客户端错误' },
  '404': { name: 'Not Found', desc: '资源不存在', category: '4xx 客户端错误' },
  '405': { name: 'Method Not Allowed', desc: '方法不允许', category: '4xx 客户端错误' },
  '408': { name: 'Request Timeout', desc: '请求超时', category: '4xx 客户端错误' },
  '409': { name: 'Conflict', desc: '请求冲突', category: '4xx 客户端错误' },
  '410': { name: 'Gone', desc: '资源已永久消失', category: '4xx 客户端错误' },
  '413': { name: 'Payload Too Large', desc: '请求体过大', category: '4xx 客户端错误' },
  '414': { name: 'URI Too Long', desc: 'URI 过长', category: '4xx 客户端错误' },
  '415': { name: 'Unsupported Media Type', desc: '不支持的媒体类型', category: '4xx 客户端错误' },
  '429': { name: 'Too Many Requests', desc: '请求过多，限流', category: '4xx 客户端错误' },
  '500': { name: 'Internal Server Error', desc: '服务器内部错误', category: '5xx 服务端错误' },
  '501': { name: 'Not Implemented', desc: '服务器不支持该功能', category: '5xx 服务端错误' },
  '502': { name: 'Bad Gateway', desc: '网关错误', category: '5xx 服务端错误' },
  '503': { name: 'Service Unavailable', desc: '服务不可用', category: '5xx 服务端错误' },
  '504': { name: 'Gateway Timeout', desc: '网关超时', category: '5xx 服务端错误' },
  '511': { name: 'Network Authentication Required', desc: '需要网络认证', category: '5xx 服务端错误' },
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const code = input.trim();
      if (!code) {
        const allCodes = Object.entries(STATUS_CODES).map(
          ([c, info]) => `${c} ${info.name} [${info.category}] - ${info.desc}`,
        );
        return `请输入状态码查询。\n\n完整列表:\n\n${allCodes.join('\n')}`;
      }
      const info = STATUS_CODES[code];
      if (!info) {
        return `状态码 ${code} 不在常见列表中。\n\n分类:\n1xx 信息\n2xx 成功\n3xx 重定向\n4xx 客户端错误\n5xx 服务端错误`;
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
