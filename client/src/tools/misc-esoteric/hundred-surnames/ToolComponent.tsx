import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const SURNAMES = '赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁'.split('');

const SURNAME_SET = new Set(SURNAMES);

function encodeToSurnames(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const groups: string[] = [];
  for (const byte of bytes) {
    const high = (byte >> 4) & 0xf;
    const low = byte & 0xf;
    groups.push(SURNAMES[high] + SURNAMES[low]);
  }
  return groups.join(' ');
}

function decodeFromSurnames(text: string): string {
  const chars = [...text].filter((ch: string) => SURNAME_SET.has(ch));
  if (chars.length === 0) return '未找到有效的姓氏字符';
  if (chars.length % 2 !== 0) {
    throw new Error('姓氏字符数量必须是偶数（每个字节 2 个姓氏）');
  }
  const bytes: number[] = [];
  for (let i = 0; i < chars.length; i += 2) {
    const high = SURNAMES.indexOf(chars[i]);
    const low = SURNAMES.indexOf(chars[i + 1]);
    bytes.push((high << 4) | low);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(new Uint8Array(bytes));
  } catch {
    return '解码失败：可能不是有效的百家姓编码';
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeFromSurnames(input);
      return encodeToSurnames(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
