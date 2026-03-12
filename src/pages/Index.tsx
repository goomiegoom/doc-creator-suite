import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { VoucherForm } from "@/components/VoucherForm";
import { VoucherPreview } from "@/components/VoucherPreview";
import { PayeeManager } from "@/components/PayeeManager";
import { defaultPayees } from "@/data/payees";
import { Payee, VoucherData } from "@/types/voucher";
import { Printer, FileDown } from "lucide-react";

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
};

export default function Index() {
  const [payees, setPayees] = useState<Payee[]>(defaultPayees);
  const [data, setData] = useState<VoucherData>(initialData);
  const [payeeDialogOpen, setPayeeDialogOpen] = useState(false);

  const handlePrint = () => {
    const printContent = document.getElementById("voucher-print");
    if (!printContent) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>ใบสำคัญรับเงิน ${data.docNo}</title>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Sarabun', sans-serif; }
        @page { size: A4; margin: 15mm; }
        @media print { body { -webkit-print-color-adjust: exact; } }
      </style></head><body>${printContent.innerHTML}</body></html>
    `);
    win.document.close();
    win.onload = () => { win.print(); };
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-background px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-lg font-bold">🧾 Mentora Document Maker</h1>
          <p className="text-xs text-muted-foreground">ระบบสร้างใบสำคัญรับเงิน</p>
        </div>
        <Button onClick={handlePrint} size="sm">
          <Printer className="mr-2 h-4 w-4" /> พิมพ์ / PDF
        </Button>
      </header>

      {/* Main layout */}
      <div className="flex gap-4 p-4 max-w-[1600px] mx-auto" style={{ height: "calc(100vh - 57px)" }}>
        {/* Left: Form */}
        <div className="w-[420px] shrink-0 overflow-y-auto pr-1">
          <VoucherForm
            payees={payees}
            data={data}
            onChange={setData}
            onManagePayees={() => setPayeeDialogOpen(true)}
          />
        </div>

        {/* Right: Preview */}
        <div className="flex-1 overflow-y-auto rounded-lg border border-border bg-muted/50 p-4">
          <div className="text-xs text-muted-foreground mb-2 text-center">ตัวอย่างเอกสาร (Live Preview)</div>
          <VoucherPreview data={data} />
        </div>
      </div>

      <PayeeManager payees={payees} onChange={setPayees} open={payeeDialogOpen} onOpenChange={setPayeeDialogOpen} />
    </div>
  );
}
