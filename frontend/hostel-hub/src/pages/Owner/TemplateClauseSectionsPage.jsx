import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronRight, Minus, Plus, Save, X } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { ROUTES } from "../../utils/routePaths";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const CLAUSE_SECTIONS = [
  {
    sectionNumber: "4",
    title: "Түрээслүүлэгчийн эрх үүрэг",
    items: [
      "Түрээслүүлэгч нь ашиглалтын шаардлага хангасан, биет байдлын болон эрхийн зөрчилгүй хөрөнгийг Түрээслэгчийн эзэмшил ашиглалтад шилжүүлэх үүрэгтэй.",
      "Түрээслүүлэгч нь хөрөнгийн түрээсийн төлбөрийг Түрээслэгчээс шаардах эрхтэй.",
      "Түрээслэгч Гэрээнд заасан үүргээ биелүүлээгүйгээс өөрт учирсан хохирлыг нөхөн төлүүлэхээр шаардах эрхтэй.",
    ],
  },
  {
    sectionNumber: "5",
    title: "Түрээслэгчийн эрх үүрэг",
    items: [
      "Хөрөнгийг Гэрээнд заасан нөхцөл болон зориулалтын дагуу ашиглах үүрэгтэй.",
      "Гэрээнд заасан хугацаанд түрээсийн төлбөрийг төлөх үүрэгтэй.",
      "Гэрээ дуусгавар болоход хөрөнгийн хэвийн элэгдэл хорогдлыг тооцон, бүрэн бүтэн байдлаар буцаан хүлээлгэн өгөх үүрэгтэй.",
      "Энэхүү Гэрээтэй холбоотой аливаа зардлыг Түрээслэгч хариуцах бөгөөд хөрөнгийн ашиглалтын бүхий л зардлыг хариуцах үүрэгтэй.",
      "Түрээслэгч Түрээслүүлэгчийн зөвшөөрөлгүй хөрөнгийг бусдад давхар түрээслэх, худалдаалахыг хориглоно.",
    ],
  },
  {
    sectionNumber: "6",
    title: "Талуудын хүлээх хариуцлага",
    items: [
      "Талууд энэхүү гэрээнд заасан үүргээ гүйцэтгээгүй тохиолдолд хугацаа хэтрүүлсэн хоног тутамд Гэрээний үнийн дүнгийн 0.1 хувьтай тэнцэх алданги төлнө.",
      "Гэрээгээр хүлээсэн үүргээ биелүүлээгүйгээс учирсан хохирлыг гэм буруутай тал нь нөгөө талд төлөх үүрэгтэй.",
      "Хэрэв талуудын хооронд маргаан гарвал талууд эвийн журмаар шийдвэрлэх ба шийдвэрлэж чадахгүй бол Үндэсний ба олон улсын худалдааны арбитраар эцэслэн шийдвэрлүүлнэ.",
    ],
  },
  {
    sectionNumber: "7",
    title: "Гэрээ цуцлах",
    items: [
      "Гэрээний аль нэг тал Гэрээнд заасан үүргээ биелүүлээгүй тохиолдолд Гэрээг нэг талын санаачлагаар цуцална.",
      "Гэрээг цуцалсан тохиолдолд гэм буруутай тал бусдад учирсан хохирол болон нөгөө талд учирсан хохирлыг өөрийн зардлаар арилгана.",
      "Талууд Гэрээг цуцалсан тохиолдолд Түрээслэгч хөрөнгийг бүрэн бүтэн, эвдрэл гэмтэлгүйгээр Түрээслүүлэгчийн өмчлөлд 7 хоногийн дотор шилжүүлэн өгнө.",
    ],
  },
  {
    sectionNumber: "8",
    title: "Бусад",
    items: [
      "Талууд энэхүү Гэрээнд гарын үсэг зурснаар хүчин төгөлдөр болно.",
      "Талууд Гэрээнд нэмэлт, өөрчлөлт оруулж болно.",
      "Гэрээний нэмэлт, өөрчлөлт нь зөвхөн бичгээр хийгдэж, Талуудын гарын үсэг зурснаар хүчин төгөлдөр болно.",
    ],
  },
];

