const STORAGE_KEY = "danielaJuanJoseWeddingGuests";
const DEFAULT_INVITATION_PASSES = 4;
const whatsappNumber = "5218710000000";

const defaultGuests = [
  { name: "Familia Garcia", passes: 4, note: "Ejemplo familiar" },
  { name: "Ana Lopez", passes: 1, note: "Ejemplo individual" },
];

const params = new URLSearchParams(window.location.search);
const guestName = params.get("invitado") || "Invitado especial";
const guestPasses = normalizePasses(params.get("pases"), DEFAULT_INVITATION_PASSES);

function getBaseUrl() {
  return `${window.location.origin}${window.location.pathname}`;
}

function normalizePasses(value, fallback = 1) {
  const passes = Number.parseInt(value, 10);
  return Number.isFinite(passes) && passes > 0 ? passes : fallback;
}

function pluralizePerson(count) {
  return count === 1 ? "1 persona" : `${count} personas`;
}

function createGuestUrl(guest) {
  const url = new URL(getBaseUrl());
  url.searchParams.set("invitado", guest.name);
  url.searchParams.set("pases", String(normalizePasses(guest.passes)));
  if (guest.note) {
    url.searchParams.set("nota", guest.note);
  }
  return url.toString();
}

function readGuests() {
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return defaultGuests;
  }

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : defaultGuests;
  } catch {
    return defaultGuests;
  }
}

function saveGuests(guests) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
}

function setPersonalInvitation() {
  document.querySelector("#coverGuestName").textContent = guestName;
  document.querySelector("#passCount").textContent = pluralizePerson(guestPasses);
  document.querySelector("#confirmationPassCount").textContent = pluralizePerson(guestPasses);

  const yesMessage = `Hola, confirmo la asistencia de ${guestName} para la boda de Daniela y Juan José. Pases: ${pluralizePerson(guestPasses)}.`;
  const noMessage = `Hola, muchas gracias por la invitación a la boda de Daniela y Juan José. ${guestName} no podrá asistir.`;

  document.querySelector("#yesRsvpLink").href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(yesMessage)}`;
  document.querySelector("#noRsvpLink").href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(noMessage)}`;
}

function setupStory() {
  const opening = document.querySelector("#opening");
  const story = document.querySelector("#story");
  const openEnvelope = document.querySelector("#openEnvelope");
  const cards = [...document.querySelectorAll(".story-card")];
  const prevButton = document.querySelector("#prevCard");
  const nextButton = document.querySelector("#nextCard");
  const stepLabel = document.querySelector("#stepLabel");
  let activeIndex = 0;

  function showCard(index) {
    activeIndex = Math.max(0, Math.min(index, cards.length - 1));
    cards.forEach((card, cardIndex) => {
      card.classList.toggle("is-active", cardIndex === activeIndex);
    });
    prevButton.disabled = activeIndex === 0;
    nextButton.textContent = activeIndex === cards.length - 1 ? "Confirmar" : "Siguiente";
    stepLabel.textContent = `${activeIndex + 1} / ${cards.length}`;
  }

  openEnvelope.addEventListener("click", () => {
    opening.classList.add("is-open");
    opening.hidden = true;
    story.classList.add("is-visible");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  prevButton.addEventListener("click", () => showCard(activeIndex - 1));
  nextButton.addEventListener("click", () => {
    if (activeIndex === cards.length - 1) {
      document.querySelector("#yesRsvpLink").focus();
      return;
    }
    showCard(activeIndex + 1);
  });

  showCard(0);
}

function parseRows(text) {
  return text
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const separator = row.includes("\t") ? "\t" : row.includes(";") ? ";" : ",";
      return row.split(separator).map((cell) => cell.trim());
    })
    .filter((cells) => cells.some(Boolean));
}

function parseGuestList(text) {
  const rows = parseRows(text);
  const first = rows[0]?.map((cell) => cell.toLowerCase()) || [];
  const hasHeader = first.includes("nombre") || first.includes("invitado");
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map(([name, passes = "1", note = ""]) => ({
      name,
      passes: normalizePasses(passes),
      note,
    }))
    .filter((guest) => guest.name);
}

