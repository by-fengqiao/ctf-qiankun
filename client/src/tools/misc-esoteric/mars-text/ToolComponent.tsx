import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const MARS_MAP: Record<string, string> = {
  '的': '啲', '是': '褆', '了': '钌', '在': '恠', '我': '偶',
  '你': '伱', '他': '祂', '她': '亇', '们': '扪', '不': '吥',
  '有': '洧', '人': '亾', '这': '遖', '那': '遃', '个': '嗰',
  '上': '丄', '下': '丅', '中': 'ф', '大': '夨', '小': '尐',
  '多': '茤', '少': '尛', '好': '恏', '坏': '坏', '来': '唻',
  '去': '厾', '看': '蓘', '说': '説', '听': '聼', '想': '葙',
  '爱': '嗳', '恨': '恨', '喜欢': '囍歡', '知道': '倁噵',
  '吗': '麼', '呢': 'ㄋ', '啊': '阿', '哦': '噢', '嗯': '嗯',
  '哈': '嗨', '嘿': '黒', '呀': '丫', '吧': '罢', '嘛': '麼',
  '一': '⑴', '二': '⒉', '三': '③', '四': '④', '五': '⑤',
  '六': '⑥', '七': '⑦', '八': '⑧', '九': '⑨', '十': '⑩',
};

const REVERSE_MARS: Record<string, string> = {};
for (const [k, v] of Object.entries(MARS_MAP)) {
  if (!REVERSE_MARS[v]) REVERSE_MARS[v] = k;
}

function encodeMars(text: string): string {
  let result = '';
  let remaining = text;
  while (remaining.length > 0) {
    let matched = false;
    for (const len of [2, 1]) {
      if (remaining.length >= len) {
        const substr = remaining.substring(0, len);
        if (MARS_MAP[substr]) {
          result += MARS_MAP[substr];
          remaining = remaining.substring(len);
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      result += remaining[0];
      remaining = remaining.substring(1);
    }
  }
  return result;
}

function decodeMars(text: string): string {
  let result = '';
  let remaining = text;
  while (remaining.length > 0) {
    let matched = false;
    for (const len of [3, 2, 1]) {
      if (remaining.length >= len) {
        const substr = remaining.substring(0, len);
        if (REVERSE_MARS[substr]) {
          result += REVERSE_MARS[substr];
          remaining = remaining.substring(len);
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      result += remaining[0];
      remaining = remaining.substring(1);
    }
  }
  return result;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string) => {
      if (mode === 'decode') return decodeMars(input);
      return encodeMars(input);
    }}
    modeOptions={[
      { value: 'encode', label: '编码' },
      { value: 'decode', label: '解码' },
    ]}
  />
);

export default ToolComponent;
