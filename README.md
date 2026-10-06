<div align="center">

# DevTools Suite

**Free, privacy-first developer tools. Everything runs in your browser.**

JSON diff, JWT decoder, PKCE generator, SQL date filters, Saudi test data and more, in one fast app.

[![Live Demo](https://img.shields.io/badge/Live_Demo-dev--tool--weld.vercel.app-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://dev-tool-weld.vercel.app)
[![Buy Me A Coffee](https://img.shields.io/badge/Buy_me_a_coffee-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=black)](https://buymeacoffee.com/imshaaz)

![CI](https://github.com/imshaaz21/DevTool/workflows/CI/badge.svg)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTool&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTool)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTool&metric=coverage)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTool)
![Next.js](https://img.shields.io/badge/Next.js_14-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)

</div>

## Why

Most online dev tools upload what you paste. This one doesn't. There is no backend, so tokens, payloads and SQL never leave your machine. Dark mode included.

## Tools

**Data and JSON**
- **JSON Formatter**: parse, format, minify, unwrap stringified JSON
- **JSON Diff v2**: semantic diff with line alignment and type checking
- **JSON Path & Sum**: aggregate values by JSON path
- **List Compare & Formatter**: diff two lists, emit SQL `IN` or JSON output

**Security and encoding**
- **JWT Decoder**
- **PKCE Generator & Validator**
- **Encoder / Decoder**: Base64, URL, HTML, MD5/SHA hashes
- **UUID Generator**

**Database and test data**
- **Saudi Fake Data**: realistic Saudi and non-Saudi test identities with transliteration
- **SQL Date & Timestamp Filter**: Oracle and PostgreSQL `WHERE` clauses (AST, SL, UTC)
- **Liquibase Checksum**

**Viewers and converters**
- **Base64 Image & PDF Viewer**
- **HTML Viewer & Sandbox**: multi-device preview
- **Text & Case Studio**
- **Hex Color Decoder & Studio**
- **Time Zone Converter**

## Run locally

```bash
npm install
npm run dev    # http://localhost:3000
```

Requires Node.js 18+ (`.nvmrc` pins 22).

```bash
npm run build          # production build
npm run lint           # ESLint
npm test               # Jest
npm run test:coverage  # Jest with coverage
```

See [TESTING.md](./TESTING.md) and [SONARCLOUD_SETUP.md](./SONARCLOUD_SETUP.md).

### Docker

```bash
docker build -t devtools-suite .
docker run -p 3000:3000 devtools-suite
```

## Support

If these tools save you time, you can [buy me a coffee](https://buymeacoffee.com/imshaaz).
