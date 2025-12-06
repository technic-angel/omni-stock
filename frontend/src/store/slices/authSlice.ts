/**
 * Auth Slice - Authentication State Management
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { tokenStore } from '../../shared/lib/tokenStore'

// Define the shape of auth state
interface AuthState {
  accessToken: string | null
  isAuthenticated: boolean
  profileCompleted: boolean
}

// Initialize from localStorage (persist login across refreshes)
const initialState: AuthState = {
  accessToken: tokenStore.getAccess(),
  isAuthenticated: Boolean(tokenStore.getAccess()),
  profileCompleted: false,
}

// Create the slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Called after successful login
    setCredentials: (state, action: PayloadAction<string>) => {
      state.accessToken = action.payload
      state.isAuthenticated = true
      tokenStore.setAccess(action.payload)
    },
    // Called after profile completion/status refresh
    setProfileComplete: (state, action: PayloadAction<boolean>) => {
      state.profileCompleted = action.payload
    },

    // Called on logout
    clearCredentials: (state) => {
      state.accessToken = null
      state.isAuthenticated = false
      state.profileCompleted = false
      tokenStore.clear()
    },
  },
})



// Export actions and reducer
export const { setCredentials, setProfileComplete, clearCredentials } = authSlice.actions
export default authSlice.reducer
