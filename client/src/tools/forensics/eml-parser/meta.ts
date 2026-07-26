import type { ToolDefinition } from '../../types';

export default {
  id: 'eml-parser',
  name: 'EML邮件解析',
  description: '解析 EML 邮件文件，提取邮件头（From/To/Subject/Date）、MIME 多部分结构、附件与正文',
  category: 'forensics',
  group: '文档',
  keywords: ['eml', 'email', 'mime', 'mail', 'header', 'attachment', 'base64', 'quoted-printable', 'forensics', '取证'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: 'From: sender@example.com\nSubject: Test\n...',
} satisfies ToolDefinition;
