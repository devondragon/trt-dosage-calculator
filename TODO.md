# TODO - Future Improvements

## 🔴 Critical/Security

### 2. Security Improvements
- [ ] Implement rate limiting to prevent API abuse
- [ ] Add request throttling per IP address
- [ ] Consider adding API key authentication for higher rate limits
- [ ] Implement CSRF protection if adding user accounts

## 🟡 Code Quality

### 4. Separate HTML/CSS/JS
- [ ] Move inline HTML template to separate files
- [ ] Consider using a template engine or build process
- [ ] Split CSS into separate stylesheet
- [ ] Extract JavaScript into separate modules

### 5. TypeScript Enhancements
- [ ] Enable strict mode in tsconfig.json
- [ ] Add explicit return type annotations for all functions
- [ ] Add stricter null checks
- [ ] Define more specific types instead of using `any`

### 6. Error Handling & Logging
- [ ] Add structured logging system
- [ ] Implement correlation IDs for request tracking
- [ ] Add debug mode with verbose logging
- [ ] Create error boundary for graceful failures

## 🟢 Feature Enhancements

### 8. Advanced Validation
- [ ] Validate testosterone strength against common values (100, 200, 250 mg/ml)
- [ ] Add warnings for unusual dosing patterns
- [ ] Implement dosage range recommendations based on medical guidelines
- [ ] Add age-based validation/warnings

### 9. API Enhancements
- [ ] Add API versioning headers (X-API-Version)
- [ ] Return calculation metadata (timestamp, version, calculation ID)
- [ ] Add batch calculation endpoint for multiple calculations
- [ ] Implement GraphQL endpoint as alternative to REST
- [ ] Add webhook support for calculation results

### Additional UX Features
- [ ] Add dosage history/tracking (requires KV or D1 storage)
- [ ] Implement unit conversion toggle (mg/ml ↔ other units)
- [ ] Add export/import settings functionality
- [ ] PWA support for offline use
- [ ] Dark mode toggle
- [ ] Multiple language support (i18n)
- [ ] Add calculation explanations/breakdown
- [ ] Implement comparison tool for different protocols

## 🔧 Technical Infrastructure

### 12. Build Process
- [ ] Add production build optimizations
- [ ] Implement HTML/CSS/JS minification
- [ ] Add source maps for debugging
- [ ] Implement asset versioning/cache busting
- [ ] Add bundle size monitoring

### 13. Monitoring & Analytics
- [ ] Add error tracking (e.g., Sentry integration)
- [ ] Implement analytics for usage patterns
- [ ] Create health check endpoint (/health)
- [ ] Add performance monitoring (response times, calculation times)
- [ ] Implement uptime monitoring
- [ ] Add CloudFlare Analytics integration
- [ ] Create admin dashboard for metrics

## 📊 Data & Storage

### Future Storage Features
- [ ] User accounts and authentication
- [ ] Save calculation history per user
- [ ] Custom presets/protocols
- [ ] Share calculations via unique URLs
- [ ] Data export in various formats (CSV, PDF)

## 📱 Mobile & Platform

### Mobile Enhancements
- [ ] Native mobile app (React Native or Flutter)
- [ ] Push notifications for injection reminders
- [ ] Calendar integration
- [ ] Apple Health / Google Fit integration

## 🧪 Testing & Quality

### Testing Improvements
- [ ] Add integration tests
- [ ] Implement E2E testing with Playwright
- [ ] Add performance benchmarks
- [ ] Create load testing suite
- [ ] Add visual regression testing

## 📚 Documentation

### Documentation Enhancements
- [ ] Add OpenAPI/Swagger documentation
- [ ] Create interactive API playground
- [ ] Add video tutorials
- [ ] Write deployment guide for different platforms
- [ ] Create contribution guidelines

## 🚀 DevOps

### Deployment & CI/CD
- [ ] Set up GitHub Actions for CI/CD
- [ ] Add automated dependency updates (Dependabot)
- [ ] Implement blue-green deployments
- [ ] Add staging environment
- [ ] Create Docker container option

## Priority Order (Suggested)

1. **High Priority**
   - Rate limiting (#2)
   - Health check endpoint (#13)
   - Strict TypeScript (#5)
   - Structured logging (#6)

2. **Medium Priority**
   - Template separation (#4)
   - Advanced validation (#8)
   - Error tracking (#13)
   - API versioning (#9)

3. **Low Priority**
   - Additional features
   - Mobile apps
   - Advanced analytics

## Notes

- Some features (like user accounts, history tracking) would require adding Cloudflare KV or D1 database
- Rate limiting can be implemented using Cloudflare's built-in features or custom logic with KV
- Consider user feedback before implementing complex features
- Keep the core calculator simple and fast while adding optional advanced features