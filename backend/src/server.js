import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs/promises";
import OpenAI from "openai";
import { extractPdfText, extractCbcValues } from "./extraction.js";
import { evaluateCbcValues } from "./ranges.js";
import { buildDoctorSummary, getUrgency } from "./interpretation.js";

const app = express();
const upload = multer({ dest: "tmp/" });

app.use(cors());
app.use(express.json());

const openaiClient = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/analyze", upload.single("report"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "report PDF is required" });
  }

  const age = Number(req.body.age);
  const gender = req.body.gender || "other";
  const history = req.body.history || "";

  try {
    const rawText = await extractPdfText(req.file.path);
    const values = await extractCbcValues({
      rawText,
      openaiClient,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini"
    });

    const flags = evaluateCbcValues(values, gender);
    const abnormalFlags = flags.filter((f) => f.status !== "normal" && f.status !== "unknown");

    const urgency = getUrgency(abnormalFlags);
    const aiSummary = await buildDoctorSummary({
      abnormalFlags,
      userContext: { age, gender, history },
      openaiClient,
      model: process.env.OPENAI_MODEL || "gpt-4o-mini"
    });

    return res.json({
      disclaimer:
        "⚠️ This tool provides interpretation assistance only. It is not a medical diagnosis and does not replace professional medical advice.",
      values,
      flags,
      urgency,
      ...aiSummary
    });
  } catch (error) {
    return res.status(500).json({
      error: "Unable to analyze report",
      details: error?.message
    });
  } finally {
    await fs.unlink(req.file.path).catch(() => {});
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`CBC analyzer backend listening on ${port}`);
});
