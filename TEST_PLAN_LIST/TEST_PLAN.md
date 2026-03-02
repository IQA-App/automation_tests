# Comprehensive Test Plan - Organized Test Suite

This document provides a complete overview of the automation test suite, organized by test categories and coverage areas. The suite is structured to support efficient test execution, maintenance, and reporting.

---

## Table of Contents

0. [Test Suite Organization](#0-test-suite-organization)
1. [Smoke Tests](#1-smoke-tests)
2. [Regression Tests](#2-regression-tests)
3. [Security Tests](#3-security-tests)
4. [Authorization Tests](#4-authorization-tests)
5. [Accessibility Tests](#5-accessibility-tests)
6. [Exploratory Tests](#6-exploratory-tests)
7. [Execution Strategies](#7-execution-strategies)
8. [Test Data and Configuration](#8-test-data-and-configuration)

---

# 0. Test Suite Organization

## Directory Structure

```
tests/
├── regression/           # Core functional tests
│   ├── api_smoke.spec.ts       # API smoke tests
│   ├── api_users.spec.ts       # User management tests
│   ├── api_orders.spec.ts      # Order/request management tests
│   ├── ui_smoke.spec.ts        # UI smoke tests
│   ├── ui_validation.spec.ts   # Form validation tests
│   ├── ui_integration.spec.ts  # API/UI integration tests
│   └── ui_boundary.spec.ts     # Boundary & edge case tests
├── security/             # Security-focused tests
│   ├── api_security.spec.ts    # API security tests
│   └── ui_security.spec.ts     # UI security tests
├── authorization/        # Authorization & permissions tests
│   └── api_authorization.spec.ts
├── accessibility/        # WCAG compliance tests
│   └── ui_accessibility.spec.ts
└── exploratory/          # Discovery & exploration tests
    └── discover_ui.spec.ts
```

## Test Categories

| Category | Purpose | Tag | Location |
|----------|---------|-----|----------|
| **Smoke** | Critical path validation | `@smoke` | `regression/*_smoke.spec.ts` |
| **Regression** | Full functional coverage | `@regression` | `regression/*.spec.ts` |
| **Security** | Security & data validation | `@security` | `security/*.spec.ts` |
| **Authorization** | Access control & permissions | `@authorization` | `authorization/*.spec.ts` |
| **Accessibility** | WCAG compliance | `@accessibility` | `accessibility/*.spec.ts` |
| **Exploratory** | Discovery & investigation | `@exploratory` | `exploratory/*.spec.ts` |

---

# 1. Smoke Tests

**Purpose:** Verify the system is alive and primary business flows work end-to-end.

**Characteristics:**
- Fast execution (< 2 minutes total)
- Stable and deterministic
- Business-critical paths only
- Run on every PR before merge

## Execution

**PowerShell (Windows) - QUOTES REQUIRED:**
```powershell
npx playwright test --grep "@smoke"
```

**Bash/Linux/Mac:**
```bash
npx playwright test --grep @smoke
```

---

## API Smoke Tests
**Source:** [tests/regression/api_smoke.spec.ts](tests/regression/api_smoke.spec.ts)

### Coverage
- API health and availability
- User lifecycle (create → login → session)
- Order lifecycle (create → read)
- Authentication flow

| Test ID | Test Name | Purpose |
|---------|-----------|---------|
| - | Health check API | Verify API is responsive |
| - | Create user through API | User registration works |
| - | Login user through API | Authentication works |
| 3.1 | Get current session with valid token | Protected endpoint access works |
| 5.1 | Create request with valid data | Order creation works |
| 6.1 | Get request by valid ID | Order retrieval works |

**Expected Runtime:** ~20-40 seconds (6 tests)

---

## UI Smoke Tests
**Source:** [tests/regression/ui_smoke.spec.ts](tests/regression/ui_smoke.spec.ts)

### Coverage
- Form rendering
- Successful submission flow
- Basic UI responsiveness

| Test Name | Purpose |
|-----------|---------|
| Submit valid request with standard data | Happy path submission |
| Form elements render correctly on load | Form renders correctly |

**Expected Runtime:** ~10-20 seconds (2 tests)

---

## Smoke Suite Execution Strategy

**CI/CD Integration:**
- **PR validation:** Smoke suite must pass before review
- **Merge gate:** Smoke + regression before merge to main
- **Post-deployment:** Smoke suite validates deployment health

**Total Expected Runtime:** ~30-90 seconds (8 tests total)

---

# 2. Regression Tests

**Purpose:** Comprehensive functional testing of all features and integrations.

**Tag:** `@regression`

**Execution:**
```powershell
npx playwright test --grep "@regression"
```

---

## 2.1 API User Management Tests
**Source:** [tests/regression/api_users.spec.ts](tests/regression/api_users.spec.ts)

### Coverage
- User creation and account management
- User authentication and login
- Session management
- Logout functionality
- User retrieval and deletion

### Test Scenarios

#### User Registration and Account Creation
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 2.1 | Create user with valid credentials | 201, user object and token returned |
| 2.2 | Missing email | 400 or 422 |
| 2.3 | Missing password | 400 or 422 |
| 2.4 | Invalid email format | 400 or 422 |
| 2.5 | Duplicate email | First: 201, Second: 409/400/422 |
| 2.6 | Empty email | 400 or 422 |
| 2.7 | Empty password | 201 (current behavior) |

#### User Authentication and Login
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 3.1 | Login with valid credentials | 200/201, token returned |
| 3.2 | Login with admin credentials | 401 or 404 |
| 3.3 | Non-existent email login | 401 or 404 |
| 3.4 | Incorrect password | 401 |
| 3.5 | Missing email on login | 400/401/422 |
| 3.6 | Missing password on login | 400/401/422 |

#### Session Management
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 4.1 | Session with valid token | 200 with matching id and email |
| 4.2 | Session without token | 404 |
| 4.3 | Session with invalid token | 404 |
| 4.4 | Session with malformed token | 404 |

#### Logout Functionality
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 5.1 | Logout with valid token | Status from EXPECTED_LOGOUT_STATUS_WITH_TOKEN (default 200) |
| 5.2 | Logout without token | Status from EXPECTED_LOGOUT_STATUS_WITHOUT_TOKEN (default 200) |

---

## 2.2 API Order/Request Management Tests
**Source:** [tests/regression/api_orders.spec.ts](tests/regression/api_orders.spec.ts)

### Coverage
- Request/Order creation
- Request retrieval (single and list)
- Request updates
- Request deletion
- Authorization checks

### Test Scenarios

#### Request Read Operations
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 6.1 | Get request by valid ID | 200, matching orderId and customerName |
| 6.2 | Get request with invalid ID | 404 |
| 6.3 | Get request without authentication | 401 or 404 |
| 6.4 | Get requests list | 200 with array body |

#### Request Create Operations
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 7.1 | Create request with valid data | 201, response contains orderId and customerName |
| 7.2 | Create request without authentication | 401 or 404 |
| 7.3 | Create request with invalid token | 401 or 404 |
| 7.4 | Create request with missing fields | 404 (legacy endpoint not available) |

#### Request Update Operations
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 8.1 | Update request with valid data | 404 (current behavior) |
| 8.2 | Update request with invalid ID | 404 |
| 8.3 | Update request without authentication | 401 or 404 |

#### Request Delete Operations
| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 9.1 | Delete request with valid ID | 404 (current behavior) |
| 9.2 | Delete request with invalid ID | 404 |
| 9.3 | Delete request without authentication | 401 or 404 |

---

## 2.3 UI Validation Tests
**Source:** [tests/regression/ui_validation.spec.ts](tests/regression/ui_validation.spec.ts)

### Coverage
- Form control rendering
- Required field validation
- Input validation rules
- Form state after validation errors
- Placeholder text

### Test Scenarios

#### Form Control Rendering
| Scenario | Expected Result |
|----------|-----------------|
| Renders all required form controls | Full Name input, Description input, and Submit button visible |
| Placeholder text is present | Placeholders exist for Full Name and Description |

#### Required Field Validation
| Scenario | Expected Result |
|----------|-----------------|
| Missing Full Name | Form remains visible, no success heading |
| Missing Project Description | Form remains visible, no success heading |
| Both fields filled | Submission accepted (with mocked success) |
| Fields editable after blocked submit | Form remains editable with entered values |

#### Input Length Validation
| Scenario | Expected Result |
|----------|-----------------|
| Very long description (5000 chars) | Submission accepted or appropriate error shown |

---

## 2.4 UI Integration Tests
**Source:** [tests/regression/ui_integration.spec.ts](tests/regression/ui_integration.spec.ts)

### Coverage
- API endpoint integration
- Request payload format
- Response handling (success/error)
- Form state persistence
- Data security (URL parameters)
- Keyboard navigation
- Rapid submission handling

### Test Scenarios

#### API Integration
| Scenario | Expected Result |
|----------|-----------------|
| API endpoint called correctly | POST request to /orders or /api/orders |
| Request payload format verification | Correct mapping of form fields to API payload |
| 201 response handling | Success UI shown, submit button hidden |
| 400 response handling | Error dialog shown, form preserved |

#### Form State & UX
| Scenario | Expected Result |
|----------|-----------------|
| Fields reset after refresh | Form fields empty after page reload |
| No sensitive data in URL | Entered values not exposed in URL |
| Tab navigation | Keyboard tab order works: Name → Email → Description |
| Multiple rapid submissions | Requests handled without spam (max 3 requests) |
| End-to-end submission flow | Complete flow from input to success |

---

## 2.5 UI Boundary Tests
**Source:** [tests/regression/ui_boundary.spec.ts](tests/regression/ui_boundary.spec.ts)

### Coverage
- Minimum and maximum input lengths
- Special characters handling
- Empty field handling
- Whitespace handling

### Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 3.2 | Maximum length input (255 chars for Full Name) | Accepted or appropriate error |
| - | Very long Full Name | Success UI or error dialog |
| - | Very long Project Description | Success UI or error dialog |
| - | Minimum data (single characters) | Form remains usable |
| - | Special characters in Full Name | Success, payload preserves characters |
| - | Numbers in Full Name | Success UI or error dialog |
| - | Whitespace handling | Success, payload includes name value |

---
# 3. Security Tests

**Purpose:** Validate security controls and protection against common attack vectors.

**Tag:** `@security`

**Execution:**
```powershell
npx playwright test --grep "@security"
```

---

## 3.1 API Security Tests
**Source:** [tests/security/api_security.spec.ts](tests/security/api_security.spec.ts)

### Coverage
- SQL injection protection
- XSS (Cross-Site Scripting) protection
- Input length validation
- Special character handling
- Email case sensitivity
- Error handling

### Test Scenarios

#### Data Validation & Edge Cases
| Scenario | Attack Vector | Expected Result |
|----------|---------------|-----------------|
| SQL injection in login email | `admin' OR '1'='1` | 400, 401, or 404 |
| XSS attempt in email creation | `<script>alert('xss')</script>@test.com` | 400 or 422 |
| Very long email string | 1000+ character email | 400, 413, or 422 |
| Special characters in email | `user+test_123@domain.co.uk` | 200 or 201 (valid) |
| Case sensitivity in email login | Uppercase variant of created email | 401 or 404 |

#### Error Handling & Responses
| Scenario | Expected Result |
|----------|-----------------|
| Non-existent endpoint | 404 |
| Invalid HTTP method | 405, 404, or 400 |

---

## 3.2 UI Security Tests
**Source:** [tests/security/ui_security.spec.ts](tests/security/ui_security.spec.ts)

### Coverage
- HTML/Script tag injection
- SQL injection patterns
- XSS protection in form inputs
- Secure data handling

### Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 4.3 | HTML/Script tags (XSS check) | Success UI shown, no XSS dialogs triggered |
| 4.4 | SQL injection patterns | Success UI shown, payload preserves as plain text |

---

# 4. Authorization Tests

**Purpose:** Validate access control and permission boundaries.

**Tag:** `@authorization`

**Execution:**
```powershell
npx playwright test --grep "@authorization"
```

---

## 4.1 API Authorization Tests
**Source:** [tests/authorization/api_authorization.spec.ts](tests/authorization/api_authorization.spec.ts)

### Coverage
- Cross-user access control
- Resource ownership validation
- Token-based authorization

### Test Scenarios

| Scenario | Steps | Expected Result |
|----------|-------|-----------------|
| User cannot access other user's request | 1. User A creates request<br>2. User B attempts to access User A's request | 403 or 404 - Access denied |

**Success Criteria:** Access is denied for non-owner  
**Failure Conditions:** User B can access User A's resource

---
# 5. Accessibility Tests

**Purpose:** Validate WCAG compliance and accessibility standards.

**Tag:** `@accessibility`

**Execution:**
```powershell
npx playwright test --grep "@accessibility"
```

---

## 5.1 UI Accessibility Tests
**Source:** [tests/accessibility/ui_accessibility.spec.ts](tests/accessibility/ui_accessibility.spec.ts)

### Coverage
- WCAG compliance
- Form label visibility
- Required field indicators
- Keyboard navigation

### Test Scenarios

| Test ID | Scenario | Expected Result |
|---------|----------|-----------------|
| 9.1 | Form fields have visible labels | Full Name and Description labels are visible |
| 9.2 | Required field indicators are present | Required marker (*) appears on labels |
| 9.3 | Form is keyboard accessible | Full keyboard navigation works: Name → Email → Description |

**Success Criteria:**
- All form fields have visible, associated labels
- Required fields are clearly marked
- Complete keyboard navigation without mouse

---

# 6. Exploratory Tests

**Purpose:** Discovery, investigation, and understanding of application behavior.

**Tag:** `@exploratory`

**Execution:**
```powershell
npx playwright test --grep "@exploratory"
```

---

## 6.1 UI Discovery Tests
**Source:** [tests/exploratory/discover_ui.spec.ts](tests/exploratory/discover_ui.spec.ts)

### Coverage
- UI state inspection
- Success/error response behavior observation
- Dialog message capture
- Element discovery and logging

### Test Scenarios

| Scenario | Purpose |
|----------|---------|
| UI state after successful submission (mocked 201) | Capture and log UI state, success elements, and button visibility |
| UI state after failed submission (mocked 400) | Capture and log UI state and dialog messages |

**Note:** These tests are primarily for exploration and documentation of UI behavior rather than strict assertions.

---

# 7. Execution Strategies

## 7.1 Running Tests by Category

### Run All Tests
```powershell
npx playwright test
```

### Run by Tag
```powershell
# Smoke tests only
npx playwright test --grep "@smoke"

# Regression tests
npx playwright test --grep "@regression"

# Security tests
npx playwright test --grep "@security"

# Authorization tests
npx playwright test --grep "@authorization"

# Accessibility tests
npx playwright test --grep "@accessibility"

# Exploratory tests
npx playwright test --grep "@exploratory"
```

### Run by Test Type
```powershell
# All API tests
npx playwright test tests/regression/api_*.spec.ts tests/security/api_*.spec.ts tests/authorization/api_*.spec.ts

# All UI tests
npx playwright test tests/regression/ui_*.spec.ts tests/security/ui_*.spec.ts tests/accessibility/ui_*.spec.ts
```

### Run by Directory
```powershell
# All regression tests
npx playwright test tests/regression/

# All security tests
npx playwright test tests/security/

# All authorization tests
npx playwright test tests/authorization/

# All accessibility tests
npx playwright test tests/accessibility/

# All exploratory tests
npx playwright test tests/exploratory/
```

## 7.2 Parallel Execution

```powershell
# Run with 4 workers
npx playwright test --workers=4

# Run smoke tests in parallel
npx playwright test --grep "@smoke" --workers=4
```

## 7.3 UI Mode (Interactive)

```powershell
# Run all tests in UI mode
npx playwright test --ui

# Run specific category in UI mode
npx playwright test --grep "@smoke" --ui
```

## 7.4 Debugging

```powershell
# Run with trace on first retry
npx playwright test --trace on-first-retry

# Run specific test with debug
npx playwright test --debug tests/regression/ui_smoke.spec.ts

# Show test output
npx playwright test --reporter=list
```

## 7.5 CI/CD Execution Strategy

### Pull Request Validation
```powershell
# Fast feedback - smoke tests only
npx playwright test --grep "@smoke" --workers=4
```

### Pre-Merge Validation
```powershell
# Comprehensive - smoke + regression
npx playwright test --grep "@smoke|@regression" --workers=4
```

### Nightly/Full Suite
```powershell
# Everything including security, authorization, accessibility
npx playwright test --workers=4
```

### Post-Deployment Verification
```powershell
# Smoke + critical security checks
npx playwright test --grep "@smoke" --workers=4
npx playwright test tests/security/ --workers=2
```

---


# 8. Test Data and Configuration

## 8.1 Test Data Sources

### Primary Test Data File
**Location:** [testData.ts](testData.ts)

Contains:
- API endpoint configurations
- UI element selectors and expected messages
- Request submission test data
- Environment-specific configurations

### Dynamic Test Data
**Location:** [helpers/faker.ts](helpers/faker.ts)

Generates:
- Unique email addresses
- Random user data
- Timestamp-based unique identifiers

## 8.2 Environment Configuration

### API Configuration
- **API_URL**: Base API URL
- **SESSION_ENDPOINT_MODE**: Session endpoint variant
- **LOGOUT_ENDPOINT_MODE**: Logout endpoint variant
- **EXPECTED_LOGOUT_STATUS_WITH_TOKEN**: Expected status code (default: 200)
- **EXPECTED_LOGOUT_STATUS_WITHOUT_TOKEN**: Expected status code (default: 200)

### Test Configuration
**Location:** [playwright.config.ts](playwright.config.ts)

Defines:
- Browser configurations
- Base URL settings
- Timeout values
- Reporter configurations
- Parallel execution settings

## 8.3 Supporting Files

### Page Objects
**Location:** [pages/RequestSubmissionPage.ts](pages/RequestSubmissionPage.ts)

Encapsulates:
- UI element locators
- Page interaction methods
- Form submission logic

### API Helpers
**Location:** [helpers/apiCalls.ts](helpers/apiCalls.ts)

Provides:
- Reusable API call functions
- Authentication helpers
- Request/response handling utilities

### Email Testing
**Location:** [helpers/getEmailContentApi.ts](helpers/getEmailContentApi.ts)

Supports:
- Email verification tests (when enabled)
- Inbox API integrations

## 8.4 Test Assumptions

1. **Starting State**: Tests assume a blank/fresh state for each scenario
2. **Data Isolation**: Unique email addresses are generated dynamically to ensure test isolation
3. **Password Format**: Unless specified, valid password is `ValidPassword123!`
4. **API Response Times**: Tests include appropriate waits for API responses
5. **Browser State**: Each test starts with a clean browser context

## 8.5 Preconditions

### For All Tests
- Playwright environment is configured and dependencies installed
- Application is reachable via configured base URL
- Test data file ([testData.ts](testData.ts)) is properly configured

### For API Tests
- API endpoints are accessible
- Required environment variables are set (if using non-default values)

### For UI Tests
- Request submission page is accessible
- Page object model is up to date with current UI structure

---

## Document Information

**Created:** February 22, 2026  
**Last Updated:** February 22, 2026

**Purpose:** Comprehensive test plan for organized automation test suite

**Test Suite Structure Version:** 2.0 (Reorganized)

---

## Completion Criteria

The test suite is considered complete and passing when:

1. **Smoke Tests**: All smoke tests pass in < 2 minutes
2. **Regression Tests**: All regression tests pass with expected results
3. **Security Tests**: All security validations confirm proper input handling
4. **Authorization Tests**: Access control boundaries are enforced
5. **Accessibility Tests**: WCAG compliance requirements are met
6. **Exploratory Tests**: Discovery tests document current behavior

---

## Traceability Matrix

| Test Category | Source Files | Helper Files | Test Data |
|---------------|--------------|--------------|-----------|
| **Smoke** | `regression/*_smoke.spec.ts` | `apiCalls.ts`, `RequestSubmissionPage.ts` | `testData.ts` |
| **Regression - API** | `regression/api_*.spec.ts` | `apiCalls.ts`, `faker.ts` | `testData.ts` |
| **Regression - UI** | `regression/ui_*.spec.ts` | `RequestSubmissionPage.ts` | `testData.ts` |
| **Security** | `security/*.spec.ts` | `apiCalls.ts`, `faker.ts` | `testData.ts` |
| **Authorization** | `authorization/*.spec.ts` | `apiCalls.ts`, `faker.ts` | `testData.ts` |
| **Accessibility** | `accessibility/*.spec.ts` | `RequestSubmissionPage.ts` | `testData.ts` |
| **Exploratory** | `exploratory/*.spec.ts` | `RequestSubmissionPage.ts` | `testData.ts` |

---

## Reporting and Metrics

### Test Execution Reports
- HTML Report: `playwright-report/index.html`
- Test Results: `test-results/`

### Key Metrics
- **Total Test Count**: ~50+ tests
- **Smoke Test Count**: 8 tests
- **Expected Smoke Runtime**: < 2 minutes
- **Expected Full Suite Runtime**: 5-10 minutes (with parallelization)

### Success Criteria
- All smoke tests: 100% pass rate
- Regression tests: ≥95% pass rate
- Security tests: 100% pass rate
- Authorization tests: 100% pass rate
- Accessibility tests: 100% pass rate
