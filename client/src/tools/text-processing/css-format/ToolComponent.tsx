import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      let css: string = input.replace(/\/\*[\s\S]*?\*\//gu, '');
      css = css.replace(/\s+/gu, ' ').trim();
      css = css
        .replace(/\s*\{\s*/gu, ' {\n  ')
        .replace(/;\s*/gu, ';\n  ')
        .replace(/\s*\}\s*/gu, '\n}\n')
        .replace(/\n\s*\n/gu, '\n')
        .replace(/:\s*/gu, ': ');
      return css.trim();
    }}
  />
);

export default ToolComponent;
