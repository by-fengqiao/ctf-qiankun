import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const MOVE_INFO: Record<string, { name: string; desc: string }> = {
  R: { name: '右面顺时针', desc: '右面向上旋转90°' },
  Rp: { name: '右面逆时针', desc: '右面向下旋转90°' },
  R2: { name: '右面180°', desc: '右面旋转180°' },
  L: { name: '左面顺时针', desc: '左面向下旋转90°（从左看）' },
  Lp: { name: '左面逆时针', desc: '左面向上旋转90°（从左看）' },
  L2: { name: '左面180°', desc: '左面旋转180°' },
  U: { name: '顶面顺时针', desc: '顶面向左旋转90°（从上看）' },
  Up: { name: '顶面逆时针', desc: '顶面向右旋转90°（从上看）' },
  U2: { name: '顶面180°', desc: '顶面旋转180°' },
  D: { name: '底面顺时针', desc: '底面向右旋转90°（从下看）' },
  Dp: { name: '底面逆时针', desc: '底面向左旋转90°（从下看）' },
  D2: { name: '底面180°', desc: '底面旋转180°' },
  F: { name: '前面顺时针', desc: '前面向右旋转90°' },
  Fp: { name: '前面逆时针', desc: '前面向左旋转90°' },
  F2: { name: '前面180°', desc: '前面旋转180°' },
  B: { name: '后面顺时针', desc: '后面向左旋转90°' },
  Bp: { name: '后面逆时针', desc: '后面向右旋转90°' },
  B2: { name: '后面180°', desc: '后面旋转180°' },
  M: { name: '中层顺时针', desc: '中层（左-右轴）随L面旋转90°' },
  Mp: { name: '中层逆时针', desc: '中层随L面逆向旋转90°' },
  M2: { name: '中层180°', desc: '中层旋转180°' },
  E: { name: '中层（水平）顺时针', desc: '中层随D面旋转90°' },
  Ep: { name: '中层（水平）逆时针', desc: '中层随D面逆向旋转90°' },
  E2: { name: '中层（水平）180°', desc: '中层旋转180°' },
  S: { name: '中层（前后）顺时针', desc: '中层随F面旋转90°' },
  Sp: { name: '中层（前后）逆时针', desc: '中层随F面逆向旋转90°' },
  S2: { name: '中层（前后）180°', desc: '中层旋转180°' },
  x: { name: '整体X轴旋转', desc: '整个魔方随R面方向旋转90°' },
  xp: { name: '整体X轴逆向', desc: '整个魔方随L面方向旋转90°' },
  x2: { name: '整体X轴180°', desc: '整个魔方绕X轴旋转180°' },
  y: { name: '整体Y轴旋转', desc: '整个魔方随U面方向旋转90°' },
  yp: { name: '整体Y轴逆向', desc: '整个魔方随D面方向旋转90°' },
  y2: { name: '整体Y轴180°', desc: '整个魔方绕Y轴旋转180°' },
  z: { name: '整体Z轴旋转', desc: '整个魔方随F面方向旋转90°' },
  zp: { name: '整体Z轴逆向', desc: '整个魔方随B面方向旋转90°' },
  z2: { name: '整体Z轴180°', desc: '整个魔方绕Z轴旋转180°' },
};

function parseMove(token: string): string | null {
  const match = token.match(/^([RLUDFBMESxyz])('|2)?$/i);
  if (!match) return null;
  const face = match[1].toUpperCase();
  const mod = match[2] || '';
  return face + (mod === "'" ? 'p' : mod === '2' ? '2' : '');
}

function analyzeRubik(input: string): string {
  const lines: string[] = [];
  const tokens = input.trim().split(/\s+/).filter((t: string) => t.length > 0);

  lines.push('=== 魔方记号解析 ===');
  lines.push(`公式: ${input.trim()}`);
  lines.push(`步数: ${tokens.length}`);
  lines.push('');

  lines.push('--- 逐步说明 ---');
  let stepNum = 1;
  let hasError = false;

  for (const token of tokens) {
    const key = parseMove(token);
    if (key && MOVE_INFO[key]) {
      const info = MOVE_INFO[key];
      lines.push(`${stepNum}. ${token.padEnd(4, ' ')} → ${info.name}：${info.desc}`);
      stepNum++;
    } else {
      lines.push(`${stepNum}. ${token.padEnd(4, ' ')} → ⚠ 无法识别的记号`);
      hasError = true;
      stepNum++;
    }
  }

  if (hasError) {
    lines.push('');
    lines.push('⚠ 部分记号无法识别');
  }

  lines.push('');
  lines.push('--- 记号速查 ---');
  lines.push('面: R(右) L(左) U(上) D(下) F(前) B(后)');
  lines.push('层: M(中) E(水平) S(前后)');
  lines.push("旋转: 无后缀=顺时针90°  '=逆时针90°  2=180°");
  lines.push('整体: x/y/z 轴旋转（大写字母为面旋转）');

  return lines.join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => analyzeRubik(input)}
  />
);

export default ToolComponent;
