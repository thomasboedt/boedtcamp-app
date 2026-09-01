// Derived body-composition metrics, computed from a measurement row and never
// stored — BMI/WHR/WHtR always follow from weight/height/waist/hip directly.

export type MeasCalc = {
  bmi: number;
  bmiLabel: string;
  whr: number;
  whtr: number;
};

export function deriveMeasCalc(m: { weight?: number | null; height?: number | null; waist?: number | null; hip?: number | null }): MeasCalc {
  const w = m.weight || 0;
  const h = m.height || 0;
  const wa = m.waist || 0;
  const hi = m.hip || 0;
  const bmi = w && h ? w / Math.pow(h / 100, 2) : 0;
  return {
    bmi: bmi ? Math.round(bmi * 10) / 10 : 0,
    bmiLabel: !bmi ? "" : bmi < 18.5 ? "ondergewicht" : bmi < 25 ? "gezond gewicht" : bmi < 30 ? "overgewicht" : "obesitas",
    whr: wa && hi ? Math.round((wa / hi) * 100) / 100 : 0,
    whtr: wa && h ? Math.round((wa / h) * 100) / 100 : 0,
  };
}

export type Zone = { color: "green" | "orange" | "red" | "neutral"; label: string };

export function measZone(metric: "bmi" | "whr" | "whtr", v: number): Zone {
  if (!v) return { color: "neutral", label: "" };
  if (metric === "bmi") {
    if (v < 18.5) return { color: "orange", label: "ondergewicht" };
    if (v < 25) return { color: "green", label: "gezond gewicht" };
    if (v < 30) return { color: "orange", label: "overgewicht" };
    return { color: "red", label: "obesitas" };
  }
  if (metric === "whr") {
    if (v < 0.9) return { color: "green", label: "onder 0,90" };
    if (v <= 0.95) return { color: "orange", label: "0,90 – 0,95" };
    return { color: "red", label: "boven 0,95" };
  }
  if (v < 0.4) return { color: "orange", label: "onder 0,40" };
  if (v < 0.5) return { color: "green", label: "0,40 – 0,49" };
  if (v < 0.6) return { color: "orange", label: "0,50 – 0,59" };
  return { color: "red", label: "boven 0,59" };
}
