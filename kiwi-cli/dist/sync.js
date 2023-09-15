"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @author linhuiw
 * @desc 翻译文件
 */
// require('ts-node').register({
//   compilerOptions: {
//     module: 'commonjs',
//     allowjs: true,
//   }
// });
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const utils_1 = require("./utils");
const tools_1 = require("./tools");
const CONFIG = utils_1.getProjectConfig();
/**
 * 获取中文文案文件的翻译，优先使用已有翻译，若找不到则使用 google 翻译
 * */
function getTranslations(file, toLang) {
    return __awaiter(this, void 0, void 0, function* () {
        const translations = {};
        const fileNameWithoutExt = path.basename(file).split('.')[0];
        const srcLangDir = utils_1.getLangDir(CONFIG.srcLang);
        const distLangDir = utils_1.getLangDir(toLang);
        const srcFile = path.resolve(srcLangDir, file);
        const distFile = path.resolve(distLangDir, file);
        const texts = tools_1.requireModule(srcFile);
        let distTexts;
        if (fs.existsSync(distFile)) {
            distTexts = tools_1.requireModule(distFile);
        }
        utils_1.traverse(texts, (text, path) => {
            const key = fileNameWithoutExt + '.' + path;
            const distText = _.get(distTexts, path);
            translations[key] = distText || text;
        });
        return translations;
    });
}
/**
 * 将翻译写入文件
 * */
function writeTranslations(file, toLang, translations) {
    const fileNameWithoutExt = path.basename(file).split('.')[0];
    const srcLangDir = utils_1.getLangDir(CONFIG.srcLang);
    const srcFile = path.resolve(srcLangDir, file);
    const texts = tools_1.requireModule(srcFile);
    const rst = {};
    utils_1.traverse(texts, (text, path) => {
        const key = fileNameWithoutExt + '.' + path;
        // 使用 setWith 而不是 set，保证 numeric key 创建的不是数组，而是对象
        // https://github.com/lodash/lodash/issues/1316#issuecomment-120753100
        _.setWith(rst, path, translations[key], Object);
    });
    const fileContent = 'export default ' + JSON.stringify(rst, null, 2);
    const filePath = path.resolve(utils_1.getLangDir(toLang), path.basename(file));
    return new Promise((resolve, reject) => {
        fs.writeFile(filePath, fileContent, err => {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
}
/**
 * 翻译对应的文件
 * @param file
 * @param toLang
 */
function translateFile(file, toLang) {
    const translations = getTranslations(file, toLang);
    const toLangDir = path.resolve(__dirname, `../${toLang}`);
    if (!fs.existsSync(toLangDir)) {
        fs.mkdirSync(toLangDir);
    }
    writeTranslations(file, toLang, translations);
}
/**
 * 翻译所有文件
 */
function sync(callback) {
    const srcLangDir = utils_1.getLangDir(CONFIG.srcLang);
    const fileType = CONFIG.fileType;
    fs.readdir(srcLangDir, (err, files) => {
        if (err) {
            console.error(err);
        }
        else {
            files = files
                .filter(file => file.endsWith(`.${fileType}`) && file !== `index.${fileType}` && file !== `mock.${fileType}`)
                .map(file => file);
            const translateFiles = toLang => Promise.all(files.map(file => {
                translateFile(file, toLang);
            }));
            Promise.all(CONFIG.distLangs.map(translateFiles)).then(() => {
                const langDirs = CONFIG.distLangs.map(utils_1.getLangDir);
                langDirs.map(dir => {
                    const filePath = path.resolve(dir, `index.${fileType}`);
                    if (!fs.existsSync(dir)) {
                        fs.mkdirSync(dir);
                    }
                    fs.copyFileSync(path.resolve(srcLangDir, `index.${fileType}`), filePath);
                });
                callback && callback();
            }, e => {
                console.error(e);
                process.exit(1);
            });
        }
    });
}
exports.sync = sync;
//# sourceMappingURL=sync.js.map