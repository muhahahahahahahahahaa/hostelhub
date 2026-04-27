import { ArrowLeft, Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import { ROUTES } from "../../utils/routePaths";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";

const parseTemplateContentToSections = (content = "") => {
  const lines = String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections = [];
  let currentSection = null;

  lines.forEach((line) => {
    const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    const clauseMatch = line.match(/^(\d+)\.1\.(\d+)\s+(.+)$/);

    if (sectionMatch && !clauseMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }

      currentSection = {
        sectionNumber: sectionMatch[1],
        title: sectionMatch[2],
        items: [],
      };
      return;
    }

    if (clauseMatch && currentSection && currentSection.sectionNumber === clauseMatch[1]) {
      currentSection.items.push(clauseMatch[3]);
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
};

const ViewTemplatePage = () => {
  const { templateName } = useParams();
  const decodedTemplateName = decodeURIComponent(templateName || "");
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const allTemplates = user?.leaseAgreementTemplates || [];

  const currentTemplate = allTemplates.find(
    (template) => template.name === decodedTemplateName,
  );
  const previewSourceTemplate =
    currentTemplate?.url
      ? currentTemplate
      : allTemplates.find((template) => template.isDefault && template.url) ||
        allTemplates.find((template) => template.url) ||
        null;

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      if (!previewSourceTemplate?.url) {
        setPreviewUrl("");
        return;
      }

      setIsLoadingPreview(true);

      try {
        const savedSections = parseTemplateContentToSections(currentTemplate.content);
        const response =
          savedSections.length > 0
            ? await axiosInstance.post(
                API_PATHS.USER.TEMPLATE_SECTION_PREVIEW(
                  encodeURIComponent(previewSourceTemplate.name),
                ),
                {
                  sections: savedSections,
                },
              )
            : await axiosInstance.get(
                API_PATHS.USER.TEMPLATE_PREVIEW(
                  encodeURIComponent(previewSourceTemplate.name),
                ),
              );

        if (isMounted) {
          setPreviewUrl(response.data?.previewUrl || "");
        }
      } catch (error) {
        console.error("Failed to load template preview", error);
        if (isMounted) {
          setPreviewUrl("");
        }
      } finally {
        if (isMounted) {
          setIsLoadingPreview(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [
    currentTemplate?.content,
    previewSourceTemplate?.name,
    previewSourceTemplate?.url,
  ]);

  if (!currentTemplate) {
    return (
      <DashboardLayout activeMenu="owner-profile">
        <div className="min-h-screen bg-gray-50 px-4 py-8">
          <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">Template not found</h1>
            <p className="mt-2 text-sm text-gray-500">
              The template you are trying to view does not exist anymore.
            </p>
            <Link
              to={ROUTES.OWNER_PROFILE}
              className="mt-6 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to profile
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="owner-profile">
      <div className="min-h-screen bg-neutral-800 px-3 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-6xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-900/80 px-4 py-3 text-white shadow-lg">
            <div>
              <Link
                to={ROUTES.OWNER_PROFILE}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-200 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to owner profile
              </Link>
              <h1 className="mt-2 text-xl font-semibold text-white">View Template</h1>
              <p className="mt-1 text-sm text-neutral-300">
                Print this page or save it as PDF from your browser.
              </p>
            </div>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              Save as PDF
            </button>
          </div>

          <div className="overflow-x-auto rounded-[28px] bg-neutral-700/80 p-3 shadow-2xl sm:p-6">
            <div className="mx-auto min-h-[1123px] w-[794px] max-w-full bg-white px-10 py-14 shadow-[0_24px_70px_rgba(0,0,0,0.35)] sm:px-16 sm:py-20">
              <div className="mb-10 text-center">
                <p className="text-sm font-medium uppercase tracking-[0.25em] text-gray-500">
                  Lease Agreement Template
                </p>
                <h2 className="mt-4 text-3xl font-semibold uppercase text-gray-900">
                  {currentTemplate.name}
                </h2>
              </div>

              {previewUrl ? (
                <iframe
                  title={currentTemplate.name}
                  src={previewUrl}
                  className="min-h-[880px] w-full border-0"
                />
              ) : isLoadingPreview ? (
                <div className="flex min-h-[880px] items-center justify-center text-center text-base text-gray-500">
                  Loading template preview...
                </div>
              ) : currentTemplate.content ? (
                <div className="min-h-[880px] whitespace-pre-wrap text-[18px] leading-10 text-gray-900">
                  {currentTemplate.content}
                </div>
              ) : currentTemplate.url ? (
                <div className="flex min-h-[880px] items-center justify-center text-center text-base leading-8 text-gray-500">
                  This file preview could not be loaded right now.
                </div>
              ) : (
                <div className="flex min-h-[880px] items-center justify-center text-center text-base text-gray-500">
                  This template does not have any content to display yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ViewTemplatePage;
