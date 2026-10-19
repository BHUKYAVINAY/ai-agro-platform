
const API_URL =
    import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function apiRequest(
    path,
    getToken,
    options = {}
) {
    const token = await getToken();

    if (!token) {
        throw new Error("Please sign in again.");
    }

    const headers = {
        Authorization: `Bearer ${token}`,
        ...options.headers
    };

    let body = options.body;

    // Handle JSON objects and FormData correctly.
    if (body instanceof FormData) {
        // The browser must set the multipart boundary.
        delete headers["Content-Type"];
    } else if (body !== undefined) {
        headers["Content-Type"] =
            headers["Content-Type"] || "application/json";

        if (
            headers["Content-Type"].includes("application/json") &&
            typeof body !== "string"
        ) {
            body = JSON.stringify(body);
        }
    }

    const response = await fetch(`${API_URL}${path}`, {
        ...options,
        body,
        headers
    });

    const contentType = response.headers.get("content-type") || "";

    const data = contentType.includes("application/json")
        ? await response.json()
        : null;

    if (!response.ok) {
        throw new Error(
            data?.message || `Request failed (${response.status}).`
        );
    }

    return data;
}

export default apiRequest;
