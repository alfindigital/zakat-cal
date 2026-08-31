# Contributing to ZakatCal

Thank you for your interest in contributing! Please follow these guidelines.

## Getting Started

1. **Fork** the repository on GitHub.
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/<your-username>/zakat-cal.git
   cd zakat-cal
   npm install
   ```
3. Create a new branch from `main` (see branch naming below).
4. Make your changes, write/update tests, then open a Pull Request.

## Branch Naming

| Prefix | Use for |
|---|---|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation only |
| `refactor/` | Code refactoring |
| `test/` | Tests only |
| `chore/` | Build, deps, config |

Example: `feat/zakat-saham`, `fix/fitrah-rounding`

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

[optional body]
[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
- `feat(fitrah): add mode beras by weight`
- `fix(penghasilan): correct nisab threshold calculation`
- `docs(readme): add deployment guide`

## Pull Request Checklist

Before submitting a PR, ensure:

- [ ] Branch is up-to-date with `main`
- [ ] `npm run lint` passes with no errors
- [ ] `npm test` passes (all unit tests green)
- [ ] New features have unit tests
- [ ] Accessibility not regressed — `npm run test:e2e:a11y` passes
- [ ] No secrets, API keys, or personal data in the diff
- [ ] PR description explains **what** and **why**

## Islamic Finance Accuracy

Zakat calculations must be grounded in recognised fiqh references. For any change to calculation logic, please cite the Islamic jurisprudence source (e.g. BAZNAS fatwa, Fatawa Islamiyya, or a specific madhab ruling).

## Code Style

- TypeScript strict mode — no `any` without justification
- React functional components + hooks only
- shadcn/ui primitives preferred over custom HTML for interactive elements
- All user-facing strings should be in Indonesian

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
