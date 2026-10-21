const header = document.querySelector("[data-masthead]");
const onScroll = () => header.classList.toggle("is-stuck", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

const toggle = document.querySelector("[data-nav-toggle]");
const nav = document.querySelector("[data-nav]");

const setNav = (open) => {
  toggle.setAttribute("aria-expanded", String(open));
  nav.classList.toggle("is-open", open);
};

toggle.addEventListener("click", () => {
  setNav(toggle.getAttribute("aria-expanded") !== "true");
});

nav.addEventListener("click", (event) => {
  if (event.target.closest("a")) setNav(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
    setNav(false);
    toggle.focus();
  }
});

const mq = window.matchMedia("(min-width: 48.0625rem)");
mq.addEventListener("change", (event) => {
  if (event.matches) setNav(false);
});

/* Segmented join form: tabs switch panels, arrow keys move between tabs. */
const tabs = [...document.querySelectorAll('[role="tab"]')];

const selectTab = (tab, focus = false) => {
  tabs.forEach((item) => {
    const active = item === tab;
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
    document.getElementById(item.getAttribute("aria-controls")).hidden = !active;
  });

  if (focus) tab.focus();
};

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectTab(tab));
  tab.addEventListener("keydown", (event) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    selectTab(tabs[(index + step + tabs.length) % tabs.length], true);
  });
});

/* Forms are front-end only: validate, then report what would happen next. */
const messages = {
  join: (name) => `Thanks, ${name}. Check your inbox for the membership confirmation and the first register update.`,
  volunteer: (name) => `Thanks, ${name}. Your local organiser will be in touch within two working days.`,
  donate: (amount) => `Thank you. A receipt for $${amount} is on its way, and the donation will appear on the live register within seven days.`,
};

document.querySelectorAll("[data-panel]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const status = form.querySelector(".form__status");
    const firstInvalid = [...form.elements].find((el) => !el.checkValidity());

    if (firstInvalid) {
      status.dataset.state = "error";
      status.textContent =
        firstInvalid.type === "email"
          ? "That email address is missing an @ or a domain. Check it and try again."
          : "Fill in the fields above so we can reach you.";
      firstInvalid.focus();
      return;
    }

    const key = form.closest("[role=tabpanel]").id.replace("panel-", "");
    const name = form.querySelector('input[name="name"]')?.value.trim().split(" ")[0] || "friend";
    const amount = form.querySelector('input[name="amount"]:checked')?.value;

    form.reset();
    status.dataset.state = "ok";
    status.textContent = messages[key](key === "donate" ? (amount ?? "25") : name);
  });
});
