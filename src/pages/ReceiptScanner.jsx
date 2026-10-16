
import { useEffect, useState } from "react";
import { createWorker } from "tesseract.js";
import "./ReceiptScanner.css";
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

  // Common receipt headers, personal information, and non-product charges.
  const excludedPatterns = [
    // Store and contact information
    /\b(pharmacy|medical plaza|healthtown|store address|billing address)\b/i,
    /\b(address|street|st\.|road|rd\.|avenue|ave\.|suite|city|state|zip code|postal code)\b/i,
    /\b(usa|united states|phone|telephone|tel\.|fax|website|www\.|email)\b/i,

    // Prescription and patient information
    /\b(rx|prescription|patient|doctor|physician|dr\.|mr\.|mrs\.|ms\.)\s*[:#.]?/i,
    /\b(patient id|member id|account number|medical record)\b/i,

    // Taxes, fees, totals, and discounts
    /\b(tax|taxes|sales tax|vat|gst|cgst|sgst|igst|hst|duty)\b/i,
    /\b(subtotal|sub-total|grand total|total|balance due|amount due|amount paid)\b/i,
    /\b(discount|coupon|savings|surcharge|service charge|service fee|convenience fee)\b/i,
    /\b(tip|gratuity|delivery fee|shipping fee|handling fee|rounding|round off)\b/i,
    /\b(percent|percentage)\b/i,

    // Insurance and payment information
    /\b(insurance|copay|co-pay|deductible|coverage|claim|reimbursement)\b/i,
    /\b(payment|paid|cash|change|credit|debit|visa|mastercard|amex|discover)\b/i,
    /\b(card|card number|card #|transaction|authorization|approval|reference number)\b/i,

    // Receipt and transaction metadata
    /\b(invoice|receipt|order number|order #|invoice #|invoice number)\b/i,
    /\b(transaction id|transaction #|terminal|register|cashier|operator)\b/i,
    /\b(date|time|thank you|welcome|customer copy|merchant copy)\b/i,
    /\b(barcode|tracking number|serial number|confirmation number)\b/i,
  ];

  for (const originalLine of lines) {
    const line = originalLine.trim();

    // Reject known non-product information anywhere in the line.
    if (excludedPatterns.some((pattern) => pattern.test(line))) {
      continue;
    }

    // Reject percentage charges such as "8% TAX" or "8%".
    if (/\d+(?:\.\d+)?\s*%/.test(line)) {
      continue;
    }

    // A product must end with a price, e.g. $12.99, 12.99, or ₹125.00.
    const priceMatch = line.match(
      /(?:\$\s*|₹\s*|Rs\.?\s*|INR\s*)?\d{1,6}(?:,\d{3})*(?:\.\d{2})\s*$/i
    );

    if (!priceMatch) continue;

    // Remove the trailing price.
    let name = line.slice(0, priceMatch.index).trim();

    // Remove a leading item number, e.g. "01. MILK".
    name = name.replace(/^\d{1,3}[.)]\s*/, "").trim();

    // Reject empty names, numeric identifiers, and punctuation-only text.
    if (name.length < 2 || !/[a-zA-Z]/.test(name)) continue;

    // Reject quantity/price headers and remaining financial labels.
    if (
      /^(qty|quantity|unit price|price|amount|total|tax|fee|discount|payment|balance|change|cash|subtotal|shipping|delivery)\b/i.test(
        name
      )
    ) {
      continue;
    }

    // Reject lines that look like addresses, contact details, or identifiers.
    if (
      /^\d+\s+[A-Za-z].*\b(street|road|avenue|lane|drive|boulevard)\b/i.test(
        name
      ) ||
      /\b\d{5}(?:-\d{4})?\b/.test(name) ||
      /^\W*\d{6,}\W*$/.test(name)
    ) {
      continue;
    }

    // Extract quantities written as "2 x MILK".
    let quantity = 1;
    const quantityMatch = name.match(/^(\d+)\s*[xX×]\s*(.+)$/);

    if (quantityMatch) {
      quantity = Math.max(1, Number(quantityMatch[1]));
      name = quantityMatch[2].trim();
    }

    // Avoid importing a line if the remaining name is metadata.
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
  const [rawText, setRawText] = useState("");
  const [showRawText, setShowRawText] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
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
    setShowRawText(false);
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
      setItems(detectedItems);
      setStatus(detectedItems.length ? "review" : "empty");

      if (!detectedItems.length) {
        setError(
          "Text was read, but no likely products were detected. Check the extracted text or add items manually."
        );
      }
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
      current.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
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
      setError(
        "The scanner is not connected to your inventory yet. Complete the integration step to import products."
      );
      return;
    }

    onImport(
      validItems.map(({ id, ...item }) => ({
        ...item,
        name: item.name.trim(),
        quantity: Math.max(1, Number(item.quantity) || 1),
      }))
    );
  };

  return (
    <main className="receipt-page">
      <header className="receipt-header">
        <div>
          <p className="receipt-eyebrow">SMARTTRACKER / AUTOMATION</p>
          <h1>Receipt Scanner</h1>
          <p className="receipt-subtitle">
            Turn a receipt into a reviewable product list.
          </p>
        </div>

        {setActivePage && (
          <button
            className="receipt-secondary-btn"
            onClick={() => setActivePage("products")}
          >
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

        <button
          className="receipt-primary-btn"
          onClick={scanReceipt}
          disabled={!file || status === "scanning"}
        >
          {status === "scanning"
            ? `Reading receipt... ${progress}%`
            : "Scan receipt"}
        </button>

        {status === "scanning" && (
          <div className="receipt-progress">
            <div style={{ width: `${progress}%` }} />
          </div>
        )}

        {error && <p className="receipt-error">{error}</p>}
      </section>

      {status === "review" && (
        <section className="receipt-review-card">
          <div className="receipt-review-heading">
            <div>
              <h2>Review detected products</h2>
              <p>
                {items.length} possible item{items.length === 1 ? "" : "s"} found.
                Correct any OCR mistakes before importing.
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
                    onChange={(event) =>
                      updateItem(item.id, "name", event.target.value)
                    }
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
                      onChange={(event) =>
                        updateItem(item.id, "quantity", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Category
                    <select
                      value={item.category}
                      onChange={(event) =>
                        updateItem(item.id, "category", event.target.value)
                      }
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
                      onChange={(event) =>
                        updateItem(item.id, "purchaseDate", event.target.value)
                      }
                    />
                  </label>

                  <label>
                    Expiry date
                    <input
                      type="date"
                      value={item.expiryDate}
                      onChange={(event) =>
                        updateItem(item.id, "expiryDate", event.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="receipt-item-footer">
                  <span>
                    {item.expiryDate
                      ? "Expiry date entered"
                      : "Expiry date needs confirmation"}
                  </span>
                  <button
                    className="receipt-remove-btn"
                    onClick={() => removeItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <p className="receipt-disclaimer">
            Receipt scanning does not verify expiry dates. Check the product
            packaging before saving an expiry date.
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
          <p>
            You can add items manually or inspect the OCR text below.
          </p>
          <button className="receipt-secondary-btn" onClick={addManualItem}>
            Add product manually
          </button>
        </section>
      )}

      {rawText && (
        <section className="receipt-raw-card">
          <button
            className="receipt-text-btn"
            onClick={() => setShowRawText((value) => !value)}
          >
            {showRawText ? "Hide" : "Show"} extracted receipt text
          </button>

          {showRawText && <pre>{rawText}</pre>}
        </section>
      )}
    </main>
  );
}

export default ReceiptScanner;
