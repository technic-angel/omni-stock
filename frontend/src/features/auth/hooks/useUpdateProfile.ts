import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProfile, type UpdateProfilePayload } from "../api/authApi";

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: UpdateProfilePayload) => updateProfile(payload),
        onSuccess: (data) => {
            // Invalidate and refetch current user data after profile update
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
        },
    });
}