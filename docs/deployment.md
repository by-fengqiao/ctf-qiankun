# 静态部署

开源版只生成静态文件，不需要 Node.js 服务端、数据库或反向代理 API。

## 构建

```bash
npm ci
npm run build
```

把 `dist/` 目录发布到任意静态托管服务即可。

## Nginx

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/ctf-qiankun/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## GitHub Pages

仓库已提供 `.github/workflows/deploy-pages.yml`。推送到 `main` 后会自动构建并发布，仓库路径部署使用 `/ctf-qiankun/` base；绑定自定义域名时将 `vite.config.ts` 的 base 调整为 `/`。

## 数据边界

客户端工具默认在浏览器本地执行。部署者如自行接入统计、CDN、外部 API 或代理服务，应另行审查数据流和隐私影响。
