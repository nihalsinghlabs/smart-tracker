import { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import "./ReceiptScanner.css";

const API_URL = "https://smart-tracker-api-pbpd.onrender.com";

const today = () => {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
};

function detectCategory(name) {
  const medicineWords =
    /\b(tablet|tablets|capsule|capsules|syrup|medicine|medication|vitamin|paracetamol|acetaminophen|ibuprofen|lisinopril|metformin|amlodipine|atorvastatin|omeprazole|insulin|ointment|injection|mg|mcg|prescription|rx)\b/i;

  return medicineWords.test(name) ? "Medicine" : "Grocery";
}

function parseReceipt(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const items = [];
  const excludedPatterns = [
    /\b(pharmacy|medical plaza|healthtown|store address|billing address)\b/i,
    /\b(address|street|st\.|road|rd\.|avenue|ave\.|suite|city|state|zip code|postal code)\b/i,
    /\b(usa|united states|phone|telephone|tel\.|fax|website|www\.|email)\b/i,
    /\b(rx|prescription|patient|doctor|physician|dr\.|mr\.|mrs\.|ms\.)\s*[:#.]?/i,
    /\b(patient id|member id|account number|medical record)\b/i,
    /\b(tax|taxes|sales tax|vat|gst|cgst|sgst|igst|hst|duty)\b/i,
    /\b(subtotal|sub-total|grand total|total|balance due|amount due|amount paid)\b/i,
    /\b(discount|coupon|savings|surcharge|service charge|service fee|convenience fee)\b/i,
    /\b(tip|gratuity|delivery fee|shipping fee|handling fee|rounding|round off)\b/i,
    /\b(percent|percentage)\b/i,
    /\b(insurance|copay|co-pay|deductible|coverage|claim|reimbursement)\b/i,
    /\b(payment|paid|cash|change|credit|debit|visa|mastercard|amex|discover)\b/i,
    /\b(card|card number|card #|transaction|authorization|approval|reference number)\b/i,
    /\b(invoice|receipt|order number|order #|invoice #|invoice number)\b/i,
    /\b(transaction id|transaction #|terminal|register|cashier|operator)\b/i,
    /\b(date|time|thank you|welcome|customer copy|merchant copy)\b/i,
    /\b(barcode|tracking number|serial number|confirmation number)\b/i,
  ];

  for (const originalLine of lines) {
    const line = originalLine.trim();

    if (excludedPatterns.some((pattern) => pattern.test(line))) continue;
    if (/\d+(?:\.\d+)?\s*%/.test(line)) continue;

    const priceMatch = line.match(
      /(?:\$\s*|₹\s*|Rs\.?\s*|INR\s*)?\d{1,6}(?:,\d{3})*(?:\.\d{2})\s*$/i
    );

    if (!priceMatch) continue;

    let name = line.slice(0, priceMatch.index).trim();
    name = name.replace(/^\d{1,3}[.)]\s*/, "").trim();

    if (name.length < 2 || !/[a-zA-Z]/.test(name)) continue;

    if (
      /^(qty|quantity|unit price|price|amount|total|tax|fee|discount|payment|balance|change|cash|subtotal|shipping|delivery)\b/i.test(
        name
      )
    ) {
      continue;
    }

    if (
      /^\d+\s+[A-Za-z].*\b(street|road|avenue|lane|drive|boulevard)\b/i.test(name) ||
      /\b\d{5}(?:-\d{4})?\b/.test(name) ||
      /^\W*\d{6,}\W*$/.test(name)
    ) {
      continue;
    }

    let quantity = 1;
    const quantityMatch = name.match(/^(\d+)\s*[xX×]\s*(.+)$/);

    if (quantityMatch) {
      quantity = Math.max(1, Number(quantityMatch[1]));
      name = quantityMatch[2].trim();
    }

    if (
      /^(tax|taxes|subtotal|grand total|total|insurance|copay|co-pay|payment|amount|balance|change|shipping|delivery|service fee|discount)\b/i.test(
        name
      )
    ) {
      continue;
    }

    items.push({
      id: `${Date.now()}-${items.length}-${Math.random()}`,
      name,
      quantity,
      category: detectCategory(name),
      purchaseDate: today(),
      expiryDate: "",
      expiryConfirmed: false,
      expirySource: "unknown",
      expiryEvidence: "Receipt does not provide a confirmed expiry date.",
      summary: "",
      sources: [],
    });
  }

  return items;
}

function ReceiptScanner({ onImport, setActivePage }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [rawText, setRawText] = useState("");
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(selectedFile.type)) {
      setError("Choose a JPG, PNG, or WebP receipt image.");
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Choose an image smaller than 10 MB.");
      return;
    }

    setFile(selectedFile);
    setItems([]);
    setRawText("");
    setProgress(0);
    setStatus("idle");
    setError("");
    setNotice("");
    setShowRawText(false);
  };

  const analyzeProducts = async (detectedItems) => {
    setStatus("analyzing");
    setNotice("Receipt scanned. Asking AI to estimate expiry dates in one batch…");

    try {
      const response = await fetch(`${API_URL}/api/expiry-intelligence/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: detectedItems.map((item) => ({
            id: item.id,
            name: item.name,
            category: item.category,
            purchaseDate: item.purchaseDate,
            expiryDate: item.expiryDate,
          })),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.details || data.error || `Request failed (${response.status}).`);
      }

      if (!Array.isArray(data.results)) {
        throw new Error("The AI response did not contain a results list.");
      }

      const resultsById = new Map(data.results.map((result) => [String(result.id), result]));

      const enrichedItems = detectedItems.map((item) => {
        const result = resultsById.get(String(item.id));

        // Never apply an AI-estimated expiry date to medicine.
        if (item.category === "Medicine") {
          return {
            ...item,
            expiryDate: "",
            expiryConfirmed: false,
            expirySource: "unknown",
            expiryEvidence:
              "AI does not estimate the actual expiry of a medicine pack. Check the printed package or ask a pharmacist.",
            summary: result?.summary || "Check the printed expiry date on the medicine package.",
            sources: [],
          };
        }

        const proposedDate =
          result?.expirySource === "estimated" &&
          typeof result.expiryDate === "string" &&
          /^\d{4}-\d{2}-\d{2}$/.test(result.expiryDate)
            ? result.expiryDate
            : "";

        return {
          ...item,
          expiryDate: proposedDate,
          expiryConfirmed: false,
          expirySource: proposedDate ? "estimated" : "unknown",
          expiryEvidence:
            result?.expiryEvidence ||
            "No reasonable expiry estimate was available. Check the product packaging.",
          summary: result?.summary || "",
          sources: Array.isArray(result?.sources) ? result.sources : [],
        };
      });

      setItems(enrichedItems);
      setStatus("review");
      setNotice(
        "AI analysis complete. Dates marked Estimated are rough guidance only; confirm dates on the packaging before relying on them."
      );

      if (data.results.length < detectedItems.length) {
        setError("AI returned results for only some products. Missing products remain without an estimated date.");
      }
    } catch (err) {
      console.error("Batch expiry analysis failed:", err);
      setItems(
        detectedItems.map((item) => ({
          ...item,
          expiryDate: "",
          expiryConfirmed: false,
          expirySource: "unknown",
          expiryEvidence:
            "AI analysis was unavailable. Check the product packaging for its expiry date.",
          summary: "",
          sources: [],
        }))
      );
      setStatus("review");
      setNotice("Receipt OCR succeeded, but AI expiry analysis failed. You can still review and import the products.");
      setError(`${err.message} Make sure the backend is running at ${API_URL}.`);
    }
  };

  const scanReceipt = async () => {
    if (!file) {
      setError("Upload a receipt image first.");
      return;
    }

    let worker;

    try {
      setStatus("scanning");
      setProgress(0);
      setError("");
      setNotice("");
      setItems([]);

      worker = await createWorker("eng", 1, {
        logger: (message) => {
          if (message.status === "recognizing text") {
            setProgress(Math.round((message.progress || 0) * 100));
          }
        },
      });

      const result = await worker.recognize(file);
      const text = result.data.text || "";
      setRawText(text);

      const detectedItems = parseReceipt(text);

      if (!detectedItems.length) {
        setItems([]);
        setStatus("empty");
        setError("Text was read, but no likely products were detected. Check the extracted text or add items manually.");
        return;
      }

      await analyzeProducts(detectedItems);
    } catch (err) {
      console.error("Receipt scanning failed:", err);
      setStatus("idle");
      setError("Could not scan this image. Try a clearer, well-lit receipt.");
    } finally {
      if (worker) await worker.terminate();
    }
  };

  const updateItem = (id, field, value) => {
    setItems((current) =>
      current.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === "expiryDate") {
          updated.expiryConfirmed = false;
          updated.expirySource = value ? "unknown" : "unknown";
          updated.expiryEvidence = value
            ? "Date entered during receipt review but not confirmed against packaging."
            : "No expiry date has been confirmed.";
        }

        if (field === "category" && value === "Medicine") {
          updated.expiryDate = "";
          updated.expiryConfirmed = false;
          updated.expirySource = "unknown";
          updated.expiryEvidence =
            "Check the printed expiry date on the medicine package or ask a pharmacist.";
        }

        return updated;
      })
    );
  };

  const addManualItem = () => {
    setItems((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random()}`,
        name: "",
        quantity: 1,
        category: "Grocery",
        purchaseDate: today(),
        expiryDate: "",
        expiryConfirmed: false,
        expirySource: "unknown",
        expiryEvidence: "No expiry date has been confirmed.",
        summary: "",
        sources: [],
      },
    ]);
    setStatus("review");
    setError("");
  };

  const removeItem = (id) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const importItems = () => {
    const validItems = items.filter((item) => item.name.trim());

    if (!validItems.length) {
      setError("Add at least one product name before importing.");
      return;
    }

    if (!onImport) {
      setError("The scanner is not connected to your inventory yet.");
      return;
    }

    onImport(
      validItems.map(({ id, expiryConfirmed, summary, sources, ...item }) => {
        const hasExpiryDate = Boolean(item.expiryDate);
        let expirySource = item.expirySource || "unknown";
        let expiryEvidence = item.expiryEvidence || "No expiry date has been confirmed.";

        if (!hasExpiryDate) {
          expirySource = "unknown";
        } else if (expiryConfirmed) {
          expirySource = "verified";
          expiryEvidence = "User confirmed the expiry date against the product packaging.";
        } else if (expirySource !== "estimated") {
          expirySource = "unknown";
          expiryEvidence = "Date entered during receipt review but not confirmed against the packaging.";
        }

        if (item.category === "Medicine" && !expiryConfirmed) {
          item.expiryDate = "";
          expirySource = "unknown";
          expiryEvidence = "Check the printed expiry date on the medicine package or ask a pharmacist.";
        }

        return {
          ...item,
          name: item.name.trim(),
          quantity: Math.max(1, Number(item.quantity) || 1),
          expirySource,
          expiryEvidence,
        };
      })
    );
  };

  const busy = status === "scanning" || status === "analyzing";

  return (
    <main className="receipt-page">
      <header className="receipt-header">
        <div>
          <p className="receipt-eyebrow">SMARTTRACKER / AUTOMATION</p>
          <h1>Receipt Scanner</h1>
          <p className="receipt-subtitle">
            Scan a receipt, review products, and get cautious expiry estimates.
          </p>
        </div>

        {setActivePage && (
          <button className="receipt-secondary-btn" onClick={() => setActivePage("Products")}>
            Back to Products
          </button>
        )}
      </header>

      <section className="receipt-upload-card">
        <div className="receipt-upload-icon">↑</div>
        <h2>Upload your receipt</h2>
        <p>Choose a clear image of your grocery or medicine bill.</p>

        <label className="receipt-file-label">
          Choose receipt image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
          />
        </label>

        <p className="receipt-hint">JPG, PNG or WebP · Maximum 10 MB</p>

        {preview && (
          <div className="receipt-preview">
            <img src={preview} alt="Selected receipt preview" />
            <p>{file.name}</p>
          </div>
        )}

        <button className="receipt-primary-btn" onClick={scanReceipt} disabled={!file || busy}>
          {status === "scanning"
            ? `Reading receipt... ${progress}%`
            : status === "analyzing"
              ? "Analysing all products with AI..."
              : "Scan receipt and analyse"}
        </button>

        {status === "scanning" && (
          <div className="receipt-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
        )}

        {notice && <p className="receipt-notice">{notice}</p>}
        {error && <p className="receipt-error">{error}</p>}
      </section>

      {status === "review" && (
        <section className="receipt-review-card">
          <div className="receipt-review-heading">
            <div>
              <h2>Review detected products</h2>
              <p>
                {items.length} possible item{items.length === 1 ? "" : "s"} found.
                Check the names and treat AI dates as estimates only.
              </p>
            </div>

            <button className="receipt-text-btn" onClick={addManualItem}>
              + Add item
            </button>
          </div>

          <div className="receipt-item-list">
            {items.map((item) => (
              <article className="receipt-item" key={item.id}>
                <label>
                  Product name
                  <input
                    value={item.name}
                    onChange={(event) => updateItem(item.id, "name", event.target.value)}
                    placeholder="e.g. Milk"
                  />
                </label>

                <div className="receipt-field-grid">
                  <label>
                    Quantity
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(event) => updateItem(item.id, "quantity", event.target.value)}
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={item.category}
                      onChange={(event) => updateItem(item.id, "category", event.target.value)}
                    >
                      <option value="Grocery">Grocery</option>
                      <option value="Medicine">Medicine</option>
                      <option value="Other">Other</option>
                    </select>
                  </label>

                  <label>
                    Purchase date
                    <input
                      type="date"
                      value={item.purchaseDate}
                      onChange={(event) => updateItem(item.id, "purchaseDate", event.target.value)}
                    />
                  </label>

                  <label>
                    Expiry date
                    <input
                      type="date"
                      value={item.expiryDate}
                      onChange={(event) => updateItem(item.id, "expiryDate", event.target.value)}
                    />
                  </label>
                </div>

                {item.summary && <p className="receipt-ai-summary">{item.summary}</p>}
                {item.expiryEvidence && (
                  <p className="receipt-ai-evidence">{item.expiryEvidence}</p>
                )}

                {item.expirySource === "estimated" && item.expiryDate && (
                  <p className="receipt-expiry-estimated">
                    Estimated date — check the product label before relying on it.
                  </p>
                )}

                <label className="receipt-expiry-confirm">
                  <input
                    type="checkbox"
                    checked={Boolean(item.expiryConfirmed)}
                    onChange={(event) =>
                      updateItem(item.id, "expiryConfirmed", event.target.checked)
                    }
                    disabled={!item.expiryDate}
                  />
                  I confirmed this expiry date on the product packaging.
                </label>

                <div className="receipt-item-footer">
                  <span>
                    {!item.expiryDate
                      ? "Expiry date unknown"
                      : item.expiryConfirmed
                        ? "Packaging-confirmed expiry date"
                        : item.expirySource === "estimated"
                          ? "AI estimate — not verified"
                          : "Expiry date not verified"}
                  </span>
                  <button className="receipt-remove-btn" onClick={() => removeItem(item.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="receipt-disclaimer">
            AI dates are estimates, not package-verified expiry dates. Storage and packaging affect shelf life.
            For medicines, check the printed expiry date or ask a pharmacist.
          </p>

          <button
            className="receipt-primary-btn"
            onClick={importItems}
            disabled={!items.some((item) => item.name.trim())}
          >
            Import reviewed products
          </button>
        </section>
      )}

      {status === "empty" && (
        <section className="receipt-review-card">
          <h2>No products detected</h2>
          <p>You can add items manually or inspect the OCR text below.</p>
          <button className="receipt-secondary-btn" onClick={addManualItem}>
            Add product manually
          </button>
        </section>
      )}

      {rawText && (
        <section className="receipt-raw-card">
          <button className="receipt-text-btn" onClick={() => setShowRawText((value) => !value)}>
            {showRawText ? "Hide" : "Show"} extracted receipt text
          </button>
          {showRawText && <pre>{rawText}</pre>}
        </section>
      )}
    </main>
  );
}

export default ReceiptScanner;
