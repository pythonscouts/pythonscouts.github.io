(function () {
    function onReady(callback) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", callback, { once: true });
        } else {
            callback();
        }
    }

    function loadDisqus(shortname) {
        if (!shortname || typeof document === "undefined") {
            return;
        }

        var thread = document.getElementById("disqus_thread");
        if (!thread) {
            return;
        }

        if (window.DISQUS) {
            window.DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = document.location.pathname;
                    this.page.url = document.location.href;
                },
            });
            return;
        }

        var dsq = document.createElement("script");
        dsq.src = "https://" + shortname + ".disqus.com/embed.js";
        dsq.async = true;
        dsq.setAttribute("data-timestamp", Date.now().toString());
        (document.head || document.body).appendChild(dsq);
    }

    onReady(function () {
        var script = document.currentScript;
        var shortname = script && script.dataset ? script.dataset.disqusShortname : "";
        loadDisqus(shortname);
    });
})();
