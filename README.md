# 项目脚手架

project init cli tools
项目初始化脚手架

## 命令

```
Usage: ksbl-cli [options] [command]

Options:
  -V, --version               output the version number
  -h, --help                  display help for command

Commands:
  create [options] <project>  使用指定模版初始化项目 init new project use preset templates
  template                    模版管理 list or edit template
  atfs [options]              为模版项目的template.config.mjs文件生成files选项 generate template.config.mjs files option of template project
  help [command]              display help for command
```

### 初始化项目

```
Usage: ksbl-cli create [options] <project>

使用指定模版初始化项目 init new project use preset templates

Options:
  -t, --template <template>       指定模版 select a template
  -m, --package-management <pkg>  选择一个包管理工具 npm yarn or pnpm (default: "npm")
  -r, --registry <registry>       设置镜像 set npm registry (default: "")
  -i, --install                   安装依赖 install dependence (default: false)
  -I, --init-git                  初始化git仓库 init git (default: false)
  -c, --cache                     使用已下载好的模版，默认拉取最新 use template cache, always download template default (default: false)
  -f, --force                     强制初始化项目 force generate project even if already exist (default: false)
  -h, --help                      display help for command
```

### 模版管理

设置模版，默认下载`repo`的`master`分支代码，如果需要指定分支需要在 url 后添加`#branch`，如`git://xxx/xxx.git#main`指定下载 main 分支

```bash
ksbl-cli template set vue3-admin-tem git://xxx/xxx.git#branch
```

```
Usage: ksbl-cli template [options] [command]

模版管理 list or edit template

Options:
  -h, --help         display help for command

Commands:
  ls                 显示所有模版 list all templates
  set <name> <repo>  新增/编辑模版 add or edit template
  rm <name...>       删除模版 remove template
  help [command]     display help for command
```

### 模版项目 files 配置生成

```
Usage: ksbl-cli atfs [options]

为模版项目的template.config.mjs文件生成files选项 generate template.config.mjs files option of template project

扫描指定目录，根据正则匹配文件内容收集文件，匹配规则默认为/<%(.+?)%>/g，可在config.js调整

Options:
  -i, --include <glob...>  使用glob包含匹配的文件 include files use glob matching
  -e, --exclude <glob...>  使用glob排除匹配的文件 exclude files use glob matching
  -h, --help               display help for command
```

## 模版项目

### 创建模版项目

模版项目一般是从原工作项目中抽离而来的，移除之前项目不需要的部分，只保留最小化可启动代码

#### 变量

所谓变量，是指哪些部分是你现在不知道的，需要去提问脚本使用者后才能得到答案。在模版项目中相应的文件中使用`<%var%>`的格式占位，生成项目后会进行自动替换

#### 配置

在模版项目**根目录**创建配置文件`template.config.mjs`，写下以下内容

```js
export default {
  // 交互式提问，使用inquire，格式为{type: 'input', name: 'name', message: '项目名称？'}，具体参考https://github.com/SBoudrias/Inquirer.js#question
  // 如果不需要提问就不用配置
  prompts: [],
  // 提问后根据回答渲染页面的编码，默认为utf8
  encoding: '',
  // 需要脚本批量替换变量的文件列表，相对路径
  files: ['src/main.js'],
  // 需要脚本批量替换变量的文件扩展名类型，如果配置了files会优先使用files
  exts: ['html', 'js', 'jsx', 'vue', 'tsx'],
};
```

如果设置了`prompts`且在模版项目中使用了变量占位，使用`ksbl-cli atfs`命令可以自动给`template.config.mjs`添加`files`配置，作用是指定需要渲染的文件列表，提升速度。如果不设置且设置了`prompts`就会使用`exts`的配置去获取渲染文件列表，如果不设置`exts`，会使用脚本的默认配置。

在`template.config.mjs`配置文件中，可以使用`process.env.DEFAULT_PROJECT_NAME`环境变量获取生成的项目目录名称
