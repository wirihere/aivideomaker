/* ConsentMate — review-mode palette switcher.
   Shared between all pages so they stay in sync.
   Reads ?palette=… from URL, or localStorage, else falls back to Ordnance. */

(function () {
  var STORAGE_KEY = "cm-palette";
  var palettes = ["ordnance", "paper", "clay", "mono"];

  function apply(pal) {
    if (!palettes.includes(pal)) pal = "ordnance";
    document.body.setAttribute("data-palette", pal);
    try { localStorage.setItem(STORAGE_KEY, pal); } catch (e) {}
    // Update buttons
    var btns = document.querySelectorAll(".cm-palette button");
    btns.forEach(function (b) {
      b.classList.toggle("active", b.dataset.pal === pal);
    });
  }

  function init() {
    var urlPal = new URLSearchParams(window.location.search).get("palette");
    var stored = null;
    try { stored = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    var initial = urlPal || stored || "ordnance";
    apply(initial);

    var btns = document.querySelectorAll(".cm-palette button");
    btns.forEach(function (b) {
      b.addEventListener("click", function () {
        apply(b.dataset.pal);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
