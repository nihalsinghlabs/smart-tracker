
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();
const PORT = process.env.PORT || 5000;
const MODEL = "gemini-3.8-flash";

app.use(cors());
app.use(express.json({ limit: "20kb" }));

if (!process.env.GEMINI_API_KEY) {
  console.error("Missing GEMINI_API_KEY in server/.env");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function logGeminiError(label, error) {
  console.error(
    label,
    JSON.stringify(
      {
        name: error.name,
        status: error.status,
        message: error.message,
        details: error.errorDetails,
      },
      null,
      2
    )
  );
}

app.get("/", (req, res) => {
  res.json({ message: "SmartTracker AI backend is running" });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "SmartTracker API" });
});

// Single-product analysis
app.post("/api/expiry-intelligence", async (req, res) => {
  try {
    const {
      name,
      category,
      purchaseDate,
      expiryDate,
      expirySource,
    } = req.body || {};

    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 150
    ) {
      return res.status(400).json({
        error: "Provide a valid product name (maximum 150 characters).",
      });
    }

    const safeCategory = ["Grocery", "Medicine", "Other"].includes(category)
      ? category
      : "Other";

    const safePurchaseDate =
      typeof purchaseDate === "string" ? purchaseDate : "Unknown";

    const safeExpiryDate =
      typeof expiryDate === "string" && expiryDate
        ? expiryDate
        : "Unknown";

    const safeExpirySource = [
      "verified",
      "estimated",
      "unknown",
    ].includes(expirySource)
      ? expirySource
      : "unknown";

    const prompt = `
You are SmartTracker's expiry intelligence assistant.

Product: ${name.trim()}
Category: ${safeCategory}
Purchase date: ${safePurchaseDate}
Recorded expiry date: ${safeExpiryDate}
Recorded expiry source: ${safeExpirySource}

Rules:
- Never invent a manufacturer's expiry date.
- A purchase date is not an expiry date.
- A receipt cannot establish the actual expiry date of a particular pack.
- Do not claim to have checked external databases or product labels.
- For medicines, do not estimate the actual pack expiry date.
  Tell the user to check the printed package or ask a pharmacist.
- For groceries, provide cautious general advice when appropriate.
- Never present a shelf-life guess as a verified expiry date.
- Treat a verified date as user-provided, not independently verified.
- Give concise, practical guidance.
- Return valid JSON with these keys:
  summary, expiryAssessment, recommendedAction, safetyNote.
- expiryAssessment must be "verified", "estimated", or "unknown".
- Do not calculate or invent an exact expiry date.
`;

    const response = await ai.interactions.create({
      model: MODEL,
      input: prompt,
      response_format: {
        type: "text",
      },
    });

    const outputText = response.output_text;

    if (!outputText) {
      throw new Error("Gemini returned an empty response.");
    }

    const result = JSON.parse(
      outputText
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/, "")
        .trim()
    );

    if (!result || typeof result !== "object" || Array.isArray(result)) {
      throw new Error("Gemini returned an invalid JSON object.");
    }

    if (safeExpirySource === "verified") {
      result.expiryAssessment = "verified";
    } else {
      result.expiryAssessment = "unknown";
    }

    res.json(result);
  } catch (error) {
    logGeminiError("Gemini single-product error:", error);

    res.status(error.status || 500).json({
      error: "AI analysis failed.",
      details: error.message,
      status: error.status || null,
    });
  }
});

// Batch analysis for receipt products
app.post("/api/expiry-intelligence/batch", async (req, res) => {
  try {
    const { products } = req.body || {};

    if (
      !Array.isArray(products) ||
      products.length === 0 ||
      products.length > 20
    ) {
      return res.status(400).json({
        error: "Provide between 1 and 20 products.",
      });
    }

    const cleanProducts = products.map((product, index) => {
      if (
        !product ||
        typeof product.name !== "string" ||
        !product.name.trim() ||
        product.name.length > 150
      ) {
        throw new Error(`Product ${index + 1} has an invalid name.`);
      }

      return {
        id: String(product.id || index + 1),
        name: product.name.trim(),
        category: ["Grocery", "Medicine", "Other"].includes(
          product.category
        )
          ? product.category
          : "Other",
        purchaseDate: isValidDate(product.purchaseDate)
          ? product.purchaseDate
          : new Date().toISOString().slice(0, 10),
        expiryDate:
          typeof product.expiryDate === "string"
            ? product.expiryDate
            : "",
      };
    });

    const prompt = `
You are SmartTracker's cautious receipt-based expiry assistant.

Analyze every product in this list:
${JSON.stringify(cleanProducts)}

Rules:
1. Return one result for every product and preserve its id.
2. Do not assume the purchase date is the manufacturing date.
3. A receipt does not establish a particular package's actual expiry date.
4. For medicines, do not estimate the actual pack expiry date.
   Return an empty expiryDate and expirySource "unknown".
5. For groceries, provide a rough expiry estimate only when reasonable.
   Explain storage and packaging assumptions.
6. If information is insufficient, return an empty expiryDate.
7. Never label an AI-generated date as verified.
8. No live web research is being performed in this request.
   Do not claim to have searched the web or consulted external sources.
9. Return only JSON matching the required schema.
10. Use "estimated" only when providing a reasonable date estimate;
    otherwise use "unknown".
`;

    const response = await ai.interactions.create({
      model: MODEL,
      input: prompt,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  expiryDate: { type: "string" },
                  expirySource: {
                    type: "string",
                    enum: ["estimated", "unknown"],
                  },
                  expiryEvidence: { type: "string" },
                  summary: { type: "string" },
                  sources: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        url: { type: "string" },
                      },
                      required: ["title", "url"],
                    },
                  },
                },
                required: [
                  "id",
                  "expiryDate",
                  "expirySource",
                  "expiryEvidence",
                  "summary",
                  "sources",
                ],
              },
            },
          },
          required: ["results"],
        },
      },
    });

    const outputText = response.output_text;

    if (!outputText) {
      throw new Error("Gemini returned an empty batch response.");
    }

    const parsed = JSON.parse(outputText);

    if (!parsed || !Array.isArray(parsed.results)) {
      throw new Error("Gemini returned an invalid results list.");
    }

    const inputIds = new Set(cleanProducts.map((product) => product.id));
    const seenIds = new Set();

    const results = parsed.results
      .filter((item) => {
        if (!item || !inputIds.has(String(item.id))) {
          return false;
        }

        const id = String(item.id);

        if (seenIds.has(id)) {
          return false;
        }

        seenIds.add(id);
        return true;
      })
      .map((item) => {
        const validEstimatedDate =
          isValidDate(item.expiryDate) &&
          item.expirySource === "estimated";

        return {
          id: String(item.id),
          expiryDate: validEstimatedDate ? item.expiryDate : "",
          expirySource: validEstimatedDate ? "estimated" : "unknown",
          expiryEvidence:
            typeof item.expiryEvidence === "string"
              ? item.expiryEvidence
              : "No reliable expiry estimate was available.",
          summary:
            typeof item.summary === "string" ? item.summary : "",
          sources: [],
        };
      });

    res.json({ results });
  } catch (error) {
    console.error(
      "Gemini batch error:",
      JSON.stringify(
        {
          name: error.name,
          status: error.status,
          message: error.message,
          details: error.errorDetails,
        },
        null,
        2
      )
    );

    res.status(error.status || 500).json({
      error: "Batch expiry analysis failed.",
      details: error.message,
      status: error.status || null,
    });
  }
});

app.listen(PORT, () => {
  console.log(`SmartTracker backend running on port ${PORT}`);
});
