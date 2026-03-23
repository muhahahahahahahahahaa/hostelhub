export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FIND_HOSTELS: "/find-hostels",
  LISTING_DETAILS: (id = ":listingId") => `/listing/${id}`,
  SAVED_LISTINGS: "/saved-listings",
  RENTER_PROFILE: "/profile",
  OWNER_DASHBOARD: "/owner-dashboard",
  POST_LISTING: "/post-listing",
  MANAGE_LISTINGS: "/manage-listings",
  INQUIRIES: "/inquiries",
  OWNER_PROFILE: "/owner-profile",
};
