const galleryItems = [
  {
    label: "Rekonstrukce bytu",
    title: "Kompletní rekonstrukce bytu",
    text: "Nové rozvody, rozvaděč, zásuvkové a světelné okruhy i přípravy pro kuchyň a koupelnu.",
    image: ""
  },
  {
    label: "Rodinný dům",
    title: "Rodinný dům na klíč",
    text: "Kompletní elektroinstalace včetně rozvaděče, osvětlení, zásuvek a příprav pro další technologie.",
    image: ""
  },
  {
    label: "Loxone",
    title: "Loxone a chytré ovládání",
    text: "Řízení osvětlení, topení, stínění nebo přístupu pro pohodlnější a úspornější provoz domácnosti.",
    image: ""
  },
  {
    label: "Preciznost",
    title: "Precizní technické provedení",
    text: "Důraz na detail, přehledné rozvaděče, čisté trasy kabeláže a poctivě dotažená práce.",
    image: ""
  }
];

// Skutečné veřejné zakázky lze doplnit později.
// Pokud pole zůstane prázdné, sekce se na webu vůbec nezobrazí.
const publicSectorReferences = [];

const documentItems = [
  {
    type: "Oprávnění",
    title: "TIČR",
    text: "Platné oprávnění k činnosti v oblasti elektro.",
    href: "",
    ctaLabel: "Zobrazit PDF"
  },
  {
    type: "Školení",
    title: "Odborná školení a certifikace",
    text: "Školení k technologiím, vyhláškám a vybraným specializovaným systémům.",
    href: "",
    ctaLabel: "Zobrazit PDF"
  },
  {
    type: "Pojištění",
    title: "Pojištění odpovědnosti",
    text: "Potvrzení o pojištění odpovědnosti za výkon činnosti.",
    href: "",
    ctaLabel: "Stáhnout PDF"
  },
  {
    type: "Kvalifikace",
    title: "Výpis z SKD",
    text: "Doklad o zápisu v Seznamu kvalifikovaných dodavatelů.",
    href: "",
    ctaLabel: "Zobrazit PDF"
  }
];

const galleryGrid = document.querySelector("#gallery-grid");
const tenderList = document.querySelector("#tender-list");
const publicReferencesSection = document.querySelector("#public-references-section");
const documentsGrid = document.querySelector("#documents-grid");

function createGalleryCard(item) {
  const article = document.createElement("article");
  article.className = "gallery-card";

  const badge = document.createElement("span");
  badge.className = "gallery-badge";
  badge.textContent = item.label;

  const title = document.createElement("h3");
  title.textContent = item.title;

  const text = document.createElement("p");
  text.textContent = item.text;

  article.append(badge, title, text);

  if (item.image) {
    const image = document.createElement("img");
    image.className = "gallery-image";
    image.src = item.image;
    image.alt = item.title;
    article.append(image);
  } else {
    const visual = document.createElement("div");
    visual.className = "gallery-visual";
    visual.setAttribute("aria-hidden", "true");
    article.append(visual);
  }

  return article;
}

function createTenderCard(item) {
  const article = document.createElement("article");
  article.className = "tender-card";

  const meta = document.createElement("span");
  meta.className = "tender-meta";
  meta.textContent = item.meta;

  const title = document.createElement("h3");
  title.textContent = item.title;

  const text = document.createElement("p");
  text.textContent = item.text;

  article.append(meta, title, text);
  return article;
}

function createDocumentCard(item) {
  const article = document.createElement("article");
  article.className = "document-card";

  const type = document.createElement("span");
  type.className = "document-type";
  type.textContent = item.type;

  const title = document.createElement("h3");
  title.textContent = item.title;

  const text = document.createElement("p");
  text.textContent = item.text;

  article.append(type, title, text);

  if (item.href) {
    const link = document.createElement("a");
    link.className = "document-link";
    link.href = item.href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = item.ctaLabel || "Zobrazit PDF";
    article.append(link);
  } else {
    const request = document.createElement("span");
    request.className = "document-status";
    request.textContent = "Dokument na vyžádání";
    article.append(request);
  }

  return article;
}

galleryItems.forEach((item) => {
  if (galleryGrid) {
    galleryGrid.appendChild(createGalleryCard(item));
  }
});

if (publicReferencesSection && tenderList && publicSectorReferences.length > 0) {
  publicReferencesSection.hidden = false;

  publicSectorReferences.forEach((item) => {
    tenderList.appendChild(createTenderCard(item));
  });
}

documentItems.forEach((item) => {
  if (documentsGrid) {
    documentsGrid.appendChild(createDocumentCard(item));
  }
});

const menuToggle = document.querySelector(".menu-toggle");
const mainNav = document.querySelector(".main-nav");

if (menuToggle && mainNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = mainNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  mainNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mainNav.classList.remove("is-open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const contactForm = document.querySelector("#contact-form");
const feedback = document.querySelector("#form-feedback");

if (contactForm && feedback) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(contactForm);
    const name = formData.get("name");
    const email = formData.get("email");
    const phone = formData.get("phone");
    const segment = formData.get("segment");
    const message = formData.get("message");

    const subject = encodeURIComponent(`Poptávka z webu iTECH elektro - ${segment}`);
    const body = encodeURIComponent(
      `Jméno: ${name}\nE-mail: ${email}\nTelefon: ${phone}\nTyp poptávky: ${segment}\n\nPopis:\n${message}`
    );

    feedback.textContent = "Otevírá se váš e-mailový program s předvyplněnou zprávou.";
    window.location.href = `mailto:stanislavsrnec@itechelektro.cz?subject=${subject}&body=${body}`;
  });
}

const currentYear = document.querySelector("#current-year");

if (currentYear) {
  currentYear.textContent = String(new Date().getFullYear());
}
