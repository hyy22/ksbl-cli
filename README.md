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
  create [options] <project>  init new project use preset templates
  template                    list or edit template
  help [command]              display help for command
```

### 初始化项目

```
Usage: ksbl-cli create [options] <project>

init new project use preset templates

Options:
  -m, --package-management <pkg>  npm or yarn (default: "npm")
  -r, --registry <registry>       set npm registry (default: "")
  -n, --not-install               not install dependence (default: false)
  -N, --not-git                   not init git (default: false)
  -t, --template <template>       select a template (default: "")
  -c, --cache                     use template cache, always download template default (default: false)
  -f, --force                     force generate project even if already exist (default: false)
  -h, --help                      display help for command
```

### 模版管理

```
Usage: ksbl-cli template [options] [command]

list or edit template

Options:
  -h, --help         display help for command

Commands:
  ls                 list all templates
  set <name> <repo>  add or edit template
  rm <name...>       remove template
  help [command]     display help for command
```

### 模版项目 files 配置生成

```
Usage: ksbl-cli atfs [options]

generate template.config.mjs files option of template project

Options:
  -i, --include <glob...>  include files use glob matching
  -e, --exclude <glob...>  exclude files use glob matching
  -h, --help               display help for command
```

## 模版项目

> 由于使用的`download-git-repo`下载代码，现在远程仓库仅支持 github、gitlab、bitbucket 及自建 gitlab 托管

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

如果设置了`prompts`且在模版项目中使用了变量占位，使用`ksbl-cli atfs`可以自动给`template.config.mjs`添加`files`配置，作用是指定需要渲染的文件列表，提升速度。如果不设置且设置了`prompts`就会使用`exts`的配置去获取渲染文件列表，如果不设置`exts`，会使用脚本的默认配置。
