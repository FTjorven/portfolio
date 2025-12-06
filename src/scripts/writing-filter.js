const filterBtns = document.querySelectorAll(".filter-btn");
const writingItems = document.querySelectorAll("[data-lang]");
const searchInput = document.getElementById("search-input");

let currentLang = "all";

// Language filter functionality
filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
        currentLang = btn.getAttribute("data-lang");

        // Update active button
        filterBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        // Apply filters
        applyFilters();
    });
});

// Search functionality
searchInput?.addEventListener("input", (e) => {
    applyFilters();
});

function applyFilters() {
    const searchTerm = searchInput?.value.toLowerCase() || "";

    writingItems.forEach((item) => {
        if (item.classList.contains("filter-btn")) return; // Skip filter buttons

        const itemLang = item.getAttribute("data-lang");
        const title = item.querySelector("h3")?.textContent.toLowerCase() || "";
        const excerpt = item.querySelector(".excerpt")?.textContent.toLowerCase() || "";
        const tags = Array.from(item.querySelectorAll(".tags li"))
            .map(tag => tag.textContent.toLowerCase())
            .join(" ");

        const matchesSearch = !searchTerm ||
            title.includes(searchTerm) ||
            excerpt.includes(searchTerm) ||
            tags.includes(searchTerm);

        const matchesLang = currentLang === "all" || itemLang === currentLang;

        if (matchesSearch && matchesLang) {
            item.style.display = "";
        } else {
            item.style.display = "none";
        }
    });
}
