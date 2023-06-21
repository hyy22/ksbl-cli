import chalk from 'chalk';
import { configManage } from '../utils.js';

const cm = configManage();
// 显示模版
export function listTemplates() {
  const temps = cm.get();
  temps.forEach((v, k) => {
    console.log(`${chalk.blueBright(k)} ${chalk.green(v)}`);
  });
}
// 设置模板
export function setTemplate(name, url) {
  cm.set(name, url);
  console.log(chalk.blueBright(name));
}
// 删除模版
export function removeTemplate(names) {
  names.forEach(name => {
    cm.remove(name);
    console.log(chalk.blueBright(name));
  });
}
