import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { VoucherForm } from "@/components/VoucherForm";
import { VoucherPreview } from "@/components/VoucherPreview";
import { PayeeManager } from "@/components/PayeeManager";
import { SettingsDialog } from "@/components/SettingsDialog";
import { defaultPayees } from "@/data/payees";
import { Payee, VoucherData, AppSettings } from "@/types/voucher";
import { sheetToCsvUrl, parseCsvToPayees, parseApiResponseToPayees, gdriveToDirectUrl } from "@/lib/google-utils";
import { Printer, Settings } from "lucide-react";
import { toast } from "sonner";

const today = new Date().toISOString().split("T")[0];
const now = new Date();
const buddhistYear = now.getFullYear() + 543;
const month = String(now.getMonth() + 1).padStart(2, "0");
const monthKey = `${buddhistYear}-${month}`;

function getNextDocNo(): string {
  try {
    const counters = JSON.parse(localStorage.getItem("mentora-doc-counters") || "{}");
    const num = (counters[monthKey] || 0) + 1;
    return `PV-${buddhistYear}-${month}${String(num).padStart(2, "0")}`;
  } catch {
    return `PV-${buddhistYear}-${month}01`;
  }
}

function incrementDocCounter() {
  const counters = JSON.parse(localStorage.getItem("mentora-doc-counters") || "{}");
  counters[monthKey] = (counters[monthKey] || 0) + 1;
  localStorage.setItem("mentora-doc-counters", JSON.stringify(counters));
}

const initialData: VoucherData = {
  docNo: getNextDocNo(),
  date: today,
  paymentMethod: "โอนเงิน",
  payee: null,
  lineItems: [{ description: "", amount: 0, notes: "" }],
  whtRate: 3,
  payerName: "วริษา เกตุพันธุ์",
  payerCompany: "บริษัท เมนทอรา คอนซัลติง กรุ๊ป จำกัด",
  logoUrl: "",
  signatureUrl: "",
};

const DEFAULT_SETTINGS: AppSettings = {
  googleSheetUrl: import.meta.env.VITE_GOOGLE_SHEET_URL ?? "",
  googleApiKey: import.meta.env.VITE_GOOGLE_API_KEY ?? "",
  googleOAuthClientId: import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? "",
  logoGdriveUrl: import.meta.env.VITE_LOGO_GDRIVE_URL ?? "",
  signatureGdriveUrl: import.meta.env.VITE_SIGNATURE_GDRIVE_URL ?? "",
};

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem("mentora-settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function loadPayees(): Payee[] {
  try {
    const saved = localStorage.getItem("mentora-payees");
    if (saved) return JSON.parse(saved);
  } catch {}
  return defaultPayees;
}

