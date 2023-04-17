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
    .description('init new project use preset templates')
    .option('-m, --package-management <pkg>', 'npm or yarn', 'npm')
    .option('-r, --registry <registry>', 'set npm registry', '')
    .option('-n, --not-install', 'not install dependence', false)
    .option('-N, --not-git', 'not init git', false)
    .option('-t, --template <template>', 'select a template', '')
    .option(
      '-c, --cache',
      'use template cache, always download template default',
      false
    )
    .option(
      '-f, --force',
      'force generate project even if already exist',
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
  templateCmd.description('list or edit template');
  templateCmd
    .command('ls')
    .description('list all templates')
    .action(() => {
      template.listTemplates();
    });
  templateCmd
    .command('set')
    .argument('<name>', 'template name')
    .argument('<repo>', 'template repo url')
    .description('add or edit template')
    .action((name, repo) => {
      template.setTemplate(name, repo);
    });
  templateCmd
    .command('rm')
    .argument('<name...>', 'template name')
    .description('remove template')
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
      'generate template.config.mjs files option of template project'
    )
    .option('-i, --include <glob...>', 'include files use glob matching')
    .option('-e, --exclude <glob...>', 'exclude files use glob matching')
    .action(options => {
      addTemplateFiles(options.include, options.exclude);
    });
  return atfsCmd;
}
program.addCommand(buildAtfsCommand());

program.parse(process.argv);
