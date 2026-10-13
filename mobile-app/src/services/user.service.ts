import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import type { PublicUser, User } from '@/types/user.types';

export interface UpdateProfileBody {
  displayName?: string;
  /** Device push token — the backend keeps a list of them */
  fcmToken?: string;
}

export const userService = {
  /** GET /users/me */
  getMe: () => apiClient.get<User>(ENDPOINTS.USER.ME),

  /** PUT /users/me — returns the updated user. HTML is stripped by the server. */
  updateMe: (body: UpdateProfileBody) => apiClient.put<User>(ENDPOINTS.USER.ME, body),

  /** DELETE /users/me — soft delete; the backend revokes ALL tokens immediately */
  deleteMe: () => apiClient.delete<unknown>(ENDPOINTS.USER.ME),

  /** GET /users/:id — public profile */
  getUser: (id: string) => apiClient.get<PublicUser>(ENDPOINTS.USER.BY_ID(id)),
};

export default userService;
