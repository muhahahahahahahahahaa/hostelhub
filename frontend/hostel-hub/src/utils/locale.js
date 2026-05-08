const LANGUAGE_STORAGE_KEY = "hostelhub-language";

export const getCurrentLanguage = () => {
    if (typeof window === "undefined") return "mn";
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "en" ? "en" : "mn";
};

export const STATUS_LABELS = {
    New: { mn: "Шинэ", en: "New" },
    Contacted: { mn: "Холбогдсон", en: "Contacted" },
    Confirmed: { mn: "Баталгаажсан", en: "Confirmed" },
    Declined: { mn: "Татгалзсан", en: "Declined" },
};

export const CATEGORY_LABELS = {
    Student: { mn: "Оюутан", en: "Student" },
    Worker: { mn: "Ажилтан", en: "Worker" },
    "Female Only": { mn: "Зөвхөн эмэгтэй", en: "Female only" },
    "Male Only": { mn: "Зөвхөн эрэгтэй", en: "Male only" },
    Mixed: { mn: "Холимог", en: "Mixed" },
};

export const ROOM_TYPE_LABELS = {
    "Dorm Bed": { mn: "Дотуур байрны ор", en: "Dorm bed" },
    "Shared Room": { mn: "Хамтын өрөө", en: "Shared room" },
    "Private Room": { mn: "Тусдаа өрөө", en: "Private room" },
};

export const AMENITY_LABELS = {
    Wifi: { mn: "Wi-Fi", en: "Wi-Fi" },
    Laundry: { mn: "Угаалгын машин", en: "Laundry" },
    Kitchen: { mn: "Хамтын гал тогоо", en: "Shared kitchen" },
    Shower: { mn: "Халуун шүршүүр", en: "Hot shower" },
    Security: { mn: "24/7 харуул хамгаалалт", en: "24/7 security" },
    Parking: { mn: "Зогсоол", en: "Parking" },
    Breakfast: { mn: "Өглөөний цай", en: "Breakfast" },
    Locker: { mn: "Шүүгээ", en: "Locker" },
};

export const ROLE_LABELS = {
    renter: { mn: "Түрээслэгч", en: "Renter" },
    owner: { mn: "Эзэмшигч", en: "Owner" },
};

const localizeLabel = (labels, value, language = getCurrentLanguage()) =>
    labels[value]?.[language] || value || "";

export const translateStatus = (status, language) => localizeLabel(STATUS_LABELS, status, language);
export const translateCategory = (category, language) => localizeLabel(CATEGORY_LABELS, category, language);
export const translateRoomType = (roomType, language) => localizeLabel(ROOM_TYPE_LABELS, roomType, language);
export const translateAmenity = (amenity, language) => localizeLabel(AMENITY_LABELS, amenity, language);
export const translateRole = (role, language) => localizeLabel(ROLE_LABELS, role, language);

