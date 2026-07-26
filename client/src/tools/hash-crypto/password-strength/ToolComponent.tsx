import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const pwd = input;
      if (!pwd) return '请输入密码';
      let poolSize = 0;
      const checks: string[] = [];
      if (/[a-z]/.test(pwd)) { poolSize += 26; checks.push('✓ 小写字母'); }
      if (/[A-Z]/.test(pwd)) { poolSize += 26; checks.push('✓ 大写字母'); }
      if (/[0-9]/.test(pwd)) { poolSize += 10; checks.push('✓ 数字'); }
      if (/[^a-zA-Z0-9]/.test(pwd)) { poolSize += 32; checks.push('✓ 特殊字符'); }
      const entropy = Math.log2(poolSize || 1) * pwd.length;
      let level: string;
      let emoji: string;
      if (entropy < 28) { level = '非常弱'; emoji = '🔴'; }
      else if (entropy < 36) { level = '弱'; emoji = '🟠'; }
      else if (entropy < 60) { level = '中等'; emoji = '🟡'; }
      else if (entropy < 128) { level = '强'; emoji = '🟢'; }
      else { level = '非常强'; emoji = '🟢'; }
      const issues: string[] = [];
      if (pwd.length < 8) issues.push('⚠ 密码长度不足8位');
      if (pwd.length < 12) issues.push('⚠ 建议密码长度≥12位');
      if (/^(123|abc|qwe|password|admin|letmein|welcome)/i.test(pwd)) issues.push('⚠ 包含常见弱密码模式');
      if (/(.)\1{2,}/.test(pwd)) issues.push('⚠ 包含连续重复字符');
      if (/^(19|20)\d{2}$/.test(pwd)) issues.push('⚠ 看起来像年份');
      if (/^\d+$/.test(pwd)) issues.push('⚠ 纯数字密码');
      if (/^[a-z]+$/i.test(pwd)) issues.push('⚠ 纯字母密码');
      const lines = [
        `${emoji} 密码强度: ${level}`,
        `熵值: ${entropy.toFixed(2)} bits`,
        `字符池大小: ${poolSize}`,
        `密码长度: ${pwd.length}`,
        '',
        '字符组成:',
        ...checks,
      ];
      if (issues.length > 0) {
        lines.push('', '安全问题:');
        lines.push(...issues);
      } else {
        lines.push('', '✅ 未发现明显安全问题');
      }
      return lines.join('\n');
    }}
  />
);
export default ToolComponent;
