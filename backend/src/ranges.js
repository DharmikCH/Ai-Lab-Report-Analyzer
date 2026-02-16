export const CBC_RANGES = {
  Hemoglobin: {
    male: [13.0, 17.0],
    female: [12.0, 16.0],
    unit: "g/dL"
  },
  WBC: {
    all: [4000, 11000],
    unit: "cells/µL"
  },
  RBC: {
    male: [4.3, 5.9],
    female: [3.5, 5.5],
    unit: "million cells/µL"
  },
  Platelets: {
    all: [150000, 400000],
    unit: "platelets/µL"
  },
  Hematocrit: {
    male: [38.3, 48.6],
    female: [35.5, 44.9],
    unit: "%"
  },
  MCV: {
    all: [80, 100],
    unit: "fL"
  },
  MCH: {
    all: [27, 33],
    unit: "pg/cell"
  },
  MCHC: {
    all: [32, 36],
    unit: "g/dL"
  }
};

function getRangeForMarker(marker, gender = "other") {
  const config = CBC_RANGES[marker];
  if (!config) return null;

  if (config.all) {
    return config.all;
  }

  const normalizedGender = String(gender).toLowerCase();
  if (normalizedGender === "male") return config.male;
  if (normalizedGender === "female") return config.female;

  return config.male ?? config.female ?? null;
}

export function evaluateCbcValues(values, gender) {
  return Object.entries(values).map(([marker, value]) => {
    const range = getRangeForMarker(marker, gender);
    if (!range || typeof value !== "number") {
      return {
        marker,
        value,
        status: "unknown",
        range: null,
        unit: CBC_RANGES[marker]?.unit ?? ""
      };
    }

    const [min, max] = range;
    let status = "normal";
    if (value < min) status = "low";
    if (value > max) status = "high";

    return {
      marker,
      value,
      status,
      range: { min, max },
      unit: CBC_RANGES[marker]?.unit ?? ""
    };
  });
}
