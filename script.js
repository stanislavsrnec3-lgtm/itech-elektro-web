document.documentElement.classList.add("js");

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {
  function closeMenu(returnFocus = false) {
    mainNav.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Otevřít nabídku");
    menuToggle.title = "Otevřít nabídku";
    menuToggle.querySelector("img").src = "assets/icons/menu.svg";
    if (returnFocus) menuToggle.focus();
  }

  menuToggle.addEventListener("click", () => {
    const open = menuToggle.getAttribute("aria-expanded") !== "true";
    mainNav.classList.toggle("is-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Zavřít nabídku" : "Otevřít nabídku");
    menuToggle.title = open ? "Zavřít nabídku" : "Otevřít nabídku";
    menuToggle.querySelector("img").src = open ? "assets/icons/x.svg" : "assets/icons/menu.svg";
  });
  mainNav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => closeMenu()));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && mainNav.classList.contains("is-open")) closeMenu(true);
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  document.addEventListener("focusin", (event) => {
    if (!event.target.closest(".site-header")) closeMenu();
  });
  window.matchMedia("(min-width: 901px)").addEventListener("change", () => closeMenu());
}

const inquiryByPage = {
  "hvi-hromosvody.html": "HVI hromosvod",
  "datove-wifi-site-brno.html": "Datové a Wi-Fi sítě",
  "energeticky-management-loxone.html": "Energetický management",
  "kamerove-systemy-zabezpeceni.html": "Zabezpečení a kamery",
  "chytre-elektroinstalace-loxone.html": "Loxone",
  "elektroinstalace-bytu.html": "Elektroinstalace",
  "elektroinstalace-rodinnych-domu.html": "Elektroinstalace",
  "elektroinstalace-novostavby-rekonstrukce.html": "Elektroinstalace",
  "revize-porevizni-opravy.html": "Revize a opravy",
  "bytove-domy-svj-bytova-druzstva.html": "SVJ a stavební firmy",
  "spoluprace-stavebni-firmy.html": "SVJ a stavební firmy"
};
const pageName = window.location.pathname.split("/").pop();
const currentService = inquiryByPage[pageName];
if (currentService) {
  document.querySelectorAll('a[href="index.html#kontakt"]').forEach((link) => {
    link.href = `index.html?inquiryType=${encodeURIComponent(currentService)}#kontakt`;
  });
}

const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");
const inquirySelect = document.querySelector("#inquiryType");
const requestedInquiryType = new URLSearchParams(window.location.search).get("inquiryType");

if (inquirySelect && requestedInquiryType) {
  const matchingOption = Array.from(inquirySelect.options).find((option) => option.value === requestedInquiryType);
  if (matchingOption) inquirySelect.value = matchingOption.value;
}

// Keep old bookmarked section links useful after shortening the homepage.
const sectionAliases = { "#domacnosti": "#realizace", "#verejna-sprava": "#o-firme", "#stavebni-firmy": "#rozcestnik" };
function revealHashTarget() {
  let hash = window.location.hash;
  if (sectionAliases[hash]) {
    hash = sectionAliases[hash];
    history.replaceState(null, "", window.location.pathname + window.location.search + hash);
  }
  const target = document.getElementById(hash.slice(1));
  if (target && target.tagName === "DETAILS") target.open = true;
  if (target && (target.tagName === "DETAILS" || Object.values(sectionAliases).includes(hash))) {
    target.scrollIntoView();
  }
}
window.addEventListener("hashchange", revealHashTarget);
revealHashTarget();

