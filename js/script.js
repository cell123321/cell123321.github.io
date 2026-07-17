
document.addEventListener("DOMContentLoaded", () => {
  // Ensure all content is visible even when animation observers are unavailable.
  document.querySelectorAll(".reveal").forEach((element) => {
    element.classList.add("visible");
  });

  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.getElementById("primary-nav");

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      const nextState = !expanded;

      menuToggle.setAttribute("aria-expanded", String(nextState));
      primaryNav.classList.toggle("open", nextState);
      primaryNav.classList.toggle("is-open", nextState);
    });
  }

  document.querySelectorAll(".nav-dropdown-toggle").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();

      const dropdown = button.closest(".nav-dropdown");
      const isOpen = dropdown.classList.contains("is-open");

      document.querySelectorAll(".nav-dropdown.is-open").forEach((item) => {
        if (item !== dropdown) {
          item.classList.remove("is-open");
          item.querySelector(".nav-dropdown-toggle")
            ?.setAttribute("aria-expanded", "false");
        }
      });

      dropdown.classList.toggle("is-open", !isOpen);
      button.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".nav-dropdown")) {
      document.querySelectorAll(".nav-dropdown.is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector(".nav-dropdown-toggle")
          ?.setAttribute("aria-expanded", "false");
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".nav-dropdown.is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector(".nav-dropdown-toggle")
          ?.setAttribute("aria-expanded", "false");
      });

      if (primaryNav && menuToggle) {
        primaryNav.classList.remove("open", "is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    }
  });
});
