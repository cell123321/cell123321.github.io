
document.addEventListener("DOMContentLoaded", () => {
  const menuToggle = document.querySelector(".menu-toggle");
  const primaryNav = document.getElementById("primary-nav");

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => {
      const expanded = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", String(!expanded));
      primaryNav.classList.toggle("is-open", !expanded);
    });
  }

  document.querySelectorAll(".nav-dropdown-toggle").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const dropdown = button.closest(".nav-dropdown");
      const isOpen = dropdown.classList.contains("is-open");

      document.querySelectorAll(".nav-dropdown.is-open").forEach((openDropdown) => {
        if (openDropdown !== dropdown) {
          openDropdown.classList.remove("is-open");
          openDropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
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
        dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
      });
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      document.querySelectorAll(".nav-dropdown.is-open").forEach((dropdown) => {
        dropdown.classList.remove("is-open");
        dropdown.querySelector(".nav-dropdown-toggle")?.setAttribute("aria-expanded", "false");
      });
    }
  });
});
