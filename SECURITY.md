# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| latest (`main`) | ✅ |
| older branches | ❌ |

## Scope

This is a **client-side only** web application. There is no backend server, database, or authentication. All data is stored in the user's browser (localStorage).

In scope:
- XSS vulnerabilities in the React/Vite application
- Dependency vulnerabilities (`npm audit`)
- Sensitive data exposure in the codebase or build output

Out of scope:
- Deployment infrastructure (Vercel, Netlify, etc.) — report to your hosting provider
- Zakat calculation methodology disputes — open a regular issue

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, report privately via [GitHub Security Advisories](https://github.com/alfindigital/zakat-cal/security/advisories/new).

Include:
1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (optional)

We will acknowledge your report within **72 hours** and aim to release a fix within **14 days** for critical issues.

## Dependency Scanning

Run `npm audit` locally to check for known vulnerabilities in dependencies. The CI pipeline runs `npm audit` on every push.
