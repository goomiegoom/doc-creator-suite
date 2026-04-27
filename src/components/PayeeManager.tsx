import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Edit2, Sheet } from "lucide-react";
import { Payee, AppSettings } from "@/types/voucher";
import { getOAuthToken, appendPayeeToSheet } from "@/lib/google-utils";
import { toast } from "sonner";

const PREFIXES = ["นาย", "นาง", "นางสาว", "ดร.", "รศ.ดร.", "ผศ.ดร.", "รศ.", "ผศ.", "ศ.", "ศ.ดร."];
const BANKS = [
  "ไทยพาณิชย์", "กสิกรไทย", "กรุงเทพ", "กรุงไทย", "กรุงศรีอยุธยา",
  "ทหารไทยธนชาต", "ออมสิน", "ธ.ก.ส.", "ธอส.", "ยูโอบี", "ซิตี้แบงก์",
  "ไอซีบีซี", "ซีไอเอ็มบี", "แลนด์แอนด์เฮ้าส์", "เกียรตินาคินภัทร", "ทิสโก้",
  "ธนาคารไทยเครดิต", "ฮ่องกงและเซี่ยงไฮ้แบงกิ้ง",
];

interface Props {
  payees: Payee[];
  onChange: (payees: Payee[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
}

const emptyForm: Omit<Payee, "id"> = {
  taxId: "", prefix: "นาย", name: "", nameEn: "", codename: "",
  address: "", bank: "", branch: "", accountNo: "",
  type: "บุคคลธรรมดา", whtRate: 3,
};

export function PayeeManager({ payees, onChange, open, onOpenChange, settings }: Props) {
  const [editing, setEditing] = useState<Payee | null>(null);
  const [form, setForm] = useState<Omit<Payee, "id">>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const set = (patch: Partial<Omit<Payee, "id">>) => setForm((f) => ({ ...f, ...patch }));
  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const saveLocal = () => {
    if (!form.name) return;
    if (editing) {
      onChange(payees.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)));
    } else {
      onChange([...payees, { ...form, id: crypto.randomUUID() }]);
    }
    resetForm();
  };

  const saveToSheet = async () => {
    if (!form.name) { toast.error("กรุณาใส่ชื่อ"); return; }
    const { googleOAuthClientId, googleSheetUrl } = settings;
    if (!googleOAuthClientId) {
      toast.error("กรุณาใส่ OAuth Client ID ในตั้งค่าก่อน");
      return;
    }
    const sheetIdMatch = googleSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]{10,})/);
    if (!sheetIdMatch) {
      toast.error("กรุณาใส่ Google Sheet URL ในตั้งค่าก่อน");
      return;
    }
    setIsSaving(true);
    try {
      const token = await getOAuthToken(googleOAuthClientId);
      await appendPayeeToSheet(token, sheetIdMatch[1], form);
      onChange([...payees, { ...form, id: crypto.randomUUID() }]);
      toast.success(`เพิ่ม "${form.name}" ลง Google Sheet แล้ว`);
      resetForm();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`บันทึกไม่สำเร็จ: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 ฐานข้อมูลผู้รับเงิน</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-4 space-y-3">
              {/* Row 1: Tax ID */}
              <div>
                <Label className="text-xs">Tax ID / เลขผู้เสียภาษี</Label>
                <Input value={form.taxId} onChange={(e) => set({ taxId: e.target.value })} className="h-9 text-sm font-mono" placeholder="1234567890123" />
              </div>

              {/* Row 2: Pref. + Thai Name + English Name */}
              <div className="grid grid-cols-[120px_1fr_1fr] gap-2">
                <div>
                  <Label className="text-xs">Pref. / คำนำหน้า</Label>
                  <Select value={form.prefix} onValueChange={(v) => set({ prefix: v })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PREFIXES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Thai Name / ชื่อ-นามสกุล</Label>
                  <Input value={form.name} onChange={(e) => set({ name: e.target.value })} className="h-9 text-sm" placeholder="สมชาย ใจดี" />
                </div>
                <div>
                  <Label className="text-xs">English Name</Label>
                  <Input value={form.nameEn} onChange={(e) => set({ nameEn: e.target.value })} className="h-9 text-sm" placeholder="Somchai Jaidee" />
                </div>
              </div>

              {/* Row 3: Codename + Address */}
              <div className="grid grid-cols-[160px_1fr] gap-2">
                <div>
                  <Label className="text-xs">Codename</Label>
                  <Input value={form.codename} onChange={(e) => set({ codename: e.target.value })} className="h-9 text-sm" placeholder="ชื่อเล่น/บทบาท" />
                </div>
                <div>
                  <Label className="text-xs">Address / ที่อยู่</Label>
                  <Input value={form.address} onChange={(e) => set({ address: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>

              {/* Row 4: Bank + Branch + Account no. */}
              <div className="grid grid-cols-[1fr_1fr_160px] gap-2">
                <div>
                  <Label className="text-xs">Bank / ธนาคาร</Label>
                  <Select value={form.bank} onValueChange={(v) => set({ bank: v })}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="เลือกธนาคาร" />
                    </SelectTrigger>
                    <SelectContent>
                      {BANKS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Branch / สาขา</Label>
                  <Input value={form.branch} onChange={(e) => set({ branch: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Account no.</Label>
                  <Input value={form.accountNo} onChange={(e) => set({ accountNo: e.target.value })} className="h-9 text-sm font-mono" placeholder="xxx-x-xxxxx-x" />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <Button size="sm" onClick={saveLocal} variant="outline" className="h-8 text-xs">
                  {editing ? "อัพเดท (local)" : "เพิ่ม (local only)"}
                </Button>
                <Button size="sm" onClick={saveToSheet} disabled={isSaving} className="h-8 text-xs">
                  <Sheet className="mr-1 h-3 w-3" />
                  {isSaving ? "กำลังบันทึก..." : "บันทึกลง Google Sheet"}
                </Button>
                {editing && (
                  <Button size="sm" variant="ghost" onClick={resetForm} className="h-8 text-xs">ยกเลิก</Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payee list */}
          <div className="space-y-2">
            {payees.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="font-medium">
                    {p.prefix}{p.name}
                    {p.codename && <span className="text-muted-foreground ml-1">({p.codename})</span>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.taxId} {p.bank && `• ${p.bank}${p.accountNo ? ` ${p.accountNo}` : ""}`}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(p); const { id, ...rest } = p; setForm(rest); }}>
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(payees.filter((x) => x.id !== p.id))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
