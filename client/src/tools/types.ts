import type { ComponentType } from 'react';

export type ToolCategory =
  | 'encoding'
  | 'text-processing'
  | 'classical-crypto'
  | 'hash-crypto'
  | 'web-network'
  | 'file-binary'
  | 'image-audio'
  | 'misc-esoteric'
  | 'modern-crypto'
  | 'pwn-reverse'
  | 'web-security'
  | 'forensics'
  | 'osint'
  | 'stego'
  | 'misc'
  | 'general';

export type ToolMode =
  | 'encode'
  | 'decode'
  | 'execute'
  | 'encrypt'
  | 'decrypt'
  | 'analyze'
  | 'generate'
  | 'extract'
  | 'convert';

export interface ToolDefinition {
  id: string;
  name: string;
  description?: string;
  category: ToolCategory;
  group?: string;
  keywords: string[];
  modes: ToolMode[];
  hasFileInput?: boolean;
  maxFileSize?: number;
  exampleInput?: string;
  defaultParams?: Record<string, unknown>;
  modeOptions?: { value: string; label: string }[];
  paramsConfig?: { name: string; label: string; type: string; default?: string; options?: { value: string; label: string }[]; placeholder?: string }[];
}

export interface ToolEntry {
  definition: ToolDefinition;
  componentLoader: () => Promise<{ default: ComponentType<ToolProps> }>;
}

export interface ToolProps {
  input: string;
  output: string;
  setOutput: (value: string) => void;
  mode: ToolMode;
  params: Record<string, unknown>;
  setParams: (params: Record<string, unknown>) => void;
  file: File | null;
  setFile: (file: File | null) => void;
}

export interface CategoryConfig {
  id: ToolCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export const DEFAULT_MAX_FILE_SIZE = 20 * 1024 * 1024;
