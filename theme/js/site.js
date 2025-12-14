(function () {
    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    }

    function initStork(config) {
        if (typeof stork === "undefined" || !config.wasm || !config.indexUrl) {
            return;
        }

        stork.initialize(config.wasm);
        stork.downloadIndex(config.indexName, config.indexUrl);
        stork.attach(config.indexName);
    }

    function setupNavbarScroll() {
        const navbar = document.querySelector(".navbar");
        if (!navbar) {
            return;
        }

        let ticking = false;
        window.addEventListener(
            "scroll",
            function () {
                if (ticking) {
                    return;
                }
                window.requestAnimationFrame(function () {
                    if (window.scrollY > 50) {
                        navbar.classList.add("scrolled");
                    } else {
                        navbar.classList.remove("scrolled");
                    }
                    ticking = false;
                });
                ticking = true;
            },
            { passive: true },
        );
    }

    function setupSkipLink() {
        const skipLink = document.querySelector(".skip-link");
        const mainContent = document.querySelector("#main-content");

        if (!skipLink || !mainContent) {
            return;
        }

        skipLink.addEventListener("click", function (event) {
            event.preventDefault();
            mainContent.focus();
            window.scrollTo({
                top: Math.max(mainContent.offsetTop - 80, 0),
                behavior: "smooth",
            });
        });
    }

    onReady(function () {
        const script = document.currentScript;
        const config = {
            indexName: script?.dataset.storkName || "sitesearch",
            wasm: script?.dataset.storkWasm || "",
            indexUrl: script?.dataset.storkIndex || "",
        };

        initStork(config);
        setupSkipLink();
        setupNavbarScroll();
    });
})();
