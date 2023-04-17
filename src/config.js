import { homedir } from 'os';
import { resolve } from 'path';
import { existsSync, mkdirSync } from 'fs';

// 配置目录
const configDir = resolve(homedir(), '.ksbl-cli');
if (!existsSync(configDir)) {
  mkdirSync(configDir, { recursive: true });
}
export default {
  configDir,
};
