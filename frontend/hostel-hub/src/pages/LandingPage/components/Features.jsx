import { renterFeatures, ownerFeatures } from '../../../utils/data';
import { usePreferences } from '../../../context/PreferencesContext';

const Features = () => {
  const { language } = usePreferences();
  const localizeFeature = (feature) => ({
    title: language === "en" ? feature.titleEn : feature.title,
    description: language === "en" ? feature.descriptionEn : feature.description,
  });

  return (
    <section className="py-20 bg-white relative overflow-hidden dark:bg-gray-950">
        <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 dark:text-white">
                    {language === "en" ? "Everything you need" : "Хостел түрээслэхэд хэрэгтэй"}
                    <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent ">
                        {language === "en" ? "to rent a hostel" : "бүх зүйл"}
                    </span>
                </h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto dark:text-gray-300">
                    {language === "en"
                        ? "A hostel platform for renters to choose faster and owners to manage listings and inquiries in one place."
                        : "Түрээслэгч хурдан сонголт хийх, эзэмшигч зар болон хүсэлтээ нэг дор удирдахад зориулсан хостелийн платформ."}
                </p>
            </div>
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24">
                {/* renter section*/}
                <div>
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
                            {language === "en" ? "For renters" : "Түрээслэгчдэд"}
                        </h3>
                        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-blue-600 mx-auto rounded-full" />
                    </div>
                    <div className="space-y-8">
                        {renterFeatures.map((feature, index)=>(
                            <div
                                key={index}
                                className="group flex items-start space-x-4 p-6 rounded-2xl hover:bg-blue-50 transition-all duration-300 cursor-pointer dark:hover:bg-blue-950/40"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                                    <feature.icon className="w-6 h-6 text-blue-600"/>
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">
                                        {localizeFeature(feature).title}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed dark:text-gray-300">
                                        {localizeFeature(feature).description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                {/*owner section */}
                <div>
                    <div className="text-center mb-12">
                        <h3 className="text-3xl font-bold text-gray-900 mb-4 dark:text-white">
                            {language === "en" ? "For owners" : "Эзэмшигчдэд"}
                        </h3>
                        <div className="w-24 h-1 bg-gradient-to-r from-purple-500 to-purple-600 mx-auto rounded-full"/>
                    </div>
                    <div className="space-y-8">
                        {ownerFeatures.map((feature, index)=>(
                            <div
                            key={index}
                            className="group flex items-start space-x-4 p-6 rounded-2xl hover:bg-purple-50 transition-all duration-300 cursor-pointer dark:hover:bg-purple-950/40"
                            >
                                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center group-hover bg-purple-200 transition-colors">
                                    <feature.icon className="w-6 h-6 text-purple-600"/>
                                </div>
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900 mb-2 dark:text-white">
                                        {localizeFeature(feature).title}
                                    </h4>
                                    <p className="text-gray-600 leading-relaxed dark:text-gray-300">
                                        {localizeFeature(feature).description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </section>
  )
}

export default Features; 
