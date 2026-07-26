import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const encrypt = (input: string, rails: number): string => {
  if (rails < 2) return input;
  const len = input.length;
  if (len === 0) return '';
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0;
  let dir = 1;
  for (let i = 0; i < len; i++) {
    fence[rail].push(input[i]);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  return fence.map((r: string[]) => r.join('')).join('');
};

const decrypt = (input: string, rails: number): string => {
  if (rails < 2) return input;
  const len = input.length;
  if (len === 0) return '';
  // Determine the pattern first
  const pattern: number[] = [];
  let rail = 0;
  let dir = 1;
  for (let i = 0; i < len; i++) {
    pattern.push(rail);
    if (rail === 0) dir = 1;
    else if (rail === rails - 1) dir = -1;
    rail += dir;
  }
  // Count chars per rail
  const counts: number[] = new Array(rails).fill(0);
  for (const r of pattern) counts[r]++;
  // Split input into rail strings
  const railStrs: string[] = [];
  let idx = 0;
  for (let r = 0; r < rails; r++) {
    railStrs.push(input.slice(idx, idx + counts[r]));
    idx += counts[r];
  }
  // Reconstruct
  const railIdx: number[] = new Array(rails).fill(0);
  const result: string[] = [];
  for (const r of pattern) {
    result.push(railStrs[r][railIdx[r]] ?? '');
    railIdx[r]++;
  }
  return result.join('');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, mode: string, params: Record<string, unknown>) => {
      const rails = Math.max(2, parseInt((params.rails as string) || '2', 10));
      return mode === 'decrypt' ? decrypt(input, rails) : encrypt(input, rails);
    }}
    modeOptions={[
      { value: 'encrypt', label: '加密' },
      { value: 'decrypt', label: '解密' },
    ]}
    paramsConfig={[
      { name: 'rails', label: '栏数', type: 'text', placeholder: '2', default: '2' },
    ]}
  />
);

export default ToolComponent;
