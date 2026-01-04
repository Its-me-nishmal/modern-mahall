# Modern Mahall - Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability, please follow these steps:

### 🚨 Critical Vulnerabilities

For critical security issues (authentication bypass, data exposure, etc.):

1. **DO NOT** open a public issue
2. Email: security@modernmahall.com (replace with actual)
3. Include:
   - Description of vulnerability
   - Steps to reproduce
   - Impact assessment
   - Suggested fix (if any)

### ⚠️ Non-Critical Issues

For less critical issues:

1. Open a GitHub issue with tag `security`
2. Describe the issue
3. We'll respond within 48 hours

## Security Best Practices

### For Developers

- Never commit `.env` files
- Use environment variables for secrets
- Keep dependencies updated: `npm audit`
- Follow OWASP guidelines
- Enable 2FA on GitHub

### For Deployments

- Use HTTPS in production
- Set `NODE_ENV=production`
- Rotate JWT secrets regularly
- Use MongoDB (not FileDB) in production
- Enable rate limiting
- Monitor logs for suspicious activity

## Security Features

✅ OTP-based authentication  
✅ JWT token management  
✅ Rate limiting  
✅ Input validation (Zod)  
✅ CORS protection  
✅ Helmet security headers  
✅ Role-based access control  

## Incident Response

If a vulnerability is confirmed:

1. We'll acknowledge within 24 hours
2. We'll provide a fix timeline
3. We'll release a patch
4. We'll credit the reporter (if desired)
5. We'll publish a security advisory

## Security Updates

- Subscribe to GitHub releases
- Watch for security tags
- Apply patches promptly

## Contact

- Security Email: security@modernmahall.com
- General Issues: GitHub Issues

Thank you for helping keep Modern Mahall secure! 🔒
