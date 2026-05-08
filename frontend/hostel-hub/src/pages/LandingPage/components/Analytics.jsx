import {motion as Motion} from 'framer-motion';
import {TrendingUp, Users, House, Target} from 'lucide-react';
import { usePreferences } from '../../../context/PreferencesContext';

const Analytics = () => {
    const { language } = usePreferences();
    const colorClasses = {
        blue: {
            iconBg: "bg-blue-100",
            iconText: "text-blue-600",
        },
        purple: {
            iconBg: "bg-purple-100",
            iconText: "text-purple-600",
        },
        green: {
            iconBg: "bg-emerald-100",
            iconText: "text-emerald-600",
        },
        orange: {
            iconBg: "bg-orange-100",
            iconText: "text-orange-600",
        },
    };

    const stats = [
        {
            icon: Users,
            title: language === "en" ? "Active renters" : "Идэвхтэй түрээслэгч",
            value: '2.4K+',
            growth: '+12%',
            color: 'blue'
        },
        {
            icon: House,
            title: language === "en" ? "Active listings" : "Идэвхтэй зар",
            value: '320+',
            growth: '+18%',
            color: 'purple'
        },
        {
            icon: Target,
            title: language === "en" ? "Confirmed inquiries" : "Баталгаажсан хүсэлт",
            value: '840+',
            growth: '+9%',
            color: 'green'
        },
        {
            icon: TrendingUp,
            title: language === "en" ? "Occupancy rate" : "Дүүргэлтийн хувь",
            value: '91%',
            growth: '+6%',
            color: 'orange'
        }
    ];
  return (
    <section className="py-20 bg-white relative overflow-hidden dark:bg-gray-950">
        <div className="container mx-auto px-4">
            <Motion.div
                initial={{opacity:0, y:30}}
                whileInView={{opacity:1, y:0}}
                transition={{duration:0.8}}
                viewport={{once:true}}
                className="text-center mb-16"
            >
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
                    HostelHub
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {language === "en" ? " metrics" : " үзүүлэлт"}
                    </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-300">
                    {language === "en"
                        ? "Sample metrics for listing, inquiry, and occupancy growth."
                        : "Зар, хүсэлт, дүүргэлтийн өсөлтийг харуулах жишээ үзүүлэлтүүд."}
                </p>
            </Motion.div>
            {/*Stat cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                {stats.map((stat, index)=>(
                    <Motion.div
                        key={index}
                        initial={{opacity:0, y:30}}
                        whileInView={{opacity:1, y:0}}
                        transition={{delay: index * 0.1, duration:0.6}}
                        viewport={{once:true}}
                        className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 dark:border-gray-800 dark:bg-gray-900"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClasses[stat.color].iconBg}`}>
                                <stat.icon className={`w-6 h-6 ${colorClasses[stat.color].iconText}`} />
                            </div>
                            <span className="text-green-500 text-sm font-semibold bg-green-50 px-2 py-1 rounded-full">
                                {stat.growth}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 mb-2 dark:text-white">{stat.value}</h3>
                        <p className="text-gray-600 dark:text-gray-300">{stat.title} </p>
                    </Motion.div>
                ))}
            </div>
        </div>
    </section>
  )
}

export default Analytics; 
