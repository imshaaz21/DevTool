# DevTools Suite

![CI](https://github.com/imshaaz21/DevTool/workflows/CI/badge.svg)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTool&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTool)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=imshaaz21_DevTool&metric=coverage)](https://sonarcloud.io/summary/new_code?id=imshaaz21_DevTool)

A collection of internal developer tools in one Next.js app. Everything runs
client-side - nothing you paste ever leaves the browser.

## Tools

- Saudi Fake Data - realistic Saudi/non-Saudi test identities with transliteration
- JSON Formatter - parse, format, minify, and unwrap stringified JSON
- JSON Diff v2 - semantic diff with line alignment and type checking
- JSON Comparison (deprecated) - superseded by JSON Diff v2
- Feature Toggle Diff - compare `configValue.release` toggles across environments
- JSON Path & Sum - aggregate values by JSON path
- List Compare & Formatter - diff two lists, emit SQL IN / JSON output
- Encoder / Decoder - Base64, URL, HTML, MD5/SHA hashes
- JWT Decoder
- PKCE Generator & Validator
- Base64 Image & PDF Viewer
- HTML Viewer & Sandbox
- Liquibase Checksum
- SQL Date & Timestamp Filter - Oracle/PostgreSQL WHERE clauses (AST, SL, UTC)
- Text & Case Studio
- Hex Color Decoder & Studio
- Time Zone Converter
- UUID Generator
- Screen Permission Decode

## Setup

```bash
npm install
npm run dev    # http://localhost:3000
```

Requires Node.js 18+.

## Scripts

```bash
npm run dev            # dev server
npm run build          # production build
npm run lint           # ESLint
npm test               # Jest
npm run test:coverage  # Jest with coverage
```

See [TESTING.md](./TESTING.md) for the test setup and
[SONARCLOUD_SETUP.md](./SONARCLOUD_SETUP.md) for CI quality gates.

## Docker

```bash
docker build -t devtools-suite .
docker run -p 3000:3000 devtools-suite
```

## License

MIT
