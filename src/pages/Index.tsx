import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { VoucherForm } from "@/components/VoucherForm";
import { VoucherPreview } from "@/components/VoucherPreview";
import { PayeeManager } from "@/components/PayeeManager";
import { SettingsDialog } from "@/components/SettingsDialog";
import { defaultPayees } from "@/data/payees";
import { Payee, VoucherData, AppSettings } from "@/types/voucher";
import { sheetToCsvUrl, parseCsvToPayees, gdriveToDirectUrl } from "@/lib/google-utils";
import { Printer, Settings } from "lucide-react";
import { toast } from "sonner";

const today = new Date().toISOString().split("T")[0];

const initialData: VoucherData = {
  docNo: "",
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

function loadSettings(): AppSettings {
  try {
    const saved = localStorage.getItem("mentora-settings");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { googleSheetUrl: "", logoGdriveUrl: "", signatureGdriveUrl: "" };
}

export default function Index() {
  const [payees, setPayees] = useState<Payee[]>(defaultPayees);
  const [data, setData] = useState<VoucherData>(initialData);
  const [payeeDialogOpen, setPayeeDialogOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [isFetching, setIsFetching] = useState(false);

  // Persist settings
  useEffect(() => {
    localStorage.setItem("mentora-settings", JSON.stringify(settings));
  }, [settings]);

  // Derive image URLs from settings
  const logoUrl = gdriveToDirectUrl(settings.logoGdriveUrl);
  const signatureUrl = gdriveToDirectUrl(settings.signatureGdriveUrl);
  const voucherData: VoucherData = { ...data, logoUrl, signatureUrl };

  const fetchPayeesFromSheet = useCallback(async (sheetUrl?: string) => {
    const url = sheetUrl || settings.googleSheetUrl;
    if (!url) return;
    setIsFetching(true);
    try {
      const csvUrl = sheetToCsvUrl(url);
      if (!csvUrl) {
        toast.error("URL ไม่ถูกต้อง กรุณาใส่ link Google Sheet");
        return;
      }
      let res: Response;
      try {
        res = await fetch(csvUrl);
      } catch {
        // CORS blocked — try via corsproxy
        res = await fetch(`https://corsproxy.io/?${encodeURIComponent(csvUrl)}`);
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const csv = await res.text();
      const newPayees = parseCsvToPayees(csv);
      if (newPayees.length === 0) {
        toast.error("ไม่พบข้อมูลผู้รับเงินใน Sheet — ตรวจสอบว่า publish ถูก sheet");
        return;
      }
      setPayees(newPayees);
      toast.success(`ดึงข้อมูลผู้รับเงิน ${newPayees.length} รายการสำเร็จ`);
    } catch (err) {
      console.error("Sheet fetch error:", err);
      toast.error("ไม่สามารถดึงข้อมูลจาก Google Sheet ได้ — ตรวจสอบว่า Publish to web (File → Share → Publish to web) แล้ว");
    } finally {
      setIsFetching(false);
    }
  }, [settings.googleSheetUrl]);

  // Auto-fetch on mount if sheet URL exists
  useEffect(() => {
    if (settings.googleSheetUrl) {
      fetchPayeesFromSheet(settings.googleSheetUrl);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePrint = () => {
    const printContent = document.getElementById("voucher-print");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;

    // Collect all stylesheets from current document
    const styleSheets = Array.from(document.styleSheets);
    let cssText = "";
    styleSheets.forEach((sheet) => {
      try {
        const rules = Array.from(sheet.cssRules);
        rules.forEach((rule) => { cssText += rule.cssText + "\n"; });
      } catch {
        // Cross-origin stylesheet — include via link tag
        if (sheet.href) {
          cssText += `@import url("${sheet.href}");\n`;
        }
      }
    });

    win.document.write(`
      <html><head><title>ใบสำคัญรับเงิน ${data.docNo}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        ${cssText}
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sarabun', sans-serif; background: white; }
        @page { size: A4; margin: 15mm; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.onload = () => { win.print(); };
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
          <VoucherForm
            payees={payees}
            data={data}
            onChange={setData}
            onManagePayees={() => setPayeeDialogOpen(true)}
          />
        </div>
        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground mb-2 text-center">ตัวอย่างเอกสาร (Live Preview)</div>
          <VoucherPreview data={voucherData} />
        </div>
      </div>

      <PayeeManager payees={payees} onChange={setPayees} open={payeeDialogOpen} onOpenChange={setPayeeDialogOpen} />
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
