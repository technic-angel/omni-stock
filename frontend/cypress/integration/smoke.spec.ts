// Cypress smoke test skeleton for omni-stock
// Adjust selectors (data-cy attributes) to match your app's components.
// This file is a minimal end-to-end smoke flow: register -> login -> create -> list -> delete

describe('Omni-Stock smoke flow', () => {
  const user = {
    email: `e2e_test_user+${Date.now()}@example.com`,
    password: 'TestPass123!',
  }

  before(() => {
    // If you have an API to clean test accounts, call it here.
    // cy.request('POST', '/test/cleanup')
  })

  it('registers a new user', () => {
    cy.visit('/')
    // Click the register link — change the selector to match your app
    cy.get('[data-cy=nav-register]').click()

    cy.get('[data-cy=register-email]').type(user.email)
    cy.get('[data-cy=register-password]').type(user.password)
    cy.get('[data-cy=register-submit]').click()

    // Expect to be redirected or see a success message / login link
    cy.contains(/welcome|verify|logged in|account created/i)

    // For apps that auto-login after register, assert an auth indicator is visible
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy=nav-logout]').length) {
        cy.get('[data-cy=nav-logout]').should('be.visible')
      }
    })
  })

  it('logs in and creates a collectible', () => {
    cy.visit('/')
    cy.get('[data-cy=nav-login]').click()

    cy.get('[data-cy=login-email]').type(user.email)
    cy.get('[data-cy=login-password]').type(user.password)
    cy.get('[data-cy=login-submit]').click()

    // Wait for successful login and navigate to create page or open modal
    cy.get('[data-cy=create-collectible-button]').click()

    // Fill in create form — adjust fields as required
    cy.get('[data-cy=collectible-name]').type('Cypress Test Card')
    cy.get('[data-cy=collectible-sku]').type(`SKU-${Date.now()}`)
    cy.get('[data-cy=collectible-submit]').click()

    // Verify the new item appears in the list
    cy.get('[data-cy=collectible-list]').should('contain', 'Cypress Test Card')
  })

  it('deletes the created collectible', () => {
    // Assumes user is still logged in from previous step or performs login here
    cy.visit('/')
    // Find the item and click delete — selector strategy depends on your markup
    cy.get('[data-cy=collectible-list]')
      .contains('Cypress Test Card')
      .parents('[data-cy=collectible-row]')
      .within(() => {
        cy.get('[data-cy=collectible-delete]').click()
      })

    // Confirm deletion in modal if present
    cy.get('body').then(($body) => {
      if ($body.find('[data-cy=confirm-delete]').length) {
        cy.get('[data-cy=confirm-delete]').click()
      }
    })

    // Assert the item no longer appears
    cy.get('[data-cy=collectible-list]').should('not.contain', 'Cypress Test Card')
  })
})
