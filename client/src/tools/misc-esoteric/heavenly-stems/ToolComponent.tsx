import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const STEMS = '甲乙丙丁戊己庚辛壬癸'.split('');
const BRANCHES = '子丑寅卯辰巳午未申酉戌亥'.split('');
const STEM_NAMES = ['甲(木·阳)', '乙(木·阴)', '丙(火·阳)', '丁(火·阴)', '戊(土·阳)', '己(土·阴)', '庚(金·阳)', '辛(金·阴)', '壬(水·阳)', '癸(水·阴)'];
const BRANCH_NAMES = ['子(鼠·水·阳)', '丑(牛·土·阴)', '寅(虎·木·阳)', '卯(兔·木·阴)', '辰(龙·土·阳)', '巳(蛇·火·阴)', '午(马·火·阳)', '未(羊·土·阴)', '申(猴·金·阳)', '酉(鸡·金·阴)', '戌(狗·土·阳)', '亥(猪·水·阴)'];

function analyze(input: string): string {
  const trimmed = input.trim();
  const lines: string[] = [];

  const tokens = trimmed.split(/[\s,，、]+/).filter((t: string) => t.length > 0);

  for (const token of tokens) {
    const num = parseInt(token, 10);
    if (isNaN(num)) {
      lines.push(`"${token}" 不是有效数字，跳过`);
      lines.push('');
      continue;
    }

    const stemIdx = ((num - 4) % 10 + 10) % 10;
    const branchIdx = ((num - 4) % 12 + 12) % 12;
    const ganzhi = STEMS[stemIdx] + BRANCHES[branchIdx];

    const cyclePos = ((num - 4) % 60 + 60) % 60;
    if (cyclePos === 0) {
      lines.push(`=== ${num} 年 ===`);
    } else {
      lines.push(`=== 数字 ${num} ===`);
    }
    lines.push(`天干: ${STEMS[stemIdx]} → ${STEM_NAMES[stemIdx]}`);
    lines.push(`地支: ${BRANCHES[branchIdx]} → ${BRANCH_NAMES[branchIdx]}`);
    lines.push(`干支: ${ganzhi}`);
    lines.push(`六十甲子序号: ${cyclePos === 0 ? 60 : cyclePos} / 60`);
    lines.push('');
  }

  if (tokens.length === 0 || lines.length === 0) {
    lines.push('请输入一个或多个数字（用空格或逗号分隔）');
    lines.push('例如：2024 表示年份，可查对应的干支纪年');
    lines.push('公式：天干 = (年-4) mod 10，地支 = (年-4) mod 12');
  }

  lines.push('--- 六十甲子全表（前12项）---');
  for (let i = 0; i < 12; i++) {
    const s = STEMS[i % 10];
    const b = BRANCHES[i % 12];
    lines.push(`${i + 1}. ${s}${b}`);
  }

  return lines.join('\n');
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => analyze(input)}
  />
);

export default ToolComponent;
