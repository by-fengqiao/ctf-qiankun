import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const strToBytes = (str: string): Uint8Array => new TextEncoder().encode(str);
const bytesToStr = (bytes: Uint8Array): string => new TextDecoder().decode(bytes);

const encode = (input: string, params: Record<string, unknown>): string => {
  const mime = (params.mime as string) || 'text/plain';
  const charset = (params.charset as string) || 'utf-8';
  const bytes = strToBytes(input);
  let binary = '';
  bytes.forEach((b: number) => { binary += String.fromCharCode(b); });
  const base64 = btoa(binary);
  return `data:${mime};charset=${charset};base64,${base64}`;
};

const decode = (input: string): string => {
  const match = input.match(/^data:([^;]+)?(?:;([^;=]+)=([^;]+))*;base64,(.*)$/s);
  if (!match) {
    if (input.startsWith('data:')) {
      const commaIdx = input.indexOf(',');
      if (commaIdx !== -1) return input.slice(commaIdx + 1);
    }
    throw new Error('无效的 Data URI 格式');
  }
  const base64 = match[4];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytesToStr(bytes);
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      try {
        return mode === 'encode' ? encode(input, params) : decode(input);
      } catch (e) {
        return `错误: ${e instanceof Error ? e.message : '无效输入'}`;
      }
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
    paramsConfig={[
      { name: 'mime', label: 'MIME', type: 'text', placeholder: 'text/plain', default: 'text/plain' },
      { name: 'charset', label: 'Charset', type: 'text', placeholder: 'utf-8', default: 'utf-8' },
    ]}
  />
);

export default ToolComponent;
