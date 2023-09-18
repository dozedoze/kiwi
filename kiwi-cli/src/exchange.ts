import * as path from 'path';
import { importMessages } from './import';
import { getLangDir, getProjectConfig } from './utils';

const exchange = () => {
  const { distLangs } = getProjectConfig();
  for (let i = 0; i < distLangs.length; i++) {
    const dstLang = distLangs[i];
    const filePath = path.resolve(getLangDir(dstLang), `${dstLang}_translate.tsv`);
    importMessages(filePath, dstLang);
  }
};

export { exchange };
