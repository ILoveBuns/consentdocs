const documents = {
  complete: {
    title: "complete-consent.pdf",
    decision: "AUTO-ELIGIBLE",
    message: "All mandatory fields passed policy.",
    detail: "Human confirmation remains available before release.",
    fields: [
      ["Party name", "Example Research Cooperative", "0.99", "party_name"],
      ["Effective date", "2026-08-17", "0.99", "effective_date"],
      ["Withdrawal method", "withdraw@example.test", "0.98", "withdrawal_method"],
      ["Contact email", "compliance@example.test", "0.99", "contact_email"],
    ],
  },
  missing: {
    title: "missing-withdrawal.pdf",
    decision: "NEEDS REVIEW",
    message: "Required withdrawal method is missing.",
    detail: "Consent cannot move downstream without an explicit human decision.",
    fields: [
      ["Party name", "Example Research Cooperative", "0.97", "party_name"],
      ["Effective date", "2026-08-17", "0.98", "effective_date"],
      ["Withdrawal method", "Missing", "—", "withdrawal_method"],
      ["Contact email", "compliance@example.test", "0.96", "contact_email"],
    ],
  },
  conflict: {
    title: "conflicting-party.pdf",
    decision: "NEEDS REVIEW",
    message: "Party names conflict across two source regions.",
    detail: "The policy preserves both citations and refuses to guess.",
    fields: [
      ["Party name", "2 conflicting values", "0.72", "party_name"],
      ["Effective date", "2026-08-17", "0.98", "effective_date"],
      ["Withdrawal method", "withdraw@example.test", "0.97", "withdrawal_method"],
      ["Contact email", "compliance@example.test", "0.98", "contact_email"],
    ],
  },
};

const fieldList = document.querySelector("#field-list");
const title = document.querySelector("#document-title");
const pill = document.querySelector("#decision-pill");
const banner = document.querySelector("#reason-banner");
const message = document.querySelector("#action-message");
const rationale = document.querySelector("#rationale");
const paper = document.querySelector("#paper");
const examplePaper = paper.innerHTML;
let selected = "complete";
let currentAuditHash = null;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderCitationSummary(fields) {
  paper.innerHTML = `
    <p class="paper-kicker">NUTRIENT DWS EXTRACTION</p><h3>Citation Summary</h3>
    <p>Values below came from the uploaded PDF. The original file was processed in memory and was not persisted by ConsentDocs.</p>
    ${fields.map((field) => {
      const citation = field.citations?.[0];
      const source = citation
        ? `Page ${citation.pageNumber ?? citation.page ?? "—"}${citation.text ? ` · “${escapeHtml(citation.text)}”` : ""}`
        : "No source citation returned";
      return `<p class="highlight" data-field="${escapeHtml(field.name)}"><b>${escapeHtml(field.name.replaceAll("_", " "))}</b><br />${escapeHtml(field.value ?? "Missing")}<br /><small>${source}</small></p>`;
    }).join("")}
    <div class="paper-stamp">REAL DWS RESULT · FILE NOT STORED</div>`;
}

function render(key) {
  currentAuditHash = null;
  selected = key;
  const item = documents[key];
  paper.innerHTML = examplePaper;
  title.textContent = item.title;
  pill.textContent = item.decision;
  const blocked = item.decision !== "AUTO-ELIGIBLE";
  pill.classList.toggle("blocked", blocked);
  banner.classList.toggle("blocked", blocked);
  banner.innerHTML = `<span>${blocked ? "!" : "✓"}</span><div><strong>${item.message}</strong><p>${item.detail}</p></div>`;
  fieldList.innerHTML = item.fields.map(([label, value, confidence, field]) => `
    <button class="field-row" data-field="${field}">
      <span>${label}</span><span class="field-value">${value}</span>
      <span class="confidence ${confidence === "—" || Number.parseFloat(confidence) < 0.85 ? "low" : ""}">${confidence === "—" ? confidence : `${confidence} signal`}</span>
    </button>`).join("");
  document.querySelectorAll(".document-card").forEach((card) => card.classList.toggle("active", card.dataset.document === key));
  message.textContent = "";
  rationale.value = "";
}

