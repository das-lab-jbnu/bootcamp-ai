function doGet(e) {
  const action = getAction(e, "status");

  try {
    if (action === "status") {
      return jsonResponse({
        result: "success",
        applications: getApplicationsByEmail(e.parameter.email)
      });
    }

    return jsonResponse({ result: "error", message: "Unknown action" });
  } catch (error) {
    return jsonResponse({ result: "error", message: error.message });
  }
}

function doPost(e) {
  const payload = parsePayload(e);
  const action = payload.action || "submit";

  try {
    if (action === "status") {
      return jsonResponse({
        result: "success",
        applications: getApplicationsByEmail(payload.email)
      });
    }

    if (action === "submit") {
      return jsonResponse(submitApplication(payload));
    }

    if (action === "update") {
      return jsonResponse(updateApplication(payload));
    }

    return jsonResponse({ result: "error", message: "Unknown action" });
  } catch (error) {
    return jsonResponse({ result: "error", message: error.message });
  }
}

function submitApplication(payload) {
  validatePayload(payload, ["name", "student_id", "email", "organization", "phone", "program", "motivation"]);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const rows = getRows(sheet);
    const duplicate = rows.find((row) => {
      return normalize(row.email) === normalize(payload.email) && row.program === payload.program;
    });

    if (duplicate) {
      return { result: "duplicate" };
    }

    const timestamp = new Date();
    const applicationId = generateApplicationId(sheet);
    const status = "접수";

    sheet.appendRow([
      timestamp,
      applicationId,
      payload.name,
      payload.student_id,
      payload.email,
      payload.organization,
      payload.phone,
      payload.program,
      payload.motivation,
      status
    ]);

    let emailSent = true;
    try {
      sendSubmissionEmail({
        email: payload.email,
        name: payload.name,
        program: payload.program,
        timestamp,
        application_id: applicationId,
        status
      });
    } catch (error) {
      emailSent = false;
      console.error(`Submission email failed for ${applicationId}: ${error.message}`);
    }

    return {
      result: "success",
      application_id: applicationId,
      timestamp: timestamp.toISOString(),
      status,
      email_sent: emailSent
    };
  } finally {
    lock.releaseLock();
  }
}

function updateApplication(payload) {
  validatePayload(payload, [
    "application_id",
    "name",
    "student_id",
    "email",
    "organization",
    "phone",
    "program",
    "motivation"
  ]);

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    const headerMap = getHeaderMap(data[0]);
    const rowIndex = findRowIndex(data, headerMap, payload.application_id, payload.email);

    if (rowIndex === -1) {
      return { result: "not_found" };
    }

    const duplicate = getRows(sheet).find((row) => {
      return (
        row.application_id !== payload.application_id &&
        normalize(row.email) === normalize(payload.email) &&
        row.program === payload.program
      );
    });

    if (duplicate) {
      return { result: "duplicate" };
    }

    const rowNumber = rowIndex + 1;
    setCell(sheet, rowNumber, headerMap, "name", payload.name);
    setCell(sheet, rowNumber, headerMap, "student_id", payload.student_id);
    setCell(sheet, rowNumber, headerMap, "organization", payload.organization);
    setCell(sheet, rowNumber, headerMap, "phone", payload.phone);
    setCell(sheet, rowNumber, headerMap, "program", payload.program);
    setCell(sheet, rowNumber, headerMap, "motivation", payload.motivation);

    return { result: "success", application_id: payload.application_id };
  } finally {
    lock.releaseLock();
  }
}
