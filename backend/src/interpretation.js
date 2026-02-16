export function getUrgency(flags) {
  const highRiskMarkers = new Set(["Hemoglobin", "WBC", "Platelets"]);
  const severe = flags.filter((f) => f.status !== "normal");

  if (severe.some((f) => highRiskMarkers.has(f.marker))) {
    return "High";
  }

  if (severe.length >= 2) {
    return "Moderate";
  }

  if (severe.length === 1) {
    return "Low";
  }

  return "Low";
}

export async function buildDoctorSummary({ abnormalFlags, userContext, openaiClient, model }) {
  const fallback = `Potentially abnormal CBC markers were detected (${abnormalFlags
    .map((f) => `${f.marker}: ${f.value}`)
    .join(", ")}). Bring this report, your medications, symptoms timeline, and prior CBC history to your clinician. This tool is not diagnostic.`;

  if (!openaiClient) {
    return {
      explanation:
        "Some CBC markers are outside typical ranges. This can have multiple causes, many of which are non-emergency and require clinician context.",
      redFlagsToWatch:
        "Worsening fatigue, persistent fever, unusual bleeding/bruising, shortness of breath, chest pain, or confusion.",
      doctorSummary: fallback
    };
  }

  const completion = await openaiClient.chat.completions.create({
    model,
    temperature: 0.2,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a cautious medical assistant. Do not diagnose. Provide educational, safety-first guidance. Return JSON with keys: explanation, redFlagsToWatch, doctorSummary."
      },
      {
        role: "user",
        content: JSON.stringify({ abnormalFlags, userContext })
      }
    ]
  });

  return JSON.parse(completion.choices?.[0]?.message?.content ?? "{}");
}
