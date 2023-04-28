import chalk from 'chalk';
import { spawn } from 'child_process';
import { resolve } from 'path';
import config from './config.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';

/**
 * 执行shell脚本
 * @param {string} code 命令
 * @returns {Promise}
 */
export function shell(code, quiet) {
  if (!quiet) {
    console.log(chalk.bgGray(`\nrun shell: ${code}`));
    console.log(chalk.cyanBright(`pwd: ${process.cwd()}`));
  }
  return new Promise(resolve => {
    const [cmd, ...args] = code.split(/\s+/);
    const task = spawn(cmd, args);
    if (!quiet) {
      task.stdout.on('data', data => {
        console.log(data.toString('utf-8'));
      });
      task.stderr.on('data', data => {
        console.log(chalk.red(data.toString('utf-8')));
      });
    }
    task.on('close', resolve);
  });
}

/**
 * 配置管理
 * @param {string} prefix 前缀
 * @returns {{
 *  get: (key: string | null) => string | string[] | Map<string, string | string[]>,
 *  set: (key: string, val: string | string[]) => void,
 *  remove: (key: string) => boolean,
 *  clear: () => boolean
 * }}
 */
export function configManage(prefix = '') {
  const configPath = resolve(
    config.configDir,
    (prefix ? `${prefix}-` : '') + 'config'
  );
  if (!existsSync(configPath)) {
    writeFileSync(configPath, '', 'utf8');
  }
  // 读取配置文件
  const readCfgFile = () => {
    return readFileSync(configPath, 'utf-8');
  };
  // 写入配置文件
  const writeCfgFile = cfg => {
    let cfgString = '';
    cfg.forEach((val, k) => {
      cfgString += `${k} ${Array.isArray(val) ? val.join(' ') : val}\n`;
    });
    return writeFileSync(configPath, cfgString, 'utf-8');
  };
  return {
    // 获取key的值，没有key的话读取全部
    get(key) {
      const configData = readCfgFile();
      const cfg = configData
        .split('\n')
        .filter(v => v)
        .reduce((prev, cur) => {
          const [k, ...v] = cur.split(/\s+/);
          prev.set(k, v.length > 1 ? v : v[0]);
          return prev;
        }, new Map());
      return key ? cfg.get(key) : cfg;
    },
    // 设置
    set() {
      if (arguments.length < 2) throw new Error('need two arguments!');
      const cfg = this.get();
      cfg.set(...Array.prototype.slice.call(arguments, 0, 2));
      writeCfgFile(cfg);
    },
    // 移除，成功返回true，失败返回false
    remove(key) {
      if (!key) throw new Error('key required');
      const cfg = this.get();
      const result = cfg.delete(key);
      writeCfgFile(cfg);
      return result;
    },
    // 清空
    clear() {
      writeCfgFile(new Map());
      return true;
    },
  };
}

/**
 * 解析json
 * @param {string} s json字符串
 * @returns {unknown}
 */
export function parseJSON(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}
