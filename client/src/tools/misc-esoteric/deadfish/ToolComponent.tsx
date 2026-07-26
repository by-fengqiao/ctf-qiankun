import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

function deadfish(code: string): string {
  let acc = 0;
  let output = '';
  const maxVal = 256;
  for (const ch of code) {
    switch (ch) {
      case 'i': case 'I':
        acc++;
        break;
      case 'd': case 'D':
        acc--;
        break;
      case 's': case 'S':
        acc *= acc;
        break;
      case 'o': case 'O':
        output += `${acc}\n`;
        break;
    }
    if (acc < 0 || acc >= maxVal) acc = 0;
  }
  return output.trimEnd();
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => deadfish(input)}
  />
);

export default ToolComponent;
