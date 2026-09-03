# iCard content

iCard 的生产内容源是：

- 清单：`https://cometseek.com/icard-content/v1/manifest.json`
- 支持：`https://cometseek.com/icard-content/support.html`
- 隐私：`https://cometseek.com/icard-content/privacy.html`

`cometseek.github.io/icard-content-pages` 暂时作为旧版 App 的兼容地址保留，
新版本不再依赖 GitHub Pages。静态文件发布在公司已备案域名和中国大陆服务器上。

发布前运行：

```bash
node scripts/verify-content.mjs
```

服务器使用 `/var/www/icard-content/releases/<release>` 保存每次发布，
`/var/www/icard-content/current` 原子指向当前版本。Nginx 配置片段保存在
`ops/nginx-location.conf`。
