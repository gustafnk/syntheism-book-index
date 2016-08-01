const fs = require('fs');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');
const handlebars = require('handlebars');

mkdirp.sync('public'); // Create output directory

const book = fs.readFileSync('book.html', 'utf8');

const glossary = JSON.parse(fs.readFileSync('glossary.json', 'utf8'));

const index = {};
glossary.forEach(item => { index[item] = [] })

$ = cheerio.load(book);

const chapters = $('.book').splice(2,14);

chapters.forEach((chapter, chapterIndex) => {
  const paragraphs = $(chapter).find('.noindent').toArray();

  const chapterNumber = chapterIndex + 1;
  mkdirp.sync(`public/${chapterNumber}`);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const html = $(paragraph).html();

    const path = `${chapterNumber}/${paragraphIndex}.html`;

    Object.keys(index).forEach(key => {
      if (html.match(new RegExp(key, 'i'))) {
        index[key].push(path);
      }
    });

    fs.writeFileSync(`public/${path}`, html);
  });
});

const templateSource = fs.readFileSync('template.hbs', 'utf8');
var template = handlebars.compile(templateSource);

var result = template({index: index});

fs.writeFileSync('public/index.html', result);
