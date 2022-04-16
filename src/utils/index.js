const Downloader = require('nodejs-file-downloader');

async function downloadCode(methodsLinks) {
  console.log(methodsLinks);
  for (let i = 0; i < methodsLinks.length; i += 1) {
    const fileName = `${methodsLinks[i].name}.js`;
    const linkMethod = methodsLinks[i].link;

    const downloader = new Downloader({
      url: linkMethod,
      directory: './src/codes',
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
