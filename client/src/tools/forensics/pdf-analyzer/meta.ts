import type { ToolDefinition } from '../../types';

export default {
  id: 'pdf-analyzer',
  name: 'PDF文件解析',
  description: '解析 PDF 文件结构（头部版本、xref 交叉引用表、对象），提取元数据（标题/作者/主题）、JavaScript 动作、内嵌文件、AcroForm 表单字段与链接',
  category: 'forensics',
  group: '文档',
  keywords: ['pdf', '文档解析', '元数据', 'metadata', 'javascript', '内嵌文件', '表单', 'acroform', 'forensics'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '255044462D312E340A',
} satisfies ToolDefinition;
