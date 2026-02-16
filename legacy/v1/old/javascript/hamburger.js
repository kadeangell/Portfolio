function hamburger() {
  var x = document.getElementById("top-bar");
  if (x.className === "top-bar") {
    x.className += " responsive";
  } else {
    x.className = "top-bar";
  }
}
