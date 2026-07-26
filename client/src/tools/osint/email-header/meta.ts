import type { ToolDefinition } from '../../types';
export default {
  id: 'email-header',
  name: '邮件头解析',
  description: '解析邮件头：Received 路由链、SPF/DKIM/DMARC、Message-ID、X-Originating-IP',
  category: 'osint',
  group: '文件/邮件',
  keywords: ['email', 'header', '邮件头', 'received', 'spf', 'dkim', 'dmarc', 'message-id', 'routing', '邮件路由'],
  modes: ['analyze'],
  exampleInput: 'Received: from mail.example.com (1.2.3.4) by mx.google.com with ESMTP;\nMessage-ID: <abc@example.com>\nFrom: sender@example.com',
} satisfies ToolDefinition;
