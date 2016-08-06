'use strict';

const fs = require('fs');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');
const handlebars = require('handlebars');
const getSlug = require('speakingurl');
const _ = require('lodash');

mkdirp.sync('public'); // Create output directory

const book = fs.readFileSync('book.html', 'utf8');

const glossary = JSON.parse(fs.readFileSync('glossary.json', 'utf8'));
const chapterNames = JSON.parse(fs.readFileSync('chapter-names.json', 'utf8'));

const index = {};
glossary.forEach(item => {
  const regex = new RegExp(`\\b${item.regex || item.key}\\b`, 'ig');

  index[item.key] = {
    anchor: getSlug(item.key),
    title: item.key, // TODO
    regex,
    paragraphs: []
  }
});

const paragraphCache = {};

const esc = '___'; // We escape matches, to only match and replace once

const $ = cheerio.load(book);

const chapters = $('.book').splice(2,14);

var chapterTemplate = handlebars.compile(fs.readFileSync('chapter-template.hbs', 'utf8'));
var paragraphTemplate = handlebars.compile(fs.readFileSync('paragraph-template.hbs', 'utf8'));

chapters.forEach((chapter, chapterIndex) => {
  const chapterNumber = chapterIndex + 1;
  const chapterName = chapterNames[chapterNumber];

  const paragraphs = $(chapter).find('.noindent').toArray();

  mkdirp.sync(`public/${chapterNumber}`);

  const paragraphResults = paragraphs.map((paragraph, paragraphIndex) => {
    const paragraphNumber = paragraphIndex + 1;
    let paragraphText = $(paragraph).html();

    const path = `${chapterNumber}/${paragraphNumber}`;

    _.sortBy(Object.keys(index), item => -item.length).forEach(key => {
      if (paragraphText.match(index[key].regex)) {
        index[key].paragraphs.push(path);
      }

      paragraphText = paragraphText.replace(index[key].regex,
        `<a href="../index.html#${esc}${index[key].anchor}${esc}">${esc}$&${esc}</a>`);
    });

    paragraphText = paragraphText.replace(new RegExp(esc, 'g'), '');
    paragraphCache[path] = paragraphText;

    const paragraphViewModel = {
      paragraphText,
      chapterNumber,
      paragraphNumber,
      chapterName,
    }

    fs.writeFileSync(`public/${path}.html`, paragraphTemplate(paragraphViewModel));

    return { paragraphNumber, paragraphText };
  });

  const chapterViewModel = {
    chapterNumber,
    chapterName,
    paragraphs: paragraphResults,
  }

  fs.writeFileSync(`public/${chapterNumber}/index.html`, chapterTemplate(chapterViewModel));
});

// Create key pages
mkdirp.sync('public/keys');
Object.keys(index).forEach(key => {

  const paragraphs = index[key].paragraphs;
  const paragraphsWithContent = paragraphs.map(paragraph => {

    const content = paragraphCache[paragraph];
    const paragraphTokens = paragraph.split('/');
    return {
      chapter: paragraphTokens[0],
      chapterName: chapterNames[paragraphTokens[0]],
      paragraph: paragraphTokens[1],
      content
    };
  });

  index[key].paragraphsWithContent = paragraphsWithContent;

  const templateSource = fs.readFileSync('key-template.hbs', 'utf8');
  const template = handlebars.compile(templateSource);

  const result = template({key: index[key]});
  fs.writeFileSync(`public/keys/${index[key].anchor}.html`, result)
});

// Create index.html
const templateSource = fs.readFileSync('template.hbs', 'utf8');
const template = handlebars.compile(templateSource);

const result = template({index: index});
fs.writeFileSync('public/index.html', result);
