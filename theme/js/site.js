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
                    if (window.scrollY > 8) {
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

        // Keep a placeholder so the TOC can return to the article on small screens.
        const placeholder = document.createComment("toc");
        toc.parentNode.insertBefore(placeholder, toc);
        const desktop = window.matchMedia("(min-width: 992px)");

        function place() {
            if (desktop.matches) {
                sidebar.appendChild(toc);
            } else {
                placeholder.parentNode.insertBefore(toc, placeholder.nextSibling);
            }
        }

        place();
        desktop.addEventListener("change", place);
        setupTocScrollSpy(toc);
    }

    function setupTocScrollSpy(toc) {
        if (!("IntersectionObserver" in window)) {
            return;
        }

        const links = Array.from(toc.querySelectorAll('a[href^="#"]'));
        const targets = links
            .map(function (link) {
                return document.getElementById(decodeURIComponent(link.hash.slice(1)));
            })
            .filter(Boolean);

        if (!targets.length) {
            return;
        }

        function activate(id) {
            links.forEach(function (link) {
                const isActive = decodeURIComponent(link.hash.slice(1)) === id;
                link.classList.toggle("is-active", isActive);
                if (isActive) {
                    link.setAttribute("aria-current", "location");
                } else {
                    link.removeAttribute("aria-current");
                }
            });
        }

        const visible = new Set();
        const observer = new IntersectionObserver(
            function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        visible.add(entry.target);
                    } else {
                        visible.delete(entry.target);
                    }
                });
                // Highlight the first visible heading, or the last one scrolled past.
                const current = targets.find(function (target) {
                    return visible.has(target);
                }) || targets.filter(function (target) {
                    return target.getBoundingClientRect().top < 0;
                }).pop();
                if (current) {
                    activate(current.id);
                }
            },
            { rootMargin: "-80px 0px -60% 0px" },
        );

        targets.forEach(function (target) {
            observer.observe(target);
        });
    }

    function setupReadingProgress() {
        const bar = document.querySelector(".reading-progress");
        const body = document.querySelector(".article-body");

        if (!bar || !body) {
            return;
        }

        let ticking = false;
        function update() {
            const rect = body.getBoundingClientRect();
            const total = rect.height - window.innerHeight * 0.5;
            const progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
            bar.style.setProperty("--ps-progress", progress.toFixed(4));
            ticking = false;
        }

        window.addEventListener(
            "scroll",
            function () {
                if (!ticking) {
                    window.requestAnimationFrame(update);
                    ticking = true;
                }
            },
            { passive: true },
        );
        update();
    }

    function setupTables() {
        document.querySelectorAll(".prose table:not(.highlighttable)").forEach(function (table) {
            if (table.parentElement.classList.contains("table-scroll")) {
                return;
            }
            const wrapper = document.createElement("div");
            wrapper.className = "table-scroll";
            table.parentNode.insertBefore(wrapper, table);
            wrapper.appendChild(table);
        });
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

    const THEME_KEY = "ps-theme";

    function storageGet(key) {
        try {
            return window.localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function storageSet(key, value) {
        try {
            window.localStorage.setItem(key, value);
        } catch (error) {
            // Storage can be unavailable (private mode); the choice then lasts for this page only.
        }
    }

    function currentTheme() {
        return document.documentElement.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
    }

    function syncThemeColor() {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) {
            return;
        }
        const color = getComputedStyle(document.documentElement).getPropertyValue("--ps-bg").trim();
        if (color) {
            meta.setAttribute("content", color);
        }
    }

    function syncThemeControls() {
        const theme = currentTheme();
        document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
            button.setAttribute(
                "aria-label",
                theme === "dark" ? "Activar tema claro" : "Activar tema oscuro",
            );
        });
        syncThemeColor();
    }

    function applyTheme(theme, persist) {
        document.documentElement.setAttribute("data-bs-theme", theme);
        if (persist) {
            storageSet(THEME_KEY, theme);
        }
        syncThemeControls();
    }

    function setupThemeToggle() {
        document.querySelectorAll("[data-theme-toggle]").forEach(function (button) {
            button.addEventListener("click", function () {
                applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
            });
        });

        // Follow the OS setting until the reader makes an explicit choice.
        const media = window.matchMedia("(prefers-color-scheme: dark)");
        media.addEventListener("change", function (event) {
            if (!storageGet(THEME_KEY)) {
                applyTheme(event.matches ? "dark" : "light", false);
            }
        });

        syncThemeControls();
    }

    const currentScript = document.currentScript;

    onReady(function () {
        const config = {
            indexName: currentScript?.dataset.storkName || "sitesearch",
            wasm: currentScript?.dataset.storkWasm || "",
            indexUrl: currentScript?.dataset.storkIndex || "",
        };

        initStork(config);
        setupSkipLink();
        setupNavbarScroll();
        setupBackToTop();
        setupThemeToggle();
        setupTables();
        setupStickyToc();
        setupReadingProgress();
        setupCopyButtons();
        setupSearchToggle();
        setupFilenameMono();
    });

    /**
     * Setup code block titles with mixed font (Sans-serif for Lang, Monospace for Filename)
     */
    function setupFilenameMono() {
        const filenames = document.querySelectorAll(".filename");
        filenames.forEach(function (el) {
            const text = el.textContent;
            const separator = text.indexOf(" - ");
            if (separator === -1) {
                return;
            }
            const file = document.createElement("span");
            file.className = "filename-mono";
            file.textContent = text.slice(separator + 3);
            el.textContent = text.slice(0, separator);
            el.appendChild(file);
        });
    }
})();