const parseTemplateContentToSections = (content = "", fallbackSections = CLAUSE_SECTIONS) => {
  const lines = String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return fallbackSections;
  }

  const sectionMap = new Map(
    fallbackSections.map((section) => [
      String(section.sectionNumber),
      {
        sectionNumber: String(section.sectionNumber),
        title: section.title,
        items: [],
      },
    ]),
  );

  lines.forEach((line) => {
    const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    const clauseMatch = line.match(/^(\d+)\.1\.(\d+)\s+(.+)$/);

    if (sectionMatch && !clauseMatch) {
      const [_, sectionNumber, title] = sectionMatch;
      const existingSection = sectionMap.get(sectionNumber);

      sectionMap.set(sectionNumber, {
        sectionNumber,
        title,
        items: existingSection?.items || [],
      });
      return;
    }

    if (clauseMatch) {
      const sectionNumber = clauseMatch[1];
      const clauseText = clauseMatch[3];
      const existingSection = sectionMap.get(sectionNumber);

      if (!existingSection) {
        return;
      }

      existingSection.items.push(clauseText);
    }
  });

  return fallbackSections.map((section) => {
    const parsedSection = sectionMap.get(String(section.sectionNumber));

    return parsedSection
      ? {
          sectionNumber: parsedSection.sectionNumber,
          title: parsedSection.title,
          items: parsedSection.items,
        }
      : section;
  });
};

const TemplateClauseSectionsPage = () => {
  const { templateName } = useParams();
  const decodedTemplateName = decodeURIComponent(templateName || "");
  const { user, updateUser } = useAuth();
  const [openSectionIndex, setOpenSectionIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [newClauseDrafts, setNewClauseDrafts] = useState({});
  const templates = useMemo(() => user?.leaseAgreementTemplates || [], [user]);

  const currentTemplateIndex = templates.findIndex(
    (template) => template.name === decodedTemplateName,
  );
  const currentTemplate = currentTemplateIndex >= 0 ? templates[currentTemplateIndex] : null;
  const previewSourceTemplate =
    currentTemplate?.url
      ? currentTemplate
      : templates.find((template) => template.isDefault && template.url) ||
        templates.find((template) => template.url) ||
        null;
  const [sections, setSections] = useState(() =>
    parseTemplateContentToSections(currentTemplate?.content, CLAUSE_SECTIONS),
  );

  useEffect(() => {
    setSections(parseTemplateContentToSections(currentTemplate?.content, CLAUSE_SECTIONS));
    setNewClauseDrafts({});
    setShowPreview(false);
    setPreviewUrl("");
  }, [currentTemplate?.content, currentTemplate?.name]);

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
    if (!currentTemplate) {
      toast.error("Template not found.");
      return;
    }

    const nextContent = buildTemplateContent().trim();

    if (!nextContent) {
      toast.error("At least one clause is required.");
      return;
    }

    const leaseAgreementTemplates = templates.map((template, index) =>
      index === currentTemplateIndex
        ? {
            ...template,
            content: nextContent,
          }
        : template,
    );

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
      toast.success("Template clauses updated successfully.");
    } catch (error) {
      console.error("Clause update failed", error);
      toast.error(error?.response?.data?.message || "Failed to save clauses.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreviewToggle = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }

    if (!buildTemplateContent().trim()) {
      toast.error("Preview content is empty.");
      return;
    }

    if (!previewSourceTemplate?.url) {
      setPreviewUrl("");
      setShowPreview(true);
      return;
    }

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
      console.error("Section preview failed", error);
      toast.error(error?.response?.data?.message || "Failed to generate preview.");
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
                Back to owner profile
              </Link>
              <h1 className="mt-2 text-xl font-semibold text-white">Гэрээний заалтын хэсгүүд</h1>
              <p className="mt-1 text-sm text-neutral-300">{decodedTemplateName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePreviewToggle}
                disabled={previewLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
              >
                {previewLoading ? "Preview бэлдэж байна..." : showPreview ? "Preview хаах" : "Preview"}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white hover:bg-white/15"
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving..." : "Хадгалах"}
              </button>
            </div>
          </div>

          <div className={`grid gap-6 ${showPreview ? "xl:grid-cols-[minmax(0,0.92fr)_minmax(420px,1.08fr)]" : "grid-cols-1"}`}>
            <div className={`rounded-3xl border border-gray-200 bg-white p-4 shadow-sm transition-all sm:p-6 ${showPreview ? "xl:sticky xl:top-6 xl:max-h-[calc(100vh-120px)] xl:overflow-y-auto" : ""}`}>
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
                          {section.items.map((item, itemIndex) => (
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
                          ))}
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
                    title={`${decodedTemplateName} preview`}
                    src={previewUrl}
                    className="h-[calc(100vh-180px)] min-h-[720px] w-full rounded-2xl border-0 bg-white"
                  />
                ) : (
                  <div className="overflow-x-auto">
                    <div className="mx-auto min-h-[1123px] w-[794px] max-w-full bg-white px-10 py-14 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:px-16 sm:py-20">
                      <div className="mb-10 text-center">
                        <p className="text-sm font-medium uppercase tracking-[0.25em] text-gray-500">
                          Clause Preview
                        </p>
                        <h2 className="mt-4 text-3xl font-semibold uppercase text-gray-900">
                          {decodedTemplateName}
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

export default TemplateClauseSectionsPage;
