module.exports = function(eleventyConfig) {
  // Passthrough copy for static assets
  eleventyConfig.addPassthroughCopy("src/css");
  eleventyConfig.addPassthroughCopy("src/js");
  eleventyConfig.addPassthroughCopy("src/images");
  eleventyConfig.addPassthroughCopy("src/_data/*.json");

  // Shortcodes
  eleventyConfig.addShortcode("bentoItem", function(url, title, image, badge, isWide = false, isTall = false, extraClasses = "", extraStyles = "") {
    const urlFilter = eleventyConfig.getFilter("url");
    const wideClass = isWide ? "bento-item-wide" : "";
    const tallClass = isTall ? "bento-item-tall" : "";

    return `<a href="${urlFilter(url)}"
       class="bento-item ${wideClass} ${tallClass} ${extraClasses} text-white text-decoration-none shadow-sm transition-300 hover-scale"
       style="background-image: url('${urlFilter(image)}'); ${extraStyles}">
        <div class="mb-auto">
            <span class="badge rounded-pill bg-white text-dark shadow-sm px-3 py-2 opacity-75">${badge}</span>
        </div>
        <h4 class="fw-bold mb-0" style="font-family: 'Poller One', cursive;">${title}</h4>
    </a>`;
  });

  eleventyConfig.addShortcode("infoCard", function(title, text, link, icon, btnClass = "btn-outline-primary", iconColor = "", titleColor = "") {
    const urlFilter = eleventyConfig.getFilter("url");
    const iconStyle = iconColor ? `style="color: ${iconColor};"` : "";
    const titleStyle = titleColor ? `style="color: ${titleColor};"` : "";

    return `<div class="col-md-4">
        <div class="card h-100 border-0 shadow-sm hover-scale text-center p-4 bg-white">
            <div class="card-body">
                <div class="bg-white rounded-circle d-inline-flex align-items-center justify-content-center mb-3 shadow-sm"
                    style="width: 80px; height: 80px;">
                    <i class="fas ${icon} fa-2x" ${iconStyle}></i>
                </div>
                <h3 class="h4 fw-bold mb-3" ${titleStyle}>${title}</h3>
                <p class="mb-4">${text}</p>
                <a href="${urlFilter(link)}" class="btn ${btnClass} fw-bold stretched-link"
                    style="border-width: 2px;">
                    Find Out More
                </a>
            </div>
        </div>
    </div>`;
  });

  eleventyConfig.addShortcode("facilityItem", function(icon, label) {
    return `<div class="col-6 col-md-4">
        <div class="p-3">
            <i class="fas ${icon} fa-2x mb-3" style="color: var(--brand-glaucous);"></i>
            <h6 class="fw-bold mb-0">${label}</h6>
        </div>
    </div>`;
  });

  return {
    pathPrefix: "/girton-feast/",
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    templateFormats: ["html", "njk", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk"
  };
};
