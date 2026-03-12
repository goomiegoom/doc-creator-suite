import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2, Edit2 } from "lucide-react";
import { Payee } from "@/types/voucher";

interface Props {
  payees: Payee[];
  onChange: (payees: Payee[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const emptyForm: Omit<Payee, "id"> = {
  taxId: "", prefix: "", name: "", nameEn: "", codename: "",
  address: "", bank: "", branch: "", accountNo: "",
  type: "บุคคลธรรมดา", whtRate: 3,
};

export function PayeeManager({ payees, onChange, open, onOpenChange }: Props) {
  const [editing, setEditing] = useState<Payee | null>(null);
  const [form, setForm] = useState<Omit<Payee, "id">>(emptyForm);

  const resetForm = () => { setForm(emptyForm); setEditing(null); };

  const save = () => {
    if (!form.name) return;
    if (editing) {
      onChange(payees.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)));
    } else {
      onChange([...payees, { ...form, id: crypto.randomUUID() }]);
    }
    resetForm();
  };

  const startEdit = (p: Payee) => {
    setEditing(p);
    const { id, ...rest } = p;
    setForm(rest);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 ฐานข้อมูลผู้รับเงิน</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">คำนำหน้า</Label>
                  <Input value={form.prefix} onChange={(e) => setForm({ ...form, prefix: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">ชื่อ-นามสกุล</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">เลขผู้เสียภาษี</Label>
                  <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">Codename</Label>
                  <Input value={form.codename} onChange={(e) => setForm({ ...form, codename: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">ที่อยู่</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="flex gap-3 items-end">
                <div>
                  <Label className="text-xs">WHT %</Label>
                  <Input type="number" value={form.whtRate} onChange={(e) => setForm({ ...form, whtRate: parseFloat(e.target.value) || 0 })} className="h-9 text-sm w-20" />
                </div>
                <Button size="sm" onClick={save}>{editing ? "อัพเดท" : "เพิ่ม"}</Button>
                {editing && <Button size="sm" variant="outline" onClick={resetForm}>ยกเลิก</Button>}
              </div>
            </CardContent>
          </Card>
          <div className="space-y-2">
            {payees.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="font-medium">{p.prefix}{p.name} {p.codename && <span className="text-muted-foreground">({p.codename})</span>}</div>
                  <div className="text-xs text-muted-foreground">{p.taxId} • {p.address}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}><Edit2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onChange(payees.filter((x) => x.id !== p.id))}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
