export interface Payee {
  id: string;
  name: string;
  taxId: string;
  address: string;
  type: string;
  whtRate: number;
}

export interface LineItem {
  description: string;
  amount: number;
  notes: string;
}

export interface VoucherData {
  docNo: string;
  date: string;
  paymentMethod: "เงินสดย่อย" | "โอนเงิน";
  payee: Payee | null;
  lineItems: LineItem[];
  whtRate: number;
  payerName: string;
  payerCompany: string;
  logoUrl: string;
  signatureUrl: string;
}

export interface AppSettings {
  googleSheetUrl: string;
  logoGdriveUrl: string;
  signatureGdriveUrl: string;
}
