# Syntheist Book Indexed

## Preparation

- Download http://syntheism.org/wp-content/syntheism_book/Syntheism.html and save it as `book.html`
- Now, need to make some minor changes in order to parse the book more easily
- Create a temporary branch and copy the book file: `git checkout -b tmp; cp book.html tmp.html; git add -A; git commit -m "Tmp"`
- Apply the patch: `git apply 0001-Book-fixes.patch`
- Inspect the necessary changes with `git diff --color-words=.`
- Run `cp tmp.html book.html` to copy back the changes to `book.html`
- Go back to master: `git checkout .; git checkout master`

## Building the book

`npm start`

The book files are now created in `public/`. Open `public/index.html` in a web browser to browse the book.
