(function () {
    function initAnalytics(id) {
        if (!id) {
            return;
        }

        window.dataLayer = window.dataLayer || [];
        window.gtag =
            window.gtag ||
            function () {
                window.dataLayer.push(arguments);
            };

        window.gtag("js", new Date());
        window.gtag("config", id);
    }

    var script = document.currentScript;
    var analyticsId = script && script.dataset ? script.dataset.analyticsId : "";
    initAnalytics(analyticsId);
})();
