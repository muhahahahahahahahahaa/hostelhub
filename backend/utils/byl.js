const BYL_API_BASE_URL = "https://byl.mn/api";

const normalizeUrl = (value = "") => String(value || "").trim().replace(/\/+$/, "");

const getBylProjectId = () => String(process.env.BYL_PROJECT_ID || "").trim();

const getBylToken = () =>
    String(process.env.BYL_TOKEN || process.env.BYL_API_TOKEN || "").trim();

const getBylWebhookSecret = () =>
    String(process.env.BYL_WEBHOOK_SECRET || "").trim();

const getFrontendBaseUrl = () =>
    normalizeUrl(
        process.env.FRONTEND_URL ||
            process.env.APP_PUBLIC_URL ||
            process.env.CLIENT_URL ||
            "http://localhost:5173"
    );

const buildDefaultRedirectUrl = (path = "/profile") =>
    `${getFrontendBaseUrl()}${String(path || "/profile").startsWith("/") ? path : `/${path}`}`;

const getBylSuccessUrl = (inquiryId) =>
    String(process.env.BYL_SUCCESS_URL || "").trim() ||
    buildDefaultRedirectUrl(`/renter/inquiries/${inquiryId}/agreement`);

const getBylCancelUrl = (inquiryId) =>
    String(process.env.BYL_CANCEL_URL || "").trim() ||
    buildDefaultRedirectUrl(`/renter/inquiries/${inquiryId}/agreement`);

const buildBylHeaders = () => {
    const token = getBylToken();

    if (!token) {
        throw new Error("Byl API token is not configured");
    }

    return {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
};

const getProjectApiPath = (path = "") => {
    const projectId = getBylProjectId();

    if (!projectId) {
        throw new Error("Byl project id is not configured");
    }

    return `/v1/projects/${projectId}${path}`;
};

const bylJsonRequest = async (requestPath, { method = "GET", body } = {}) => {
    const response = await fetch(`${BYL_API_BASE_URL}${requestPath}`, {
        method,
        headers: buildBylHeaders(),
        body: body ? JSON.stringify(body) : undefined,
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        if (response.status === 401) {
            throw new Error("Byl API authentication failed. Check BYL_TOKEN.");
        }

        throw new Error(
            payload?.message ||
                payload?.error ||
                payload?.description ||
                "Byl request failed"
        );
    }

    return payload;
};

const createBylCheckout = async ({
    inquiryId,
    amount,
    description,
    customerEmail,
}) => {
    const clientReferenceId = `inquiry:${inquiryId}`;
    const payload = await bylJsonRequest(getProjectApiPath("/checkouts"), {
        method: "POST",
        body: {
            success_url: getBylSuccessUrl(inquiryId),
            cancel_url: getBylCancelUrl(inquiryId),
            customer_email: customerEmail || undefined,
            phone_number_collection: true,
            delivery_address_collection: false,
            allow_promotion_codes: false,
            client_reference_id: clientReferenceId,
            items: [
                {
                    price_data: {
                        unit_amount: amount,
                        product_data: {
                            name: description || "Hostel booking payment",
                            client_reference_id: String(inquiryId),
                        },
                    },
                    quantity: 1,
                },
            ],
        },
    });

    const checkout = payload?.data || {};

    return {
        checkoutId: String(checkout?.id || ""),
        checkoutUrl: String(checkout?.url || ""),
        clientReferenceId,
        status: String(checkout?.status || "open"),
        expiresAt: checkout?.expires_at || null,
        raw: payload,
    };
};

const checkBylCheckout = async ({ checkoutId }) => {
    if (!checkoutId) {
        throw new Error("Byl checkout id is required");
    }

    const payload = await bylJsonRequest(getProjectApiPath(`/checkouts/${checkoutId}`));
    const checkout = payload?.data || {};
    const status = String(checkout?.status || "").toLowerCase();

    return {
        paid: status === "complete" || status === "completed",
        expired: status === "expired",
        paidAt:
            checkout?.paid_at ||
            checkout?.updated_at ||
            checkout?.created_at ||
            null,
        checkoutUrl: String(checkout?.url || ""),
        status,
        raw: payload,
    };
};

module.exports = {
    getBylWebhookSecret,
    createBylCheckout,
    checkBylCheckout,
};
