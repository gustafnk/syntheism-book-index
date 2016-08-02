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

var paragraphTemplate = handlebars.compile(fs.readFileSync('paragraph-template.hbs', 'utf8'));

chapters.forEach((chapter, chapterIndex) => {
  const chapterNumber = chapterIndex + 1;

  const paragraphs = $(chapter).find('.noindent').toArray();

  mkdirp.sync(`public/${chapterNumber}`);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const paragraphNumber = paragraphIndex + 1;
    const paragraphText = $(paragraph).html();

    const path = `${chapterNumber}/${paragraphNumber}.html`;

    Object.keys(index).forEach(key => {
      if (paragraphText.match(new RegExp(key, 'i'))) {
        index[key].push(path);
      }
    });

    const paragraphViewModel = {
      paragraphText,
      chapterNumber,
      paragraphNumber,
    }

    fs.writeFileSync(`public/${path}`, paragraphTemplate(paragraphViewModel));
  });
});

const templateSource = fs.readFileSync('template.hbs', 'utf8');
var template = handlebars.compile(templateSource);

var result = template({index: index});

fs.writeFileSync('public/index.html', result);
