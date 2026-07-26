import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const explainRegex = (pattern: string): string => {
  const explanations: string[] = [];
  let i = 0;
  let groupCount = 0;
  const parts: string[] = [`正则: /${pattern}/\n`];
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '\\') {
      const next = pattern[i + 1];
      const escMap: Record<string, string> = {
        d: '数字 [0-9]',
        D: '非数字',
        w: '单词字符 [a-zA-Z0-9_]',
        W: '非单词字符',
        s: '空白字符',
        S: '非空白字符',
        b: '单词边界',
        B: '非单词边界',
        n: '换行符',
        t: '制表符',
        r: '回车符',
        '.': '字面量句点',
        '\\': '字面量反斜杠',
      };
      explanations.push(`\\${next} → ${escMap[next] ?? `字面量 ${next}`}`);
      i += 2;
    } else if (ch === '[') {
      const endIdx = pattern.indexOf(']', i);
      const charClass = pattern.slice(i, endIdx + 1);
      const negated = pattern[i + 1] === '^';
      explanations.push(
        `${charClass} → 字符类: ${negated ? '不匹配' : '匹配'} ${charClass.slice(negated ? 2 : 1, -1)}`,
      );
      i = endIdx + 1;
    } else if (ch === '(') {
      groupCount++;
      if (pattern[i + 1] === '?') {
        if (pattern[i + 2] === ':') {
          explanations.push(`(?:...) → 非捕获组`);
        } else if (pattern[i + 2] === '=') {
          explanations.push(`(?=...) → 正向先行断言`);
        } else if (pattern[i + 2] === '!') {
          explanations.push(`(?!...) → 负向先行断言`);
        } else if (pattern[i + 2] === '<') {
          if (pattern[i + 3] === '=') {
            explanations.push(`(?<=...) → 正向后行断言`);
          } else if (pattern[i + 3] === '!') {
            explanations.push(`(?<!...) → 负向后行断言`);
          }
        }
      } else {
        explanations.push(`(...) → 捕获组 #${groupCount}`);
      }
      i++;
    } else if (ch === '^') {
      explanations.push(`^ → 字符串起始`);
      i++;
    } else if (ch === '$') {
      explanations.push(`$ → 字符串结尾`);
      i++;
    } else if (ch === '.') {
      explanations.push(`. → 任意字符(除换行)`);
      i++;
    } else if (ch === '*') {
      explanations.push(`* → 前一项重复 0 次或多次`);
      i++;
    } else if (ch === '+') {
      explanations.push(`+ → 前一项重复 1 次或多次`);
      i++;
    } else if (ch === '?') {
      explanations.push(`? → 前一项重复 0 次或 1 次`);
      i++;
    } else if (ch === '{') {
      const endIdx = pattern.indexOf('}', i);
      explanations.push(`${pattern.slice(i, endIdx + 1)} → 重复次数`);
      i = endIdx + 1;
    } else if (ch === '|') {
      explanations.push(`| → 或`);
      i++;
    } else {
      i++;
    }
  }
  return [...parts, ...explanations].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    paramsConfig={[
      { name: 'pattern', label: '正则', type: 'text', placeholder: '输入正则表达式...', default: '' },
    ]}
    execute={(_input: string, _mode: string, params: Record<string, unknown>) => {
      const pattern = (params.pattern as string) ?? '';
      if (!pattern) throw new Error('请输入正则表达式');
      try {
        new RegExp(pattern);
      } catch {
        throw new Error('正则表达式语法错误');
      }
      return explainRegex(pattern);
    }}
  />
);

export default ToolComponent;
