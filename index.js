const fs = require('fs');
const cheerio = require('cheerio');
const mkdirp = require('mkdirp');

mkdirp.sync('public'); // Create output directory

const book = fs.readFileSync('book.html', 'utf8');
$ = cheerio.load(book);

const chapters = $('.book').splice(2,14);

chapters.forEach((chapter, chapterIndex) => {
  const paragraphs = $(chapter).find('.noindent').toArray();

  const chapterNumber = chapterIndex + 1;
  mkdirp.sync(`public/${chapterNumber}`);

  paragraphs.forEach((paragraph, paragraphIndex) => {
    const html = $(paragraph).html();

    fs.writeFileSync(`public/${chapterNumber}/${paragraphIndex}.html`, html);

    
  });
});

// console.log(chapters)