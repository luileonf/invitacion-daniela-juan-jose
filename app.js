const STORAGE_KEY = "danielaJuanJoseWeddingGuests";
const RSVP_STORAGE_KEY = "danielaJuanJoseWeddingRsvps";
const ADMIN_SESSION_KEY = "danielaJuanJoseAdminUnlocked";
const DEFAULT_INVITATION_PASSES = 4;
const ADMIN_PASSWORD = "Dani&JuanJoPorSiempre";

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

function readRsvps() {
  const saved = window.localStorage.getItem(RSVP_STORAGE_KEY);
  if (!saved) {
    return {};
  }

  try {
    const parsed = JSON.parse(saved);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveRsvps(rsvps) {
  window.localStorage.setItem(RSVP_STORAGE_KEY, JSON.stringify(rsvps));
}

function saveRsvp(status, attending = 0) {
  const rsvps = readRsvps();
  rsvps[guestName] = {
    status,
    attending: status === "yes" ? attending : 0,
    allowed: guestPasses,
    updatedAt: new Date().toISOString(),
  };
  saveRsvps(rsvps);
}

function showRsvpFeedback(message) {
  const feedback = document.querySelector("#rsvpFeedback");
  if (feedback) {
    feedback.textContent = message;
  }
  renderAdminSummary();
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
  document.querySelector("#confirmationPassCount").textContent = pluralizePerson(guestPasses);
  const attendingCount = document.querySelector("#attendingCount");

  attendingCount.innerHTML = Array.from({ length: guestPasses }, (_, index) => {
    const count = index + 1;
    return `<option value="${count}">${pluralizePerson(count)}</option>`;
  }).join("");
  attendingCount.value = String(guestPasses);

  document.querySelector("#yesRsvpLink").addEventListener("click", () => {
    const selectedCount = normalizePasses(attendingCount.value, guestPasses);
    saveRsvp("yes", selectedCount);
    showRsvpFeedback(`Confirmación guardada: asistirán ${pluralizePerson(selectedCount)}.`);
  });
  document.querySelector("#noRsvpLink").addEventListener("click", () => {
    saveRsvp("no", 0);
    showRsvpFeedback("Confirmación guardada: no podrán asistir.");
  });
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
    if (opening.classList.contains("is-opening")) {
      return;
    }
    opening.classList.add("is-opening");
    window.setTimeout(() => {
      opening.hidden = true;
      story.classList.add("is-visible");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 2800);
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
  const rsvps = readRsvps();
  renderAdminSummary();

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
      const rsvp = rsvps[guest.name];
      const rsvpText = rsvp
        ? rsvp.status === "yes"
          ? `Confirmó ${pluralizePerson(normalizePasses(rsvp.attending, 0))}`
          : "No asistirá"
        : "Sin confirmar";
      return `
        <article class="guest-card" data-index="${index}">
          <div>
            <h3>${safeName}</h3>
            <p>${pluralizePerson(normalizePasses(guest.passes))}${safeNote ? ` · ${safeNote}` : ""}</p>
            <p class="rsvp-status">${escapeHtml(rsvpText)}</p>
          </div>
          <div class="guest-url" title="${safeUrl}">${safeUrl}</div>
          <div class="guest-card-actions">
            <button class="copy-link" type="button" data-index="${index}">Copiar link</button>
            <button class="edit-guest" type="button" data-index="${index}">Editar</button>
            <button class="cancel-edit delete-guest" type="button" data-index="${index}">Eliminar</button>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderAdminSummary() {
  const summary = document.querySelector("#adminSummary");
  if (!summary) {
    return;
  }
  const guests = readGuests();
  const rsvps = readRsvps();
  const totals = guests.reduce(
    (sum, guest) => {
      const allowed = normalizePasses(guest.passes, DEFAULT_INVITATION_PASSES);
      const rsvp = rsvps[guest.name];

      if (!rsvp) {
        sum.notConfirmed += allowed;
        return sum;
      }

      if (rsvp.status === "yes") {
        const attending = Math.min(normalizePasses(rsvp.attending, 0), allowed);
        sum.confirmed += attending;
        sum.notAttending += Math.max(allowed - attending, 0);
        return sum;
      }

      if (rsvp.status === "no") {
        sum.notAttending += allowed;
      }

      return sum;
    },
    { confirmed: 0, notConfirmed: 0, notAttending: 0 },
  );

  summary.innerHTML = `
    <div>
      <span>Invitados confirmados</span>
      <strong>${totals.confirmed}</strong>
    </div>
    <div>
      <span>No confirmados</span>
      <strong>${totals.notConfirmed}</strong>
    </div>
    <div>
      <span>No asistirán</span>
      <strong>${totals.notAttending}</strong>
    </div>
  `;
}

function renderGuestEditor(index) {
  const guests = readGuests();
  const guest = guests[index];
  const card = document.querySelector(`.guest-card[data-index="${index}"]`);
  if (!guest || !card) {
    return;
  }

  card.classList.add("is-editing");
  card.innerHTML = `
    <label>
      Nombre del invitado
      <input class="edit-name" type="text" value="${escapeHtml(guest.name)}" />
    </label>
    <label>
      Añadidos / pases
      <input class="edit-passes" type="number" min="1" value="${normalizePasses(guest.passes)}" />
    </label>
    <label>
      Nota opcional
      <input class="edit-note" type="text" value="${escapeHtml(guest.note || "")}" />
    </label>
    <div class="guest-card-actions">
      <button class="save-guest" type="button" data-index="${index}">Guardar</button>
      <button class="cancel-edit" type="button">Cancelar</button>
    </div>
  `;
}

function setupAdmin() {
  const openAdmin = document.querySelector("#openAdmin");
  const adminPanel = document.querySelector("#adminPanel");
  const form = document.querySelector("#guestForm");
  const csvInput = document.querySelector("#csvInput");
  const pasteArea = document.querySelector("#pasteArea");
  const importPasted = document.querySelector("#importPasted");
  const copyAllLinks = document.querySelector("#copyAllLinks");
  const downloadCsv = document.querySelector("#downloadCsv");
  const clearGuests = document.querySelector("#clearGuests");
  const guestList = document.querySelector("#guestList");

  function openAdminPanel(options = {}) {
    const { smooth = true } = options;
    adminPanel.hidden = false;
    window.sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
    if (window.location.hash !== "#adminPanel") {
      window.history.replaceState(null, "", "#adminPanel");
    }
    adminPanel.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
  }

  openAdmin.addEventListener("click", () => {
    const password = window.prompt("Contraseña del panel de novios");
    if (password === ADMIN_PASSWORD) {
      openAdminPanel();
      return;
    }
    if (password !== null) {
      window.alert("Contraseña incorrecta.");
    }
  });

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
    const copyButton = event.target.closest(".copy-link:not(.delete-guest)");
    const editButton = event.target.closest(".edit-guest");
    const deleteButton = event.target.closest(".delete-guest");
    const saveButton = event.target.closest(".save-guest");
    const cancelButton = event.target.closest(".cancel-edit:not(.delete-guest)");

    if (copyButton) {
      const guest = readGuests()[Number(copyButton.dataset.index)];
      await copyText(createGuestUrl(guest));
      copyButton.textContent = "Copiado";
      setTimeout(() => {
        copyButton.textContent = "Copiar link";
      }, 1400);
      return;
    }

    if (editButton) {
      renderGuestEditor(Number(editButton.dataset.index));
      return;
    }

    if (deleteButton) {
      const index = Number(deleteButton.dataset.index);
      const guests = readGuests();
      const guest = guests[index];
      if (!guest) {
        return;
      }
      if (window.confirm(`¿Quieres eliminar a ${guest.name} de la lista?`)) {
        guests.splice(index, 1);
        saveGuests(guests);
        const rsvps = readRsvps();
        delete rsvps[guest.name];
        saveRsvps(rsvps);
        renderGuests();
      }
      return;
    }

    if (saveButton) {
      const index = Number(saveButton.dataset.index);
      const card = saveButton.closest(".guest-card");
      const guests = readGuests();
      const previousName = guests[index]?.name;
      const updatedGuest = {
        name: card.querySelector(".edit-name").value.trim(),
        passes: normalizePasses(card.querySelector(".edit-passes").value),
        note: card.querySelector(".edit-note").value.trim(),
      };
      guests[index] = updatedGuest;
      saveGuests(guests.filter((guest) => guest.name));

      if (previousName && previousName !== updatedGuest.name) {
        const rsvps = readRsvps();
        if (rsvps[previousName] && !rsvps[updatedGuest.name]) {
          rsvps[updatedGuest.name] = rsvps[previousName];
        }
        delete rsvps[previousName];
        saveRsvps(rsvps);
      }

      renderGuests();
      return;
    }

    if (cancelButton) {
      renderGuests();
    }
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
    const rsvps = readRsvps();
    const header = ["nombre", "pases", "nota", "confirmacion", "asistiran", "link"];
    const rows = readGuests().map((guest) => {
      const rsvp = rsvps[guest.name];
      return [
        guest.name,
        normalizePasses(guest.passes),
        guest.note || "",
        rsvp?.status === "yes" ? "si" : rsvp?.status === "no" ? "no" : "",
        rsvp?.status === "yes" ? normalizePasses(rsvp.attending, 0) : 0,
        createGuestUrl(guest),
      ];
    });
    const csv = [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
    downloadFile("links-invitados-daniela-juan-jose.csv", csv, "text/csv;charset=utf-8");
  });

  clearGuests.addEventListener("click", () => {
    if (window.confirm("¿Quieres borrar la lista de invitados guardada en este navegador?")) {
      saveGuests([]);
      saveRsvps({});
      renderGuests();
    }
  });

  if (window.sessionStorage.getItem(ADMIN_SESSION_KEY) === "true" && window.location.hash === "#adminPanel") {
    openAdminPanel({ smooth: false });
  }

  renderGuests();
}

setPersonalInvitation();
setupStory();
setupAdmin();
