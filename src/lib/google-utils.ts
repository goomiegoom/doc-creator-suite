import { Payee } from "@/types/voucher";

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (cfg: {
            client_id: string;
            scope: string;
            callback: (r: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: (opts?: { prompt?: string }) => void };
        };
      };
    };
  }
}

function loadGIS(): Promise<void> {
  return new Promise((resolve) => {
    if (window.google?.accounts) { resolve(); return; }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

export async function getOAuthToken(clientId: string): Promise<string> {
  await loadGIS();
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      callback: (r) => {
        if (r.error || !r.access_token) reject(new Error(r.error || "no token"));
        else resolve(r.access_token);
      },
    });
    client.requestAccessToken({ prompt: "" });
  });
}

export async function appendPayeeToSheet(
  accessToken: string,
  sheetId: string,
  payee: Omit<Payee, "id">
): Promise<void> {
  const row = [
    payee.taxId, payee.prefix, payee.name, payee.nameEn,
    payee.codename, payee.address, payee.bank, payee.branch, payee.accountNo,
  ];
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Payees:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ values: [row] }),
    }
  );
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message || `HTTP ${res.status}`);
  }
}

/**
 * Convert a Google Drive sharing URL to a direct image URL
 * Supports: /file/d/ID/view, /open?id=ID, /uc?id=ID
 */
export function gdriveToDirectUrl(url: string): string {
  if (!url) return "";
  
  // Extract file ID from various Google Drive URL formats
  let fileId = "";
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }
  
  if (!fileId) return url; // Return as-is if not a Drive URL
  
  return `https://lh3.googleusercontent.com/d/${fileId}=w400`;
}

/**
 * Convert a Google Sheet published URL to CSV fetch URL
 * Input: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=GID
 * or published URL
 */
export function sheetToCsvUrl(url: string, gid = "0"): string {
  if (!url) return "";
  
  // If already a published CSV URL, use as-is
  if (url.includes("/pub") && url.includes("output=csv")) {
    return url;
  }
  // If it's a /pub URL without output=csv, append it
  if (url.includes("/pub")) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}output=csv`;
  }
  
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return "";
  
  const sheetId = match[1];
  const gidMatch = url.match(/gid=(\d+)/);
  const finalGid = gidMatch ? gidMatch[1] : gid;
  
  return `https://docs.google.com/spreadsheets/d/${sheetId}/pub?output=csv&gid=${finalGid}`;
}

/**
 * Parse Sheets API v4 values array into Payee objects
 */
export function parseApiResponseToPayees(values: string[][]): Payee[] {
  if (values.length < 2) return [];
  return values.slice(1).map((cols, i) => {
    const get = (idx: number) => (cols[idx] || "").trim();
    const taxIdRaw = get(0);
    let taxId = taxIdRaw;
    if (taxIdRaw.includes("E+") || taxIdRaw.includes("e+")) {
      taxId = Number(taxIdRaw).toFixed(0);
    }
    return {
      id: `sheet-${i}`,
      taxId,
      prefix: get(1),
      name: get(2),
      nameEn: get(3),
      codename: get(4),
      address: get(5),
      bank: get(6),
      branch: get(7),
      accountNo: get(8),
      type: "บุคคลธรรมดา",
      whtRate: 3,
    };
  }).filter((p) => p.name);
}

/**
 * Parse CSV text into Payee objects
 * Sheet "Payees" columns: Tax ID, Pref., Thai Name, English Name, Codename, Address, Bank, Branch, Account no.
 */
export function parseCsvToPayees(csv: string): Payee[] {
  const lines = csv.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];
  
  return lines.slice(1).map((line, i) => {
    const cols = parseCsvLine(line).map((c) => c.replace(/"/g, "").trim());
    const taxIdRaw = cols[0] || "";
    // Handle scientific notation from Excel (e.g., 1.3994E+12)
    let taxId = taxIdRaw;
    if (taxIdRaw.includes("E+") || taxIdRaw.includes("e+")) {
      taxId = Number(taxIdRaw).toFixed(0);
    }
    
    return {
      id: `sheet-${i}`,
      taxId,
      prefix: cols[1] || "",
      name: cols[2] || "",
      nameEn: cols[3] || "",
      codename: cols[4] || "",
      address: cols[5] || "",
      bank: cols[6] || "",
      branch: cols[7] || "",
      accountNo: cols[8] || "",
      type: "บุคคลธรรมดา",
      whtRate: 3,
    };
  }).filter((p) => p.name);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}
