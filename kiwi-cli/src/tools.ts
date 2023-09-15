import * as prettier from 'prettier';
import * as path from 'path';

import { traverse, getProjectConfig } from './utils';
import { readFile } from './extract/file';

export function requireBatchModule(targetPath: string, basePath: string) {
  const fileType = getProjectConfig().fileType;

  if (fileType === 'js') {
    try {
      const getFile = readFile(targetPath);
      const getExportContent = getFile.split('export default')[1];
      const tirmStr = getExportContent
        .replace(/Object.assign\(\{\}, /, '')
        .replace(/\);/, '')
        .trim();
      const ss = tirmStr.replace(/\w+,/g, $1 => {
        const slice$1 = $1.slice(0, -1);
        return `${slice$1}: '${slice$1}',`;
      });
      const stringContent = prettier.format(ss, { parser: 'json-stringify' });
      const paths = JSON.parse(stringContent);
      const BigObj = {};

      Object.keys(paths).forEach(item => {
        const childDirPath = path.resolve(basePath, `${item}.${fileType}`);
        const content = requireModule(childDirPath);
        BigObj[item] = content;
      });
      return BigObj;
    } catch (error) {
      console.log('---------------------------start------------------------------------');
      console.log('---------error---------');
      console.log(error);
      console.log('----------zh-ms-----------');
      console.log(`requireBatchModule    ${targetPath} 无效`);
      console.log('-----------------------');
      console.log('----------------------------end------------------------------------');
      return {};
    }
  } else {
    return require(targetPath).default;
  }
}

export function requireModule(targetPath: string) {
  const fileType = getProjectConfig().fileType;
  if (fileType === 'js') {
    try {
      const getFile = readFile(targetPath);
      if (!getFile) {
        return {};
      }
      const tirmStr = getFile
        .replace(/export default /, '')
        .replace(/;/, '')
        .trim();
      const stringContent = prettier.format(tirmStr, { parser: 'json-stringify' });
      return JSON.parse(stringContent);
    } catch (error) {
      console.log('---------------------------start------------------------------------');
      console.log('---------error---------');
      console.log(error);
      console.log('----------zh-ms-----------');
      console.log(`requireModule      ${targetPath} 无效`);
      console.log('-----------------------');
      console.log('----------------------------end------------------------------------');
      return {};
    }
  } else {
    return require(targetPath).default;
  }
}
