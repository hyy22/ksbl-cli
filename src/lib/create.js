import chalk from 'chalk';
import { resolve, extname } from 'path';
import ora from 'ora';
import inquirer from 'inquirer';
import { existsSync } from 'fs';
import {
  mkdir,
  readdir,
  readFile,
  writeFile,
  stat,
  copyFile,
} from 'fs/promises';
import { shell, configManage } from '../utils.js';
import config from '../config.js';

const cm = configManage();
export default async function exec(name, setting) {
  // 检测是否存在相关模版
  const templateName = setting.template;
  const templateDownloadUrl = cm.get(templateName);
  if (!templateDownloadUrl) {
    console.log(chalk.red(`template ${templateName} is not found`));
    return;
  }
  // 下载缓存路径
  const downloadPath = resolve(config.configDir, templateName);
  // 如果缓存不存在或者没有设置使用缓存
  if (!existsSync(downloadPath) || !setting.cache) {
    // http下载git仓库
    const spinner = ora(
      `downloading template ${chalk.bgGreenBright(templateName)}`
    ).start();
    try {
      // 移除已经存在的模版
      await shell(`rm -rf ${downloadPath}`, true);
      // 下载
      await downloadTemplate(templateDownloadUrl, downloadPath);
      // 移除.git目录
      await shell(`rm -rf ${downloadPath}/.git`, true);
      spinner.succeed('template download success');
    } catch (e) {
      spinner.fail('template download fail');
      return;
    }
  }
  /**
   * 处理模板的template.config.js
   */
  const templateConfigFile = resolve(downloadPath, 'template.config.mjs');
  const templateConfig = await parseTemplateConfig(templateConfigFile);
  let answers;
  if (templateConfig.prompts.length) {
    answers = await inquirer.prompt(templateConfig.prompts);
  }
  /**
   * 复制并替换文件
   */
  const copyDestPath = resolve(process.cwd(), name);
  // 校验文件夹是否存在
  if (existsSync(copyDestPath)) {
    if (!setting.force) {
      console.log(`project is already exist, use -f, --force option if sure`);
      return;
    } else {
      await shell(`rm -rf ${copyDestPath}`);
    }
  }
  // 开始复制
  const copySpinner = ora('start copy template files').start();
  await copyFolder({
    target: downloadPath,
    dest: copyDestPath,
    cfg: { ...templateConfig, answers: { ...answers, projectName: name } },
    filter: v => v !== templateConfigFile,
    rootPath: downloadPath,
  });
  copySpinner.succeed('copy success');
  // 切换工作目录
  process.chdir(name);
  // git初始化
  if (setting.initGit) {
    await shell('git init');
  }
  // 安装依赖
  if (setting.install) {
    let registryArg = setting.registry ? ` --registry ${setting.registry}` : '';
    let installCode = `${setting.packageManagement}${
      setting.packageManagement === 'yarn' ? '' : ' install'
    }${registryArg}`;
    await shell(installCode);
  }
}

/**
 * 下载模板
 * @param {string} url 地址
 * @param {string} dest 缓存目录
 * @returns {Promise<any>}
 */
function downloadTemplate(url, dest) {
  const [gitUrl, branch = 'master'] = url.split('#');
  return shell(
    `git clone --depth 1 --branch ${branch} ${gitUrl} ${dest}`,
    true
  );
}

/**
 * 解析模版的配置
 * @param {string} p 模版路径
 * @returns {{
 *  prompts: import('inquirer').Question[],
 *  encoding: string,
 *  files: string[],
 *  exts: string[]
 * }}
 */
async function parseTemplateConfig(p) {
  const configs = existsSync(p) ? (await import(p)).default : {};
  return {
    prompts: configs.prompts || [],
    encoding: configs.encoding || 'utf8',
    files: configs.files || [],
    exts:
      configs.exts && configs.exts.length
        ? configs.exts
        : ['html', 'js', 'ts', 'tsx', 'vue', 'json', 'py', 'java', 'go'],
  };
}

/**
 * 复制文件夹
 * @param {{target: string, dest: string, cfg: object, filter: (v: string) => boolean, rootPath: string}} param0
 */
async function copyFolder({ target, dest, cfg, filter, rootPath }) {
  // 创建文件夹
  await mkdir(dest, { recursive: true });
  // 读取文件列表
  const files = await readdir(target);
  for (const file of files) {
    const newTargetPath = resolve(target, file);
    const newDestPath = resolve(dest, file);
    if (typeof filter === 'function' && !filter(newTargetPath)) {
      continue;
    }
    const statInfo = await stat(newTargetPath);
    // 文件夹，递归复制
    if (statInfo.isDirectory()) {
      await copyFolder({
        target: newTargetPath,
        dest: newDestPath,
        cfg,
        filter,
        rootPath,
      });
    }
    // 文件，进行复制操作
    else if (
      statInfo.isFile() &&
      needRenderFile(cfg, newTargetPath, rootPath)
    ) {
      let content = await readFile(newTargetPath, cfg.encoding);
      content = content.replaceAll(config.templateRegExp, (...args) => {
        const key = args[1];
        return cfg.answers[key] || args[0];
      });
      writeFile(newDestPath, content, cfg.encoding);
    }
    // 默认用copyFile
    else {
      await copyFile(newTargetPath, newDestPath);
    }
  }
}

/**
 * 是否需要渲染文件
 * @param {object} config 模版配置
 * @param {string} targetPath 当前复制文件路径
 * @param {string} rootPath 下载根目录
 * @returns {boolean}
 */
function needRenderFile({ files, exts }, targetPath, rootPath) {
  // 如果模版提供了文件列表就只替换相关文件
  if (files?.length) {
    return files.some(v => {
      const fp = resolve(rootPath, v);
      return fp === targetPath;
    });
  }
  // 都没有就匹配文件后缀
  return exts.includes(extname(targetPath).slice(1));
}
