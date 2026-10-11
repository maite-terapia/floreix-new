/*
 * Floreix contact form — progressive enhancement for static GitHub Pages.
 * Keeps the native FormSubmit POST action as a no-JavaScript fallback.
 * Do not put SMTP credentials or secrets in this client-side file.
 */
(function () {
  "use strict";

  const form = document.getElementById("floreix-contact-form");
  if (!form) return;

  const language = form.getAttribute("data-form-language") === "es" ? "es" : "ca";
  const messages = {
    ca: {
      sending: "Enviant…",
      success: "Hem rebut la confirmació d'enviament. Gràcies! Et respondrem tan aviat com sigui possible.",
      error: "No hem pogut confirmar l'enviament. És possible que el servei hagi rebut el missatge; evita repetir-lo moltes vegades. Si ho prefereixes, escriu-nos directament a "
    },
    es: {
      sending: "Enviando…",
      success: "Hemos recibido la confirmación de envío. ¡Gracias! Te responderemos lo antes posible.",
      error: "No hemos podido confirmar el envío. Es posible que el servicio haya recibido el mensaje; evita repetirlo muchas veces. Si lo prefieres, escríbenos directamente a "
    }
  };
  const copy = messages[language];
  const button = form.querySelector('button[type="submit"]');
  const status = form.querySelector("#floreix-contact-status");
  if (!button || !status) return;

  const originalLabel = button.textContent;
  let isSending = false;

  function displayStatus(type) {
    status.replaceChildren();
    status.classList.remove("is-success", "is-error");
    status.classList.add(type === "success" ? "is-success" : "is-error");

    const text = document.createElement("span");
    text.textContent = copy[type];
    status.appendChild(text);

    if (type === "error") {
      const link = document.createElement("a");
      link.href = "mailto:maite@floreix.com";
      link.textContent = "maite@floreix.com";
      status.appendChild(link);
      status.appendChild(document.createTextNode("."));
    }

    status.hidden = false;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (isSending || !form.reportValidity()) return;

    const fields = Object.fromEntries(new FormData(form).entries());
    if (typeof fields._honey === "string" && fields._honey.trim() !== "") return;

    const controller = new AbortController();
    const timeoutId = setTimeout(function () {
      controller.abort();
    }, 20000);

    isSending = true;
    button.disabled = true;
    button.textContent = copy.sending;
    status.hidden = true;
    status.replaceChildren();

    try {
      const response = await fetch("https://formsubmit.co/ajax/maite@floreix.com", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(fields),
        signal: controller.signal
      });

      // The service may return HTML (e.g. a challenge or an outage).
      // Never interpret that, an HTTP error, or a network error as success.
      const result = await response.json();
      const accepted = result && (result.success === true || result.success === "true" || result.success === 1);
      if (!response.ok || !accepted) {
        throw new Error("FormSubmit did not confirm the submission");
      }

      form.reset();
      displayStatus("success");
    } catch (_error) {
      // The server might have received the POST even if the response failed.
      // Do not retry automatically; that can produce duplicate emails.
      displayStatus("error");
    } finally {
      clearTimeout(timeoutId);
      isSending = false;
      button.disabled = false;
      button.textContent = originalLabel;
    }
  });
})();