const API_TEXT_LABELS = {
    "All fields are required": "Бүх талбарыг бөглөнө үү",
    "User already exists": "Хэрэглэгч аль хэдийн бүртгэлтэй байна",
    "Invalid email or password": "Имэйл эсвэл нууц үг буруу байна",
    "Not authorized, no token": "Нэвтрэх шаардлагатай",
    "Token failed": "Нэвтрэлтийн хугацаа дууссан байна",
    "Access denied": "Хандах эрхгүй байна",
    "Listing not found": "Зар олдсонгүй",
    "Inquiry not found": "Хүсэлт олдсонгүй",
    "Chat not found": "Чат олдсонгүй",
    "User not found": "Хэрэглэгч олдсонгүй",
    "Only renters can send inquiries": "Зөвхөн түрээслэгч хүсэлт илгээх боломжтой",
    "Only renters can save listings": "Зөвхөн түрээслэгч зар хадгалах боломжтой",
    "Only owners can post listings": "Зөвхөн эзэмшигч зар оруулах боломжтой",
    "Inquiry already sent for this listing": "Энэ зарт хүсэлт аль хэдийн илгээсэн байна",
    "This listing is currently closed": "Энэ зар одоогоор хаалттай байна",
    "Please select a valid start date": "Зөв эхлэх өдөр сонгоно уу",
    "Please select a valid end date": "Зөв дуусах өдөр сонгоно уу",
    "End date must be the same as or after the start date": "Дуусах өдөр эхлэх өдрөөс хойш эсвэл ижил өдөр байх ёстой",
    "Booking dates must cover at least 1 night": "Захиалга дор хаяж 1 шөнийг хамрах ёстой",
    "Agreement accepted successfully": "Гэрээ амжилттай зөвшөөрөгдлөө",
    "Inquiry confirmed successfully": "Хүсэлт амжилттай баталгаажлаа",
    "Inquiry status updated": "Хүсэлтийн төлөв шинэчлэгдлээ",
    "Payment has not been initiated yet": "Төлбөр хараахан эхлээгүй байна",
    "Payment is available only for confirmed inquiries": "Төлбөр зөвхөн баталгаажсан хүсэлтэд боломжтой",
    "Both parties must complete the agreement before payment": "Төлбөрөөс өмнө хоёр тал гэрээг бөглөх ёстой",
    "Payment deadline expired. This booking was cancelled.": "Төлбөр төлөх хугацаа дууссан тул захиалга цуцлагдлаа.",
    "Payment deadline expired": "Төлбөрийн хугацаа дууссан",
    "Booking cancelled": "Захиалга цуцлагдлаа",
    "New inquiry received": "Шинэ хүсэлт ирлээ",
    "Your request was confirmed": "Таны хүсэлт баталгаажлаа",
    "Your request was declined": "Таны хүсэлтээс татгалзлаа",
    "Final agreement is ready": "Эцсийн гэрээ бэлэн боллоо",
    "Payment time expired": "Төлбөрийн хугацаа дууслаа",
    "Review your completed rental": "Дууссан түрээсэндээ үнэлгээ өгнө үү",
    "Message is required": "Мессеж шаардлагатай",
    "Message is too long": "Мессеж хэт урт байна",
    "Only renters can start chats from listings": "Зөвхөн түрээслэгч зараас чат эхлүүлэх боломжтой",
    "You cannot chat on your own listing": "Өөрийн зар дээр чатлах боломжгүй",
    "Not authorized to view this chat": "Энэ чатыг харах эрхгүй байна",
    "Not authorized to send messages here": "Энд мессеж илгээх эрхгүй байна",
    "At least one template is required": "Дор хаяж нэг гэрээний загвар шаардлагатай",
    "Template names must be unique": "Гэрээний загварын нэр давхцахгүй байх ёстой",
    "Template not found": "Загвар олдсонгүй",
    "Template file not found": "Загварын файл олдсонгүй",
    "Preview content is required": "Урьдчилж харах агуулга шаардлагатай",
    "Preview sections are required": "Урьдчилж харах хэсгүүд шаардлагатай",
    "Failed to generate preview": "Урьдчилсан харагдац үүсгэж чадсангүй",
    "Failed to preview template": "Загварыг урьдчилж харж чадсангүй",
    "Failed to save listing": "Зар хадгалж чадсангүй",
    "Listing deleted successfully": "Зар амжилттай устлаа",
    "Cannot reopen expired listing. Update availability first.": "Хугацаа дууссан зарыг дахин нээх боломжгүй. Эхлээд боломжит хугацааг шинэчилнэ үү.",
    "Listing closed": "Зар хаагдлаа",
    "Listing reopened": "Зар дахин нээгдлээ",
    "Withdrawal amount is required": "Татах дүн шаардлагатай",
    "Insufficient wallet balance": "Wallet үлдэгдэл хүрэлцэхгүй байна",
    "Withdrawal request submitted": "Татах хүсэлт илгээгдлээ",
    "Failed to request withdrawal": "Татах хүсэлт илгээж чадсангүй",
    "Only renters can review listings": "Зөвхөн түрээслэгч үнэлгээ өгөх боломжтой",
    "Rating must be between 1 and 5": "Үнэлгээ 1-5 одны хооронд байх ёстой",
    "Review comment is too long": "Сэтгэгдэл хэт урт байна",
    "Review is available after a paid rental ends": "Төлбөр баталгаажсан түрээсийн хугацаа дууссаны дараа үнэлгээ өгөх боломжтой",
    "You have already reviewed this listing": "Та энэ зарт үнэлгээ өгсөн байна",
    "You have already reviewed this completed rental": "Та энэ дууссан түрээсэнд үнэлгээ өгсөн байна",
    "Review submitted": "Үнэлгээ амжилттай илгээгдлээ",
    "Failed to fetch reviews": "Үнэлгээнүүдийг ачаалж чадсангүй",
    "Failed to submit review": "Үнэлгээ илгээж чадсангүй",
    "You have already reviewed this rental": "Та энэ түрээсэнд үнэлгээ өгсөн байна",
    "Review is not available for this listing": "Энэ зарт үнэлгээ өгөх боломжгүй байна",
    "Only renters can update reviews": "Зөвхөн түрээслэгч үнэлгээ засах боломжтой",
    "Review not found": "Үнэлгээ олдсонгүй",
    "You can update only your own review": "Та зөвхөн өөрийн бичсэн үнэлгээг засах боломжтой",
    "Review can be updated only within 7 days": "Үнэлгээг зөвхөн 7 хоногийн дотор засах боломжтой",
    "Review updated": "Үнэлгээ шинэчлэгдлээ",
    "Failed to update review": "Үнэлгээ засаж чадсангүй",
};

