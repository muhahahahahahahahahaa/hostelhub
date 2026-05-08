import { Languages, Moon, Sun } from "lucide-react";
import { usePreferences } from "../../context/PreferencesContext";

const PreferenceControls = ({ className = "" }) => {
  const { language, theme, toggleLanguage, toggleTheme, t } = usePreferences();
  const isDark = theme === "dark";

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={toggleLanguage}
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        aria-label={language === "mn" ? t("switchToEnglish") : t("switchToMongolian")}
        title={language === "mn" ? t("switchToEnglish") : t("switchToMongolian")}
      >
        <Languages className="h-4 w-4" />
        <span>{language === "mn" ? "MN" : "EN"}</span>
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:hover:bg-gray-800"
        aria-label={isDark ? t("lightMode") : t("darkMode")}
        title={isDark ? t("lightMode") : t("darkMode")}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
    </div>
  );
};

export default PreferenceControls;
