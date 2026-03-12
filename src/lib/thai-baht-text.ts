const numbers = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const units = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน", "ล้าน"];

function convertLessThanMillion(n: number): string {
  if (n === 0) return "";
  let result = "";
  const str = Math.floor(n).toString();
  const len = str.length;
  for (let i = 0; i < len; i++) {
    const digit = parseInt(str[i]);
    const pos = len - i - 1;
    if (digit === 0) continue;
    if (pos === 1 && digit === 1) {
      result += "สิบ";
    } else if (pos === 1 && digit === 2) {
      result += "ยี่สิบ";
    } else if (pos === 0 && digit === 1 && len > 1) {
      result += "เอ็ด";
    } else {
      result += numbers[digit] + units[pos];
    }
  }
  return result;
}

export function thaiBahtText(amount: number): string {
  if (amount === 0) return "ศูนย์บาทถ้วน";
  
  const [intPart, decPart] = amount.toFixed(2).split(".");
  const intNum = parseInt(intPart);
  const decNum = parseInt(decPart);

  let result = "";
  if (intNum >= 1000000) {
    const millions = Math.floor(intNum / 1000000);
    result += convertLessThanMillion(millions) + "ล้าน";
    result += convertLessThanMillion(intNum % 1000000);
  } else {
    result += convertLessThanMillion(intNum);
  }

  result += "บาท";

  if (decNum === 0) {
    result += "ถ้วน";
  } else {
    result += convertLessThanMillion(decNum) + "สตางค์";
  }

  return result;
}
