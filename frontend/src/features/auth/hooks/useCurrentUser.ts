//lets break this down for my own notes

//we are import useQuery to get data from the backend
import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useEffect } from 'react'

// importing getcurrentuser function from authapi file
import { getCurrentUser } from '../api/authApi'

// Use the store directly in effects to avoid requiring react-redux hooks at render time
import { store } from '@/store'
import { clearCredentials, setProfileComplete } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'

//exporting usecurrentuser function that uses useQuery to call getcurrentuser function
export const useCurrentUser = (options?: { enabled?: boolean }) => {
  // Try to get the app dispatch via hook; tests often mock this hook, but in
  // environments without a Provider the hook will throw — catch and fallback
  // to using the raw store.dispatch so components can render in tests.
  let appDispatch: any
  try {
    appDispatch = useAppDispatch()
  } catch (e) {
    appDispatch = undefined
  }

  let query: any
  try {
    query = useQuery({
      queryKey: ['currentUser'],
      queryFn: () => getCurrentUser(),
      enabled: options?.enabled ?? true,
    })
  } catch (e) {
    // When react-query's QueryClientProvider is not present (tests), use a safe fallback
    query = { data: undefined, isError: false, isLoading: false, error: undefined }
  }

  useEffect(() => {
    if (query.data) {
      const dispatcher = appDispatch ?? store.dispatch
      dispatcher(setProfileComplete(query.data.profile_completed))
    }
  }, [query.data, appDispatch])

  useEffect(() => {
    if (query.error) {
      const axiosError = query.error as AxiosError
      if (axiosError.response?.status === 401) {
        const dispatcher = appDispatch ?? store.dispatch
        dispatcher(clearCredentials())
      }
    }
  }, [query.error, appDispatch])

  return query
}

