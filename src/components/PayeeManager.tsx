import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { Payee } from "@/types/voucher";

interface Props {
  payees: Payee[];
  onChange: (payees: Payee[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PayeeManager({ payees, onChange, open, onOpenChange }: Props) {
  const [editing, setEditing] = useState<Payee | null>(null);
  const [form, setForm] = useState<Omit<Payee, "id">>({ name: "", taxId: "", address: "", type: "บุคคลธรรมดา", whtRate: 3 });

  const resetForm = () => setForm({ name: "", taxId: "", address: "", type: "บุคคลธรรมดา", whtRate: 3 });

  const save = () => {
    if (!form.name) return;
    if (editing) {
      onChange(payees.map((p) => (p.id === editing.id ? { ...editing, ...form } : p)));
    } else {
      onChange([...payees, { ...form, id: crypto.randomUUID() }]);
    }
    resetForm();
    setEditing(null);
  };

  const startEdit = (p: Payee) => {
    setEditing(p);
    setForm({ name: p.name, taxId: p.taxId, address: p.address, type: p.type, whtRate: p.whtRate });
  };

  const remove = (id: string) => onChange(payees.filter((p) => p.id !== id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📋 ฐานข้อมูลผู้รับเงิน</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          {/* Add/Edit form */}
          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">ชื่อ-นามสกุล</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">เลขผู้เสียภาษี</Label>
                  <Input value={form.taxId} onChange={(e) => setForm({ ...form, taxId: e.target.value })} className="h-9 text-sm" />
                </div>
              </div>
              <div>
                <Label className="text-xs">ที่อยู่</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="h-9 text-sm" />
              </div>
              <div className="flex gap-3">
                <div>
                  <Label className="text-xs">WHT %</Label>
                  <Input type="number" value={form.whtRate} onChange={(e) => setForm({ ...form, whtRate: parseFloat(e.target.value) || 0 })} className="h-9 text-sm w-20" />
                </div>
                <div className="flex items-end gap-2">
                  <Button size="sm" onClick={save}>{editing ? "อัพเดท" : "เพิ่ม"}</Button>
                  {editing && <Button size="sm" variant="outline" onClick={() => { resetForm(); setEditing(null); }}>ยกเลิก</Button>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* List */}
          <div className="space-y-2">
            {payees.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-muted-foreground">{p.taxId} • {p.address}</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(p)}><Edit2 className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
