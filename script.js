// ---------------------------------------------------------------------------
// Hennen van Merchtenen -- evidence tabs
//
// This file only renders whatever is in /data/*.json. To plug in real
// results instead of the bundled sample data, run export_for_website.py
// against your corpus and pipeline output, and drop its four JSON files
// into /data with the same names. No changes to this file are needed --
// the sample-data banner even disables itself automatically once none of
// the loaded files carry a "SAMPLE DATA" note.
//
// Expected shapes (also documented in export_for_website.py):
//
//   ngrams.json / rhymes.json:
//     { meta: { known_label, questioned_label, note? },
//       items: [ { term, type, score,
//                  known:      [ { line_no, lines: [str,...], match_index } ],
//                  questioned: [ same shape ] } ] }
//
//   null_calibration.json:
//     { feature_mode, known_label, questioned_label, questioned_score,
//       percentile, background: [ { document, score } ], note? }
//
//   embeddings.json:
//     { known_label, questioned_label, note?,
//       points: [ { id, doc: "known"|"questioned", x, y, line_no,
//                   lines: [str,...], match_index } ] }
// ---------------------------------------------------------------------------

(function () {
  "use strict";

  // ---- small utilities -----------------------------------------------

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function escapeRegex(s) {
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Wraps the first case-insensitive match of `term` in <mark>, HTML-escaping
  // everything else. Escaping happens AFTER splitting on the raw string so
  // the <mark> tags themselves never get escaped away.
  function highlightTerm(line, term) {
    var re = new RegExp("(" + escapeRegex(term) + ")", "i");
    var m = re.exec(line);
    if (!m) return escapeHtml(line);
    var before = line.slice(0, m.index);
    var matched = m[0];
    var after = line.slice(m.index + matched.length);
    return escapeHtml(before) + "<mark>" + escapeHtml(matched) + "</mark>" + escapeHtml(after);
  }

  function fetchJSON(path) {
    return fetch(path).then(function (r) {
      if (!r.ok) throw new Error("Failed to load " + path + " (" + r.status + ")");
      return r.json();
    });
  }

  function isSampleDataset(d) {
    var note = (d && (d.note || (d.meta && d.meta.note))) || "";
    return note.toUpperCase().indexOf("SAMPLE DATA") !== -1;
  }

  // ---- tabs -------------------------------------------------------------

  function initTabs() {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".tab"));

    function panelFor(tab) {
      return document.getElementById("panel-" + tab.dataset.tab);
    }

    function activate(target) {
      tabs.forEach(function (t) {
        var selected = t === target;
        t.setAttribute("aria-selected", String(selected));
        t.tabIndex = selected ? 0 : -1;
        panelFor(t).hidden = !selected;
      });
    }

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { activate(t); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") {
          e.preventDefault();
          var n = tabs[(i + 1) % tabs.length];
          n.focus(); activate(n);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          var p = tabs[(i - 1 + tabs.length) % tabs.length];
          p.focus(); activate(p);
        }
      });
    });
  }

  // ---- sample-data banner -------------------------------------------------

  function initBanner(anySample) {
    var banner = document.getElementById("sampleBanner");
    var dismissBtn = document.getElementById("dismissBanner");
    var dismissedBefore = false;
    try { dismissedBefore = localStorage.getItem("hvm-banner-dismissed") === "1"; } catch (e) { /* ignore */ }

    if (!anySample || dismissedBefore) banner.classList.add("is-dismissed");

    dismissBtn.addEventListener("click", function () {
      banner.classList.add("is-dismissed");
      try { localStorage.setItem("hvm-banner-dismissed", "1"); } catch (e) { /* ignore */ }
    });
  }

  // ---- compare tabs: shared bigrams/trigrams & shared rhymes -------------

  function renderCompareTab(data, gridId, contextId) {
    var grid = document.getElementById(gridId);
    var context = document.getElementById(contextId);
    var items = (data.items || []).slice().sort(function (a, b) { return b.score - a.score; });

    function columnHtml(side) {
      var label = side === "known" ? data.meta.known_label : data.meta.questioned_label;
      var rows = items.map(function (item) {
        return (
          '<li><button class="term-btn" data-term="' + escapeHtml(item.term) + '" data-side="' + side + '">' +
          '<span class="term-word">' + escapeHtml(item.term) + "</span>" +
          '<span class="term-meta"><span class="term-tag">' + escapeHtml(item.type) + "</span>" +
          '<span class="term-score">' + item.score.toFixed(2) + "</span></span>" +
          "</button></li>"
        );
      }).join("");
      return '<div class="compare-col"><h4>' + escapeHtml(label) + '</h4><ul class="term-list">' + rows + "</ul></div>";
    }

    grid.innerHTML = columnHtml("known") + columnHtml("questioned");

    grid.querySelectorAll(".term-btn").forEach(function (btn) {
      btn.addEventListener("click", function () { selectTerm(btn.dataset.term); });
    });

    function occurrencesHtml(occs, term) {
      if (!occs || occs.length === 0) return '<p class="context-placeholder">No occurrences found.</p>';
      var html = occs.map(function (occ) {
        var start = occ.line_no - occ.match_index;
        var lis = occ.lines.map(function (line, idx) {
          var isMatch = idx === occ.match_index;
          var lineHtml = isMatch ? highlightTerm(line, term) : escapeHtml(line);
          return '<li class="' + (isMatch ? "match-line" : "") + '">' + lineHtml + "</li>";
        }).join("");
        return '<ol class="context-lines" start="' + start + '">' + lis + "</ol>";
      }).join("");
      if (occs.length > 1) html += '<p class="occurrence-count">' + occs.length + " occurrences shown</p>";
      return html;
    }

    function selectTerm(term) {
      grid.querySelectorAll(".term-btn").forEach(function (b) {
        b.classList.toggle("is-active", b.dataset.term === term);
      });
      var item = items.filter(function (it) { return it.term === term; })[0];
      if (!item) return;
      context.innerHTML =
        "<h4>\u201C" + escapeHtml(item.term) + "\u201D</h4>" +
        '<div class="context-grid">' +
        '<div class="context-col"><h5>' + escapeHtml(data.meta.known_label) + "</h5>" +
        occurrencesHtml(item.known, item.term) + "</div>" +
        '<div class="context-col"><h5>' + escapeHtml(data.meta.questioned_label) + "</h5>" +
        occurrencesHtml(item.questioned, item.term) + "</div>" +
        "</div>";
    }

    if (items.length) selectTerm(items[0].term); // preselect the top-scoring term
  }

  // ---- impostors null-calibration strip plot -----------------------------

  function renderCalibration(data) {
    var caption = document.getElementById("calibration-caption");
    caption.textContent =
      'Background rate: how often "' + data.known_label + '" is the nearest match among ' +
      data.background.length + " other, presumably unrelated documents (grey), compared with its score " +
      'against "' + data.questioned_label + '" (highlighted). The questioned manuscript sits at the ' +
      data.percentile + "th percentile of that background distribution.";

    var w = 640, h = 130, pad = 40;
    function scaleX(v) { return pad + v * (w - 2 * pad); }

    var dots = data.background.map(function (b, i) {
      var jitter = ((i % 5) - 2) * 9;
      var cy = h / 2 + jitter;
      return (
        '<circle class="calibration-dot" cx="' + scaleX(b.score).toFixed(1) + '" cy="' + cy + '" r="4">' +
        "<title>" + escapeHtml(b.document) + ": " + b.score.toFixed(3) + "</title>" +
        "</circle>"
      );
    }).join("");

    var markerX = scaleX(data.questioned_score).toFixed(1);
    var ticks = [0, 0.25, 0.5, 0.75, 1].map(function (t) {
      return (
        '<line class="calibration-axis" x1="' + scaleX(t) + '" x2="' + scaleX(t) + '" y1="' + (h - 24) + '" y2="' + (h - 18) + '"></line>' +
        '<text class="calibration-label" x="' + scaleX(t) + '" y="' + (h - 4) + '" text-anchor="middle">' + t + "</text>"
      );
    }).join("");

    document.getElementById("calibration-chart").innerHTML =
      '<svg viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Strip plot of impostor-method background scores, with the questioned manuscript score highlighted">' +
      '<line class="calibration-axis" x1="' + pad + '" x2="' + (w - pad) + '" y1="' + (h - 24) + '" y2="' + (h - 24) + '"></line>' +
      ticks + dots +
      '<line class="calibration-axis" x1="' + markerX + '" x2="' + markerX + '" y1="14" y2="' + (h - 24) + '" stroke-dasharray="3,3"></line>' +
      '<circle class="calibration-marker" cx="' + markerX + '" cy="' + (h / 2) + '" r="6">' +
      "<title>" + escapeHtml(data.questioned_label) + ": " + data.questioned_score.toFixed(3) + "</title>" +
      "</circle>" +
      '<text class="calibration-marker-label" x="' + markerX + '" y="12" text-anchor="middle">questioned ms.</text>' +
      "</svg>";
  }

  // ---- contrastive-embedding scatter plot ---------------------------------

  var embeddingData = null;

  function renderEmbeddings(data) {
    embeddingData = data;
    var plot = document.getElementById("embedding-plot");
    var w = 560, h = 480, pad = 24;
    var xs = data.points.map(function (p) { return p.x; });
    var ys = data.points.map(function (p) { return p.y; });
    var xMin = Math.min.apply(null, xs), xMax = Math.max.apply(null, xs);
    var yMin = Math.min.apply(null, ys), yMax = Math.max.apply(null, ys);

    function sx(x) { return pad + (x - xMin) / ((xMax - xMin) || 1) * (w - 2 * pad); }
    function sy(y) { return h - pad - (y - yMin) / ((yMax - yMin) || 1) * (h - 2 * pad); }

    var circles = data.points.map(function (p) {
      return (
        '<circle class="embed-point doc-' + p.doc + '" data-id="' + escapeHtml(p.id) + '" ' +
        'cx="' + sx(p.x).toFixed(1) + '" cy="' + sy(p.y).toFixed(1) + '" r="4.5"></circle>'
      );
    }).join("");

    plot.innerHTML =
      '<div class="embed-legend">' +
      '<span class="doc-known"><i></i>' + escapeHtml(data.known_label) + "</span>" +
      '<span class="doc-questioned"><i></i>' + escapeHtml(data.questioned_label) + "</span>" +
      "</div>" +
      '<svg viewBox="0 0 ' + w + " " + h + '" role="img" aria-label="Scatter plot of line-level style embeddings reduced to two dimensions">' +
      circles +
      '<text class="embed-axis-label" x="' + (w / 2) + '" y="' + (h - 4) + '" text-anchor="middle">Dimension 1</text>' +
      '<text class="embed-axis-label" x="12" y="' + (h / 2) + '" text-anchor="middle" transform="rotate(-90 12 ' + (h / 2) + ')">Dimension 2</text>' +
      "</svg>";

    plot.querySelector("svg").addEventListener("click", function (e) {
      var c = e.target.closest("circle[data-id]");
      if (!c) return;
      selectEmbeddingPoint(c.dataset.id);
    });
  }

  function selectEmbeddingPoint(id) {
    var container = document.getElementById("embedding-plot");
    container.querySelectorAll(".embed-point").forEach(function (c) {
      c.classList.toggle("is-selected", c.dataset.id === id);
    });
    var point = embeddingData.points.filter(function (p) { return p.id === id; })[0];
    if (!point) return;
    var label = point.doc === "known" ? embeddingData.known_label : embeddingData.questioned_label;
    var start = point.line_no - point.match_index;
    var lis = point.lines.map(function (line, idx) {
      var isMatch = idx === point.match_index;
      return '<li class="' + (isMatch ? "match-line" : "") + '">' + escapeHtml(line) + "</li>";
    }).join("");
    document.getElementById("embedding-context").innerHTML =
      "<h4>" + escapeHtml(label) + ", line " + point.line_no + "</h4>" +
      '<ol class="context-lines single" start="' + start + '">' + lis + "</ol>";
  }

  // ---- boot ---------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", function () {
    initTabs();

    Promise.all([
      fetchJSON("data/ngrams.json"),
      fetchJSON("data/rhymes.json"),
      fetchJSON("data/null_calibration.json"),
      fetchJSON("data/embeddings.json")
    ]).then(function (results) {
      var ngrams = results[0], rhymes = results[1], calibration = results[2], embeddings = results[3];

      renderCompareTab(ngrams, "ngrams-grid", "ngrams-context");
      renderCompareTab(rhymes, "rhymes-grid", "rhymes-context");
      renderCalibration(calibration);
      renderEmbeddings(embeddings);

      initBanner(results.some(isSampleDataset));
    }).catch(function (err) {
      console.error(err);
      document.querySelectorAll(".tab-panel").forEach(function (p) {
        p.insertAdjacentHTML(
          "afterbegin",
          '<p class="context-placeholder">Could not load data: ' + escapeHtml(err.message) +
          ". If you're opening this file directly (file://), browsers block fetch() on local files -- " +
          "run a local server instead, e.g. <code>python3 -m http.server</code> in this folder, then open " +
          "http://localhost:8000/.</p>"
        );
      });
      initBanner(false);
    });
  });
})();
