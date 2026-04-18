/**
 * Public Lichess HTTP APIs (no token required for these endpoints).
 * For authenticated calls, set localStorage key `lichessToken` (Bearer)
 * and use fetchLichessAuthed().
 */

const EXPLORER = "https://explorer.lichess.ovh";
const LICHESS_API = "https://lichess.org/api";

/**
 * @param {string} fen
 * @returns {Promise<object>} JSON from masters database explorer
 */
export async function fetchMastersExplorer(fen) {
    const url = `${EXPLORER}/masters?fen=${encodeURIComponent(fen)}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Masters explorer HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Lichess player games opening stats (standard chess).
 * @param {string} fen
 * @param {{ speeds?: string, ratings?: string }} [opts]
 */
export async function fetchLichessPlayerExplorer(fen, opts = {}) {
    const speeds = opts.speeds ?? "rapid,classical";
    const ratings = opts.ratings ?? "1600,1800,2000,2200,2500";
    const q = new URLSearchParams({
        variant: "standard",
        fen,
        speeds,
        ratings,
    });
    const url = `${EXPLORER}/lichess?${q}`;
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Lichess explorer HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Optional: cloud-eval when available (many positions return empty).
 * @param {string} fen
 */
export async function fetchCloudEval(fen) {
    const url = `${LICHESS_API}/cloud-eval?fen=${encodeURIComponent(fen)}`;
    const res = await fetch(url);
    if (res.status === 404) {
        return null;
    }
    if (!res.ok) {
        throw new Error(`Cloud eval HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * @param {string} path e.g. "/api/account/me"
 * @param {RequestInit} [init]
 */
export async function fetchLichessAuthed(path, init = {}) {
    const token = globalThis.localStorage?.getItem("lichessToken");
    if (!token) {
        throw new Error("Missing localStorage.lichessToken for authenticated Lichess API");
    }
    const url = path.startsWith("http") ? path : `https://lichess.org${path}`;
    const headers = {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...init.headers,
    };
    const res = await fetch(url, { ...init, headers });
    if (!res.ok) {
        throw new Error(`Lichess ${path} HTTP ${res.status}`);
    }
    const ct = res.headers.get("content-type");
    if (ct && ct.includes("application/json")) {
        return res.json();
    }
    return res.text();
}
