import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const LANG_OPTIONS = [
  { value: 'php', label: 'PHP' },
  { value: 'asp', label: 'ASP/ASPX' },
  { value: 'jsp', label: 'JSP' },
];

const TYPE_OPTIONS = [
  { value: 'admin', label: '后台管理' },
  { value: 'backup', label: '备份文件' },
  { value: 'config', label: '配置文件' },
  { value: 'api', label: 'API接口' },
  { value: 'sensitive', label: '敏感文件' },
];

const WORDLISTS: Record<string, Record<string, string[]>> = {
  php: {
    admin: ['admin', 'administrator', 'login', 'wp-admin', 'wp-login', 'manager', 'panel', 'dashboard', 'cp', 'control', 'admincp', 'adminpanel', 'backend', 'admin/login.php', 'admin/index.php', 'admin/admin.php', 'phpmyadmin', 'pma', 'phpMyAdmin', 'adminer.php', 'adminer'],
    backup: ['backup', 'backup.zip', 'backup.tar.gz', 'backup.sql', 'db.sql', 'dump.sql', 'database.sql', 'backup.php', 'old.zip', 'www.zip', 'web.zip', 'site.zip', 'html.zip', 'backup.bak', '1.zip', '1.sql', 'data.sql', 'data.zip', 'data.tar.gz', 'backup.tar', 'www.tar.gz', 'web.tar.gz', 'site.tar.gz', 'release.zip', 'archive.zip'],
    config: ['.env', '.env.local', '.env.production', 'config.php', 'config.inc.php', 'config/config.php', 'configuration.php', 'wp-config.php', 'config.json', 'config.yml', 'config.yaml', 'settings.php', 'database.php', 'db.php', 'connection.php', 'conn.php', 'constants.php', 'app/config.php', 'application/config.php', 'config/database.php', '.htaccess', '.htpasswd', 'php.ini', 'wp-config.php.bak', 'config.php.bak'],
    api: ['api', 'api/v1', 'api/v2', 'api/v3', 'api/login', 'api/user', 'api/users', 'api/admin', 'api/token', 'api/auth', 'api/oauth', 'api/graphql', 'api/rest', 'api/json', 'api.php', 'api/index.php', 'api/v1/user', 'api/v1/login', 'api/v1/users', 'api/v1/token', 'api/swagger', 'api/docs', 'api/openapi', 'api/spec', 'api/health', 'api/status', 'api/config', 'rest', 'rest/v1'],
    sensitive: ['.git', '.git/config', '.git/HEAD', '.git/index', '.svn', '.svn/entries', '.DS_Store', 'robots.txt', 'sitemap.xml', '.htaccess', '.htpasswd', 'phpinfo.php', 'info.php', 'test.php', 'debug.php', 'phpmyadmin', 'pma', 'adminer.php', 'install.php', 'setup.php', 'license.txt', 'readme.txt', 'README.md', 'CHANGELOG.md', 'composer.json', 'composer.lock', 'package.json', 'vendor', 'vendor/autoload.php', 'storage', 'storage/logs', 'storage/logs/laravel.log', 'debug.log', 'error.log', 'access.log', '.well-known', '.well-known/security.txt', 'server-status', 'server-info'],
  },
  asp: {
    admin: ['admin', 'administrator', 'login', 'manager', 'panel', 'dashboard', 'cp', 'control', 'admincp', 'adminpanel', 'backend', 'admin/login.aspx', 'admin/login.asp', 'admin/index.aspx', 'admin/admin.aspx', 'admin/default.aspx', 'manage', 'management', 'console', 'admin.aspx', 'login.aspx', 'default.aspx', 'iisstart.htm', 'iisadmin'],
    backup: ['backup', 'backup.zip', 'backup.bak', 'backup.rar', 'db.bak', 'database.bak', 'www.zip', 'web.zip', 'site.zip', 'Backup.zip', 'app.zip', 'App_Data.zip', 'App_Data.bak', 'old.zip', '1.zip', '1.bak', 'data.bak', 'data.zip', 'release.zip', 'wwwroot.zip', 'web.config.bak', 'web.config.old', 'web.config.txt'],
    config: ['web.config', 'Web.config', 'app.config', 'App.config', 'connectionstrings.config', 'appsettings.json', 'appsettings.Development.json', 'appsettings.Production.json', '.env', 'config.aspx', 'config.asp', 'settings.aspx', 'global.asa', 'global.asax', 'connection.aspx', 'db.aspx', 'database.aspx', 'web.config.bak', 'web.config.old', 'machine.config', 'App_Data/config.xml', 'App_Data/settings.xml'],
    api: ['api', 'api/v1', 'api/v2', 'api/login', 'api/user', 'api/users', 'api/admin', 'api/token', 'api/auth', 'api/oauth', 'api/graphql', 'api/Account', 'api/Account/Login', 'api/Account/Register', 'api/Values', 'api/values', 'api/identity', 'api/health', 'api/swagger', 'api/docs', 'swagger', 'swagger/index.html', 'swagger/v1/swagger.json', 'api/v1/values', 'odata', 'odata/v1', 'Service.svc', 'WebService.asmx', 'asmx'],
    sensitive: ['.git', '.git/config', '.svn', '.DS_Store', 'robots.txt', 'sitemap.xml', 'web.config', 'elmah.axd', 'trace.axd', 'trace', 'trace.aspx', 'debug.aspx', 'test.aspx', 'info.aspx', 'install.aspx', 'setup.aspx', 'license.txt', 'readme.txt', 'README.md', 'packages.config', 'packages', 'bin', 'obj', 'App_Data', 'App_Data/Logs', 'App_Data/logs.txt', 'App_Data/db.mdb', 'App_Data/Database.mdb', 'App_Data/data.mdf', 'App_Data/aspnetdb.mdf', 'error.log', 'access.log', '.well-known', '.well-known/security.txt', 'iisstart.htm', 'default.htm'],
  },
  jsp: {
    admin: ['admin', 'administrator', 'login', 'manager', 'panel', 'dashboard', 'cp', 'control', 'admincp', 'adminpanel', 'backend', 'admin/login.jsp', 'admin/index.jsp', 'admin/admin.jsp', 'admin/home.jsp', 'manage', 'management', 'console', 'jmx-console', 'web-console', 'jmx-console/', 'admin-console', 'admin.jsp', 'login.jsp', 'index.jsp', 'main.jsp', 'home.jsp'],
    backup: ['backup', 'backup.zip', 'backup.tar.gz', 'backup.war', 'db.sql', 'dump.sql', 'database.sql', 'backup.sql', 'www.zip', 'web.zip', 'site.zip', 'webapps.zip', '1.zip', '1.sql', 'data.sql', 'data.zip', 'release.zip', 'backup.tar', 'www.tar.gz', 'web.tar.gz', 'site.tar.gz', 'WEB-INF.zip', 'WEB-INF.bak', 'classes.zip', 'lib.zip'],
    config: ['.env', 'application.properties', 'application.yml', 'application.yaml', 'application-dev.properties', 'application-prod.properties', 'application-dev.yml', 'application-prod.yml', 'config.properties', 'config.yml', 'config.yaml', 'database.properties', 'db.properties', 'jdbc.properties', 'datasource.properties', 'spring.properties', 'settings.properties', 'WEB-INF/web.xml', 'WEB-INF/classes/application.properties', 'WEB-INF/classes/application.yml', 'WEB-INF/classes/jdbc.properties', 'META-INF/context.xml', 'WEB-INF/context.xml', 'WEB-INF/classes/log4j.properties', 'WEB-INF/classes/log4j2.xml', 'pom.xml', 'build.gradle', 'gradle.properties', 'settings.gradle'],
    api: ['api', 'api/v1', 'api/v2', 'api/v3', 'api/login', 'api/user', 'api/users', 'api/admin', 'api/token', 'api/auth', 'api/oauth', 'api/graphql', 'api/rest', 'api/json', 'api/swagger', 'api/docs', 'swagger', 'swagger-ui.html', 'swagger-ui/index.html', 'v2/api-docs', 'v3/api-docs', 'api/v1/user', 'api/v1/login', 'api/v1/users', 'api/v1/token', 'api/health', 'api/status', 'api/actuator', 'actuator', 'actuator/health', 'actuator/env', 'actuator/beans', 'actuator/mappings', 'actuator/configprops', 'actuator/heapdump', 'actuator/loggers', 'actuator/threaddump'],
    sensitive: ['.git', '.git/config', '.svn', '.DS_Store', 'robots.txt', 'sitemap.xml', 'WEB-INF/web.xml', 'WEB-INF/classes/', 'WEB-INF/lib/', 'WEB-INF/classes/log4j.properties', 'WEB-INF/classes/log4j2.xml', 'META-INF/', 'META-INF/MANIFEST.MF', 'META-INF/context.xml', 'test.jsp', 'debug.jsp', 'info.jsp', 'install.jsp', 'setup.jsp', 'license.txt', 'readme.txt', 'README.md', 'pom.xml', 'build.gradle', 'gradle.properties', 'settings.gradle', 'error.log', 'access.log', 'catalina.out', 'localhost.log', 'localhost_access_log', '.well-known', '.well-known/security.txt', 'manager/html', 'manager/status', 'host-manager/html', 'jmx-console', 'web-console'],
  },
};

