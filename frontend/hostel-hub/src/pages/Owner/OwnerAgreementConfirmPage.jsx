import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ExternalLink, FileText, RotateCcw } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import DashboardLayout from "../../components/layout/DashboardLayout";
import axiosInstance from "../../utils/axiosInstance";
import { API_PATHS } from "../../utils/apiPaths";
import { ROUTES } from "../../utils/routePaths";
import { useAuth } from "../../context/AuthContext";

const FALLBACK_SECTIONS = [
  { sectionNumber: "4", title: "Түрээслүүлэгчийн эрх үүрэг", items: [] },
  { sectionNumber: "5", title: "Түрээслэгчийн эрх үүрэг", items: [] },
  { sectionNumber: "6", title: "Талуудын хүлээх хариуцлага", items: [] },
  { sectionNumber: "7", title: "Гэрээ цуцлах", items: [] },
  { sectionNumber: "8", title: "Бусад", items: [] },
];

const STEPS = [
  "Заалтууд хянах",
  "Эзэмшигчийн мэдээлэл",
  "Гарын үсэг",
  "Дуусгах",
];

const parseTemplateContentToSections = (content = "") => {
  const lines = String(content || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sectionMap = new Map(
    FALLBACK_SECTIONS.map((section) => [
      section.sectionNumber,
      {
        ...section,
        items: [],
      },
    ]),
  );

  lines.forEach((line) => {
    const sectionMatch = line.match(/^(\d+)\.\s+(.+)$/);
    const clauseMatch = line.match(/^(\d+)\.1\.(\d+)\s+(.+)$/);

    if (sectionMatch && !clauseMatch) {
      const [_, sectionNumber, title] = sectionMatch;

      if (sectionMap.has(sectionNumber)) {
        sectionMap.set(sectionNumber, {
          ...(sectionMap.get(sectionNumber) || {}),
          sectionNumber,
          title,
          items: sectionMap.get(sectionNumber)?.items || [],
        });
      }

      return;
    }

    if (clauseMatch) {
      const sectionNumber = clauseMatch[1];
      const itemText = clauseMatch[3];

      if (!sectionMap.has(sectionNumber)) {
        return;
      }

      sectionMap.set(sectionNumber, {
        ...(sectionMap.get(sectionNumber) || {}),
        items: [...(sectionMap.get(sectionNumber)?.items || []), itemText],
      });
    }
  });

  return FALLBACK_SECTIONS.map(
    (section) => sectionMap.get(section.sectionNumber) || section,
  );
};

const OwnerAgreementConfirmPage = () => {
  const { inquiryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [inquiry, setInquiry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [ownerName, setOwnerName] = useState(user?.name || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState("");
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const loadInquiry = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(API_PATHS.INQUIRIES.GET_BY_ID(inquiryId));

        if (!isMounted) {
          return;
        }

        setInquiry(response.data || null);
      } catch (error) {
        console.error("Failed to load owner inquiry confirmation", error);
        toast.error(error?.response?.data?.message || "Гэрээ баталгаажуулах мэдээлэл ачаалж чадсангүй.");
        if (isMounted) {
          setInquiry(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (inquiryId) {
      loadInquiry();
    }

    return () => {
      isMounted = false;
    };
  }, [inquiryId]);

  useEffect(() => {
    if (!user?.name) {
      return;
    }

    setOwnerName((current) => current || user.name);
  }, [user?.name]);

  useEffect(() => {
    if (currentStep !== 2 || !canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 2;
    context.strokeStyle = "#0f172a";
  }, [currentStep]);

  const sections = useMemo(
    () => parseTemplateContentToSections(inquiry?.listing?.leaseTemplateContent || ""),
    [inquiry?.listing?.leaseTemplateContent],
  );

  const getCanvasPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in event ? event.touches[0].clientX : event.clientX;
    const clientY = "touches" in event ? event.touches[0].clientY : event.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    if (!canvasRef.current) {
      return;
    }

    const context = canvasRef.current.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    context.beginPath();
    context.moveTo(x, y);
    isDrawingRef.current = true;
    setHasSignature(true);
  };

  const draw = (event) => {
    if (!isDrawingRef.current || !canvasRef.current) {
      return;
    }

    if ("touches" in event) {
      event.preventDefault();
    }

    const context = canvasRef.current.getContext("2d");
    const { x, y } = getCanvasPoint(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current || !canvasRef.current) {
      return;
    }

    const context = canvasRef.current.getContext("2d");
    context.closePath();
    isDrawingRef.current = false;
    setSignatureDataUrl(canvasRef.current.toDataURL("image/png"));
  };

  const clearSignature = () => {
    if (!canvasRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl("");
  };

  const getSignatureDataUrl = () => {
    if (signatureDataUrl) {
      return signatureDataUrl;
    }

    if (!canvasRef.current || !hasSignature) {
      return "";
    }

    return canvasRef.current.toDataURL("image/png");
  };

  const handleViewPdf = async () => {
    if (!inquiryId) {
      toast.error("Загварын урьдчилсан харагдац боломжгүй байна.");
      return;
    }

    try {
      setDownloading(true);
      const response = await axiosInstance.post(API_PATHS.INQUIRIES.AGREEMENT_PREVIEW(inquiryId), {
        ownerAgreementDetails: {
          fullName: ownerName,
          phoneNumber,
          signatureDataUrl: getSignatureDataUrl(),
        },
      });
      const previewUrl = response.data?.previewUrl;

      if (!previewUrl) {
        toast.error("PDF урьдчилсан харагдац бэлтгэж чадсангүй.");
        return;
      }

      window.open(previewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      console.error("Failed to open agreement pdf", error);
      toast.error(error?.response?.data?.message || "PDF урьдчилсан харагдац нээж чадсангүй.");
    } finally {
      setDownloading(false);
    }
  };

  const handleStepNext = () => {
    if (currentStep === 0 && !accepted) {
      toast.error("Үргэлжлүүлэхийн өмнө зөвшөөрөх тэмдэглэгээг хийнэ үү.");
      return;
    }

    if (currentStep === 1 && (!ownerName.trim() || !phoneNumber.trim())) {
      toast.error("Овог нэр болон утасны дугаараа оруулна уу.");
      return;
    }

    if (currentStep === 2 && !hasSignature) {
      toast.error("Үргэлжлүүлэхийн өмнө гарын үсгээ зурна уу.");
      return;
    }

    if (currentStep < 3) {
      if (currentStep === 2 && canvasRef.current) {
        setSignatureDataUrl(canvasRef.current.toDataURL("image/png"));
      }

      setCurrentStep((current) => current + 1);
    }
  };

  const handleStepBack = () => {
    if (currentStep > 0) {
      setCurrentStep((current) => current - 1);
    }
  };

  const handleFinish = async () => {
    try {
      setSubmitting(true);
      await axiosInstance.post(API_PATHS.INQUIRIES.CONFIRM_WITH_AGREEMENT(inquiryId), {
        fullName: ownerName,
        phoneNumber,
        signatureDataUrl: getSignatureDataUrl(),
      });
      toast.success("Хүсэлт амжилттай баталгаажлаа.");
      navigate(ROUTES.INQUIRIES);
    } catch (error) {
      console.error("Failed to confirm inquiry with agreement", error);
      toast.error(error?.response?.data?.message || "Хүсэлт баталгаажуулж чадсангүй.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderStepContent = () => {
    if (currentStep === 0) {
      return (
        <>
          <div className="space-y-5 px-6 py-6">
            {sections.map((section) => (
              <div
                key={section.sectionNumber}
                className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <h2 className="text-lg font-semibold text-slate-900">
                  {section.sectionNumber}. {section.title}
                </h2>

                {section.items.length > 0 ? (
                  <div className="mt-4 space-y-3">
                    {section.items.map((item, index) => (
                      <div
                        key={`${section.sectionNumber}-${index}`}
                        className="rounded-2xl border border-white bg-white px-4 py-3 text-sm leading-7 text-slate-700 shadow-sm"
                      >
                        <span className="font-semibold text-slate-900">
                          {section.sectionNumber}.1.{index + 1}
                        </span>{" "}
                        {item}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">Энэ хэсэгт заалт нэмээгүй байна.</p>
                )}
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 px-6 py-6">
            <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Би түрээсийн гэрээний заалтуудыг уншиж танилцсан бөгөөд дээрх нөхцөлийг ойлгож байна.
              </span>
            </label>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={handleStepNext}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Дараах
              </button>
            </div>
          </div>
        </>
      );
    }

    if (currentStep === 1) {
      return (
        <div className="px-6 py-8">
          <div className="mx-auto max-w-2xl rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
              Түрээслүүлэгч
            </p>

            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Овог нэр
                </label>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="Овог нэрээ бичнэ үү"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Утасны дугаар
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(event) => setPhoneNumber(event.target.value)}
                  placeholder="Утасны дугаараа бичнэ үү"
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStepBack}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Буцах
            </button>
            <button
              type="button"
              onClick={handleStepNext}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Дараах
            </button>
          </div>
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className="px-6 py-8">
          <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Гарын үсгээ зурна уу</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Доорх хоосон талбайд гарын үсгээ зурна уу.
                </p>
              </div>

              <button
                type="button"
                onClick={clearSignature}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <RotateCcw className="h-4 w-4" />
                Арилгах
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border-2 border-dashed border-slate-200 bg-slate-50 p-4">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="signature-canvas h-[420px] w-full rounded-[20px] border border-slate-200"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleStepBack}
              className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Буцах
            </button>
            <button
              type="button"
              onClick={handleStepNext}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Дараах
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="px-6 py-8">
        <div className="mx-auto max-w-3xl rounded-[28px] border border-slate-200 bg-slate-50 p-8 text-center shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Баталгаажуулах мэдээлэл бэлэн</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Таны эзэмшигчийн мэдээлэл болон гарын үсэг бэлэн боллоо. Загварыг дахин хянаад баталгаажуулалтыг дуусгана уу.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleStepBack}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Буцах
            </button>
            <button
              type="button"
              onClick={handleViewPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              Гэрээ харах
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting ? "Дуусгаж байна..." : "Дуусгах"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <DashboardLayout activeMenu="inquiries">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
            <p className="mt-3 text-sm text-slate-500">Гэрээ баталгаажуулах мэдээлэл ачаалж байна...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!inquiry) {
    return (
      <DashboardLayout activeMenu="inquiries">
        <div className="mx-auto max-w-3xl px-4 pb-10 pt-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-semibold text-slate-900">Хүсэлт олдсонгүй</h1>
            <p className="mt-3 text-sm text-slate-500">
              Энэ хүсэлт одоогоор боломжгүй байна.
            </p>
            <Link
              to={ROUTES.INQUIRIES}
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <ArrowLeft className="h-4 w-4" />
              Хүсэлтүүд рүү буцах
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeMenu="inquiries">
      <div className="mx-auto max-w-5xl px-4 pb-12 pt-8">
        <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_24px_80px_-36px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-6">
            <div>
              <Link
                to={ROUTES.INQUIRIES}
                className="inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Хүсэлтүүд рүү буцах
              </Link>
              <h1 className="mt-4 text-3xl font-semibold text-slate-900">
                Хүсэлтийн гэрээ баталгаажуулах
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {inquiry?.listing?.title || "Зар"} • {inquiry?.listing?.leaseTemplateName || "Загвар"}
              </p>
            </div>

            <button
              type="button"
              onClick={handleViewPdf}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FileText className="h-4 w-4" />
              <span>PDF-ээр харах</span>
              <ExternalLink className="h-4 w-4" />
            </button>
          </div>

          <div className="border-b border-slate-200 px-6 py-4">
            <div className="grid gap-3 md:grid-cols-4">
              {STEPS.map((stepLabel, index) => (
                <div
                  key={stepLabel}
                  className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
                    index === currentStep
                      ? "border-blue-200 bg-blue-50 text-blue-700"
                      : index < currentStep
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-500"
                  }`}
                >
                  {index + 1}. {stepLabel}
                </div>
              ))}
            </div>
          </div>

          {renderStepContent()}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default OwnerAgreementConfirmPage;
