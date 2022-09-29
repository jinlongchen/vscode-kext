# Kext

*forked from https://github.com/LeetCode-OpenSource/vscode-leetcode*

修改了 LeetCode 插件的标题和图标，这样一来，老板就不知道你在划水刷题了。

另外，增加了一个配置项“Enable main code”，打开这个，会在代码文件中增加main函数，方便使用ide调试。(目前只支持java和go，欢迎添加其他语言的main函数)

## 配置

请在 vs code 的`settings.json`作类似下面的配置

```
    "leetcode.filePath": {
        "golang": {
            "folder": "go/${id}.${kebab-case-name}"
        },
        "java": {
            "folder": "java/kext_${id}_${snake_case_name}",
            "filename": "kext_${id}_${snake_case_name}.${ext}"
        },
        "default": {
            "folder": "",
            "filename": "${id}.${kebab-case-name}.${ext}"
        }
    },
```
