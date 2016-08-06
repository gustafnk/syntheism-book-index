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

const index = {};
glossary.forEach(item => { index[item] = {
  anchor: getSlug(item),
  paragraphs: []
}});

const esc = '___'; // We escape matches, to only match and replace once

const $ = cheerio.load(book);

const chapters = $('.book').splice(2,14);

var chapterTemplate = handlebars.compile(fs.readFileSync('chapter-template.hbs', 'utf8'));
var paragraphTemplate = handlebars.compile(fs.readFileSync('paragraph-template.hbs', 'utf8'));

chapters.forEach((chapter, chapterIndex) => {
  const chapterNumber = chapterIndex + 1;

  const paragraphs = $(chapter).find('.noindent').toArray();

  mkdirp.sync(`public/${chapterNumber}`);

  const paragraphResults = paragraphs.map((paragraph, paragraphIndex) => {
    const paragraphNumber = paragraphIndex + 1;
    let paragraphText = $(paragraph).html();

    const path = `${chapterNumber}/${paragraphNumber}`;

    _.sortBy(Object.keys(index), item => -item.length).forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'ig');
      if (paragraphText.match(regex)) {
        index[key].paragraphs.push(path);
      }

      paragraphText = paragraphText.replace(regex,
        `<a href="../index.html#${esc}${index[key].anchor}${esc}">${esc}$&${esc}</a>`);
    });

    paragraphText = paragraphText.replace(new RegExp(esc, 'g'), '');

    const paragraphViewModel = {
      paragraphText,
      chapterNumber,
      paragraphNumber,
    }

    fs.writeFileSync(`public/${path}.html`, paragraphTemplate(paragraphViewModel));

    return { paragraphNumber, paragraphText };
  });

  const chapterViewModel = {
    chapterNumber,
    paragraphs: paragraphResults,
  }

  fs.writeFileSync(`public/${chapterNumber}/index.html`, chapterTemplate(chapterViewModel));

});

const templateSource = fs.readFileSync('template.hbs', 'utf8');
var template = handlebars.compile(templateSource);

var result = template({index: index});

fs.writeFileSync('public/index.html', result);
