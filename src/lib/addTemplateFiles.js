import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { glob } from 'glob';
import { existsSync } from 'fs';
import config from '../config.js';
import { format as prettierFormat } from 'prettier';

// 获取当前路径
const pwd = process.cwd();
export default async function addTemplateFiles(incs = [], excs = []) {
  // 根据参数匹配文件
  const matchFiles = await glob(incs.length ? incs : '**', {
    cwd: pwd,
    nodir: true,
    ignore: excs.length
      ? [...excs, ...config.defaultIgnorePath]
      : [...config.defaultIgnorePath],
  });
  // 配置文件
  const cm = await templateConfig();
  // 获取需要替换的文件列表
  const renderFiles = await getRenderFiles(matchFiles, cm.encoding);
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
  const config = existsSync(filepath) ? (await import(filepath)).default : {};
  return {
    get() {
      return {
        prompts: config.prompts || [],
        encoding: config.encoding || 'utf8',
        files: config.files || [],
        exts: config.exts || [],
      };
    },
    set(k, v) {
      config[k] = v;
      // prettier格式化
      return writeFile(
        filepath,
        prettierFormat(`export default ${JSON.stringify(config)}`),
        config.encoding || 'utf8'
      );
    },
  };
}

/**
 * 获取渲染文件
 * @param {*} target 目录
 * @returns
 */
async function getRenderFiles(files = [], encoding = 'utf8') {
  const lists = [];
  for (const f of files) {
    const content = await readFile(f, encoding);
    const reg = config.templateRegExp;
    if (reg.test(content)) {
      lists.push(f);
      reg.lastIndex = 0; // 重置游标
    }
  }
  return lists;
}
