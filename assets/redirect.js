(function () {
  "use strict";
  const game = window.GameShelfCatalog.games.find(game => game.id === "mofuru-gym");
  if (!game) return;
  // The destination is trusted catalog data, never a query-supplied redirect URL.
  const destination = new URL(game.href);
  destination.search = window.location.search;
  destination.hash = window.location.hash;
  document.getElementById("canonical-game").href = destination.href;
  // Replace avoids a redirect loop when the player presses Back.
  window.location.replace(destination.href);
})();
