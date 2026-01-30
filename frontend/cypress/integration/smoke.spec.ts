// Cypress smoke test skeleton for omni-stock
// Adjust selectors (data-cy attributes) to match your app's components.
// This file is a minimal end-to-end smoke flow: register -> login -> create -> list -> delete

describe('Omni-Stock smoke flow', () => {
  const timestamp = Date.now()
  const user = {
    email: `e2e_test_${timestamp}@example.com`,
    password: 'TestPass123!',
    username: `user_${timestamp}`,
    firstName: 'Cypress',
    lastName: 'TestUser',
    birthdate: '1990-01-01',
  }

  before(() => {
    // If you have an API to clean test accounts, call it here.
    // cy.request('POST', '/test/cleanup')
  })

  it('registers a new user', () => {
    cy.visit('/')
    // Click the register link — change the selector to match your app
    cy.get('[data-cy=nav-register]').click()

    // Step 1: Check Email
    cy.get('[data-cy=register-email]').type(user.email)
    cy.get('[data-cy=check-email-submit]').click()

    // Step 2: Fill Details (Wait for username field to appear)
    cy.get('[data-cy=register-username]').should('be.visible').type(user.username)
    cy.get('[data-cy=register-first-name]').type(user.firstName)
    cy.get('[data-cy=register-last-name]').type(user.lastName)
    cy.get('[data-cy=register-password]').type(user.password)
    cy.get('[data-cy=register-confirm-password]').type(user.password)
    cy.get('[data-cy=register-birthdate]').type(user.birthdate)
    
    cy.get('[data-cy=register-submit]').click()

    // Expect to be redirected or see a success message / login link
    // The app might redirect to dashboard or login
    cy.contains(/welcome|dashboard|total skus/i, { timeout: 10000 })
  })

  it('logs in, checks dashboard, creates, edits, and deletes a collectible', () => {
    // If registration logs us in automatically and redirects to dashboard, we might not need to login again.
    // But to be safe and test login flow, let's logout if we are logged in, or just valid login page.
    
    // Check if we are already logged in (redirected to dashboard)
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy=nav-logout]').length > 0) {
        cy.get('[data-cy=nav-logout]').click()
      }
    })

    cy.visit('/login')
    cy.get('[data-cy=login-email]').type(user.email)
    cy.get('[data-cy=login-password]').type(user.password)
    cy.get('[data-cy=login-submit]').click()

    // Dashboard check
    cy.contains('Dashboard', { timeout: 10000 }).should('be.visible')
    cy.contains('Total SKUs').should('be.visible')


    // Navigate to create page
    cy.visit('/inventory/new')

    // Fill in create form
    cy.get('[data-cy=add-item-store]').should('not.be.disabled')
    cy.get('[data-cy=add-item-name]').type('Cypress Test Card')
    cy.get('[data-cy=add-item-sku]').type(`SKU-${Date.now()}`)
    cy.get('[data-cy=add-item-submit]').click()

    // Verify list and item presence
    cy.url().should('include', '/inventory')
    cy.contains('Cypress Test Card').should('be.visible')

    // Edit the item
    cy.get('button[aria-label="Edit Cypress Test Card"]').click()
    cy.location('pathname').should('contain', '/edit')
    
    // Check edit form values
    cy.get('[data-cy=edit-item-name]').should('have.value', 'Cypress Test Card')
    
    // Update name
    cy.get('[data-cy=edit-item-name]').clear().type('Cypress Test Card Updated')
    cy.get('[data-cy=edit-item-submit]').click()

    // Verify update
    cy.location('pathname').should('eq', '/inventory')
    cy.contains('Cypress Test Card Updated').should('be.visible')
    cy.contains('Cypress Test Card').should('not.exist')

    // Delete the item
    cy.contains('Cypress Test Card Updated')
      .parents('tr')
      .within(() => {
        cy.get('button[aria-label="Delete Cypress Test Card Updated"]').click()
      })

    // Confirm deletion
    cy.get('[data-testid="confirm-dialog"]').should('be.visible').within(() => {
      cy.contains('button', 'Delete').click()
    })
    
    // Verify item is gone
    cy.get('[data-testid="confirm-dialog"]').should('not.exist')
    cy.contains('Cypress Test Card Updated').should('not.exist')
  })

  // it('deletes the created collectible', () => { ... }) // Merged into above.
})

