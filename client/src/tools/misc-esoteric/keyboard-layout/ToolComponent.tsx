import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const QWERTY = 'qwertyuiopasdfghjkl;zxcvbnm,./QWERTYUIOPASDFGHJKL:ZXCVBNM<>?';
const DVORAK = "',.pyfgcrlaoeuidhtns;qjkxbmwvz\"<>PYFGCRLAOEUIDHTNS:QJKXBMWVZ";
const AZERTY = 'azertyuiopqsdfghjklmwxcvbn,;:=AZERTYUIOPQSDFGHJKLMWXCVBN?;:+';

const LAYOUTS: Record<string, string> = {
  qwerty: QWERTY,
  dvorak: DVORAK,
  azerty: AZERTY,
};

const LAYOUT_OPTIONS = [
  { value: 'qwerty', label: 'QWERTY' },
  { value: 'dvorak', label: 'Dvorak' },
  { value: 'azerty', label: 'AZERTY' },
];

function convertLayout(text: string, from: string, to: string): string {
  const fromLayout = LAYOUTS[from] ?? QWERTY;
  const toLayout = LAYOUTS[to] ?? DVORAK;
  const map: Record<string, string> = {};
  for (let i = 0; i < fromLayout.length; i++) {
    map[fromLayout[i]] = toLayout[i];
  }
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += map[text[i]] ?? text[i];
  }
  return result;
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string, _mode: string, params: Record<string, unknown>) => {
      const from = (params.from as string) ?? 'qwerty';
      const to = (params.to as string) ?? 'dvorak';
      return convertLayout(input, from, to);
    }}
    paramsConfig={[
      { name: 'from', label: '从', type: 'select', default: 'qwerty', options: LAYOUT_OPTIONS },
      { name: 'to', label: '到', type: 'select', default: 'dvorak', options: LAYOUT_OPTIONS },
    ]}
  />
);

export default ToolComponent;
