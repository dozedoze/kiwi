"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 导入翻译文件
 */
require('ts-node').register({
    compilerOptions: {
        module: 'commonjs'
    }
});
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const prettier = require("prettier");
const d3_dsv_1 = require("d3-dsv");
const utils_1 = require("./utils");
const tools_1 = require("./tools");
const CONFIG = utils_1.getProjectConfig();
function getMessagesToImport(file) {
    const content = fs.readFileSync(file).toString();
    const messages = d3_dsv_1.tsvParseRows(content, ([key, value]) => {
        try {
            // value 的形式和 JSON 中的字符串值一致，其中的特殊字符是以转义形式存在的，
            // 如换行符 \n，在 value 中占两个字符，需要转成真正的换行符。
            // 把文案中自带的"转换成\", 防止JSON解析报错
            value = JSON.parse(`"${value.replace(/"/g, '\\"')}"`);
        }
        catch (e) {
            console.log(content, 'content');
            throw new Error(`Illegal message: ${value}`);
        }
        return [key, value];
    });
    const rst = {};
    const duplicateKeys = new Set();
    messages.forEach(([key, value]) => {
        if (rst.hasOwnProperty(key)) {
            duplicateKeys.add(key);
        }
        rst[key] = value;
    });
    if (duplicateKeys.size > 0) {
        const errorMessage = 'Duplicate messages detected: \n' + [...duplicateKeys].join('\n');
        console.error(errorMessage);
        process.exit(1);
    }
    return rst;
}
function writeMessagesToFile(messages, file, lang) {
    const kiwiDir = CONFIG.kiwiDir;
    const fileType = CONFIG.fileType;
    const srcMessages = tools_1.requireModule(path.resolve(kiwiDir, CONFIG.srcLang, `${file}.${fileType}`));
    const dstFile = path.resolve(kiwiDir, lang, file);
    const oldDstMessages = tools_1.requireModule(`${dstFile}.${fileType}`);
    const rst = {};
    utils_1.traverse(srcMessages, (message, key) => {
        _.setWith(rst, key, _.get(messages, key) || _.get(oldDstMessages, key), Object);
    });
    console.log(rst);
    const prettierRst = prettier.format('export default ' + JSON.stringify(rst, null, 2), {
        parser: 'typescript',
        trailingComma: 'all',
        singleQuote: true
    });
    fs.writeFileSync(dstFile + `.${CONFIG.fileType}`, prettierRst);
}
function importMessages(file, lang) {
    let messagesToImport = getMessagesToImport(file);
    const allMessages = utils_1.getAllMessages(CONFIG.srcLang);
    messagesToImport = _.pickBy(messagesToImport, (message, key) => allMessages.hasOwnProperty(key));
    const keysByFiles = _.groupBy(Object.keys(messagesToImport), key => key.split('.')[0]);
    console.log(keysByFiles, 'kebyfiels');
    const messagesByFiles = _.mapValues(keysByFiles, (keys, file) => {
        const rst = {};
        _.forEach(keys, key => {
            _.setWith(rst, key.substr(file.length + 1), messagesToImport[key], Object);
        });
        return rst;
    });
    _.forEach(messagesByFiles, (messages, file) => {
        writeMessagesToFile(messages, file, lang);
    });
}
exports.importMessages = importMessages;
//# sourceMappingURL=import.js.map