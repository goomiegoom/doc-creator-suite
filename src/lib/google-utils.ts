import { Payee } from "@/types/voucher";

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
  
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`;
}

/**
 * Convert a Google Sheet published URL to CSV fetch URL
 * Input: https://docs.google.com/spreadsheets/d/SHEET_ID/edit#gid=GID
 * or published URL
 */
export function sheetToCsvUrl(url: string, gid = "0"): string {
  if (!url) return "";
  
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!match) return "";
  
  const sheetId = match[1];
  
  // Check if URL has gid
  const gidMatch = url.match(/gid=(\d+)/);
  const finalGid = gidMatch ? gidMatch[1] : gid;
  
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${finalGid}`;
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
