/**
 * HTML Sanitization Utility
 * Prevents XSS attacks by escaping HTML special characters
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param input - The string to escape
 * @returns The escaped string safe for insertion into HTML
 */
export function escapeHtml(input: any): string {
    const s = String(input ?? "");
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Escapes HTML for use in HTML attributes (including single quotes for onclick handlers)
 * @param input - The string to escape
 * @returns The escaped string safe for insertion into HTML attributes
 */
export function escapeHtmlAttribute(input: any): string {
    const s = String(input ?? "");
    return s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\\/g, "&#x5C;");
}

/**
 * Sanitizes a URL to prevent javascript: protocol and other XSS vectors
 * @param url - The URL to sanitize
 * @returns The sanitized URL or empty string if unsafe
 */
export function sanitizeUrl(url: string): string {
    if (!url) return "";
    const trimmed = url.trim().toLowerCase();
    if (trimmed.startsWith("javascript:") || trimmed.startsWith("data:") || trimmed.startsWith("vbscript:")) {
        return "";
    }
    return url;
}
