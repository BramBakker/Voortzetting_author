# Hennen van Merchtenen and the voortzetting

A static site presenting three independent lines of computational evidence
for shared authorship between Hennen van Merchtenen's known work and the
disputed continuation of the Brabantsche Yeesten (ch. 6-7).

## Viewing it locally

Browsers block `fetch()` on files opened directly (`file://`), and this
site loads its data as JSON, so start a local server from this folder
rather than double-clicking `index.html`:

```
python3 -m http.server 8000
```

then open `http://localhost:8000/`. Any static server works the same way
(the VS Code "Live Server" extension, `npx serve`, etc.).

## Structure

```
index.html        the page itself (three tabs: n-grams, rhymes, embeddings)
style.css         all styling, including the blurred manuscript backdrop
script.js         tab switching + rendering for all three tabs
data/*.json       the actual results the page displays (currently SAMPLE DATA)
assets/           the manuscript photo used as the header backdrop
```

## Replacing the sample data

Everything under `data/` is currently placeholder content so the page has
something real to click through -- it is clearly marked `SAMPLE DATA` in
both a visible banner and each JSON file's own `note` field. To plug in
real results:

1. Run your analysis pipeline (in order, from the folder containing your
   corpus):
   - `extract_xml_to_csv.py` -- once, to turn the TEI XML into CSVs with
     author metadata.
   - `impostors_verification.py` -- General Impostors verification with
     leave-one-out validation.
   - `contrastive_line_embeddings.py` -- trains the contrastive line
     encoder and saves `line_embeddings.npy` (needed for the embeddings
     tab; skip this if you only want the first two tabs working).
2. Run `export_for_website.py` (edit `KNOWN_MATCH`, `QUESTIONED_MATCH`,
   `KNOWN_LABEL`, `QUESTIONED_LABEL`, and `OUTPUT_DIR` at the top first).
   It reads the pipeline's output and writes fresh `ngrams.json`,
   `rhymes.json`, `null_calibration.json`, and `embeddings.json`.
3. Copy those four files into this site's `data/` folder, overwriting the
   sample ones (or point `OUTPUT_DIR` at this folder directly). Reload the
   page -- the sample-data banner disappears on its own once none of the
   loaded files carry a `SAMPLE DATA` note.

The exact JSON schema each file expects is documented in the comment block
at the top of `script.js`.

## Editing the page itself

- Title, subtitle, byline, abstract, and the "How it was made" paragraph
  are plain text in `index.html` -- edit directly.
- The one accent color lives in `style.css` as `--accent`; a second accent
  (`--accent2`, used to tell the two documents apart in the embedding plot)
  sits right next to it.
- To use a different manuscript photo for the header backdrop, replace
  `assets/manuscript-bg.jpg` and keep the filename, or update the path in
  the `.hero::before` rule in `style.css`.

## License

Text, images, and data: CC BY 4.0. Reuse freely with credit.
Source template: https://github.com/christiancasey/measuring-manuscripts-project-template
