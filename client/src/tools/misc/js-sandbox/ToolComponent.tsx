import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function formatValue(v: unknown): string {
  if (typeof v === 'string') return v;
  if (v === null) return 'null';
  if (v === undefined) return 'undefined';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'bigint') return `${v}n`;
  if (typeof v === 'symbol') return v.toString();
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (v instanceof Date) return v.toISOString();
  if (v instanceof RegExp) return v.toString();
  if (v instanceof Map) {
    const entries: string[] = [];
    v.forEach((val: unknown, key: unknown) => {
      entries.push(`${formatValue(key)} => ${formatValue(val)}`);
    });
    return `Map(${entries.length}) { ${entries.join(', ')} }`;
  }
  if (v instanceof Set) {
    const items: string[] = [];
    v.forEach((val: unknown) => items.push(formatValue(val)));
    return `Set(${items.length}) { ${items.join(', ')} }`;
  }
  if (Array.isArray(v)) {
    return `[${v.map((item: unknown) => formatValue(item)).join(', ')}]`;
  }
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v, null, 2);
    } catch {
      return String(v);
    }
  }
  return String(v);
}

function executeSandbox(code: string, timeoutMs: number): string {
  const logs: string[] = [];

  const sandboxConsole = {
    log: (...args: unknown[]) => logs.push(args.map(formatValue).join(' ')),
    error: (...args: unknown[]) =>
      logs.push('[ERROR] ' + args.map(formatValue).join(' ')),
    warn: (...args: unknown[]) =>
      logs.push('[WARN] ' + args.map(formatValue).join(' ')),
    info: (...args: unknown[]) =>
      logs.push('[INFO] ' + args.map(formatValue).join(' ')),
    table: (data: unknown) => logs.push(formatValue(data)),
    dir: (obj: unknown) => logs.push(formatValue(obj)),
    trace: (...args: unknown[]) =>
      logs.push('[TRACE] ' + args.map(formatValue).join(' ')),
    assert: (condition: unknown, ...args: unknown[]) => {
      if (!condition) {
        logs.push(
          '[ASSERT] ' + (args.length > 0 ? args.map(formatValue).join(' ') : 'assertion failed'),
        );
      }
    },
    group: (...args: unknown[]) => logs.push('[GROUP] ' + args.map(formatValue).join(' ')),
    groupEnd: () => {},
    count: (label?: string) => logs.push(`[COUNT] ${label ?? 'default'}`),
    time: () => {},
    timeEnd: () => {},
    clear: () => { logs.length = 0; },
  };

  const safeUtils = {
    btoa,
    atob,
    TextEncoder,
    TextDecoder,
    Math,
    JSON,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    String,
    Number,
    Boolean,
    Array,
    Object,
    Date,
    RegExp,
    Error,
    Map,
    Set,
    WeakMap,
    WeakSet,
    Promise,
    Symbol,
    encodeURIComponent,
    decodeURIComponent,
    encodeURI,
    decodeURI,
    Uint8Array,
    Uint16Array,
    Uint32Array,
    Int8Array,
    Int16Array,
    Int32Array,
    Float32Array,
    Float64Array,
    ArrayBuffer,
    DataView,
    crypto: {
      getRandomValues: (arr: Uint8Array) => crypto.getRandomValues(arr),
    },
  };

  let result: unknown;
  const startTime = Date.now();

  try {
    const fn = new Function(
      'console',
      'utils',
      'eval',
      'Function',
      'window',
      'document',
      'globalThis',
      'self',
      'this',
      `"use strict";\n${code}`,
    );
    result = fn(
      sandboxConsole,
      safeUtils,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  } catch (e) {
    const elapsed = Date.now() - startTime;
    let output = `执行出错 (耗时 ${elapsed}ms / 超时 ${timeoutMs}ms)\n\n`;
    output += `控制台输出:\n${logs.length > 0 ? logs.join('\n') : '(无)'}\n\n`;
    output += `错误: ${e instanceof Error ? e.message : String(e)}`;
    if (e instanceof Error && e.stack) {
      output += `\n\n堆栈:\n${e.stack}`;
    }
    return output;
  }

  const elapsed = Date.now() - startTime;
  let output = `执行完成 (耗时 ${elapsed}ms / 超时 ${timeoutMs}ms)\n\n`;
  output += `控制台输出:\n${logs.length > 0 ? logs.join('\n') : '(无)'}\n\n`;
  if (result !== undefined) {
    output += `返回值:\n${formatValue(result)}`;
  } else {
    output += `返回值: (undefined — 使用 return 语句返回值)`;
  }
  return output;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="JS 沙箱执行器"
    paramsConfig={[
      {
        name: 'timeout',
        label: '超时(ms)',
        type: 'text',
        default: '1000',
        placeholder: '1000',
      },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => {
      const timeoutMs = parseInt((params.timeout as string) || '1000', 10) || 1000;
      return executeSandbox(input, timeoutMs);
    }}
  />
);

export default ToolComponent;
