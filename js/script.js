document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".reveal").forEach(function (element) {
    element.classList.add("visible");
  });

  var mobileQuery = window.matchMedia("(max-width: 1060px)");

  document.querySelectorAll(".menu-toggle").forEach(function (toggle) {
    var navId = toggle.getAttribute("aria-controls") || "primary-nav";
    var nav = document.getElementById(navId);

    if (!nav) {
      return;
    }

    function setMenuState(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.classList.toggle("is-open", open);
      nav.classList.toggle("open", open);
      nav.classList.toggle("is-open", open);
      document.documentElement.classList.toggle("mobile-menu-open", open);
    }

    toggle.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      var isOpen = toggle.getAttribute("aria-expanded") === "true";
      setMenuState(!isOpen);
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        if (mobileQuery.matches) {
          setMenuState(false);
        }
      });
    });

    document.addEventListener("click", function (event) {
      if (
        toggle.getAttribute("aria-expanded") === "true" &&
        !toggle.contains(event.target) &&
        !nav.contains(event.target)
      ) {
        setMenuState(false);
      }
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
        setMenuState(false);
        toggle.focus();
      }
    });

    window.addEventListener("resize", function () {
      if (!mobileQuery.matches) {
        setMenuState(false);
      }
    });
  });

  document.querySelectorAll(".nav-dropdown-toggle").forEach(function (button) {
    button.addEventListener("click", function (event) {
      if (!mobileQuery.matches) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      var dropdown = button.closest(".nav-dropdown");
      if (!dropdown) {
        return;
      }

      var shouldOpen = !dropdown.classList.contains("is-open");

      document.querySelectorAll(".nav-dropdown.is-open").forEach(function (item) {
        if (item !== dropdown) {
          item.classList.remove("is-open");
          var otherButton = item.querySelector(".nav-dropdown-toggle");
          if (otherButton) {
            otherButton.setAttribute("aria-expanded", "false");
          }
        }
      });

      dropdown.classList.toggle("is-open", shouldOpen);
      button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
    });
  });
});
