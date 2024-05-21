function updateDateTime() {
  var dt = new Date();
  document.getElementById("datetime").innerHTML = dt.toLocaleString();
}
setInterval(updateDateTime, 1000);
