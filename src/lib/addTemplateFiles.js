import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { glob } from 'glob';
import { existsSync } from 'fs';
import config from '../config.js';
import { format as prettierFormat } from 'prettier';
import { isType } from '../utils.js';

// 获取当前路径
const pwd = process.cwd();
export default async function addTemplateFiles(incs = [], excs = []) {
  // 根据参数匹配文件
  const matchFiles = await glob(incs.length ? incs : '**', {
    cwd: pwd,
    nodir: true,
    dot: true,
    ignore: excs.length
      ? [...excs, ...config.defaultIgnorePath]
      : [...config.defaultIgnorePath],
  });
  // 配置文件
  const cm = await templateConfig();
  // 获取需要替换的文件列表
  const renderFiles = await getRenderFiles(
    matchFiles,
    cm.get('encoding'),
    cm.get('regExp')
  );
  // 写入配置文件
  if (renderFiles.length) {
    await cm.set('files', renderFiles);
  }
}

/**
 * 管理模版配置
 */
async function templateConfig() {
  const filepath = resolve(pwd, 'template.config.mjs');
  const tmpConfig = existsSync(filepath)
    ? (await import(filepath)).default
    : {};
  return {
    get(key) {
      const result = {
        prompts: tmpConfig.prompts || [],
        encoding: tmpConfig.encoding || 'utf8',
        files: tmpConfig.files || [],
        exts: tmpConfig.exts || [],
        regExp: tmpConfig.regExp || config.templateRegExp,
      };
      return typeof key === 'string' ? result[key] : result;
    },
    async set(k, v) {
      tmpConfig[k] = v;
      const configString = stringifyWithFunctions(tmpConfig);
      return writeFile(
        filepath,
        prettierFormat(`export default ${configString}`, {
          parser: 'babel',
        }),
        tmpConfig.encoding || 'utf8'
      );
    },
  };
}

/**
 * 转换对象成字符串
 * @param {unknown} obj
 * @returns
 */
function stringifyWithFunctions(obj) {
  if (Array.isArray(obj)) {
    return `[${obj.map(item => stringifyWithFunctions(item)).join(', ')}]`;
  } else if (isType(obj, 'object')) {
    return `{${Object.entries(obj)
      .map(([key, value]) => `${key}: ${stringifyWithFunctions(value)}`)
      .join(', ')}}`;
  } else if (isType(obj, 'function')) {
    return obj.toString();
  } else if (isType(obj, 'string')) {
    return JSON.stringify(obj);
  } else {
    return obj;
  }
}

/**
 * 获取渲染文件
 * @param {*} target 目录
 * @returns
 */
async function getRenderFiles(files = [], encoding = 'utf8', regExp) {
  const lists = [];
  for (const f of files) {
    const content = await readFile(f, encoding);
    if (regExp.test(content)) {
      lists.push(f);
      regExp.lastIndex = 0; // 重置游标
    }
  }
  return lists;
}
