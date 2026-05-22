const STORAGE_KEY = "danielaJuanJoseWeddingGuests";
const DEFAULT_INVITATION_PASSES = 4;
const whatsappNumber = "5218710000000";

const defaultGuests = [
  {
    name: "Familia Garcia",
    passes: 4,
    note: "Ejemplo de invitacion familiar",
  },
  {
    name: "Ana Lopez",
    passes: 1,
    note: "Ejemplo individual",
  },
];

function getParams() {
  return new URLSearchParams(window.location.search);
}

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
  const params = getParams();
  const guestName = params.get("invitado");
  const passes = normalizePasses(params.get("pases"), DEFAULT_INVITATION_PASSES);
  const greeting = document.querySelector("#guestGreeting");
  const passCount = document.querySelector("#passCount");
  const receptionPassCount = document.querySelector("#receptionPassCount");
  const confirmationPassCount = document.querySelector("#confirmationPassCount");
  const passCard = document.querySelector("#passCard");
  const rsvpLink = document.querySelector("#rsvpLink");

  if (guestName) {
    greeting.textContent = `${guestName}, tenemos el honor de invitarlos a celebrar`;
    passCard.hidden = false;
  } else {
    greeting.textContent = "Tenemos el honor de invitarlos a celebrar";
  }

  passCount.textContent = pluralizePerson(passes);
  receptionPassCount.textContent = `(${pluralizePerson(passes)})`;
  confirmationPassCount.textContent = pluralizePerson(passes);

  const message = guestName
    ? `Hola, confirmo la asistencia de ${guestName} para la boda de Daniela y Juan José. Pases: ${pluralizePerson(passes)}.`
    : "Hola, quiero confirmar asistencia para la boda de Daniela y Juan José.";

  rsvpLink.href = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
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
    document.querySelector("#guestName").value = "";
    document.querySelector("#guestPasses").value = DEFAULT_INVITATION_PASSES;
    document.querySelector("#guestNote").value = "";
    renderGuests();
  });

  csvInput.addEventListener("change", async () => {
    const file = csvInput.files?.[0];
    if (!file) {
      return;
    }
    const importedGuests = parseGuestList(await file.text());
    saveGuests([...readGuests(), ...importedGuests]);
    csvInput.value = "";
    renderGuests();
  });

  importPasted.addEventListener("click", () => {
    const importedGuests = parseGuestList(pasteArea.value);
    saveGuests([...readGuests(), ...importedGuests]);
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
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");
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
setupAdmin();
