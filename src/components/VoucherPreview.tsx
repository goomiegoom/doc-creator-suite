import { VoucherData } from "@/types/voucher";
import { subtotal, wht, netAmount } from "./VoucherForm";
import { thaiBahtText } from "@/lib/thai-baht-text";

interface Props {
  data: VoucherData;
}

function formatTaxId(id: string) {
  const digits = id.replace(/\D/g, "");
  if (digits.length !== 13) return id;
  return `${digits[0]} ${digits.slice(1, 5)} ${digits.slice(5, 10)} ${digits.slice(10, 12)} ${digits[12]}`;
}

function formatDate(dateStr: string) {
  if (!dateStr) return "_______________";
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    const thaiYear = d.getFullYear() + 543;
    return `${day} ${months[d.getMonth()]} ${thaiYear}`;
  } catch {
    return dateStr;
  }
}

export function VoucherPreview({ data }: Props) {
  const sub = subtotal(data);
  const tax = wht(data);
  const net = netAmount(data);
  const fmt = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div id="voucher-print" className="bg-white text-black p-8 max-w-[210mm] mx-auto shadow-lg" style={{ fontFamily: "'Sarabun', 'Noto Sans Thai', sans-serif", fontSize: "13px", lineHeight: "1.6" }}>
      {/* Header with Logo */}
      <div className="text-center mb-1">
        {data.logoUrl ? (
          <img src={data.logoUrl} alt="Company Logo" className="mx-auto mb-2" style={{ maxHeight: "60px" }} crossOrigin="anonymous" />
        ) : (
          <div className="text-xs tracking-[0.3em] text-gray-500 uppercase">Mentora Consulting</div>
        )}
        <h1 className="text-xl font-bold mt-1">ใบสำคัญรับเงิน</h1>
      </div>

      {/* Doc info */}
      <div className="flex justify-between mb-4 text-sm">
        <div>เลขที่: <span className="font-semibold">{data.docNo || "___________"}</span></div>
        <div>วันที่: <span className="font-semibold">{formatDate(data.date)}</span></div>
      </div>

      {/* Payee info */}
      <div className="mb-2 text-sm space-y-1">
        <div>
          ข้าพเจ้า: <span className="font-semibold">{data.payee ? `${data.payee.prefix}${data.payee.name}` : "___________________________"}</span>
          <span className="text-gray-500 ml-1">(ผู้ขายสินค้า/ให้บริการ)</span>
          <span className="ml-4">เลขประจำตัวผู้เสียภาษี: <span className="font-semibold">{data.payee ? formatTaxId(data.payee.taxId) : "_ ____ _____ __ _"}</span></span>
        </div>
        <div>ที่อยู่ตามบัตรประชาชน: <span className="font-semibold">{data.payee?.address || "_______________________________________________"}</span></div>
        <div>ได้รับเงินจาก: <span className="font-semibold">{data.payerCompany}</span> <span className="text-gray-500">(ผู้ซื้อ/ผู้รับบริการ)</span></div>
      </div>

      {/* Line items */}
      <div className="font-bold text-sm mb-2">รายการดังต่อไปนี้:</div>
      <table className="w-full border-collapse mb-4 text-sm">
        <thead>
          <tr className="border-y border-black">
            <th className="py-1 px-2 text-center w-12">ลำดับ</th>
            <th className="py-1 px-2 text-left">รายการ</th>
            <th className="py-1 px-2 text-right w-32">จำนวนเงิน (บาท)</th>
            <th className="py-1 px-2 text-left w-24">หมายเหตุ</th>
          </tr>
        </thead>
        <tbody>
          {data.lineItems.map((item, i) => (
            <tr key={i} className="border-b border-gray-300">
              <td className="py-1 px-2 text-center">{i + 1}</td>
              <td className="py-1 px-2">{item.description || "-"}</td>
              <td className="py-1 px-2 text-right">{item.amount ? fmt(item.amount) : "-"}</td>
              <td className="py-1 px-2">{item.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="text-sm space-y-1 mb-4">
        <div className="flex justify-end gap-8">
          <span>หัก ณ ที่จ่าย {data.whtRate}%:</span>
          <span className="w-28 text-right font-semibold">{fmt(tax)} บาท</span>
        </div>
        <div className="flex justify-end gap-8 border-t border-black pt-1">
          <span className="font-bold">ยอดรวมสุทธิ:</span>
          <span className="w-28 text-right font-bold">{fmt(net)} บาท</span>
        </div>
        <div className="flex justify-end">
          <span className="text-gray-600">ตัวอักษร: ( {thaiBahtText(net)} )</span>
        </div>
      </div>

      {/* Payment method */}
      <div className="text-sm mb-6">
        สำหรับบัญชี: จ่ายผ่าน{" "}
        [{data.paymentMethod === "เงินสดย่อย" ? "X" : " "}] เงินสดย่อย{" "}
        [{data.paymentMethod === "โอนเงิน" ? "X" : " "}] โอนเงิน
      </div>

      {/* Signatures with signature image */}
      <div className="flex justify-between text-sm mt-8">
        <div className="text-center">
          <div className="mb-8">ลงชื่อ.........................................(ผู้รับเงิน)</div>
          <div>({data.payee ? `${data.payee.prefix}${data.payee.name}` : "......................................."})</div>
        </div>
        <div className="text-center">
          {data.signatureUrl ? (
            <div className="mb-2">
              <img src={data.signatureUrl} alt="ลายเซ็น" className="mx-auto" style={{ maxHeight: "50px" }} crossOrigin="anonymous" />
            </div>
          ) : (
            <div className="mb-8">ลงชื่อ.........................................(ผู้จ่ายเงิน)</div>
          )}
          <div>( {data.payerName} )</div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-500 mt-6 text-center">
        กรณีโอนเงิน ใบสำคัญรับเงินฉบับนี้จะสมบูรณ์ต่อเมื่อได้รับเงินจำนวนดังกล่าวข้างต้นเรียบร้อยแล้ว
      </div>
    </div>
  );
}
