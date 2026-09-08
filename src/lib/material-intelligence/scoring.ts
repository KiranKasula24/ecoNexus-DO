export function calculateQualityTier(
  qualityGrade: "A" | "B" | "C" | "D",
  contaminationLevel?: number | null,
): number {
  const tierMap: Record<"A" | "B" | "C" | "D", number> = {
    A: 1,
    B: 2,
    C: 3,
    D: 4,
  };
  let tier = tierMap[qualityGrade];

  if (contaminationLevel !== null && contaminationLevel !== undefined) {
    if (contaminationLevel > 20) {
      tier = Math.min(4, tier + 1);
    }
  }

  return tier;
}

function clampScore(value: number): number {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return Math.round(value);
}

export function calculateProcessabilityScore(
  materialCategory: string,
  contaminationLevel?: number | null,
): number {
  let base = 70;

  if (materialCategory === "metal") base = 85;
  if (materialCategory === "plastic") base = 75;

  if (contaminationLevel !== null && contaminationLevel !== undefined) {
    base -= contaminationLevel * 0.5;
  }

  return clampScore(base);
}

export function calculateRecyclableScore(
  materialCategory: string,
  qualityTier: number,
): number {
  let base = 80 - qualityTier * 10;

  if (materialCategory === "glass") base += 5;

  return clampScore(base);
}
