import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const COMMON_PASSWORDS: string[] = [
  '123456', 'password', '12345678', 'qwerty', '123456789', '12345', '1234', '111111',
  '1234567', 'dragon', '123123', 'baseball', 'abc123', 'football', 'monkey', 'letmein',
  '696969', 'shadow', 'master', '666666', 'qwertyuiop', '123321', 'mustang', '1234567890',
  'michael', '654321', 'superman', '1qaz2wsx', '7777777', '121212', '000000', 'qazwsx',
  '123qwe', 'killer', 'trustno1', 'jordan', 'jennifer', 'zxcvbnm', 'asdfgh', 'hunter',
  'buster', 'soccer', 'harley', 'batman', 'andrew', 'tigger', 'sunshine', 'iloveyou',
  '2000', 'charlie', 'robert', 'thomas', 'hockey', 'ranger', 'daniel', 'starwars',
  'klaster', '112233', 'george', 'computer', 'michelle', 'jessica', 'pepper', '1111',
  'zxcvbn', '555555', '11111111', '131313', 'freedom', '777777', 'pass', 'fuck',
  'maggie', '159753', 'aaaaaa', 'ginger', 'princess', 'joshua', 'cheese', 'amanda',
  'summer', 'love', 'ashley', '6969', 'nicole', 'chelsea', 'biteme', 'matthew',
  'access', 'yankees', '987654321', 'dallas', 'austin', 'thunder', 'taylor', 'matrix',
  'william', 'corvette', 'hello', 'martin', 'heather', 'secret', 'fukc', 'merlin',
  'diamond', '1234qwer', 'gfhjkm', 'hammer', 'silver', '222222', '88888888', 'anthony',
  'justin', 'test', 'bailey', 'q1w2e3r4t5', 'patrick', 'internet', 'scooter', 'orange',
  '11111', 'golfer', 'cookie', 'richard', 'samantha', 'bigdog', 'guitar', 'jackson',
  'whatever', 'mickey', 'chicken', 'sparky', 'snoopy', 'maverick', 'phoenix', 'camaro',
  'sexy', 'peanut', 'morgan', 'welcome', 'falcon', 'cowboy', 'ferrari', 'samsung',
  'andrea', 'smokey', 'steelers', 'joseph', 'mercedes', 'dakota', 'eagles', 'marina',
  'pussy', 'brandon', '2112', 'yellow', 'robert', '12qwaszx', 'asdf', '123abc',
];

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="泄露查询"
    execute={(input: string): string => {
      const target = input.trim();
      if (!target) return '请输入邮箱、用户名或密码';
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target);
      const out: string[] = ['泄露查询', '═'.repeat(60), ''];

      if (isEmail || (!isEmail && /^[a-zA-Z0-9_.-]+$/.test(target) && !COMMON_PASSWORDS.includes(target.toLowerCase()) && target.length >= 3 && target.length <= 64)) {
        out.push(`输入: ${target}`);
        out.push(`类型: ${isEmail ? '邮箱' : '用户名'}`);
        out.push('');

        out.push('── Have I Been Pwned ──');
        out.push(`  邮箱查询: https://haveibeenpwned.com/account/${encodeURIComponent(target)}`);
        out.push(`  Breach 列表: https://haveibeenpwned.com/Breaches`);
        out.push(`  Paste 查询: https://haveibeenpwned.com/Pastes`);
        out.push('');

        out.push('── DeHashed ──');
        out.push(`  查询: https://dehashed.com/search?query=${encodeURIComponent(target)}`);
        out.push('');

        out.push('── LeakCheck / Intelligence X ──');
        out.push(`  LeakCheck: https://leakcheck.io/`);
        out.push(`  IntelX: https://intelx.io/?s=${encodeURIComponent(target)}`);
        out.push('');

        out.push('── 泄露数据库聚合 ──');
        out.push(`  Snusbase: https://snusbase.com/`);
        out.push(`  Leakpeek: https://leakpeek.com/`);
        out.push(`  WeLeakInfo: https://weleakinfo.com/`);
        out.push(`  breachdirectory: https://breachdirectory.org/`);
        out.push(`  译者注: 部分平台需付费订阅`);
        out.push('');

        out.push('── 中国常见泄露查询 ──');
        out.push(`  reg007: https://www.reg007.com/`);
        out.push(`  Firefox Monitor: https://monitor.firefox.com/`);
        out.push('');

        out.push('── 密码强度检查 ──');
        out.push(`  HIBP 密码: https://haveibeenpwned.com/Passwords`);
        out.push('  说明: HIBP 密码查询使用 k-anonymity 模型，仅发送 SHA1 前缀');
      } else {
        out.push(`输入: ${target}`);
        out.push('类型: 密码');
        out.push('');
        const lower = target.toLowerCase();
        const inCommon = COMMON_PASSWORDS.includes(lower);
        out.push('── 本地常见密码比对 ──');
        out.push(`常见密码库大小: ${COMMON_PASSWORDS.length}`);
        out.push(`是否命中常见密码: ${inCommon ? '⚠ 命中！该密码在泄露密码库中极常见' : '✓ 未命中常见密码（仍不安全，建议检查 HIBP）'}`);
        out.push('');

        const checks: string[] = [];
        if (target.length < 8) checks.push('长度不足 8 位');
        if (!/[a-z]/.test(target)) checks.push('缺少小写字母');
        if (!/[A-Z]/.test(target)) checks.push('缺少大写字母');
        if (!/[0-9]/.test(target)) checks.push('缺少数字');
        if (!/[^a-zA-Z0-9]/.test(target)) checks.push('缺少特殊字符');
        if (/(.)\1{2,}/.test(target)) checks.push('包含连续重复字符');
        if (/^(0123|1234|2345|3456|4567|5678|6789|abcd|qwer|asdf)/.test(lower)) checks.push('包含键盘序列');

        out.push('── 密码强度评估 ──');
        if (checks.length === 0) {
          out.push('✓ 强度较好（但仍建议检查是否在泄露库中）');
        } else {
          for (const c of checks) out.push(`  ⚠ ${c}`);
        }
        out.push('');

        out.push('── 在线泄露检查 ──');
        out.push(`  HIBP 密码: https://haveibeenpwned.com/Passwords`);
        out.push(`  命令行: curl -s "https://api.pwnedpasswords.com/range/$(echo -n "${target}" | sha1sum | cut -c1-5 | tr a-f A-F)"`);
      }
      return out.join('\n');
    }}
  />
);
export default ToolComponent;
