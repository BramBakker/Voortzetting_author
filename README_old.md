# Project Template (GitHub Pages)

A tiny static website for a course project. No build step, no server, nothing to
keep paying for. It is just a few files that GitHub Pages serves as a web page,
which is why it will still work years from now.

## What's here

- `index.html` - the page itself. Edit the text here.
- `style.css` - the look. Change one color near the top to re-skin it.
- `figure.png` - your main figure. Replace this file with your own.
- `data.csv` - your data, in an open and machine-readable format.
- `LICENSE` - the terms others may reuse your work under (CC BY 4.0).
- `.nojekyll` - tells GitHub to serve the files exactly as they are.

## Put it online with GitHub Pages

1. Make a free account at github.com.
2. Make a new **public** repository. Any name works. For a personal site the
   simplest name is `YOUR-USERNAME.github.io`.
3. Add these files to it. The no-terminal way: on the repository page choose
   **Add file -> Upload files**, drag everything in, and **Commit**. The git way:
   `git clone` the repository, copy the files in, then `git add .`,
   `git commit -m "first version"`, `git push`.
4. In the repository open **Settings -> Pages**. Under **Build and deployment**
   set **Source** to **Deploy from a branch**, choose the **main** branch and the
   **/ (root)** folder, and click **Save**.
5. Wait a minute, then visit `https://YOUR-USERNAME.github.io/REPO-NAME/`.

Every time you push a change, the live site updates on its own.

## Make it yours

- Edit the title, your name, the abstract, and the table in `index.html`.
- Drop in your own `figure.png` and `data.csv`.
- Rewrite this README to say what your project is and how to rebuild it.
- Change the accent color at the top of `style.css`.

## Going further

This page is fully static: the data are typed straight into the HTML. The next
step, if you want a table that updates whenever you edit a data file, is to load
`data.csv` or a `data.json` with a few lines of JavaScript. That keeps the data
separate from the page and still needs no server.

## License

Text, images, and data: CC BY 4.0 (reuse with credit). See `LICENSE`.
