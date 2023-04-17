# 项目脚手架

project init cli tools

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
