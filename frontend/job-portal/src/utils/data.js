import {
    Search,
    Users,
    BedDouble,
    MessageSquare,
    BarChart3,
    Shield,
    House,
    Briefcase,
    Building2,
    LayoutDashboard,
    Plus,
    ClipboardList,
} from 'lucide-react';

export const renterFeatures = [
    {
        icon: Search,
        title: "Search by Location",
        description: 
        "Filter listings by area, room type, and budget to find the right hostel faster."
    },
    {
        icon: BedDouble,
        title: "Clear Room Details",
        description: 
        "Compare monthly rent, deposit, bed availability, amenities, and house rules in one place."
    },
    {
        icon: MessageSquare,
        title: "One-Click Inquiry",
        description:
        "Send an inquiry instantly on any listing and wait for the owner to follow up."
    },
    {
        icon: Shield,
        title: "More Trustworthy Choices",
        description:
        "Review hostel branding, photos, rules, and essential details in a consistent layout."
    }
];

export const ownerFeatures = [
    {
        icon: House,
        title: "Listing Control",
        description:
        "Post, edit, close, and reopen hostel listings from one owner dashboard."
    },
    {
        icon: BarChart3,
        title: "Inquiry Tracking",
        description:
        "Track total inquiries, recent interest, and confirmed renters without leaving the dashboard."
    },
    {
        icon: Users,
        title: "Renter Pipeline",
        description:
        "Review each renter inquiry, update statuses, and keep listing demand organized."
    },
    {
        icon: Building2,
        title: "Hostel Branding",
        description:
        "Maintain your hostel name, description, logo, and listing presentation in one place."
    },
];

// Navigation items configurations
export const NAVIGATION_MENU=[
    {id: "owner-dashboard", name:"Dashboard", icon: LayoutDashboard },
    {id: "post-listing", name:"Post Listing", icon: Plus },
    {id: "manage-listings", name: "Manage Listings", icon: ClipboardList},
    {id: "inquiries", name: "Inquiries", icon: Users},
    {id: "owner-profile", name: "Hostel Profile", icon: Building2},
];

export const CATEGORIES = [
    {value: "Student", label: "Student"},
    {value: "Worker", label: "Worker"},
    {value: "Female Only", label: "Female Only"},
    {value: "Male Only", label: "Male Only"},
    {value: "Mixed", label: "Mixed"},
];

export const ROOM_TYPES = [
    {value: "Dorm Bed", label: "Dorm Bed"},
    {value: "Shared Room", label: "Shared Room"},
    {value: "Private Room", label: "Private Room"},
];

export const AMENITY_OPTIONS = [
    { value: "Wifi", label: "Wi-Fi" },
    { value: "Laundry", label: "Laundry" },
    { value: "Kitchen", label: "Shared Kitchen" },
    { value: "Shower", label: "Hot Shower" },
    { value: "Security", label: "24/7 Security" },
    { value: "Parking", label: "Parking" },
    { value: "Breakfast", label: "Breakfast" },
    { value: "Locker", label: "Locker" },
];
