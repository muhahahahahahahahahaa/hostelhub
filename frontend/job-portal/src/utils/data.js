import {
    Search,
    Users,
    FileText,
    MessageSquare,
    BarChart3,
    Shield,
    Clock,
    Award,
    Briefcase,
    Building2,
    LayoutDashboard,
    Plus
} from 'lucide-react';

export const jobSeekerFeatures =[
    {
        icon: Search,
        title: "Ухаалаг ажил хайлт",
        description: 
        "хиймэл оюун ухаанд суурилсан ажил хайлтын систем ашиглан таны ур чадвар, туршлага, сонирхолд нийцсэн ажлын байр санал болгоно."
    },
    {
        icon: FileText,
        title: "CV бүтээгч",
        description: 
        "мэргэжлийн загварууд болон хялбар засварлах хэрэгслүүдийг ашиглан оновчтой CV үүсгэнэ."
    },
    {
        icon: MessageSquare,
        title: "Хялбар харилцаа",
        description:
        "ажлын байрны зарлагчидтай шууд мессежээр холбогдох боломжийг олгоно."
    },
    {
        icon: Award,
        title: "Ур чадварын батламж",
        description:
        "өөрийн ур чадварыг албан ёсны тестээр баталгаажуулж, ажил олгогчдод өөрийгөө илүү сайн танилцуулах боломжийг олгоно."
    }
];

export const employerFeatures = [
    {
        icon: Users,
        title: "Talent Pool Access",
        description:
        "Access our vast database of pre-screened candidates and find perfect fit for your team."
    },
    {
        icon: BarChart3,
        title: "Analytics Dashboard",
        description:
        "Track your hiring performance with detailed analytics and insights on candidate engagement."
    },
    {
        icon: Shield,
        title: "Verified Candidates",
        description:
        "All candidates undergo background verification to ensure you're hiring trustworthy professionals."
    },
    {
        icon: Clock,
        title: "Quick Hiring",
        description:
        "Streamlined hiring process reduces time-to-hire by 60% with automated screening tools."
    },
];

// Navigation items configurations
export const NAVIGATION_MENU=[
    {id: "employer-dashboard", name:"Dashboard", icon: LayoutDashboard },
    {id: "post-job", name:"Post Job", icon: Plus },
    {id: "manage-jobs", name: "Manage Jobs", icon: Briefcase},
    {id: "company-profile", name: "Company Profile", icon: Building2},
];

//categories and job types
export const CATEGORIES = [
    {value: "Engineering", label: "Engineering"},
    {value: "Design", label: "Design"},
    {value: "Marketing", label: "Marketing"},
    {value: "Sales", label: "Sales"},
    {value: "IT & Software", label: "IT & Software"},
    {value: "Customer Support", label: "Customer Support"},
    {value: "Product", label: "Product"},
    {value: "Operations", label: "Operations"},
    {value: "Finance", label: "Finance"},
    {value: "HR", label: "HR"},
    {value: "Other", label: "Other"},
];

export const JOB_TYPES = [
    {value: "Remote", label: "Remote"},
    {value: "Full-Time", label: "Full-Time"},
    {value: "Part-Time", label: "Part-Time"},
    {value: "Contract", label: "Contract"},
    {value: "Internship", label: "Internship"},
];

export const SALARY_RANGES = [
    "Less than $1000",
    "$1000 - $15000",
    "More than $15000",
];