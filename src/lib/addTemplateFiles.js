import { readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { glob } from 'glob';
import { existsSync } from 'fs';
import config from '../config.js';
import { format as prettierFormat } from 'prettier';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import t from '@babel/types';

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
  const configFilePath = resolve(pwd, 'template.config.mjs');
  // 读取配置文件
  const templateConfig = existsSync(configFilePath)
    ? (await import(configFilePath)).default
    : {};
  // 获取需要替换的文件列表
  const renderFiles = await getRenderFiles(
    matchFiles,
    templateConfig.encoding ?? 'utf-8',
    templateConfig.regExp ?? config.templateRegExp
  );
  // 写入配置文件
  if (renderFiles.length) {
    const tmpConfigContent = existsSync(configFilePath)
      ? await readFile(configFilePath, 'utf-8')
      : `export default {}`;
    const ast = parse(tmpConfigContent, {
      sourceType: 'module',
    });
    traverse.default(ast, {
      enter(path) {
        if (
          path.isExportDeclaration() &&
          path.get('declaration').isObjectExpression()
        ) {
          const properties = path.get('declaration.properties');
          const arrayExpression = t.arrayExpression(
            renderFiles.map(file => t.stringLiteral(file))
          );
          // 遍历，寻找相关属性
          for (const property of properties) {
            if (property.get('key').isIdentifier({ name: 'files' })) {
              property.get('value').replaceWith(arrayExpression);
              path.stop();
              return;
            }
          }
          // 如果没有找到就新增
          const property = t.objectProperty(
            t.identifier('files'),
            arrayExpression
          );
          path.get('declaration').pushContainer('properties', property);
          path.stop();
        }
      },
    });
    const configString = generate.default(ast).code;
    writeFile(
      configFilePath,
      prettierFormat(configString, {
        parser: 'babel',
        singleQuote: true,
        bracketSpacing: true,
        bracketSameLine: true,
        arrowParens: 'avoid',
      }),
      'utf-8'
    );
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
