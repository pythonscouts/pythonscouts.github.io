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

    function setupBackToTop() {
        const btn = document.createElement("button");
        btn.className = "back-to-top";
        btn.setAttribute("aria-label", "Volver arriba");
        btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
        document.body.appendChild(btn);

        let ticking = false;
        window.addEventListener(
            "scroll",
            function () {
                if (ticking) {
                    return;
                }
                window.requestAnimationFrame(function () {
                    if (window.scrollY > 400) {
                        btn.classList.add("visible");
                    } else {
                        btn.classList.remove("visible");
                    }
                    ticking = false;
                });
                ticking = true;
            },
            { passive: true },
        );

        btn.addEventListener("click", function () {
            window.scrollTo({ top: 0, behavior: "smooth" });
        });
    }

    function setupStickyToc() {
        const sidebar = document.getElementById("toc-sidebar");
        const toc = document.querySelector(".article-body .toc");

        if (!sidebar || !toc) {
            return;
        }

        // Only move TOC to sidebar on desktop
        if (window.matchMedia("(min-width: 992px)").matches) {
            sidebar.appendChild(toc);
        }
    }

    function setupCopyButtons() {
        // Target only the outermost highlight container
        const blocks = document.querySelectorAll(".highlight:not(td .highlight)");

        blocks.forEach(function (block) {
            const pre = block.querySelector("td.code pre") || block.querySelector("pre");
            if (!pre) {
                return;
            }

            block.classList.add("has-copy-btn");

            const btn = document.createElement("button");
            btn.className = "copy-btn";
            btn.type = "button";
            btn.innerHTML = '<i class="bi bi-clipboard"></i>';
            btn.setAttribute("aria-label", "Copiar código");
            btn.title = "Copiar código";

            btn.addEventListener("click", function () {
                let code = pre.textContent;
                const lines = code.split("\n");
                
                // If it looks like a REPL session (contains >>>), only copy prompt lines
                if (code.includes(">>> ")) {
                    code = lines
                        .filter(line => line.startsWith(">>> ") || line.startsWith("... "))
                        .map(line => line.replace(/^(?:>>> |\.\.\. )/, ""))
                        .join("\n");
                } else {
                    // Standard shell/env prompt stripping
                    code = lines
                        .map(line => line.replace(/^(?:\(.*\)\s+)?(?:>>> |\.\.\. |\$ |PS\s*> )/gm, ""))
                        .join("\n");
                }
                
                navigator.clipboard.writeText(code.trim()).then(function () {
                    btn.innerHTML = '<i class="bi bi-clipboard-check"></i>';
                    btn.classList.add("copied");
                    setTimeout(function () {
                        btn.innerHTML = '<i class="bi bi-clipboard"></i>';
                        btn.classList.remove("copied");
                    }, 2000);
                });
            });

            block.appendChild(btn);
        });
    }

    function setupSearchToggle() {
        const toggle = document.querySelector(".search-toggle");
        const form = document.querySelector(".search-form");
        const input = document.querySelector(".search-form .stork-input");

        if (!toggle || !form || !input) {
            return;
        }

        toggle.addEventListener("click", function () {
            form.classList.add("search-expanded");
            input.focus();
        });

        input.addEventListener("blur", function () {
            if (!input.value.trim()) {
                form.classList.remove("search-expanded");
            }
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
        setupBackToTop();
        setupStickyToc();
        setupCopyButtons();
        setupSearchToggle();
        setupFilenameMono();
    });

    /**
     * Setup code block titles with mixed font (Sans-serif for Lang, Monospace for Filename)
     */
    function setupFilenameMono() {
        const filenames = document.querySelectorAll(".filename");
        filenames.forEach(el => {
            const text = el.textContent;
            if (text.includes(" - ")) {
                const parts = text.split(" - ");
                const lang = parts[0];
                const file = parts[1];
                el.innerHTML = `${lang} - <span class="filename-mono">${file}</span>`;
            }
        });
    }
})();
