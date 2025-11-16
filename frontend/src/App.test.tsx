import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Mock child components to avoid importing heavier runtime code that can
// cause duplicate React/runtime mismatches in the test environment.
vi.mock('./features/collectibles/CollectiblesList', () => ({
  default: () => <div role="main">Mock Collectibles</div>,
}));
vi.mock('./features/auth/LoginPage', () => ({
  default: ({ onLoggedIn }: any) => <div data-testid="login" onClick={() => onLoggedIn && onLoggedIn()}>Mock Login</div>,
}));
vi.mock('./features/auth/RegisterPage', () => ({
  default: ({ onRegistered }: any) => <div data-testid="register" onClick={() => onRegistered && onRegistered()}>Mock Register</div>,
}));

import App from './App';
import { Provider } from 'react-redux';
import store from './store';

describe('App', () => {
  it('renders the main application component', () => {
    render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });
});
