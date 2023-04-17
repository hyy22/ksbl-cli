import { homedir } from 'os';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 配置目录
const configDir = resolve(homedir(), '.ksbl-cli');
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true });
}
export default {
  // 配置文件目录
  configDir,
  // 模版匹配规则
  templateRegExp: /<%(.+?)%>/g,
  // 默认排除文件
  defaultIgnorePath: ['node_modules/**'],
};
