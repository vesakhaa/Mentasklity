import { normalizePhone, formatPhoneDisplay } from "../phone";

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`FAIL: ${message} | expected=${expected}, actual=${actual}`);
  }
  console.log(`PASS: ${message}`);
}

// Uji contoh dari Bagian 4 Spesifikasi
assertEqual(
  normalizePhone("0812-3456-7890"),
  "6281234567890",
  "Format 0812-3456-7890"
);
assertEqual(
  normalizePhone("+62 812 3456 7890"),
  "6281234567890",
  "Format +62 812 3456 7890"
);
assertEqual(
  normalizePhone("81234567890"),
  "6281234567890",
  "Format 81234567890 tanpa awalan 0/62"
);
assertEqual(
  normalizePhone("021-5551234"),
  null,
  "Nomor telepon rumah ditolak"
);
assertEqual(
  normalizePhone("08123"),
  null,
  "Nomor terlalu pendek ditolak"
);
assertEqual(
  formatPhoneDisplay("6281234567890"),
  "+62 812-3456-7890",
  "Format tampilan +62 812-3456-7890"
);
