#!/usr/bin/env node
import { program, Command } from 'commander';
import { readFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import create from './lib/create.js';
import * as template from './lib/template.js';
import addTemplateFiles from './lib/addTemplateFiles.js';

// 文件路径
const __filename__ = fileURLToPath(import.meta.url);
// 读取目录
const __dirname__ = dirname(__filename__);
const pkg = JSON.parse(readFileSync(resolve(__dirname__, '../package.json')));
program.version(pkg.version);

/**
 * create command
 * create proj --template vue3-admin-ts
 */
function buildCreateCommand() {
  const createCmd = new Command('create');
  createCmd
    .argument('<project>')
    .description('使用指定模版初始化项目 init new project use preset templates')
    .requiredOption('-t, --template <template>', '指定模版 select a template')
    .option(
      '-m, --package-management <pkg>',
      '选择一个包管理工具 npm yarn or pnpm',
      'npm'
    )
    .option('-r, --registry <registry>', '设置镜像 set npm registry', '')
    .option('-i, --install', '安装依赖 install dependence', false)
    .option('-I, --init-git', '初始化git仓库 init git', false)
    .option(
      '-c, --cache',
      '使用已下载好的模版，默认拉取最新 use template cache, always download template default',
      false
    )
    .option(
      '-f, --force',
      '强制初始化项目 force generate project even if already exist',
      false
    )
    .action((project, options) => {
      create(project, options);
    });
  return createCmd;
}
program.addCommand(buildCreateCommand());

/**
 * template command
 * template ls 显示
 * template set name url 设置
 * template rm name 删除
 */
function buildTemplateCommand() {
  const templateCmd = new Command('template');
  templateCmd.description('模版管理 list or edit template');
  templateCmd
    .command('ls')
    .description('显示所有模版 list all templates')
    .action(() => {
      template.listTemplates();
    });
  templateCmd
    .command('set')
    .description('新增/编辑模版 add or edit template')
    .argument('<name>', '模版名称 template name')
    .argument('<repo>', '模版仓库地址 template repo url')
    .action((name, repo) => {
      template.setTemplate(name, repo);
    });
  templateCmd
    .command('rm')
    .description('删除模版 remove template')
    .argument('<name...>', '模版名称 template name')
    .action(name => {
      template.removeTemplate(name);
    });
  return templateCmd;
}
program.addCommand(buildTemplateCommand());

/**
 * atfs --include src/**
 * atfs --exclude node_modules/
 */
function buildAtfsCommand() {
  const atfsCmd = new Command('atfs');
  atfsCmd
    .description(
      '为模版项目的template.config.mjs文件生成files选项 generate template.config.mjs files option of template project'
    )
    .option(
      '-i, --include <glob...>',
      '使用glob包含匹配的文件 include files use glob matching'
    )
    .option(
      '-e, --exclude <glob...>',
      '使用glob排除匹配的文件 exclude files use glob matching'
    )
    .action(options => {
      addTemplateFiles(options.include, options.exclude);
    });
  return atfsCmd;
}
program.addCommand(buildAtfsCommand());

program.parse(process.argv);
