LOGO TICKER FILES
=================

Drop logo files here using these EXACT filenames:

    united-airlines.svg
    tesla.svg
    pfizer.svg
    palace-entertainment.svg
    alpha-kappa-psi.svg
    iowa-state.svg

Until a file exists, the ticker shows a clean text wordmark instead, so the
site never looks broken.

FORMAT
- SVG is best (stays sharp at any size). Transparent PNG at 2x also works.
- If you use PNG, change the file extension in index.html to match.
- Logos are auto-converted to flat black on the page, so the source file's
  own colors don't matter. A transparent background DOES matter.

WHERE TO GET THEM
- Most companies publish a press/brand page: search "Tesla brand assets",
  "United Airlines newsroom logo", "Pfizer brand portal".
- Iowa State and Alpha Kappa Psi both have official brand/identity pages.
- Wikipedia's page for each company usually has a clean SVG in the infobox.

A NOTE ON USING THEM
Showing the logos of places you actually worked or belonged to is normal and
expected on a personal portfolio. Just don't alter the marks or arrange them
in a way that implies a company endorses or sponsors you.

SIZING
Different logos have very different proportions. If one looks too big or
small next to the others, set a per-logo height in styles.css, e.g.:

    .tk img[alt="Pfizer"] { height: 78%; }
