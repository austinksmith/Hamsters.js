import fs from 'fs-extra';

function clearBuildDirectory() {
  return new Promise((resolve, reject) => {
    fs.emptyDir('../build', (err) => {
      if (err) {
        console.error(err);
        reject();
      } else {
        resolve();
      }
    });
  });
}

clearBuildDirectory();