async function copyText(text) {
  await navigator.clipboard.writeText(text);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsv(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderGuests() {
  const list = document.querySelector("#guestList");
  const guests = readGuests();

  if (!guests.length) {
    list.innerHTML = `<div class="empty-state">Aún no hay invitados. Agrega uno manualmente o importa tu lista.</div>`;
    return;
  }

  list.innerHTML = guests
    .map((guest, index) => {
      const url = createGuestUrl(guest);
      const safeName = escapeHtml(guest.name);
      const safeNote = escapeHtml(guest.note || "");
      const safeUrl = escapeHtml(url);
      return `
        <article class="guest-card">
          <div>
            <h3>${safeName}</h3>
            <p>${pluralizePerson(normalizePasses(guest.passes))}${safeNote ? ` · ${safeNote}` : ""}</p>
          </div>
          <div class="guest-url" title="${safeUrl}">${safeUrl}</div>
          <button class="copy-link" type="button" data-index="${index}">Copiar link</button>
        </article>
      `;
    })
    .join("");
}

function setupAdmin() {
  const form = document.querySelector("#guestForm");
  const csvInput = document.querySelector("#csvInput");
  const pasteArea = document.querySelector("#pasteArea");
  const importPasted = document.querySelector("#importPasted");
  const copyAllLinks = document.querySelector("#copyAllLinks");
  const downloadCsv = document.querySelector("#downloadCsv");
  const clearGuests = document.querySelector("#clearGuests");
  const guestList = document.querySelector("#guestList");

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const guests = readGuests();
    guests.push({
      name: String(formData.get("guestName") || "").trim(),
      passes: normalizePasses(formData.get("guestPasses")),
      note: String(formData.get("guestNote") || "").trim(),
    });
    saveGuests(guests.filter((guest) => guest.name));
    form.reset();
    document.querySelector("#guestPasses").value = DEFAULT_INVITATION_PASSES;
    renderGuests();
  });

  csvInput.addEventListener("change", async () => {
    const file = csvInput.files?.[0];
    if (!file) {
      return;
    }
    saveGuests([...readGuests(), ...parseGuestList(await file.text())]);
    csvInput.value = "";
    renderGuests();
  });

  importPasted.addEventListener("click", () => {
    saveGuests([...readGuests(), ...parseGuestList(pasteArea.value)]);
    pasteArea.value = "";
    renderGuests();
  });

  guestList.addEventListener("click", async (event) => {
    const button = event.target.closest(".copy-link");
    if (!button) {
      return;
    }
    const guest = readGuests()[Number(button.dataset.index)];
    await copyText(createGuestUrl(guest));
    button.textContent = "Copiado";
    setTimeout(() => {
      button.textContent = "Copiar link";
    }, 1400);
  });

  copyAllLinks.addEventListener("click", async () => {
    const links = readGuests()
      .map((guest) => `${guest.name}: ${createGuestUrl(guest)}`)
      .join("\n");
    await copyText(links);
    copyAllLinks.textContent = "Links copiados";
    setTimeout(() => {
      copyAllLinks.textContent = "Copiar todos los links";
    }, 1400);
  });

  downloadCsv.addEventListener("click", () => {
    const header = ["nombre", "pases", "nota", "link"];
    const rows = readGuests().map((guest) => [
      guest.name,
      normalizePasses(guest.passes),
      guest.note || "",
      createGuestUrl(guest),
    ]);
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    downloadFile("links-invitados-daniela-juan-jose.csv", csv, "text/csv;charset=utf-8");
  });

  clearGuests.addEventListener("click", () => {
    if (window.confirm("¿Quieres borrar la lista de invitados guardada en este navegador?")) {
      saveGuests([]);
      renderGuests();
    }
  });

  renderGuests();
}

setPersonalInvitation();
setupStory();
setupAdmin();
