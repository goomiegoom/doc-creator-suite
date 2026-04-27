export interface Payee {
  id: string;
  taxId: string;
  prefix: string;
  name: string;
  nameEn: string;
  codename: string;
  address: string;
  bank: string;
  branch: string;
  accountNo: string;
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
  googleApiKey: string;
  logoGdriveUrl: string;
  signatureGdriveUrl: string;
}
