import type { ToolDefinition } from '../../types';
export default {
  id: 'ssh-public-key',
  name: 'SSH Public Key',
  category: 'hash-crypto',
  group: 'JWT/密钥',
  keywords: ['ssh', 'public-key', 'ssh-public-key', 'authorized_keys'],
  modes: ['analyze'],
  exampleInput: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCx... user@host',
} satisfies ToolDefinition;
