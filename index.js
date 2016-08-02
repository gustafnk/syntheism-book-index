const fs = require('fs');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');
const handlebars = require('handlebars');
const getSlug = require('speakingurl');

mkdirp.sync('public'); // Create output directory

const book = fs.readFileSync('book.html', 'utf8');

const glossary = JSON.parse(fs.readFileSync('glossary.json', 'utf8'));

const index = {};
glossary.forEach(item => { index[item] = {
  anchor: getSlug(item),
  paragraphs: []
}});

$ = cheerio.load(book);

const chapters = $('.book').splice(2,14);

var chapterTemplate = handlebars.compile(fs.readFileSync('chapter-template.hbs', 'utf8'));
var paragraphTemplate = handlebars.compile(fs.readFileSync('paragraph-template.hbs', 'utf8'));

chapters.forEach((chapter, chapterIndex) => {
  const chapterNumber = chapterIndex + 1;

  const paragraphs = $(chapter).find('.noindent').toArray();

  mkdirp.sync(`public/${chapterNumber}`);

  const paragraphNumbers = paragraphs.map((paragraph, paragraphIndex) => {
    const paragraphNumber = paragraphIndex + 1;
    const paragraphText = $(paragraph).html();

    const path = `${chapterNumber}/${paragraphNumber}.html`;

    Object.keys(index).forEach(key => {
      if (paragraphText.match(new RegExp(key, 'i'))) {
        index[key].paragraphs.push(path);
      }
    });

    const paragraphViewModel = {
      paragraphText,
      chapterNumber,
      paragraphNumber,
    }

    fs.writeFileSync(`public/${path}`, paragraphTemplate(paragraphViewModel));

    return paragraphNumber;
  });

  const chapterViewModel = {
    chapterNumber,
    paragraphNumbers,
  }

  fs.writeFileSync(`public/${chapterNumber}/index.html`, chapterTemplate(chapterViewModel));

});

const templateSource = fs.readFileSync('template.hbs', 'utf8');
var template = handlebars.compile(templateSource);

var result = template({index: index});

fs.writeFileSync('public/index.html', result);