const translateDynamicApiText = (value) => {
    let text = value;

    text = text.replace(/(.+) will end in 3 days\./, "$1 3 хоногийн дараа дуусна.");
    text = text.replace(/(.+) ends today\./, "$1 өнөөдөр дуусна.");
    text = text.replace(/(.+) sent an inquiry for (.+)\./, "$1 $2 зар дээр хүсэлт илгээлээ.");
    text = text.replace(/(.+) is ready for agreement review\./, "$1 гэрээ хянахад бэлэн боллоо.");
    text = text.replace(/(.+) now has a signed agreement PDF\./, "$1 гарын үсэгтэй PDF гэрээтэй боллоо.");
    text = text.replace(/(.+) was declined by the owner\./, "$1 хүсэлтээс эзэмшигч татгалзлаа.");
    text = text.replace(/(.+) was cancelled because the payment was not completed within 24 hours\./, "$1 төлбөр 24 цагийн дотор төлөгдөөгүй тул цуцлагдлаа.");
    text = text.replace(/(.+) was cancelled because payment was not completed within 24 hours\./, "$1 төлбөр 24 цагийн дотор төлөгдөөгүй тул цуцлагдлаа.");
    text = text.replace(/(.+) was cancelled because the renter did not pay within 24 hours\./, "$1 түрээслэгч 24 цагийн дотор төлөөгүй тул цуцлагдлаа.");
    text = text.replace(/(.+) rental has ended\. You can leave a review now\./, "$1 түрээсийн хугацаа дууслаа. Та одоо үнэлгээ өгөх боломжтой.");

    return text;
};

export const translateApiText = (value, language = getCurrentLanguage()) => {
    if (typeof value !== "string") return value;
    if (language === "en") return value;
    return API_TEXT_LABELS[value] || translateDynamicApiText(value);
};

export const translateApiPayload = (payload, language = getCurrentLanguage()) => {
    if (Array.isArray(payload)) {
        return payload.map((item) => translateApiPayload(item, language));
    }

    if (!payload || typeof payload !== "object") {
        return payload;
    }

    return Object.fromEntries(
        Object.entries(payload).map(([key, value]) => {
            if (["message", "title", "error"].includes(key) && typeof value === "string") {
                return [key, translateApiText(value, language)];
            }

            return [key, translateApiPayload(value, language)];
        }),
    );
};