document.querySelectorAll(".document-card").forEach((card) => card.addEventListener("click", () => render(card.dataset.document)));
fieldList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-field]");
  if (!row) return;
  document.querySelectorAll(".paper [data-field]").forEach((entry) => entry.classList.toggle("active", entry.dataset.field === row.dataset.field));
});

async function decide(decision) {
  const text = rationale.value.trim();
  if (text.length < 8) {
    message.textContent = "Add a rationale of at least 8 characters before deciding.";
    message.style.color = "#b63a46";
    return;
  }
  if (!currentAuditHash) {
    message.style.color = "#69758b";
    message.textContent = `${decision} previewed. Analyze a PDF through the local server to record a real audit event.`;
    return;
  }
  const response = await fetch("/api/review", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ auditHash: currentAuditHash, decision: decision === "Approval" ? "approved" : "rejected", rationale: text }),
  });
  const result = await response.json();
  if (!response.ok) {
    message.style.color = "#b63a46";
    message.textContent = result.error ?? "Review could not be recorded.";
    return;
  }
  currentAuditHash = result.audit.eventHash;
  message.style.color = "#11875d";
  message.textContent = `${decision} recorded in the tamper-evident audit chain.`;
  document.querySelector("#audit-hash").textContent = `${currentAuditHash.slice(0, 4)}…${currentAuditHash.slice(-4)}`;
}

document.querySelector("#approve-button").addEventListener("click", () => decide("Approval"));
document.querySelector("#reject-button").addEventListener("click", () => decide("Rejection"));
document.querySelector("#export-button").addEventListener("click", () => {
  const payload = JSON.stringify({ demo: true, document: documents[selected].title, chain: "verified", containsPersonalData: false }, null, 2);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
  link.download = "consentdocs-audit-demo.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.querySelector("#pdf-upload").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const uploadStatus = document.querySelector("#upload-status");
  uploadStatus.textContent = "Sending to Nutrient DWS through the secure server…";
  const form = new FormData();
  form.append("file", file);
  try {
    const response = await fetch("/api/analyze", { method: "POST", body: form });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error ?? "Analysis failed");
    currentAuditHash = result.audit.eventHash;
    selected = "uploaded";
    title.textContent = file.name;
    const blocked = result.policy.decision !== "auto_eligible";
    pill.textContent = result.policy.decision.replaceAll("_", " ").toUpperCase();
    pill.classList.toggle("blocked", blocked);
    banner.classList.toggle("blocked", blocked);
    banner.innerHTML = `<span>${blocked ? "!" : "✓"}</span><div><strong>${blocked ? "Policy requires human review." : "All mandatory fields passed policy."}</strong><p>${result.policy.reasons.join(", ") || "Every accepted field has source evidence."}</p></div>`;
    fieldList.innerHTML = result.fields.map((field) => `<button class="field-row" data-field="${field.name}"><span>${field.name.replaceAll("_", " ")}</span><span class="field-value">${field.value ?? "Missing"}</span><span class="confidence ${result.policy.fieldStatus[field.name] === "accepted" ? "" : "low"}">${field.confidence === null ? "—" : `${field.confidence.toFixed(2)} signal`}</span></button>`).join("");
    renderCitationSummary(result.fields);
    document.querySelector("#audit-hash").textContent = `${currentAuditHash.slice(0, 4)}…${currentAuditHash.slice(-4)}`;
    uploadStatus.textContent = `Real DWS request ${result.requestId}; source file was not persisted.`;
  } catch (error) {
    uploadStatus.textContent = error instanceof Error ? error.message : "Analysis failed";
  }
});

fetch("/api/health")
  .then((response) => response.ok ? response.json() : Promise.reject())
  .then((health) => {
    document.querySelector("#connection-status").innerHTML = `<i></i> ${health.keyConfigured ? "Nutrient DWS connected" : "Server running · key missing"}`;
  })
  .catch(() => {});

render("complete");
