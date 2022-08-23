const Downloader = require('nodejs-file-downloader');

const DIRECTORY = {
  javascript: './src/codes',
  java: './src/classes',
  python: './src/codes',
}

const FILETYPE = {
  javascript: '.js',
  java: '.class',
  python: 'py',
}

async function downloadCode(methodsLinks, language) {
  console.log(methodsLinks);

  let directory = DIRECTORY[language];

  for (let i = 0; i < methodsLinks.length; i += 1) {
    const fileName = `${methodsLinks[i].name}${FILETYPE[language]}`;
    const url = methodsLinks[i].link;

    const downloader = new Downloader({
      url,
      directory,
      fileName,
    });
    try {
      // eslint-disable-next-line no-await-in-loop
      await downloader.download();
      console.log('Download Finished');
    } catch (error) {
      console.log(error);
      return false;
    }
  }
  return true;
}

module.exports = {
  downloadCode,
};
