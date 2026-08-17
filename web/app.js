const documents = {
  complete: {
    title: "complete-consent.pdf",
    decision: "AUTO-ELIGIBLE",
    message: "All mandatory fields passed policy.",
    detail: "Human confirmation remains available before release.",
    fields: [
      ["Party name", "Example Research Cooperative", "99%", "party_name"],
      ["Effective date", "2026-08-17", "99%", "effective_date"],
      ["Withdrawal method", "withdraw@example.test", "98%", "withdrawal_method"],
      ["Contact email", "compliance@example.test", "99%", "contact_email"],
    ],
  },
  missing: {
    title: "missing-withdrawal.pdf",
    decision: "NEEDS REVIEW",
    message: "Required withdrawal method is missing.",
    detail: "Consent cannot move downstream without an explicit human decision.",
    fields: [
      ["Party name", "Example Research Cooperative", "97%", "party_name"],
      ["Effective date", "2026-08-17", "98%", "effective_date"],
      ["Withdrawal method", "Missing", "—", "withdrawal_method"],
      ["Contact email", "compliance@example.test", "96%", "contact_email"],
    ],
  },
  conflict: {
    title: "conflicting-party.pdf",
    decision: "NEEDS REVIEW",
    message: "Party names conflict across two source regions.",
    detail: "The policy preserves both citations and refuses to guess.",
    fields: [
      ["Party name", "2 conflicting values", "72%", "party_name"],
      ["Effective date", "2026-08-17", "98%", "effective_date"],
      ["Withdrawal method", "withdraw@example.test", "97%", "withdrawal_method"],
      ["Contact email", "compliance@example.test", "98%", "contact_email"],
    ],
  },
};

const fieldList = document.querySelector("#field-list");
const title = document.querySelector("#document-title");
const pill = document.querySelector("#decision-pill");
const banner = document.querySelector("#reason-banner");
const message = document.querySelector("#action-message");
const rationale = document.querySelector("#rationale");
let selected = "complete";

function render(key) {
  selected = key;
  const item = documents[key];
  title.textContent = item.title;
  pill.textContent = item.decision;
  const blocked = item.decision !== "AUTO-ELIGIBLE";
  pill.classList.toggle("blocked", blocked);
  banner.classList.toggle("blocked", blocked);
  banner.innerHTML = `<span>${blocked ? "!" : "✓"}</span><div><strong>${item.message}</strong><p>${item.detail}</p></div>`;
  fieldList.innerHTML = item.fields.map(([label, value, confidence, field]) => `
    <button class="field-row" data-field="${field}">
      <span>${label}</span><span class="field-value">${value}</span>
      <span class="confidence ${confidence === "—" || Number.parseInt(confidence) < 85 ? "low" : ""}">${confidence}</span>
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

function decide(decision) {
  const text = rationale.value.trim();
  if (text.length < 8) {
    message.textContent = "Add a rationale of at least 8 characters before deciding.";
    message.style.color = "#b63a46";
    return;
  }
  message.style.color = "#11875d";
  message.textContent = `${decision} recorded in the tamper-evident audit chain for ${documents[selected].title}.`;
  document.querySelector("#audit-hash").textContent = `${Math.random().toString(16).slice(2, 6)}…${Math.random().toString(16).slice(2, 6)}`;
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

render("complete");
