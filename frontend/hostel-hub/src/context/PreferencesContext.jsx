import { createContext, useContext, useEffect, useMemo, useState } from "react";

const PreferencesContext = createContext(null);

const LANGUAGE_STORAGE_KEY = "hostelhub-language";
const THEME_STORAGE_KEY = "hostelhub-theme";

// eslint-disable-next-line react-refresh/only-export-components
export const UI_TEXT = {
  dashboard: { mn: "Самбар", en: "Dashboard" },
  findHostels: { mn: "Хостел хайх", en: "Find hostels" },
  ownerArea: { mn: "Түрээслүүлэгчийн хэсэг", en: "Owner area" },
  login: { mn: "Нэвтрэх", en: "Log in" },
  signup: { mn: "Бүртгүүлэх", en: "Sign up" },
  greeting: { mn: "Сайн байна уу", en: "Hello" },
  welcome: { mn: "Тавтай морилно уу!", en: "Welcome!" },
  ownerOverview: {
    mn: "Таны хостелийн заруудын өнөөдрийн мэдээлэл энд харагдана.",
    en: "Today's overview for your hostel listings is shown here.",
  },
  notifications: { mn: "Мэдэгдэл", en: "Notifications" },
  messages: { mn: "Чат", en: "Messages" },
  savedListings: { mn: "Хадгалсан зар", en: "Saved listings" },
  viewProfile: { mn: "Профайл харах", en: "View profile" },
  logout: { mn: "Гарах", en: "Log out" },
  ownerDashboard: { mn: "Самбар", en: "Dashboard" },
  postListing: { mn: "Зар оруулах", en: "Post listing" },
  manageListings: { mn: "Зараа удирдах", en: "Manage listings" },
  chats: { mn: "Чат", en: "Chats" },
  inquiries: { mn: "Хүсэлтүүд", en: "Inquiries" },
  ownerProfile: { mn: "Хостелийн профайл", en: "Hostel profile" },
  rentalRevenue: { mn: "Түрээсийн орлого", en: "Rental revenue" },
  wallet: { mn: "Wallet", en: "Wallet" },
  availableToWithdraw: { mn: "Татах боломжтой үлдэгдэл", en: "Available to withdraw" },
  pendingRevenue: { mn: "Хүлээгдэж буй орлого", en: "Pending revenue" },
  totalRevenue: { mn: "Нийт орлого", en: "Total revenue" },
  withdraw: { mn: "Орлого татах", en: "Withdraw" },
  withdrawRequested: { mn: "Татах хүсэлт илгээгдлээ.", en: "Withdrawal request sent." },
  noRevenue: { mn: "Одоогоор төлөгдсөн түрээсийн орлого алга.", en: "No paid rental revenue yet." },
  recentPayments: { mn: "Сүүлийн төлбөрүүд", en: "Recent payments" },
  paidBookings: { mn: "төлөгдсөн захиалга", en: "paid bookings" },
  pendingBookings: { mn: "хүлээгдэж буй төлбөр", en: "pending payments" },
  language: { mn: "Хэл", en: "Language" },
  switchToEnglish: { mn: "Англи хэл рүү солих", en: "Switch to English" },
  switchToMongolian: { mn: "Монгол хэл рүү солих", en: "Switch to Mongolian" },
  darkMode: { mn: "Харанхуй горим", en: "Dark mode" },
  lightMode: { mn: "Гэрэлтэй горим", en: "Light mode" },
  openChat: { mn: "Чат нээх", en: "Open chat" },
  listing: { mn: "Зар", en: "Listing" },
  hostelOwner: { mn: "Хостелийн эзэмшигч", en: "Hostel owner" },
  beds: { mn: "ор", en: "beds" },
  noData: { mn: "Мэдээлэлгүй", en: "No data" },
  perDay: { mn: "өдөр", en: "day" },
  deposit: { mn: "Барьцаа", en: "Deposit" },
  available: { mn: "Боломжтой", en: "Available" },
  now: { mn: "Одоо", en: "Now" },
  openEnded: { mn: "Нээлттэй", en: "Open-ended" },
  inquirySent: { mn: "Захиалгын хүсэлт илгээгдсэн", en: "Inquiry sent" },
  sendInquiry: { mn: "Захиалах хүсэлт илгээх", en: "Send inquiry" },
  activeListings: { mn: "Идэвхтэй зар", en: "Active listings" },
  totalInquiries: { mn: "Нийт хүсэлт", en: "Total inquiries" },
  confirmedInquiries: { mn: "Баталгаажсан хүсэлт", en: "Confirmed inquiries" },
  chatConversations: { mn: "Чатын яриа", en: "Chat conversations" },
  unread: { mn: "уншаагүй", en: "unread" },
  viewAll: { mn: "Бүгдийг харах", en: "View all" },
  recentListings: { mn: "Сүүлийн зарууд", en: "Recent listings" },
  recentListingsSubtitle: {
    mn: "Таны хамгийн шинэ хостелийн зарууд",
    en: "Your newest hostel listings",
  },
  recentInquiries: { mn: "Сүүлийн хүсэлтүүд", en: "Recent inquiries" },
  recentInquiriesSubtitle: {
    mn: "Түрээслэгчийн хамгийн шинэ идэвх",
    en: "Latest renter activity",
  },
  recentChats: { mn: "Сүүлийн чатууд", en: "Recent chats" },
  recentChatsSubtitle: {
    mn: "Түрээслэгчийн мессежийг харж шууд хариулах",
    en: "Review renter messages and reply quickly",
  },
  noRenterChats: {
    mn: "Одоогоор түрээслэгчийн чат алга.",
    en: "No renter chats yet.",
  },
  quickActions: { mn: "Шуурхай үйлдэл", en: "Quick actions" },
  ownerCommonTasks: {
    mn: "Эзэмшигчийн түгээмэл ажлууд",
    en: "Common owner tasks",
  },
  viewInquiries: { mn: "Хүсэлтүүд харах", en: "View inquiries" },
  openChatAction: { mn: "Чат нээх", en: "Open chat" },
  failedOpenInquiry: {
    mn: "Хүсэлтийг нээж чадсангүй.",
    en: "Failed to open inquiry.",
  },
  failedOpenChat: {
    mn: "Чатыг нээж чадсангүй.",
    en: "Failed to open chat.",
  },
  active: { mn: "Идэвхтэй", en: "Active" },
  closed: { mn: "Хаалттай", en: "Closed" },
  new: { mn: "шинэ", en: "new" },
  fromListingChat: { mn: "зараас ирсэн чат", en: "chat from listing" },
  noMessagesYet: { mn: "Одоогоор мессеж алга", en: "No messages yet" },
  listingInquiry: { mn: "зарын хүсэлт", en: "listing inquiry" },
  ownerFallback: { mn: "Эзэмшигч", en: "Owner" },
  unknownUser: { mn: "Тодорхойгүй хэрэглэгч", en: "Unknown user" },
  thisListing: { mn: "энэ зар", en: "this listing" },
  startChatAboutListing: {
    mn: "талаар чат эхлүүлэх",
    en: "Start a chat about",
  },
  listingTitle: { mn: "Зарын гарчиг", en: "Listing title" },
  location: { mn: "Байршил", en: "Location" },
  category: { mn: "Хостелийн ангилал", en: "Hostel category" },
  roomType: { mn: "Өрөөний төрөл", en: "Room type" },
  dailyRent: { mn: "Өдрийн түрээс", en: "Daily rent" },
  startDate: { mn: "Эхлэх өдөр", en: "Start date" },
  endDate: { mn: "Дуусах өдөр", en: "End date" },
  availableBeds: { mn: "Сул ор", en: "Available beds" },
  leaseTemplate: { mn: "Түрээсийн гэрээний загвар", en: "Lease agreement template" },
  listingImages: { mn: "Зарын зургууд", en: "Listing images" },
  amenities: { mn: "Тохижилт", en: "Amenities" },
  hostelDescription: { mn: "Хостелийн тайлбар", en: "Hostel description" },
  houseRules: { mn: "Дотоод дүрэм", en: "House rules" },
  preview: { mn: "Урьдчилж харах", en: "Preview" },
  cancel: { mn: "Болих", en: "Cancel" },
  edit: { mn: "Засах", en: "Edit" },
  delete: { mn: "Устгах", en: "Delete" },
  saveChanges: { mn: "Өөрчлөлт хадгалах", en: "Save changes" },
  saving: { mn: "Хадгалж байна...", en: "Saving..." },
  loadingListing: { mn: "Зар ачаалж байна...", en: "Loading listing..." },
  postNewListing: { mn: "Шинэ хостелийн зар оруулах", en: "Post new hostel listing" },
  editHostelListing: { mn: "Хостелийн зар засах", en: "Edit hostel listing" },
  listingFormIntro: {
    mn: "Түрээслэгчид ойлгомжтой зар нийтлэхийн тулд доорх мэдээллийг бөглөнө үү. Өрөө түрээслүүлэх боломжтой огнооны мужийг тодорхой тохируулж болно.",
    en: "Fill in the details below to publish a clear listing for renters. You can also set the available rental date range.",
  },
  addListing: { mn: "Зар нэмэх", en: "Add listing" },
  publishListing: { mn: "Зар нийтлэх", en: "Publish listing" },
  updateListing: { mn: "Зар шинэчлэх", en: "Update listing" },
  selectCategory: { mn: "Ангилал сонгох", en: "Select category" },
  selectRoomType: { mn: "Өрөөний төрөл сонгох", en: "Select room type" },
  optionalStartDate: { mn: "Заавал биш эхлэх өдөр.", en: "Optional start date." },
  optionalEndDate: { mn: "Заавал биш дуусах өдөр.", en: "Optional end date." },
  dailyRentHelper: { mn: "Нэг өдрийн үнийг оруулна уу.", en: "Enter the price per day." },
  previewAgreement: { mn: "Гэрээ урьдчилж харах", en: "Preview agreement" },
  closePreview: { mn: "Урьдчилсан харагдац хаах", en: "Close preview" },
  loadingPreview: { mn: "Урьдчилж харагдац ачаалж байна...", en: "Loading preview..." },
  chooseLeaseTemplate: {
    mn: "Түрээслэгчид энэ зар дээр харагдах гэрээний загварыг сонгоно уу.",
    en: "Choose the agreement template renters will see on this listing.",
  },
  imageLimitText: { mn: "6 хүртэл JPG эсвэл PNG зураг", en: "Up to 6 JPG or PNG images" },
  uploadImage: { mn: "Зураг оруулах", en: "Upload image" },
  uploading: { mn: "Оруулж байна...", en: "Uploading..." },
  listingImageAlt: { mn: "Зар", en: "Listing" },
  addListingPhotosHint: {
    mn: "Түрээслэгчид хурдан харьцуулахад туслах өрөө болон хостелийн зураг нэмнэ үү.",
    en: "Add room and hostel photos so renters can compare listings quickly.",
  },
  listingQualityTip: { mn: "Зарын чанарын зөвлөмж", en: "Listing quality tip" },
  listingQualityTipBody: {
    mn: "Өдрийн түрээс, боломжит хугацаа, сул ор, дүрэм тодорхой байвал түрээслэгчид хурдан харьцуулж шийдвэр гаргана.",
    en: "Clear daily rent, availability, beds, and rules help renters compare and decide faster.",
  },
  manageListingsTitle: { mn: "Зараа удирдах", en: "Manage listings" },
  manageListingsSubtitle: {
    mn: "Хостелийн зараа үүсгэх, засах, хаах, хүсэлтийн үзүүлэлтийг харах.",
    en: "Create, edit, close, and review inquiry metrics for your hostel listings.",
  },
  searchListings: { mn: "Зараас хайх...", en: "Search listings..." },
  allStatuses: { mn: "Бүх төлөв", en: "All statuses" },
  inactive: { mn: "Идэвхгүй", en: "Inactive" },
  listingsVisible: { mn: "зар харагдаж байна", en: "listings shown" },
  loadingListings: { mn: "Зарууд ачаалж байна...", en: "Loading listings..." },
  noListingsFound: { mn: "Зар олдсонгүй", en: "No listings found" },
  tryAnotherSearch: {
    mn: "Өөрөөр хайх эсвэл шинэ зар үүсгэнэ үү.",
    en: "Try another search or create a new listing.",
  },
  rent: { mn: "Түрээс", en: "Rent" },
  bedCount: { mn: "Ор", en: "Beds" },
  inquiryCount: { mn: "Хүсэлт", en: "Inquiries" },
  rating: { mn: "Үнэлгээ", en: "Rating" },
  reviews: { mn: "Үнэлгээ", en: "Reviews" },
  published: { mn: "Нийтэлсэн", en: "Published" },
  availableUntil: { mn: "Боломжтой хугацаа", en: "Available until" },
  expired: { mn: "Хугацаа дууссан", en: "Expired" },
  close: { mn: "Хаах", en: "Close" },
  reopen: { mn: "Дахин нээх", en: "Reopen" },
  inquiriesOverview: { mn: "Хүсэлтүүдийн тойм", en: "Inquiries overview" },
  inquiriesOverviewSubtitle: {
    mn: "Хостелийн зарууд дээр ирсэн түрээслэгчийн хүсэлтүүдийг хянана.",
    en: "Review renter inquiries received on your hostel listings.",
  },
  back: { mn: "Буцах", en: "Back" },
  filterByStatus: { mn: "Төлөвөөр шүүх", en: "Filter by status" },
  showSelectedStatuses: {
    mn: "Сонгосон төлөвтэй хүсэлтүүдийг харуулах",
    en: "Show inquiries with selected statuses",
  },
  loadingInquiries: { mn: "Хүсэлтүүд ачаалж байна...", en: "Loading inquiries..." },
  noInquiries: { mn: "Хүсэлт алга", en: "No inquiries" },
  noInquiriesSubtitle: {
    mn: "Шинэ түрээслэгчийн хүсэлт ирмэгц энд харагдана.",
    en: "New renter inquiries will appear here.",
  },
  noFilteredInquiries: {
    mn: "Энэ шүүлтүүрт тохирох хүсэлт алга",
    en: "No inquiries match this filter",
  },
  noFilteredInquiriesSubtitle: {
    mn: "Төлөвийн шүүлтүүрээс илүү олон төлөв сонгоод үзнэ үү.",
    en: "Select more statuses from the status filter.",
  },
  inquirySingular: { mn: "хүсэлт", en: "inquiries" },
  inquirySentAt: { mn: "Хүсэлт илгээсэн", en: "Inquiry sent" },
  viewInquiry: { mn: "Хүсэлт харах", en: "View inquiry" },
  statusUpdated: { mn: "Хүсэлтийн төлөв шинэчлэгдлээ", en: "Inquiry status updated" },
  statusUpdateFailed: {
    mn: "Хүсэлтийн төлөв шинэчилж чадсангүй.",
    en: "Failed to update inquiry status.",
  },
  ownerProfileTitle: { mn: "Эзэмшигчийн профайл", en: "Owner profile" },
  editProfile: { mn: "Профайл засах", en: "Edit profile" },
  personalInfo: { mn: "Хувийн мэдээлэл", en: "Personal information" },
  hostelInfo: { mn: "Хостелийн мэдээлэл", en: "Hostel information" },
  hostelLogo: { mn: "Хостелийн лого", en: "Hostel logo" },
  profileImage: { mn: "Профайл зураг", en: "Profile photo" },
  hostelName: { mn: "Хостелийн нэр", en: "Hostel name" },
  hostelIntro: { mn: "Хостелийн танилцуулга", en: "Hostel introduction" },
  aboutHostel: { mn: "Хостелийн тухай", en: "About the hostel" },
  noHostelDescription: {
    mn: "Хостелийн тайлбар хараахан нэмээгүй байна.",
    en: "No hostel description has been added yet.",
  },
  leaseTemplates: { mn: "Түрээсийн гэрээний загварууд", en: "Lease agreement templates" },
  openDocxTemplate: { mn: "DOCX загвар нээх", en: "Open DOCX template" },
  viewTemplate: { mn: "Загвар харах", en: "View template" },
  noLeaseTemplates: {
    mn: "Одоогоор түрээсийн гэрээний загвар оруулаагүй байна.",
    en: "No lease agreement templates have been added yet.",
  },
  editOwnerProfile: { mn: "Эзэмшигчийн профайл засах", en: "Edit owner profile" },
  fullName: { mn: "Бүтэн нэр", en: "Full name" },
  emailAddress: { mn: "Имэйл хаяг", en: "Email address" },
  savedTemplates: { mn: "Хадгалсан загварууд", en: "Saved templates" },
  editTemplate: { mn: "Загвар засах", en: "Edit template" },
  noTemplatesYet: { mn: "Одоогоор загвар нэмээгүй байна.", en: "No templates added yet." },
  addNewTemplate: { mn: "Шинэ загвар нэмэх", en: "Add new template" },
  noConversations: { mn: "Одоогоор яриа алга", en: "No conversations yet" },
  noMatchingChats: { mn: "Тохирох чат алга", en: "No matching chats" },
  ownerChatEmpty: {
    mn: "Түрээслэгч чат эхлүүлмэгц мессежүүд энд харагдана.",
    en: "Messages will appear here when a renter starts a chat.",
  },
  renterChatEmpty: {
    mn: "Хостелийн зараас чат эхлүүлбэл яриа энд харагдана.",
    en: "Start a chat from a hostel listing and conversations will appear here.",
  },
  chatSearchEmpty: {
    mn: "Өөр нэр, зар эсвэл мессежийн түлхүүр үгээр хайж үзнэ үү.",
    en: "Try searching by another name, listing, or message keyword.",
  },
  hostelListing: { mn: "Хостелийн зар", en: "Hostel listing" },
  chooseListingOrConversation: {
    mn: "Чат эхлүүлэхийн тулд зар эсвэл яриа сонгоно уу.",
    en: "Select a listing or conversation to start chatting.",
  },
  typeMessage: { mn: "Мессеж бичих", en: "Type a message" },
  backToChats: { mn: "Чатууд руу буцах", en: "Back to chats" },
  renter: { mn: "Түрээслэгч", en: "Renter" },
  viewListing: { mn: "Зар харах", en: "View listing" },
  loadingConversation: { mn: "Яриа ачаалж байна...", en: "Loading conversation..." },
  leasePdf: { mn: "Гэрээний PDF", en: "Agreement PDF" },
  openPdf: { mn: "PDF нээх", en: "Open PDF" },
  jumpToLatest: { mn: "Сүүлийн мессеж рүү очих", en: "Jump to latest message" },
  initialMessageHint: {
    mn: "Энд анхны мессежээ бичнэ үү. Захиалгын хүсэлт илгээхээсээ өмнө сул ор, дүрэм, барьцаа болон бусад зүйлсийг асуугаарай.",
    en: "Write your first message here. Ask about beds, rules, deposit, and other details before sending an inquiry.",
  },
  selectConversation: { mn: "Яриа сонгоно уу", en: "Select a conversation" },
  selectConversationHint: {
    mn: "Зүүн талаас яриа сонгоод Messenger маягийн чат дотор үргэлжлүүлнэ үү.",
    en: "Select a conversation from the left and continue in the chat view.",
  },
  conversationCount: { mn: "яриа", en: "conversations" },
  searchChats: { mn: "Чатаас хайх", en: "Search chats" },
  messageSendFailed: { mn: "Мессеж илгээж чадсангүй.", en: "Failed to send message." },
  selectChatFirst: { mn: "Эхлээд чат сонгоно уу.", en: "Select a chat first." },
  renterInquiry: { mn: "Түрээслэгчийн хүсэлт", en: "Renter inquiry" },
  backgroundDocument: { mn: "Шалгалтын баримт", en: "Background document" },
  openUploadedDocument: { mn: "Оруулсан баримтыг нээх", en: "Open uploaded document" },
  noDocumentUploaded: { mn: "Баримт оруулаагүй байна.", en: "No document uploaded." },
  inquiryDetails: { mn: "Хүсэлтийн мэдээлэл", en: "Inquiry details" },
  status: { mn: "Төлөв", en: "Status" },
  inquiryDate: { mn: "Хүсэлтийн огноо", en: "Inquiry date" },
  changeInquiryStatus: { mn: "Хүсэлтийн төлөв өөрчлөх", en: "Change inquiry status" },
  updatingStatus: { mn: "Төлөв шинэчилж байна...", en: "Updating status..." },
  findHostelsTitle: { mn: "Хостел хайх", en: "Find hostels" },
  findHostelsSubtitle: {
    mn: "Байршил, өрөөний төрөл, төсвөөр шүүнэ",
    en: "Filter by location, room type, and budget",
  },
  searchKeywordPlaceholder: {
    mn: "Хостелийн нэр, тохижилт эсвэл түлхүүр үг",
    en: "Hostel name, amenity, or keyword",
  },
  search: { mn: "Хайх", en: "Search" },
  listingFilters: { mn: "Зарын шүүлтүүр", en: "Listing filters" },
  total: { mn: "Нийт", en: "Total" },
  noListingsMatch: { mn: "Зар олдсонгүй", en: "No listings found" },
  adjustFilters: {
    mn: "Шүүлтүүрээ өөрчлөөд дахин хайж үзнэ үү.",
    en: "Adjust your filters and search again.",
  },
  listingsLoadFailed: {
    mn: "Заруудыг ачаалж чадсангүй. Дахин оролдоно уу.",
    en: "Failed to load listings. Please try again.",
  },
  rentersOnlySave: {
    mn: "Зөвхөн түрээслэгч бүртгэл зар хадгалах боломжтой.",
    en: "Only renter accounts can save listings.",
  },
  listingUnsaved: {
    mn: "Зарыг хадгалсан жагсаалтаас хаслаа.",
    en: "Listing removed from saved list.",
  },
  listingSaved: { mn: "Зарыг хадгаллаа.", en: "Listing saved." },
  savedListingsUpdateFailed: {
    mn: "Хадгалсан заруудыг шинэчилж чадсангүй.",
    en: "Failed to update saved listings.",
  },
  rentedCount: { mn: "түрээсэлсэн", en: "rented" },
  closedListing: { mn: "Хаалттай", en: "Closed" },
  viewListings: { mn: "Зарууд харах", en: "View listings" },
  noListingImages: { mn: "Зарын зураг алга", en: "No listing images available" },
  listingClosed: { mn: "Зар хаалттай", en: "Listing closed" },
  next: { mn: "Дараах", en: "Next" },
  loginToContinue: {
    mn: "Үргэлжлүүлэхийн тулд нэвтэрнэ үү",
    en: "Log in to continue",
  },
  reviewsAndComments: { mn: "Үнэлгээ, сэтгэгдэл", en: "Reviews and comments" },
  previousRenterReviews: {
    mn: "Өмнө түрээсэлсэн хэрэглэгчдийн үнэлгээ энд харагдана.",
    en: "Reviews from previous renters are shown here.",
  },
  comments: { mn: "сэтгэгдэл", en: "comments" },
  canReviewAfterRental: {
    mn: "Түрээсийн хугацаа дууссан тул үнэлгээ өгөх боломжтой",
    en: "Your rental has ended, so you can leave a review",
  },
  writeComment: { mn: "Сэтгэгдлээ бичнэ үү", en: "Write your comment" },
  submitReview: { mn: "Үнэлгээ илгээх", en: "Submit review" },
  submitting: { mn: "Илгээж байна...", en: "Submitting..." },
  yourReview: { mn: "Таны үнэлгээ", en: "Your review" },
  save: { mn: "Хадгалах", en: "Save" },
  reviewEditExpired: {
    mn: "Засах 7 хоногийн хугацаа дууссан.",
    en: "The 7-day edit window has ended.",
  },
  noReviews: { mn: "Одоогоор үнэлгээ алга.", en: "No reviews yet." },
  selectStayDates: { mn: "Байрлах өдрөө сонгоно уу", en: "Select stay dates" },
  selectStayDatesSubtitle: {
    mn: "Байрлах өдрөө сонгоод эзэмшигч рүү хүсэлт илгээнэ үү.",
    en: "Choose your stay dates and send an inquiry to the owner.",
  },
  stayLength: { mn: "Байрлах хугацаа", en: "Stay length" },
  nights: { mn: "шөнө", en: "nights" },
  priceSummary: { mn: "Үнийн хураангуй", en: "Price summary" },
  selectedNights: { mn: "Сонгосон шөнө", en: "Selected nights" },
  rentSubtotal: { mn: "Түрээсийн дүн", en: "Rent subtotal" },
  totalAmount: { mn: "Нийт", en: "Total" },
  sendInquiryButton: { mn: "Хүсэлт илгээх", en: "Send inquiry" },
  rentersOnlyInquiry: {
    mn: "Зөвхөн түрээслэгч бүртгэл хүсэлт илгээх боломжтой.",
    en: "Only renter accounts can send inquiries.",
  },
  rentersOnlyChat: {
    mn: "Зөвхөн түрээслэгч бүртгэл чат эхлүүлэх боломжтой.",
    en: "Only renter accounts can start chats.",
  },
  inquirySentSuccess: { mn: "Хүсэлт амжилттай илгээгдлээ.", en: "Inquiry sent successfully." },
  inquirySendFailed: { mn: "Хүсэлт илгээж чадсангүй.", en: "Failed to send inquiry." },
  agreementPdfPrepareFailed: {
    mn: "Гэрээний PDF бэлтгэж чадсангүй.",
    en: "Failed to prepare agreement PDF.",
  },
  agreementPdfDownloadFailed: {
    mn: "Гэрээний PDF татаж чадсангүй.",
    en: "Failed to download agreement PDF.",
  },
  rentersOnlyReview: {
    mn: "Зөвхөн түрээслэгч үнэлгээ өгөх боломжтой.",
    en: "Only renters can leave reviews.",
  },
  reviewSubmitted: { mn: "Үнэлгээ амжилттай илгээгдлээ.", en: "Review submitted." },
  reviewSubmitFailed: { mn: "Үнэлгээ илгээж чадсангүй.", en: "Failed to submit review." },
  reviewUpdated: { mn: "Үнэлгээ шинэчлэгдлээ.", en: "Review updated." },
  reviewUpdateFailed: { mn: "Үнэлгээ засаж чадсангүй.", en: "Failed to update review." },
  selectStartDateError: { mn: "Эхлэх өдрөө сонгоно уу", en: "Select a start date" },
  selectEndDateError: { mn: "Дуусах өдрөө сонгоно уу", en: "Select an end date" },
  endDateAfterStartError: {
    mn: "Дуусах өдөр эхлэх өдрөөс хойш эсвэл ижил өдөр байх ёстой",
    en: "End date must be on or after the start date",
  },
  minimumOneNightError: {
    mn: "Захиалга дор хаяж 1 шөнийг хамрах ёстой",
    en: "Booking must cover at least 1 night",
  },
  startOutsideAvailabilityError: {
    mn: "Эхлэх өдөр зарын боломжит хугацаанаас гадуур байна",
    en: "Start date is outside the listing availability",
  },
  endOutsideAvailabilityError: {
    mn: "Дуусах өдөр зарын боломжит хугацаанаас гадуур байна",
    en: "End date is outside the listing availability",
  },
  minDailyRent: { mn: "Өдрийн түрээсийн доод үнэ", en: "Minimum daily rent" },
  maxDailyRent: { mn: "Өдрийн түрээсийн дээд үнэ", en: "Maximum daily rent" },
  unlimited: { mn: "Хязгааргүй", en: "Unlimited" },
};

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "mn";
  return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "mn";
};

const getInitialTheme = () => {
  if (typeof window === "undefined") return "light";
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "dark" || storedTheme === "light") return storedTheme;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const fallbackPreferences = {
  language: "mn",
  setLanguage: () => {},
  toggleLanguage: () => {},
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  t: (key) => UI_TEXT[key]?.mn || key,
};

export const PreferencesProvider = ({ children }) => {
  const [language, setLanguage] = useState(getInitialLanguage);
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage: () => setLanguage((current) => (current === "mn" ? "en" : "mn")),
      theme,
      setTheme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
      t: (key) => UI_TEXT[key]?.[language] || key,
    }),
    [language, theme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePreferences = () => {
  const value = useContext(PreferencesContext);
  return value || fallbackPreferences;
};
