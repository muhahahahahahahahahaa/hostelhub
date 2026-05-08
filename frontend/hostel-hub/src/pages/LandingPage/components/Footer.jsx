import { House } from 'lucide-react';
import { usePreferences } from '../../../context/PreferencesContext';

const Footer = () => {
  const { language } = usePreferences();

  return (
    <footer className="relative bg-gray-50 text-gray-900 overflow-hidden dark:bg-gray-950 dark:text-white">
        <div className="relative z-10 px-6 py-16">
            <div className="max-w-6xl mx-auto">
                {/*Main Footer content */}
                <div className="text-center space-y-8">
                    {/*logo Brand */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-center space-x-2 mb-6">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <House className="w-6 h-6 text-white"/>
                            </div>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">HostelHub</h3>
                        </div>
                        <p className={`text-sm text-gray-600 max-w-md mx-auto dark:text-gray-300`}>
                            {language === "en"
                                ? "A simple platform for city hostel rentals, renter inquiries, and owner listing management."
                                : "Хотын хостелийн түрээс, түрээслэгчийн хүсэлт, эзэмшигчийн зарын удирдлагад зориулсан энгийн платформ."}
                        </p>
                    </div>
                    {/*Copyright */}
                    <div className="space-y-2">
                        <p className={`text-sm text-gray-600 dark:text-gray-400`}>
                            @{new Date().getFullYear()} HostelHub
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </footer>
  )
}

export default Footer; 
