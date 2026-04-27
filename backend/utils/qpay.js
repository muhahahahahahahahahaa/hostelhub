const getQPayBaseUrl = () =>
    process.env.QPAY_BASE_URL || "https://merchant-sandbox.qpay.mn";

const getQPayAccessToken = () =>
    process.env.QPAY_ACCESS_TOKEN || process.env.QPAY_API_TOKEN || "";

const getQPayInvoiceCode = () =>
    process.env.QPAY_INVOICE_CODE || "TEST_INVOICE";

const getQPayClientId = () =>
    process.env.QPAY_CLIENT_ID || "";

const getQPayClientSecret = () =>
    process.env.QPAY_CLIENT_SECRET || "";

let cachedOAuthToken = "";
let cachedOAuthTokenExpiresAt = 0;

const normalizeUrl = (value = "") => String(value || "").replace(/\/+$/, "");

const buildBearerHeaders = (accessToken) => {
    if (!accessToken) {
        throw new Error("QPay access token is not configured");
    }

    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
    };
};

const getCachedOAuthTokenIfValid = () => {
    if (!cachedOAuthToken || Date.now() >= cachedOAuthTokenExpiresAt) {
        return "";
    }

    return cachedOAuthToken;
};

const fetchQPayAccessToken = async () => {
    const clientId = getQPayClientId();
    const clientSecret = getQPayClientSecret();

    if (!clientId || !clientSecret) {
        throw new Error(
            "QPay token is invalid or expired. Configure QPAY_CLIENT_ID and QPAY_CLIENT_SECRET to auto-refresh it."
        );
    }

    const basicToken = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const response = await fetch(`${normalizeUrl(getQPayBaseUrl())}/v2/auth/token`, {
        method: "POST",
        headers: {
            Authorization: `Basic ${basicToken}`,
        },
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(payload?.message || "Failed to fetch QPay access token");
    }

    const nextAccessToken = String(payload?.access_token || payload?.token || "").trim();
    const expiresInSeconds = Number(payload?.expires_in || 0);

    if (!nextAccessToken) {
        throw new Error("QPay auth response did not include an access token");
    }

    cachedOAuthToken = nextAccessToken;
    cachedOAuthTokenExpiresAt = Date.now() + Math.max(30, expiresInSeconds - 60) * 1000;

    return nextAccessToken;
};

const resolveQPayAccessToken = async (forceRefresh = false) => {
    if (!forceRefresh) {
        const configuredAccessToken = getQPayAccessToken();
        if (configuredAccessToken) {
            return configuredAccessToken;
        }

        const cachedToken = getCachedOAuthTokenIfValid();
        if (cachedToken) {
            return cachedToken;
        }
    }

    return fetchQPayAccessToken();
};

const qpayJsonRequest = async (requestPath, body) => {
    const execute = async (forceRefresh = false) => {
        const accessToken = await resolveQPayAccessToken(forceRefresh);
        const response = await fetch(`${normalizeUrl(getQPayBaseUrl())}${requestPath}`, {
            method: "POST",
            headers: buildBearerHeaders(accessToken),
            body: JSON.stringify(body),
        });

        const payload = await response.json().catch(() => ({}));

        if (response.status === 401 && !forceRefresh && getQPayClientId() && getQPayClientSecret()) {
            return execute(true);
        }

        if (!response.ok) {
            const upstreamMessage =
                payload?.message ||
                payload?.error ||
                payload?.description ||
                payload?.msg ||
                "QPay request failed";

            if (response.status === 401) {
                throw new Error(
                    `${upstreamMessage}. QPay access token may be invalid or expired.`
                );
            }

            throw new Error(upstreamMessage);
        }

        return payload;
    };

    return execute(false);
};

const createQPayInvoice = async ({
    inquiryId,
    amount,
    description,
    customerCode,
    callbackUrl = "",
}) => {
    const senderInvoiceNo = `inquiry-${inquiryId}-${Date.now()}`;
    const payload = await qpayJsonRequest("/v2/invoice", {
        invoice_code: getQPayInvoiceCode(),
        sender_invoice_no: senderInvoiceNo,
        invoice_receiver_code: customerCode || `renter-${inquiryId}`,
        invoice_description: description,
        amount,
        callback_url: callbackUrl,
    });

    return {
        invoiceId: String(payload?.invoice_id || payload?.invoiceId || ""),
        senderInvoiceNo,
        qrText: String(payload?.qr_text || payload?.qrText || ""),
        qrImage: String(payload?.qr_image || payload?.qrImage || ""),
        urls: Array.isArray(payload?.urls) ? payload.urls : [],
        raw: payload,
    };
};

const checkQPayPayment = async ({ invoiceId, objectType = "INVOICE" }) => {
    if (!invoiceId) {
        throw new Error("QPay invoice id is required");
    }

    const payload = await qpayJsonRequest("/v2/payment/check", {
        object_type: objectType,
        object_id: invoiceId,
        offset: {
            page_number: 1,
            page_limit: 100,
        },
    });

    const rows = Array.isArray(payload?.rows)
        ? payload.rows
        : Array.isArray(payload?.payments)
          ? payload.payments
          : [];

    const paidRow =
        rows.find((row) => {
            const paymentStatus = String(
                row?.payment_status || row?.paymentStatus || row?.status || ""
            ).toLowerCase();

            return ["paid", "success", "completed"].includes(paymentStatus);
        }) || rows[0] || null;

    return {
        paid: Boolean(
            paidRow &&
                ["paid", "success", "completed"].includes(
                    String(
                        paidRow?.payment_status || paidRow?.paymentStatus || paidRow?.status || ""
                    ).toLowerCase()
                )
        ),
        paidAt:
            paidRow?.paid_at ||
            paidRow?.paidAt ||
            paidRow?.payment_date ||
            paidRow?.created_at ||
            null,
        raw: payload,
    };
};

module.exports = {
    getQPayBaseUrl,
    getQPayInvoiceCode,
    fetchQPayAccessToken,
    createQPayInvoice,
    checkQPayPayment,
};