if (contactForm && feedback) {
  const email = contactForm.elements.email;
  const phone = contactForm.elements.phone;
  const message = contactForm.elements.message;
  const location = contactForm.elements.location;
  const contactError = document.querySelector("#contact-error");
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const submitLabel = submitButton.innerHTML;
  const mobileCta = document.querySelector(".mobile-cta");
  let sending = false;

  // Without JavaScript the normal HTML form requires an email address.
  email.required = false;

  function clearContactError() {
    email.setCustomValidity("");
    phone.setCustomValidity("");
    email.removeAttribute("aria-invalid");
    phone.removeAttribute("aria-invalid");
    contactError.hidden = true;
    contactError.textContent = "Vyplňte e-mail nebo telefon, abychom vám mohli odpovědět.";
  }
  [email, phone].forEach((input) => input.addEventListener("input", clearContactError));
  [message, location].forEach((input) => input.addEventListener("input", () => input.setCustomValidity("")));

  async function rejectionReason(response) {
    if (response.status === 429) return "limit";
    if (response.status === 413) return "size";
    let payload;
    try { payload = await response.json(); } catch { return "response"; }
    const errors = Array.isArray(payload?.errors)
      ? payload.errors.filter((error) => error && typeof error === "object")
      : [];
    if (errors.some((error) => error.code === "NO_FILE_UPLOADS" || error.message === "File Uploads Not Permitted") || payload?.error === "File Uploads Not Permitted") return "uploads";
    if (errors.some((error) => error.code === "TYPE_EMAIL" || (error.field === "email" && ["REQUIRED_FIELD_MISSING", "REQUIRED_FIELD_EMPTY"].includes(error.code)))) return "email";
    if (errors.some((error) => ["INACTIVE", "BLOCKED", "FORM_NOT_FOUND", "PROJECT_NOT_FOUND"].includes(error.code))) return "unavailable";
    return "response";
  }

  function setFeedback(text, state) {
    feedback.textContent = text;
    feedback.className = "form-feedback" + (state ? ` is-${state}` : "");
  }
  contactForm.addEventListener("focusin", () => mobileCta?.classList.add("is-hidden"));
  contactForm.addEventListener("focusout", (event) => {
    if (!contactForm.contains(event.relatedTarget)) mobileCta?.classList.remove("is-hidden");
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (sending) return;
    clearContactError();
    email.value = email.value.trim();
    phone.value = phone.value.trim();
    if (!email.value && !phone.value) {
      contactError.hidden = false;
      email.setAttribute("aria-invalid", "true");
      phone.setAttribute("aria-invalid", "true");
      email.setCustomValidity(contactError.textContent);
    } else if (phone.value && (!/^\+?[\d\s().-]+$/.test(phone.value) || phone.value.replace(/\D/g, "").length < 7 || phone.value.replace(/\D/g, "").length > 15)) {
      contactError.textContent = "Zkontrolujte telefonní číslo včetně případné předvolby.";
      contactError.hidden = false;
      phone.setCustomValidity(contactError.textContent);
      phone.setAttribute("aria-invalid", "true");
    }
    if (!message.value.trim()) message.setCustomValidity("Napište prosím, co potřebujete.");
    if (!location.value.trim()) location.setCustomValidity("Napište prosím lokalitu zakázky.");
    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    // Never silently discard files from an older cached version of the form.
    if (!contactForm.elements.attachments?.files.length) formData.delete("attachments");
    if (!email.value) formData.delete("email");
    formData.set("_subject", "Poptávka iTECH elektro" + (inquirySelect.value ? ": " + inquirySelect.value : ""));
    const service = inquirySelect.value;
    const controls = Array.from(contactForm.elements).filter((control) => !control.disabled);
    sending = true;
    controls.forEach((control) => { control.disabled = true; });
    contactForm.setAttribute("aria-busy", "true");
    submitButton.textContent = "Odesíláme poptávku…";
    setFeedback("Odesíláme poptávku. Chvíli prosím vyčkejte.", "");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(contactForm.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(await rejectionReason(response));
      }
      contactForm.reset();
      if (requestedInquiryType) inquirySelect.value = service;
      setFeedback("Děkujeme, poptávka byla odeslána. Ozveme se vám na uvedený kontakt.", "success");
      contactForm.dispatchEvent(new CustomEvent("itech:inquiry-sent", { bubbles: true, detail: { service } }));
    } catch (error) {
      const errorMessages = {
        limit: "Formulář teď nepřijímá další zprávy. Napište nám prosím na stanislavsrnec@itechelektro.cz nebo zavolejte. Vyplněné údaje zůstaly zachované.",
        uploads: "Tento formulář nepodporuje přílohy. Podklady pošlete na stanislavsrnec@itechelektro.cz. Poptávka nebyla odeslána a údaje zůstaly zachované.",
        email: "Služba vyžaduje platnou e-mailovou adresu. Doplňte nebo opravte e-mail a odešlete poptávku znovu. Vyplněné údaje zůstaly zachované.",
        size: "Služba odmítla příliš velkou zprávu. Delší zadání a podklady pošlete na stanislavsrnec@itechelektro.cz. Vyplněné údaje zůstaly zachované.",
        unavailable: "Formulář je momentálně nedostupný. Napište nám na stanislavsrnec@itechelektro.cz nebo zavolejte na +420 721 904 248. Vyplněné údaje zůstaly zachované."
      };
      const text = Object.hasOwn(errorMessages, error.message)
        ? errorMessages[error.message]
        : "Nemáme potvrzení o odeslání. Vaše údaje zůstaly ve formuláři. Kontaktujte nás na stanislavsrnec@itechelektro.cz nebo +420 721 904 248; poptávku můžete také zkusit odeslat znovu.";
      setFeedback(text, "error");
    } finally {
      clearTimeout(timeout);
      sending = false;
      controls.forEach((control) => { control.disabled = false; });
      contactForm.removeAttribute("aria-busy");
      submitButton.innerHTML = submitLabel;
      feedback.focus();
    }
  });
}

const currentYear = document.querySelector("#current-year");
if (currentYear) currentYear.textContent = String(new Date().getFullYear());