const generate = (lang: string, type: string, prefix: string, suffix: string): string => {
  const wordlist = WORDLISTS[lang]?.[type] ?? WORDLISTS.php.admin;
  const pre = prefix.trim();
  const suf = suffix.trim();
  const paths = wordlist.map((w) => {
    let p = w;
    if (pre && !p.startsWith('/')) p = `${pre}/${p}`;
    else if (pre) p = `${pre}${p}`;
    if (suf && !suf.startsWith('.')) p = `${p}.${suf}`;
    else if (suf) p = `${p}${suf}`;
    return p;
  });
  return [
    `=== 目录爆破字典（Lang: ${lang} / Type: ${type}）===`,
    `路径数: ${paths.length}`,
    `前缀: ${pre || '(无)'}`,
    `后缀: ${suf || '(无)'}`,
    '',
    ...paths,
  ].join('\n');
};

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    toolName="目录爆破字典生成器"
    paramsConfig={[
      { name: 'lang', label: '语言', type: 'select', options: LANG_OPTIONS, default: 'php' },
      { name: 'type', label: '类型', type: 'select', options: TYPE_OPTIONS, default: 'admin' },
      { name: 'prefix', label: '前缀', type: 'text', placeholder: '/app', default: '' },
      { name: 'suffix', label: '后缀', type: 'text', placeholder: '.bak', default: '' },
    ]}
    execute={(
      _input: string,
      _mode: string,
      params: Record<string, unknown>,
    ): string => generate(
      (params.lang as string) ?? 'php',
      (params.type as string) ?? 'admin',
      (params.prefix as string) ?? '',
      (params.suffix as string) ?? '',
    )}
  />
);

export default ToolComponent;
