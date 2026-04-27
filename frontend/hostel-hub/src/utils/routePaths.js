export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FIND_HOSTELS: "/find-hostels",
  LISTING_DETAILS: (id = ":listingId") => `/listing/${id}`,
  SAVED_LISTINGS: "/saved-listings",
  RENTER_PROFILE: "/profile",
  RENTER_AGREEMENT_REVIEW: (inquiryId = ":inquiryId") =>
    `/renter/inquiries/${inquiryId}/agreement`,
  CHATS: "/chats",
  OWNER_DASHBOARD: "/owner-dashboard",
  OWNER_LISTING_DETAILS: (id = ":listingId") => `/owner-listings/${id}`,
  OWNER_INQUIRY_CONFIRM: (inquiryId = ":inquiryId") =>
    `/owner/inquiries/${inquiryId}/confirm`,
  POST_LISTING: "/post-listing",
  MANAGE_LISTINGS: "/manage-listings",
  INQUIRIES: "/inquiries",
  OWNER_PROFILE: "/owner-profile",
  OWNER_TEMPLATE_NEW: "/owner-profile/templates/new",
  OWNER_TEMPLATE_VIEW: (templateName = ":templateName") =>
    `/owner-profile/templates/${templateName}/view`,
  OWNER_TEMPLATE_CLAUSES: (templateName = ":templateName") =>
    `/owner-profile/templates/${templateName}/clauses`,
};
