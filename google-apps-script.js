const SPREADSHEET_ID = "18eHNul9IiOm2Sibx8mgA77meRDqT-yP_37BwfPmrVv4";
const GUESTS_SHEET = "Invitados";
const RSVPS_SHEET = "RSVP";

function doGet() {
  return jsonResponse(getData());
}

function doPost(event) {
  const body = parseBody(event);
  const action = body.action || "getData";

  if (action === "saveData") {
    saveData(body.guests || [], body.rsvps || {});
    return jsonResponse({ ok: true, ...getData() });
  }

  return jsonResponse({ ok: true, ...getData() });
}

function parseBody(event) {
  if (!event || !event.postData || !event.postData.contents) {
    return {};
  }

  try {
    return JSON.parse(event.postData.contents);
  } catch (error) {
    return {};
  }
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name, headers) {
  const spreadsheet = getSpreadsheet();
  let sheet = spreadsheet.getSheetByName(name);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(name);
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  return sheet;
}

function getData() {
  return {
    guests: readGuests(),
    rsvps: readRsvps(),
  };
}

function readGuests() {
  const sheet = getSheet(GUESTS_SHEET, ["nombre", "pases", "nota", "creado", "actualizado"]);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return [];
  }

  return sheet.getRange(2, 1, lastRow - 1, 5).getValues()
    .filter((row) => row[0])
    .map((row) => ({
      name: String(row[0] || ""),
      passes: Number(row[1]) || 1,
      note: String(row[2] || ""),
    }));
}

function readRsvps() {
  const sheet = getSheet(RSVPS_SHEET, ["nombre", "estado", "asistiran", "pases", "actualizado"]);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    return {};
  }

  return sheet.getRange(2, 1, lastRow - 1, 5).getValues()
    .filter((row) => row[0])
    .reduce((result, row) => {
      result[String(row[0])] = {
        status: String(row[1] || ""),
        attending: Number(row[2]) || 0,
        allowed: Number(row[3]) || 1,
        updatedAt: row[4] ? new Date(row[4]).toISOString() : new Date().toISOString(),
      };
      return result;
    }, {});
}

function saveData(guests, rsvps) {
  writeGuests(guests);
  writeRsvps(rsvps);
}

function writeGuests(guests) {
  const sheet = getSheet(GUESTS_SHEET, ["nombre", "pases", "nota", "creado", "actualizado"]);
  clearDataRows(sheet, 5);
  const now = new Date();
  const rows = guests
    .filter((guest) => guest && guest.name)
    .map((guest) => [guest.name, Number(guest.passes) || 1, guest.note || "", now, now]);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

function writeRsvps(rsvps) {
  const sheet = getSheet(RSVPS_SHEET, ["nombre", "estado", "asistiran", "pases", "actualizado"]);
  clearDataRows(sheet, 5);
  const rows = Object.entries(rsvps || {})
    .filter(([name]) => name)
    .map(([name, rsvp]) => [
      name,
      rsvp.status || "",
      Number(rsvp.attending) || 0,
      Number(rsvp.allowed) || 1,
      rsvp.updatedAt ? new Date(rsvp.updatedAt) : new Date(),
    ]);

  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 5).setValues(rows);
  }
}

function clearDataRows(sheet, columns) {
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, columns).clearContent();
  }
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