export default function Index() {
  const [payees, setPayees] = useState<Payee[]>(loadPayees);
  const [data, setData] = useState<VoucherData>(initialData);
  const [payeeDialogOpen, setPayeeDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isFetching, setIsFetching] = useState(false);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("mentora-settings", JSON.stringify(settings));
  }, [settings]);

  // Persist payees
  useEffect(() => {
    localStorage.setItem("mentora-payees", JSON.stringify(payees));
  }, [payees]);

  // Derive image URLs from settings
  const logoUrl = gdriveToDirectUrl(settings.logoGdriveUrl);
  const signatureUrl = gdriveToDirectUrl(settings.signatureGdriveUrl);
  const voucherData: VoucherData = { ...data, logoUrl, signatureUrl };

 const fetchPayeesFromSheet = useCallback(
    async (sheetUrl?: string) => {
      const url = typeof sheetUrl === "string" ? sheetUrl : settings.googleSheetUrl;
      if (!url) return;

      setIsFetching(true);
      try {
        let newPayees: Payee[] = [];

        if (settings.googleApiKey) {
          // Skip /d/e/ (published URL prefix) — match real sheet ID only
          const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,})/);
          if (!match) {
            toast.error("URL ไม่ถูกต้อง — ใส่ sharing link ปกติ (ไม่ใช่ Publish to web link)");
            setIsFetching(false);
            return;
          }
          const sheetId = match[1];
          const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Payees?key=${settings.googleApiKey}`;
          const res = await fetch(apiUrl);
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const msg = body?.error?.message || `HTTP ${res.status}`;
            if (res.status === 403) toast.error(`API Key ถูกบล็อก: ${msg}`);
            else if (res.status === 404) toast.error("ไม่พบ sheet ชื่อ 'Payees' — ตรวจสอบชื่อ tab");
            else toast.error(`Google API Error: ${msg}`);
            return;
          }
          const json = await res.json();
          newPayees = parseApiResponseToPayees(json.values || []);
        } else {
          const csvUrl = sheetToCsvUrl(url);
          if (!csvUrl) {
            toast.error("URL ไม่ถูกต้อง กรุณาใส่ link Google Sheet");
            setIsFetching(false);
            return;
          }
          const proxies = [
            csvUrl,
            `https://corsproxy.io/?url=${encodeURIComponent(csvUrl)}`,
            `https://api.allorigins.win/raw?url=${encodeURIComponent(csvUrl)}`,
          ];
          let res: Response | null = null;
          let lastError: unknown;
          for (const proxyUrl of proxies) {
            try {
              const r = await fetch(proxyUrl);
              if (r.ok) { res = r; break; }
              lastError = new Error(`HTTP ${r.status}`);
            } catch (e) {
              lastError = e;
            }
          }
          if (!res) throw lastError;
          const csv = await res.text();
          newPayees = parseCsvToPayees(csv);
        }

        if (newPayees.length === 0) {
          toast.error("ไม่พบข้อมูลผู้รับเงินใน Sheet — ตรวจสอบชื่อ sheet ว่าเป็น 'Payees'");
          return;
        }
        setPayees(newPayees);
        toast.success(`ดึงข้อมูลผู้รับเงิน ${newPayees.length} รายการสำเร็จ`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Sheet fetch error:", err);
        toast.error(`ดึงข้อมูลไม่ได้: ${msg}`);
      } finally {
        setIsFetching(false);
      }
    },
    [settings.googleSheetUrl, settings.googleApiKey]
  );

  const handlePrint = () => {
    const printContent = document.getElementById("voucher-print");
    if (!printContent) return;

    // Create hidden iframe for printing
    let iframe = document.getElementById("print-iframe") as HTMLIFrameElement | null;
    if (iframe) iframe.remove();
    iframe = document.createElement("iframe");
    iframe.id = "print-iframe";
    iframe.style.position = "fixed";
    iframe.style.top = "-10000px";
    iframe.style.left = "-10000px";
    iframe.style.width = "210mm";
    iframe.style.height = "297mm";
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    // Collect all stylesheets
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";
    styleSheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules);
        rules.forEach((rule) => {
          cssText += rule.cssText + "\n";
        });
      } catch {
        if (sheet.href) {
          cssText += `@import url("${sheet.href}");\n`;
        }
      }
    });

    iframeDoc.open();
    iframeDoc.write(`
      <html><head>
      <title>${data.docNo}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        ${cssText}
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Sarabun', sans-serif !important; }
        body { font-family: 'Sarabun', sans-serif !important; background: white; }
        @page { size: A4; margin: 15mm; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    iframeDoc.close();

    // Wait for fonts then print
    const doPrint = () => {
      iframe!.contentWindow?.print();
      // Increment counter and update docNo for next voucher
      incrementDocCounter();
      setData((prev) => ({ ...prev, docNo: getNextDocNo() }));
      setTimeout(() => iframe?.remove(), 1000);
    };

    if (iframeDoc.fonts?.ready) {
      iframeDoc.fonts.ready.then(doPrint);
    } else {
      setTimeout(doPrint, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">🧾 Mentora Document Maker</h1>
          <p className="text-xs text-muted-foreground">ระบบสร้างใบสำคัญรับเงิน</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" /> ตั้งค่า
          </Button>
          <Button onClick={handlePrint} size="sm">
            <Printer className="mr-2 h-4 w-4" /> พิมพ์ / PDF
          </Button>
        </div>
      </header>

      <div className="flex gap-4 p-4 max-w-[1600px] mx-auto" style={{ height: "calc(100vh - 57px)" }}>
        <div className="w-[420px] shrink-0 overflow-y-auto pr-1">
          <VoucherForm payees={payees} data={data} onChange={setData} onManagePayees={() => setPayeeDialogOpen(true)} />
        </div>
        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground mb-2 text-center">ตัวอย่างเอกสาร (Live Preview)</div>
          <VoucherPreview data={voucherData} />
        </div>
      </div>

      <PayeeManager payees={payees} onChange={setPayees} open={payeeDialogOpen} onOpenChange={setPayeeDialogOpen} settings={settings} />
      <SettingsDialog
        settings={settings}
        onChange={setSettings}
        onFetchPayees={fetchPayeesFromSheet}
        isFetching={isFetching}
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
      />
    </div>
  );
}
