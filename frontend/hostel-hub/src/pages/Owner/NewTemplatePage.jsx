import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronRight,
  Minus,
  Plus,
  Save,
  X,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { ROUTES } from "../../utils/routePaths";

const EMPTY_CLAUSE_SECTIONS = [
  {
    sectionNumber: "4",
    title: "Түрээслүүлэгчийн эрх үүрэг",
    items: [],
  },
  {
    sectionNumber: "5",
    title: "Түрээслэгчийн эрх үүрэг",
    items: [],
  },
  {
    sectionNumber: "6",
    title: "Талуудын хүлээх хариуцлага",
    items: [],
  },
  {
    sectionNumber: "7",
    title: "Гэрээ цуцлах",
    items: [],
  },
  {
    sectionNumber: "8",
    title: "Бусад",
    items: [],
  },
];

const normalizeTemplateName = (value) => value.trim().toLowerCase();

const NewTemplatePage = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const templates = useMemo(() => user?.leaseAgreementTemplates || [], [user]);
  const previewSourceTemplate = useMemo(
    () =>
      templates.find((template) => template.isDefault && template.url) ||
      templates.find((template) => template.url) ||
      null,
    [templates],
  );

  const [name, setName] = useState("");
  const [sections, setSections] = useState(EMPTY_CLAUSE_SECTIONS);
  const [openSectionIndex, setOpenSectionIndex] = useState(0);
  const [newClauseDrafts, setNewClauseDrafts] = useState({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showNameError, setShowNameError] = useState(false);

  const handleRemoveItem = (sectionIndex, itemIndex) => {
    setSections((currentSections) =>
      currentSections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              items: section.items.filter((_, currentItemIndex) => currentItemIndex !== itemIndex),
            }
          : section,
      ),
    );
  };

  const handleStartAddItem = (sectionIndex) => {
    setNewClauseDrafts((currentDrafts) => ({
      ...currentDrafts,
      [sectionIndex]: currentDrafts[sectionIndex] || "",
    }));
  };

  const handleDraftChange = (sectionIndex, value) => {
    setNewClauseDrafts((currentDrafts) => ({
      ...currentDrafts,
      [sectionIndex]: value,
    }));
  };

  const handleCancelAddItem = (sectionIndex) => {
    setNewClauseDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[sectionIndex];
      return nextDrafts;
    });
  };

  const handleConfirmAddItem = (sectionIndex) => {
    const nextItem = String(newClauseDrafts[sectionIndex] || "").trim();

    if (!nextItem) {
      toast.error("Шинэ заалтаа бичнэ үү.");
      return;
    }

    setSections((currentSections) =>
      currentSections.map((section, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? {
              ...section,
              items: [...section.items, nextItem],
            }
          : section,
      ),
    );

    handleCancelAddItem(sectionIndex);
  };

  const buildTemplateContent = () =>
    sections
      .map((section) => {
        const normalizedItems = section.items
          .map((item) => String(item || "").trim())
          .filter(Boolean);

        if (normalizedItems.length === 0) {
          return `${section.sectionNumber}. ${section.title}`;
        }

        return `${section.sectionNumber}. ${section.title}\n${normalizedItems
          .map((item, itemIndex) => `${section.sectionNumber}.1.${itemIndex + 1} ${item}`)
          .join("\n")}`;
      })
      .join("\n\n");

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedContent = buildTemplateContent().trim();
    const hasAtLeastOneClause = sections.some((section) =>
      section.items.some((item) => String(item || "").trim())
    );

    if (!trimmedName) {
      setShowNameError(true);
      toast.error("Загварын нэр оруулна уу.");
      return;
    }

    setShowNameError(false);

    if (!hasAtLeastOneClause) {
      toast.error("Дор хаяж нэг заалт шаардлагатай.");
      return;
    }

    const hasDuplicateName = templates.some(
      (template) => normalizeTemplateName(template.name) === normalizeTemplateName(trimmedName),
    );

    if (hasDuplicateName) {
      toast.error("Ийм нэртэй загвар аль хэдийн байна.");
      return;
    }

    const leaseAgreementTemplates = [
      ...templates,
      {
        name: trimmedName,
        url: "",
        content: trimmedContent,
      },
    ];

    setSaving(true);

    try {
      const response = await axiosInstance.put(API_PATHS.AUTH.UPDATE_PROFILE, {
        name: user?.name || "",
        avatar: user?.avatar || "",
        hostelName: user?.hostelName || "",
        hostelDescription: user?.hostelDescription || "",
        hostelLogo: user?.hostelLogo || "",
        leaseAgreementTemplates,
      });

      updateUser(response.data);
      toast.success("Загвар амжилттай үүслээ.");
      navigate(ROUTES.OWNER_PROFILE);
    } catch (error) {
      console.error("Template create failed", error);
      toast.error(error?.response?.data?.message || "Загвар үүсгэж чадсангүй.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewToggle = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    if (!previewSourceTemplate?.url) {
      setPreviewUrl("");
      setShowPreview(true);
      return;
    }

    if (!name.trim()) {
      setShowNameError(true);
      toast.error("Эхлээд загварын нэр оруулна уу.");
      return;
    }

    setShowNameError(false);

    setPreviewLoading(true);

    try {
      const response = await axiosInstance.post(
        API_PATHS.USER.TEMPLATE_SECTION_PREVIEW(
          encodeURIComponent(previewSourceTemplate.name),
        ),
        {
          sections,
        },
      );

      setPreviewUrl(response.data?.previewUrl || "");
      setShowPreview(true);
    } catch (error) {
      console.error("New template preview failed", error);
      toast.error(error?.response?.data?.message || "Урьдчилсан харагдац үүсгэж чадсангүй.");
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <DashboardLayout activeMenu="owner-profile">
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className={`mx-auto space-y-6 ${showPreview ? "max-w-7xl" : "max-w-4xl"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-900/80 px-4 py-3 text-white shadow-lg">
            <div>
              <Link
                to={ROUTES.OWNER_PROFILE}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Эзэмшигчийн профайл руу буцах
              </Link>
              <h1 className="mt-2 text-xl font-semibold text-white">Шинэ загвар нэмэх</h1>
              
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePreviewToggle}
                disabled={previewLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                {previewLoading ? "Урьдчилсан харагдац бэлдэж байна..." : showPreview ? "Урьдчилсан харагдац хаах" : "Урьдчилж харах"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving ? "Хадгалж байна..." : "Загвар хадгалах"}
              </button>
            </div>
          </div>

          <div className={`grid gap-6 ${showPreview ? "xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]" : "grid-cols-1"}`}>
            <div
              className={`rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-all sm:p-6 ${
                showPreview ? "xl:sticky xl:top-6 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto" : ""
              }`}
            >
              <div className="mb-4 rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <label className="block text-sm font-medium text-gray-700">
                  Загварын нэр <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    if (event.target.value.trim()) {
                      setShowNameError(false);
                    }
                  }}
                  placeholder="Загварын нэр оруулна уу"
                  required
                  aria-required="true"
                  className={`mt-3 h-12 w-full rounded-xl bg-white px-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 ${
                    showNameError
                      ? "border border-rose-400 focus:border-rose-500"
                      : "border border-gray-300 focus:border-blue-500"
                  }`}
                />
                {showNameError ? (
                  <p className="mt-2 text-sm text-rose-500">Загварын нэр шаардлагатай.</p>
                ) : null}
              </div>

              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={section.title}
                    className="rounded-2xl border border-gray-200 bg-gray-50"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenSectionIndex((current) => (current === index ? -1 : index))
                      }
                      className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {section.sectionNumber}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{section.title}</p>
                      </div>
                      {openSectionIndex === index ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {openSectionIndex === index ? (
                      <div className="border-t border-gray-200 px-4 pb-4 pt-3">
                        <div className="space-y-3 rounded-xl bg-white p-4">
                          {section.items.length > 0 ? (
                            section.items.map((item, itemIndex) => (
                              <div
                                key={`${section.title}-${itemIndex}`}
                                className="flex items-start justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
                              >
                                <p className="text-sm leading-7 text-gray-700">
                                  <span className="mr-2 font-semibold text-gray-900">
                                    {section.sectionNumber}.1.{itemIndex + 1}
                                  </span>
                                  {item}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(index, itemIndex)}
                                  className="shrink-0 rounded-lg border border-rose-200 bg-white p-2 text-rose-600 hover:bg-rose-50"
                                >
                                  <Minus className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-400">
                              Энэ хэсэг хоосон байна.
                            </div>
                          )}

                          {Object.prototype.hasOwnProperty.call(newClauseDrafts, index) ? (
                            <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3">
                              <input
                                type="text"
                                value={newClauseDrafts[index]}
                                onChange={(event) => handleDraftChange(index, event.target.value)}
                                placeholder="Шинэ заалтаа бичнэ үү..."
                                className="h-11 flex-1 rounded-xl border border-blue-200 bg-white px-4 text-sm text-gray-800 outline-none ring-0 placeholder:text-gray-400 focus:border-blue-400"
                              />
                              <button
                                type="button"
                                onClick={() => handleConfirmAddItem(index)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-white hover:bg-emerald-600"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleCancelAddItem(index)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartAddItem(index)}
                              className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50"
                            >
                              <Plus className="h-4 w-4" />
                              Нэмэх
                            </button>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            {showPreview ? (
              <div className="overflow-hidden rounded-[28px] bg-neutral-700/80 p-3 shadow-2xl sm:p-4">
                {previewUrl ? (
                  <iframe
                    title={`${name || "Шинэ загвар"} урьдчилсан харагдац`}
                    src={previewUrl}
                    className="h-[calc(100vh-180px)] min-h-[720px] w-full rounded-2xl border-0 bg-white"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <div className="mx-auto min-h-[1123px] w-[794px] max-w-full bg-white px-10 py-14 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:px-16 sm:py-20">
                      <div className="mb-10 text-center">
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-gray-500">
                          Түрээсийн гэрээний загвар
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold uppercase text-gray-900">
                          {name || "Шинэ загвар"}
                        </h2>
                      </div>

                      <div className="min-h-[880px] whitespace-pre-wrap text-[18px] leading-10 text-gray-900">
                        {buildTemplateContent()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NewTemplatePage;
