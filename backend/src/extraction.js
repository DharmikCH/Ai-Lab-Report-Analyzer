import fs from "node:fs/promises";
import pdf from "pdf-parse";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { z } from "zod";

const CBC_SCHEMA = z.object({
  Hemoglobin: z.number().nullable(),
  WBC: z.number().nullable(),
  RBC: z.number().nullable(),
  Platelets: z.number().nullable(),
  Hematocrit: z.number().nullable(),
  MCV: z.number().nullable(),
  MCH: z.number().nullable(),
  MCHC: z.number().nullable()
});

export async function extractPdfText(filePath) {
  try {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    return docs.map((doc) => doc.pageContent).join("\n");
  } catch {
    const buffer = await fs.readFile(filePath);
    const parsed = await pdf(buffer);
    return parsed.text;
  }
}

function localFallbackExtraction(rawText) {
  const patterns = {
    Hemoglobin: /hemoglobin\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    WBC: /(?:wbc|white\s*blood\s*cell(?:s)?)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    RBC: /(?:rbc|red\s*blood\s*cell(?:s)?)\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    Platelets: /platelets?\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    Hematocrit: /hematocrit\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    MCV: /mcv\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    MCH: /mch\s*[:\-]?\s*(\d+(?:\.\d+)?)/i,
    MCHC: /mchc\s*[:\-]?\s*(\d+(?:\.\d+)?)/i
  };

  return Object.fromEntries(
    Object.entries(patterns).map(([marker, regex]) => {
      const match = rawText.match(regex);
      return [marker, match ? Number(match[1]) : null];
    })
  );
}

export async function extractCbcValues({ rawText, openaiClient, model }) {
  if (!openaiClient) {
    return CBC_SCHEMA.parse(localFallbackExtraction(rawText));
  }

  const completion = await openaiClient.chat.completions.create({
    model,
    temperature: 0,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Extract only these CBC values from the provided report text: Hemoglobin, WBC, RBC, Platelets, Hematocrit, MCV, MCH, MCHC. Return JSON only. Use numbers or null if unavailable."
      },
      {
        role: "user",
        content: rawText.slice(0, 12000)
      }
    ]
  });

  const content = completion.choices?.[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(content);
  return CBC_SCHEMA.parse(parsed);
}
