# Test Organization

This directory contains comprehensive test coverage for the Omni-Stock backend.

## Structure

```
tests/
├── api/                    # API endpoint tests
│   ├── test_api_security.py       # Auth, permissions, validation
│   ├── test_card_details_api.py   # Card-specific endpoints
│   ├── test_vendor_permissions.py # Multi-tenant isolation
│   └── test_viewsets.py           # CRUD operations
├── models/                 # Model layer tests
├── selectors/             # Read operation tests
├── services/              # Business logic tests
└── factories.py           # Test data factories

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=. --cov-report=term-missing

# Run specific test file
pytest inventory/tests/api/test_api_security.py

# Run specific test class
pytest inventory/tests/api/test_api_security.py::TestVendorIsolation

# Run with verbose output
pytest -v
```

## Test Categories

### API Tests
- **Authentication**: Verifies all endpoints require valid JWT tokens
- **Authorization**: Tests vendor-scoped access control
- **Validation**: Input validation and error handling
- **Status Codes**: HTTP response correctness

### Service Tests
- Business logic validation
- Transaction handling
- Error scenarios

### Selector Tests
- Query optimization
- Data filtering
- Vendor scoping

## Coverage Goals

- Maintain >85% code coverage
- Critical paths at 100%
- All API endpoints tested
- All services tested
