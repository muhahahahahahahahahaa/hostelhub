import { motion as Motion } from "framer-motion"; 
import {Search, ArrowRight, Users, Building2, TrendingUp} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { usePreferences } from '../../../context/PreferencesContext';
import { ROUTES } from "../../../utils/routePaths";

const Hero = () => {
    const {user, isAuthenticated} = useAuth();
    const { language } = usePreferences();
    const navigate = useNavigate();
    const stats =[
        {icon: Users, label: language === "en" ? "Monthly inquiries" : "Сарын хүсэлт", value: '4.8K+'},
        {icon: Building2, label: language === "en" ? "Total hostels" : "Нийт хостел", value: '320+'},
        {icon: TrendingUp, label: language === "en" ? "Available beds" : "Сул ор", value: '1.2K+'},
    ];
  return (
    <section className="pt-24 pb-16 bg-white min-h-screen flex items-center dark:bg-gray-950">
        <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
                {/*main heading */}
                <Motion.h1 
                    initial={{opacity:0, y:30}}
                    animate={{opacity:1, y:0}}
                    transition={{duration:0.8}}
                    className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight placeholder-teal-10 dark:text-white">
                        {language === "en" ? "Find the city hostel" : "Танд тохирох"}
                        <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
                            {language === "en" ? "that fits you" : "хотын хостелийг олоорой"}
                        </span>
                </Motion.h1>
                {/*subheading*/}
                <Motion.p
                    initial={{opacity:0, y:30}}
                    animate={{opacity:1, y:0}}
                    transition={{delay:0.2, duration:0.8}}
                    className="text-xl md:text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed dark:text-gray-300"
                >
                    {language === "en"
                        ? "Compare daily rent, deposit, available beds, amenities, and rules in one place, then send an inquiry directly to the owner."
                        : "Өдрийн түрээс, барьцаа, сул ор, тохижилт, дүрмийг нэг дор харьцуулаад эзэмшигч рүү шууд хүсэлт илгээнэ."}
                </Motion.p>
                {/*CTA button*/}
                <Motion.div
                    initial={{opacity:0, y:30}}
                    animate={{opacity:1, y:0}}
                    transition={{delay:0.4, duration:0.8}}
                    className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
                >
                    <Motion.button 
                        whileHover={{scale:1.02}}
                        whileTap={{scale:0.98}}
                        className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center space-x-2"
                        onClick={() => navigate(ROUTES.FIND_HOSTELS)}
                    >
                        <Search className="w-5 h-5"/>
                        <span>
                            {language === "en" ? "Find hostels" : "Хостел хайх"}
                        </span>
                        <ArrowRight className="w-5 h-5 group-hover:transition-transform "/>
                    </Motion.button>
                    <Motion.button
                        whileHover={{scale:1.02}}
                        whileTap={{scale:0.98}}
                        className="bg-white border-2 border-gray-700 px-8 py-4 rounded-xl font-semibold text-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md dark:border-gray-600 dark:bg-gray-900 dark:text-white dark:hover:bg-gray-800"
                        onClick={() => {navigate(isAuthenticated && user?.role==="owner"
                            ?ROUTES.OWNER_DASHBOARD
                            :ROUTES.LOGIN);
                        }}
                    >
                        {language === "en" ? "Post listing" : "Зар оруулах"}
                    </Motion.button>
                </Motion.div>
                {/*stats*/}
                <Motion.div
                    initial={{opacity:0, y:30}}
                    animate={{opacity:1, y:0}}
                    transition={{delay:0.6, duration:0.8}}
                    className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto"
                >
                    {stats.map((stat, index) => (
                        <Motion.div
                            key={index}
                            initial= {{opacity:0, y:20}}
                            animate={{opacity:1, y:0}}
                            transition={{delay:0.8 + index *0.1, duration: 0.6}}
                            className="flex flex-col items-center space-y-2 p-4 rounded-xl hover:bg-gray-50 transition-colors dark:hover:bg-gray-900">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mb-2">
                                    <stat.icon className="w-6 h-6 text-blue-600"/>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                                <div className="text-sm text-gray-600 font-medium dark:text-gray-300">{stat.label}</div>
                        </Motion.div>
                    ))}
                </Motion.div>
            </div>
        </div>
        {/*Subtle background elements*/}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-30"/>
            <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100 rounded-full blur-3xl opacity-30"/>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full blur-3xl opacity-20"/>
        </div>
    </section>
  )
}

export default Hero; 
