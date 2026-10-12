// Listing Service (To be implemented in Prompt 13)
export const listingService = {
  getListings: async (_params?: unknown) => {
    // GET /listings
  },
  getListingById: async (_id: string) => {
    // GET /listings/:id
  },
  createListing: async (_data: unknown) => {
    // POST /listings
  },
  updateListing: async (_id: string, _data: unknown) => {
    // PUT /listings/:id
  },
  deleteListing: async (_id: string) => {
    // DELETE /listings/:id
  },
  getMyListings: async (_params?: unknown) => {
    // GET /listings/my
  },
};
