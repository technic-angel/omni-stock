//lets break this down for my own notes

//we are import useQuery to get data from the backend
import { useQuery } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { useEffect } from 'react'

// importing getcurrentuser function from authapi file
import { getCurrentUser } from '../api/authApi'

// Use the store directly in effects to avoid requiring react-redux hooks at render time
import { clearCredentials, setProfileComplete } from '@/store/slices/authSlice'
import { useAppDispatch } from '@/store/hooks'

//exporting usecurrentuser function that uses useQuery to call getcurrentuser function
export const useCurrentUser = (options?: { enabled?: boolean }) => {
  const dispatch = useAppDispatch()

  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    enabled: options?.enabled ?? true,
  })

  useEffect(() => {
    if (query.data) {
      dispatch(setProfileComplete(query.data.profile_completed))
    }
  }, [query.data, dispatch])

  useEffect(() => {
    if (query.error) {
      const axiosError = query.error as AxiosError
      if (axiosError.response?.status === 401) {
        dispatch(clearCredentials())
      }
    }
  }, [query.error, dispatch])

  return query
}
