# Contributing to Modern Mahall

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/modern-mahall.git`
3. Create a branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test your changes: `npm test`
6. Commit: `git commit -m "Add: your feature description"`
7. Push: `git push origin feature/your-feature-name`
8. Open a Pull Request

## 📋 Development Workflow

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Setup
```bash
npm install
npm run dev    # Frontend
npm run server # Backend
npm test       # Run tests
```

## 🎯 Contribution Guidelines

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** rules (will be added)
- Use **Prettier** for formatting
- Write **meaningful commit messages**

### Testing

- Write tests for new features
- Ensure all tests pass: `npm test`
- Maintain coverage above 60%
- Add tests to `__tests__/` directory

### Commit Messages

Follow conventional commits:

```
feat: Add new feature
fix: Bug fix
docs: Documentation changes
style: Code style changes
refactor: Code refactoring
test: Adding tests
chore: Maintenance tasks
```

Examples:
- `feat: Add bulk payment deletion`
- `fix: Resolve OTP expiry issue`
- `docs: Update API documentation`
- `test: Add validation schema tests`

### Pull Request Process

1. **Update documentation** if needed
2. **Add/update tests** for your changes
3. **Ensure all tests pass**
4. **Update README** if adding features
5. **Describe your changes** in PR description
6. **Link related issues** (e.g., "Fixes #123")

### PR Title Format
```
[Type] Brief description

Examples:
[Feature] Add member export functionality
[Fix] Resolve payment calculation error
[Refactor] Split AdminDashboard into components
```

## 🐛 Reporting Bugs

Use the GitHub issue tracker:

**Include:**
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Environment (OS, Node version, browser)

**Template:**
```markdown
**Description**
Brief description of the bug

**Steps to Reproduce**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**
- OS: Windows 11
- Node: 18.17.0
- Browser: Chrome 120
```

## 💡 Suggesting Features

Open a feature request issue:

**Include:**
- Clear use case
- Expected behavior
- Mockups/examples if applicable
- Why it's valuable

## 📁 Project Structure

```
modern-mahall/
├── components/      # React components
├── backend/        # Express backend
│   ├── api/       # Routes
│   ├── services/  # Business logic
│   └── utils/     # Helpers
├── hooks/         # Custom hooks
├── __tests__/     # Tests
└── types.ts       # TypeScript types
```

## 🔒 Security

- Never commit `.env` files
- Never commit secrets/API keys
- Report security issues privately
- Follow security best practices

## ✅ Code Review Checklist

Before submitting PR:

- [ ] Code follows project style
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] No console.logs in production code
- [ ] TypeScript types added
- [ ] Commit messages are clear
- [ ] PR description is comprehensive

## 🎨 Design Guidelines

- Follow existing UI patterns
- Use Tailwind CSS classes
- Maintain responsive design
- Test on mobile and desktop
- Ensure accessibility (ARIA labels)

## 📝 Documentation

- Update README for new features
- Add JSDoc comments to functions
- Document complex logic
- Keep API docs up-to-date

## 🤝 Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on the code, not the person

## 📞 Getting Help

- GitHub Discussions for questions
- Issues for bugs/features
- Check existing issues first

## 🎉 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

Thank you for contributing! 🚀
