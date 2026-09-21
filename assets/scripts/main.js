// Page content and navigation work without JavaScript.
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
