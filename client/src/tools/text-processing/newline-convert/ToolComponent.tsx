import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    modeOptions={[
      { value: 'lf', label: 'LF (\\n)' },
      { value: 'crlf', label: 'CRLF (\\r\\n)' },
      { value: 'cr', label: 'CR (\\r)' },
    ]}
    execute={(input: string, mode: string) => {
      const normalized: string = input.replace(/\r\n/gu, '\n').replace(/\r/gu, '\n');
      if (mode === 'crlf') return normalized.replace(/\n/gu, '\r\n');
      if (mode === 'cr') return normalized.replace(/\n/gu, '\r');
      return normalized;
    }}
  />
);

export default ToolComponent;
