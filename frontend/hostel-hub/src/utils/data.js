import {
    Search,
    Users,
    BedDouble,
    MessageSquare,
    BarChart3,
    Shield,
    House,
    Building2,
    LayoutDashboard,
    Plus,
    ClipboardList,
} from 'lucide-react';

export const renterFeatures = [
    {
        icon: Search,
        title: "Байршлаар хайх",
        titleEn: "Search by location",
        description: 
        "Байршил, өрөөний төрөл, төсвөөр шүүж өөрт тохирох хостелийг хурдан олоорой.",
        descriptionEn:
        "Filter by location, room type, and budget to find the right hostel faster."
    },
    {
        icon: BedDouble,
        title: "Өрөөний тодорхой мэдээлэл",
        titleEn: "Clear room details",
        description: 
        "Өдрийн түрээс, барьцаа, сул ор, тохижилт, дүрмийг нэг дор харьцуулна.",
        descriptionEn:
        "Compare daily rent, deposit, available beds, amenities, and house rules in one place."
    },
    {
        icon: MessageSquare,
        title: "Хүсэлт хурдан илгээх",
        titleEn: "Quick inquiry",
        description:
        "Таалагдсан зараас хүсэлтээ шууд илгээж, эзэмшигчийн хариуг хүлээнэ.",
        descriptionEn:
        "Send an inquiry from a listing and wait for the owner to respond."
    },
    {
        icon: Shield,
        title: "Илүү найдвартай сонголт",
        titleEn: "More trusted choices",
        description:
        "Хостелийн нэр, зураг, дүрэм, чухал мэдээллийг ойлгомжтой байдлаар харна.",
        descriptionEn:
        "Review hostel branding, photos, rules, and essential details in a clear layout."
    }
];

export const ownerFeatures = [
    {
        icon: House,
        title: "Зарын удирдлага",
        titleEn: "Listing control",
        description:
        "Хостелийн зараа нэг самбараас нийтлэх, засах, хаах, дахин нээх боломжтой.",
        descriptionEn:
        "Post, edit, close, and reopen hostel listings from one owner dashboard."
    },
    {
        icon: BarChart3,
        title: "Хүсэлтийн хяналт",
        titleEn: "Inquiry tracking",
        description:
        "Нийт хүсэлт, шинэ сонирхол, баталгаажсан түрээслэгчдийг самбараасаа хянана.",
        descriptionEn:
        "Track total inquiries, recent interest, and confirmed renters from your dashboard."
    },
    {
        icon: Users,
        title: "Түрээслэгчийн урсгал",
        titleEn: "Renter pipeline",
        description:
        "Түрээслэгчийн хүсэлт бүрийг шалгаж, төлөвийг шинэчилж, эрэлтийг эмхтэй байлгана.",
        descriptionEn:
        "Review each renter inquiry, update statuses, and keep demand organized."
    },
    {
        icon: Building2,
        title: "Хостелийн танилцуулга",
        titleEn: "Hostel branding",
        description:
        "Хостелийн нэр, тайлбар, лого, зарын танилцуулгыг нэг дор удирдана.",
        descriptionEn:
        "Manage your hostel name, description, logo, and listing presentation in one place."
    },
];

// Navigation items configurations
export const NAVIGATION_MENU=[
    {id: "owner-dashboard", name:"Самбар", labelKey: "ownerDashboard", icon: LayoutDashboard },
    {id: "post-listing", name:"Зар оруулах", labelKey: "postListing", icon: Plus },
    {id: "manage-listings", name: "Зараа удирдах", labelKey: "manageListings", icon: ClipboardList},
    {id: "chats", name: "Чат", labelKey: "chats", icon: MessageSquare},
    {id: "inquiries", name: "Хүсэлтүүд", labelKey: "inquiries", icon: Users},
    {id: "owner-profile", name: "Хостелийн профайл", labelKey: "ownerProfile", icon: Building2},
];

export const CATEGORIES = [
    {value: "Student", label: "Оюутан", labelEn: "Student"},
    {value: "Worker", label: "Ажилтан", labelEn: "Worker"},
    {value: "Female Only", label: "Зөвхөн эмэгтэй", labelEn: "Female only"},
    {value: "Male Only", label: "Зөвхөн эрэгтэй", labelEn: "Male only"},
    {value: "Mixed", label: "Холимог", labelEn: "Mixed"},
];

export const ROOM_TYPES = [
    {value: "Dorm Bed", label: "Дотуур байрны ор", labelEn: "Dorm bed"},
    {value: "Shared Room", label: "Хамтын өрөө", labelEn: "Shared room"},
    {value: "Private Room", label: "Тусдаа өрөө", labelEn: "Private room"},
];

export const AMENITY_OPTIONS = [
    { value: "Wifi", label: "Wi-Fi", labelEn: "Wi-Fi" },
    { value: "Laundry", label: "Угаалгын машин", labelEn: "Laundry" },
    { value: "Kitchen", label: "Хамтын гал тогоо", labelEn: "Shared kitchen" },
    { value: "Shower", label: "Халуун шүршүүр", labelEn: "Hot shower" },
    { value: "Security", label: "24/7 харуул хамгаалалт", labelEn: "24/7 security" },
    { value: "Parking", label: "Зогсоол", labelEn: "Parking" },
    { value: "Breakfast", label: "Өглөөний цай", labelEn: "Breakfast" },
    { value: "Locker", label: "Шүүгээ", labelEn: "Locker" },
];
