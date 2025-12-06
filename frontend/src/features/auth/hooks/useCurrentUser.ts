//lets break this down for my own notes

//we are import useQuery to get data from the backend
import { useQuery } from '@tanstack/react-query'

//importing getcurrentuser function from authapi file
import { getCurrentUser } from '../api/authApi'

//importing useappdispatch to dispatch actions to the redux store
import { useAppDispatch } from '@/store/hooks'
import { setProfileComplete } from '@/store/slices/authSlice'

//exporting usecurrentuser function that uses useQuery to call getcurrentuser function
export const useCurrentUser = (options?: { enabled?: boolean }) => {
  //declare dispatch variable to use redux dispatch
  const dispatch = useAppDispatch()

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(),
    enabled: options?.enabled ?? true,
    onSuccess: (data) => {
      //dispatch action to set profile completion status in redux store
      dispatch(setProfileComplete(data.profile_completed))
    },
  })
}
 
