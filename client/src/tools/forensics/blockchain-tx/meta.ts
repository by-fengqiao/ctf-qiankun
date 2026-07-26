import type { ToolDefinition } from '../../types';

export default {
  id: 'blockchain-tx',
  name: '区块链交易解析',
  description: '解析 Bitcoin/Ethereum 原始交易数据，解码输入输出、脚本类型（P2PKH/P2SH/P2WPKH）与 RLP 结构',
  category: 'forensics',
  group: '移动/链',
  keywords: ['blockchain', 'bitcoin', 'ethereum', 'transaction', 'rlp', 'p2pkh', 'p2sh', 'p2wpkh', 'crypto', 'forensics'],
  modes: ['analyze'],
  hasFileInput: true,
  exampleInput: '0100000001...',
} satisfies ToolDefinition;
