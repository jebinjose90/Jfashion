const sidebar_links = document.querySelectorAll(".sidebar-links a");
const active_tab = document.querySelector(".active-tab");
const shortcuts = document.querySelector(".sidebar-links h4");
const tooltip_elements = document.querySelectorAll(".tooltip-element");

let activeIndex;

// Get the main content area
const mainContent = document.querySelector("main");

function loadPage(pageURL) {
  // Fetch the content of the page
  fetch(pageURL)
    .then((response) => response.text())
    .then((html) => {
      // Replace the content of the main area with the loaded page
      mainContent.innerHTML = html;
    })
    .catch((error) => {
      console.error("Error loading page:", error);
    });
}

function moveActiveTab() {
  let topPosition = activeIndex * 58 + 2.5;
  if (activeIndex > 3) {
    topPosition += shortcuts.clientHeight;
  }
  active_tab.style.top = `${topPosition}px`;
}

// Function to handle link clicks and load corresponding pages
function changeLink(event) {
  event.preventDefault();

  sidebar_links.forEach((sideLink) => sideLink.classList.remove("active"));
  this.classList.add("active");

  activeIndex = this.dataset.active;
  moveActiveTab();

  const pageURL = this.getAttribute("href");
  loadPage(pageURL);
}

// Attach the event listener to each side menu link
sidebar_links.forEach((link) => link.addEventListener("click", changeLink));

// Initial page load (you can set a default page)
loadPage("/userProfile");

function showTooltip() {
  let tooltip = this.parentNode.lastElementChild;
  let spans = tooltip.children;
  let tooltipIndex = this.dataset.tooltip;

  Array.from(spans).forEach((sp) => sp.classList.remove("show"));
  spans[tooltipIndex].classList.add("show");

  tooltip.style.top = `${(100 / (spans.length * 2)) * (tooltipIndex * 2 + 1)}%`;
}

tooltip_elements.forEach((elem) => {
  elem.addEventListener("mouseover", showTooltip);
});