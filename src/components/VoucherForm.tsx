import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Trash2, Plus, UserPlus, ChevronsUpDown, Check } from "lucide-react";
import { Payee, LineItem, VoucherData } from "@/types/voucher";
import { cn } from "@/lib/utils";

interface VoucherFormProps {
  payees: Payee[];
  data: VoucherData;
  onChange: (data: VoucherData) => void;
  onManagePayees: () => void;
}

export function VoucherForm({ payees, data, onChange, onManagePayees }: VoucherFormProps) {
  const [payeeOpen, setPayeeOpen] = useState(false);
  const update = (partial: Partial<VoucherData>) => onChange({ ...data, ...partial });

  const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
    const items = [...data.lineItems];
    items[index] = { ...items[index], [field]: value };
    update({ lineItems: items });
  };

  const addLineItem = () => {
    update({ lineItems: [...data.lineItems, { description: "", amount: 0, notes: "" }] });
  };

  const removeLineItem = (index: number) => {
    if (data.lineItems.length <= 1) return;
    update({ lineItems: data.lineItems.filter((_, i) => i !== index) });
  };

  const selectPayee = (payeeId: string) => {
    const payee = payees.find((p) => p.id === payeeId) || null;
    update({ payee, whtRate: payee?.whtRate ?? data.whtRate });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📋 ข้อมูลเอกสาร</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">เลขที่เอกสาร</Label>
              <Input value={data.docNo} onChange={(e) => update({ docNo: e.target.value })} placeholder="PV-2568-001" className="h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">วันที่</Label>
              <Input type="date" value={data.date} onChange={(e) => update({ date: e.target.value })} className="h-9 text-sm" />
            </div>
          </div>
          <div>
            <Label className="text-xs">วิธีจ่าย</Label>
            <Select value={data.paymentMethod} onValueChange={(v) => update({ paymentMethod: v as VoucherData["paymentMethod"] })}>
              <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="โอนเงิน">โอนเงิน</SelectItem>
                <SelectItem value="เงินสดย่อย">เงินสดย่อย</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">👤 ผู้รับเงิน</CardTitle>
            <Button variant="outline" size="sm" onClick={onManagePayees} className="h-7 text-xs">
              <UserPlus className="mr-1 h-3 w-3" /> จัดการผู้รับเงิน
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">ค้นหาผู้รับเงิน (ชื่อ / codename)</Label>
            <Popover open={payeeOpen} onOpenChange={setPayeeOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={payeeOpen} className="w-full h-9 text-sm justify-between font-normal">
                  {data.payee ? `${data.payee.prefix}${data.payee.name}${data.payee.codename ? ` (${data.payee.codename})` : ""}` : "เลือกผู้รับเงิน..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="พิมพ์ชื่อ หรือ codename..." />
                  <CommandList>
                    <CommandEmpty>ไม่พบผู้รับเงิน</CommandEmpty>
                    <CommandGroup>
                      {payees.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.prefix}${p.name} ${p.codename} ${p.nameEn}`}
                          onSelect={() => { selectPayee(p.id); setPayeeOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", data.payee?.id === p.id ? "opacity-100" : "opacity-0")} />
                          {p.prefix}{p.name} {p.codename && <span className="text-muted-foreground ml-1">({p.codename})</span>}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          {data.payee && (
            <div className="space-y-2 rounded-md border border-border bg-muted/50 p-3 text-sm">
              <div><span className="text-muted-foreground">ชื่อ:</span> {data.payee.prefix}{data.payee.name}</div>
              <div><span className="text-muted-foreground">เลขภาษี:</span> {data.payee.taxId}</div>
              <div><span className="text-muted-foreground">ที่อยู่:</span> {data.payee.address}</div>
              {data.payee.codename && <div><span className="text-muted-foreground">Codename:</span> {data.payee.codename}</div>}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">📝 รายการ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.lineItems.map((item, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1">
                {i === 0 && <Label className="text-xs">รายการ</Label>}
                <Input value={item.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} placeholder="รายละเอียด" className="h-9 text-sm" />
              </div>
              <div className="w-28">
                {i === 0 && <Label className="text-xs">จำนวนเงิน</Label>}
                <Input type="number" value={item.amount || ""} onChange={(e) => updateLineItem(i, "amount", parseFloat(e.target.value) || 0)} placeholder="0.00" className="h-9 text-sm text-right" />
              </div>
              <div className="w-24">
                {i === 0 && <Label className="text-xs">หมายเหตุ</Label>}
                <Input value={item.notes} onChange={(e) => updateLineItem(i, "notes", e.target.value)} className="h-9 text-sm" />
              </div>
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => removeLineItem(i)} disabled={data.lineItems.length <= 1}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addLineItem} className="h-8 text-xs w-full">
            <Plus className="mr-1 h-3 w-3" /> เพิ่มรายการ
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">💰 สรุปยอด</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Label className="text-xs w-32">อัตรา WHT %</Label>
            <Input type="number" value={data.whtRate} onChange={(e) => update({ whtRate: parseFloat(e.target.value) || 0 })} className="h-9 text-sm w-20 text-right" />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
          <div className="rounded-md border border-border bg-muted/50 p-3 text-sm space-y-1">
            <div className="flex justify-between"><span>ยอดรวม</span><span>{subtotal(data).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span></div>
            <div className="flex justify-between"><span>หัก ณ ที่จ่าย {data.whtRate}%</span><span>{wht(data).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span></div>
            <div className="flex justify-between font-semibold border-t border-border pt-1"><span>ยอดสุทธิ</span><span>{netAmount(data).toLocaleString("th-TH", { minimumFractionDigits: 2 })} บาท</span></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function subtotal(data: VoucherData) {
  return data.lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
}
export function wht(data: VoucherData) {
  return subtotal(data) * (data.whtRate / 100);
}
export function netAmount(data: VoucherData) {
  return subtotal(data) - wht(data);
}
