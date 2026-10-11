/*
 * Floreix contact form integration for Web3Forms.
 * Prepared for cutover once the recipient's Web3Forms access key is verified.
 * Deliberately not loaded on the live contact pages until configuration is complete.
 * Web3Forms access keys are public form identifiers, not email/SMTP passwords.
 */
(function () {
  "use strict";

  const form = document.getElementById("floreix-contact-form");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector("#floreix-contact-status");
  const keyInput = form.querySelector('input[name="access_key"]');
  if (!button || !status) return;

  const email = "maite@floreix.com";
  const language = form.getAttribute("data-form-language") === "es" ? "es" : "ca";
  const messages = language === "es" ? {
    sending: "Enviando…",
    ok: "Mensaje enviado correctamente. Gracias por contactar con Floreix.",
    error: "No se ha podido enviar el mensaje. Inténtalo más tarde o escríbenos a ",
    unavailable: "El formulario no está disponible temporalmente. Escríbenos a "
  } : {
    sending: "Enviant…",
    ok: "Missatge enviat correctament. Gràcies per contactar amb Floreix.",
    error: "No s'ha pogut enviar el missatge. Torna-ho a provar més tard o escriu-nos a ",
    unavailable: "El formulari no està disponible temporalment. Escriu-nos a "
  };

  function showStatus(type, text) {
    status.replaceChildren();
    status.classList.remove("is-success", "is-error");
    status.classList.add(type === "success" ? "is-success" : "is-error");
    const label = document.createElement("span");
    label.textContent = text;
    status.appendChild(label);
    if (type === "error") {
      const link = document.createElement("a");
      link.href = "mailto:" + email;
      link.textContent = email;
      status.appendChild(link);
      status.appendChild(document.createTextNode("."));
    }
    status.hidden = false;
  }

  // Never allow the browser to navigate to a raw form endpoint.
  form.addEventListener("submit", onSubmit, true);
  const key = keyInput && keyInput.value.trim();
  if (!key || !/^[0-9a-fA-F-]{32,40}$/.test(key)) {
    button.disabled = true;
    showStatus("error", messages.unavailable);
    return;
  }

  button.disabled = false;
  const defaultText = button.textContent;
  let pending = false;

  async function onSubmit(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    if (pending || !form.reportValidity()) return;

    const fields = Object.fromEntries(new FormData(form).entries());
    if (fields.botcheck === "on" || fields.botcheck === "true") return;
    // Send only the documented provider fields. Do not send stale WPForms metadata.
    const payload = {
      access_key: key,
      name: fields.name || "",
      email: fields.email || "",
      message: fields.message || "",
      subject: language === "es"
        ? "Nuevo contacto - Floreix (español)"
        : "Nou contacte - Floreix (català)",
      from_name: "Floreix"
    };

    pending = true;
    button.disabled = true;
    button.textContent = messages.sending;
    status.hidden = true;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        mode: "cors",
        headers: {"Content-Type": "application/json", "Accept": "application/json"},
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      const result = await response.json();
      if (!response.ok || result?.success !== true) {
        const reason = typeof result?.message === "string" ? result.message.slice(0, 160) : "Unknown response";
        throw new Error("Web3Forms HTTP " + response.status + ": " + reason);
      }
      form.reset();
      showStatus("success", messages.ok);
    } catch (error) {
      console.warn("[Floreix contact] Provider error:", error instanceof Error ? error.message : "Unknown error");
      showStatus("error", messages.error);
    } finally {
      clearTimeout(timeout);
      pending = false;
      button.disabled = false;
      button.textContent = defaultText;
    }
  }
})();
