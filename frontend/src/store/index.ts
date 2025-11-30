/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'

// Create the store
export const store = configureStore({
  reducer: {
    auth: authReducer,
  }
})

// Export TypeScript types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch


