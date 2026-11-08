/**
 * Normalisasi nomor HP Indonesia sesuai Bagian 4 spesifikasi:
 * 1. Hapus semua karakter selain digit.
 * 2. Jika diawali 0 -> ganti 0 dengan 62.
 * 3. Jika diawali 8 -> tambahkan 62 di depan.
 * 4. Jika diawali 62 -> biarkan.
 * 5. Hasil valid jika cocok regex ^628\d{8,12}$, selain itu kembalikan null.
 */
export function normalizePhone(input: string): string | null {
  if (!input) return null;
  let digits = input.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = "62" + digits.slice(1);
  } else if (digits.startsWith("8")) {
    digits = "62" + digits;
  } else if (digits.startsWith("62")) {
    // biarkan
  }

  if (/^628\d{8,12}$/.test(digits)) {
    return digits;
  }
  return null;
}

/**
 * Format nomor HP ternormalisasi (6281234567890) menjadi tampilan user:
 * "+62 812-3456-7890"
 */
export function formatPhoneDisplay(phone: string | null | undefined): string {
  if (!phone) return "-";
  const normalized = normalizePhone(phone) ?? phone;
  if (!normalized.startsWith("62")) return normalized;

  const rest = normalized.slice(2); // contoh: 81234567890
  const part1 = rest.slice(0, 3);
  const part2 = rest.slice(3, 7);
  const part3 = rest.slice(7);

  return `+62 ${[part1, part2, part3].filter(Boolean).join("-")}`;
}
