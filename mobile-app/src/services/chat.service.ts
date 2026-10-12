// Chat Service (To be implemented in Prompt 27)
export const chatService = {
  getRooms: async () => {
    // GET /chat/rooms
  },
  getRoomMessages: async (_roomId: string, _params?: unknown) => {
    // GET /chat/rooms/:roomId/messages
  },
  startRoom: async (_targetUserId: string, _listingId?: string) => {
    // POST /chat/rooms
  },
};
