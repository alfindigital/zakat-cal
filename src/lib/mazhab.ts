// User's fiqh preference. Purely informational today: we surface a contextual
// note next to calculators whose default takaran/nisab differs by mazhab.
// Not a calculation switch — users still enter their own price/rate, so no
// existing math changes when this flips.
export type Mazhab = "jumhur" | "hanafi";

const MAZHAB_KEY = "zakat-mazhab";

export const MAZHAB_LABEL: Record<Mazhab, string> = {
  jumhur: "Jumhur (Syafi'i/Maliki/Hanbali)",
  hanafi: "Hanafi",
};

export const MAZHAB_NOTES: Record<Mazhab, { fitrah: string; maal: string }> = {
  jumhur: {
    fitrah: "Jumhur: 1 sha' ≈ 2,5 kg makanan pokok (beras) per jiwa.",
    maal: "Jumhur: nisab utama emas 85 g; boleh perak untuk aset non-tunai.",
  },
  hanafi: {
    fitrah: "Hanafi: boleh dibayar uang senilai ½ sha' gandum (~1,75 kg) atau 1 sha' kurma/kismis (~2,5 kg).",
    maal: "Hanafi: nisab perak (595 g) diutamakan untuk uang tunai agar lebih memberatkan bagi si kaya.",
  },
};

export function loadMazhab(): Mazhab {
  if (typeof localStorage === "undefined") return "jumhur";
  try {
    const v = localStorage.getItem(MAZHAB_KEY);
    return v === "hanafi" ? "hanafi" : "jumhur";
  } catch {
    return "jumhur";
  }
}

export function saveMazhab(m: Mazhab) {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(MAZHAB_KEY, m);
  } catch {
    /* ignore */
  }
}
