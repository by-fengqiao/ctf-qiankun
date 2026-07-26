import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

interface UAInfo {
  browser: string;
  browserVersion: string;
  engine: string;
  os: string;
  device: string;
}

const parseUA = (ua: string): UAInfo => {
  const info: UAInfo = {
    browser: 'Unknown',
    browserVersion: '',
    engine: 'Unknown',
    os: 'Unknown',
    device: 'Desktop',
  };
  if (/Edg\/([\d.]+)/.test(ua)) {
    info.browser = 'Edge';
    info.browserVersion = RegExp.$1;
  } else if (/OPR\/([\d.]+)/.test(ua)) {
    info.browser = 'Opera';
    info.browserVersion = RegExp.$1;
  } else if (/Firefox\/([\d.]+)/.test(ua)) {
    info.browser = 'Firefox';
    info.browserVersion = RegExp.$1;
  } else if (/Chrome\/([\d.]+)/.test(ua)) {
    info.browser = 'Chrome';
    info.browserVersion = RegExp.$1;
  } else if (/Safari\/([\d.]+)/.test(ua) && /Version\/([\d.]+)/.test(ua)) {
    info.browser = 'Safari';
    info.browserVersion = RegExp.$1;
  }
  if (/AppleWebKit\/([\d.]+)/.test(ua)) {
    info.engine = `WebKit/${RegExp.$1}`;
  } else if (/Gecko\/([\d.]+)/.test(ua)) {
    info.engine = `Gecko/${RegExp.$1}`;
  } else if (/Trident\/([\d.]+)/.test(ua)) {
    info.engine = `Trident/${RegExp.$1}`;
  }
  if (/Windows NT ([\d.]+)/.test(ua)) {
    const ver = RegExp.$1;
    const winMap: Record<string, string> = {
      '10.0': 'Windows 10/11',
      '6.3': 'Windows 8.1',
      '6.2': 'Windows 8',
      '6.1': 'Windows 7',
    };
    info.os = winMap[ver] || `Windows NT ${ver}`;
  } else if (/Mac OS X ([\d_]+)/.test(ua)) {
    info.os = `macOS ${RegExp.$1.replace(/_/g, '.')}`;
  } else if (/Android ([\d.]+)/.test(ua)) {
    info.os = `Android ${RegExp.$1}`;
    info.device = 'Mobile';
  } else if (/iPhone OS ([\d_]+)/.test(ua)) {
    info.os = `iOS ${RegExp.$1.replace(/_/g, '.')}`;
    info.device = 'iPhone';
  } else if (/iPad.*OS ([\d_]+)/.test(ua)) {
    info.os = `iPadOS ${RegExp.$1.replace(/_/g, '.')}`;
    info.device = 'iPad';
  } else if (/Linux/.test(ua)) {
    info.os = 'Linux';
  }
  if (/Mobile/.test(ua) && info.device === 'Desktop') {
    info.device = 'Mobile';
  }
  return info;
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const info = parseUA(input);
      return [
        `浏览器: ${info.browser} ${info.browserVersion}`.trim(),
        `引擎: ${info.engine}`,
        `操作系统: ${info.os}`,
        `设备类型: ${info.device}`,
      ].join('\n');
    }}
  />
);

export default ToolComponent;
