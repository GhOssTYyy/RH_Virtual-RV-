// ============================================
// HEADER
// ============================================
const header_back_button = document.getElementById("header-back-button")

if (header_back_button) {
    header_back_button.addEventListener("click", function() {
        window.location.href = "/pages/employees/main-page.html"
    })
}


// ============================================
// NAVEGAÇÃO DAS TABS
// ============================================
const tabs = document.querySelectorAll(".tab")

tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
        const target = tab.dataset.tab
        console.log("🚀 Tab clicada:", target)
        
        if (target === "home") {
            window.location.href = "/pages/employees/main-page.html"
        } else if (target === "point") {
            window.location.href = "/pages/employees/clock-in.html"
        } else if (target === "historic") {
            window.location.href = "/pages/employees/historic-clock-in-register.html"
        }
        // "holiday" já é a página atual
    })
})