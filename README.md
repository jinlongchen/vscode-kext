# LoveCode

*forked from https://github.com/LeetCode-OpenSource/vscode-leetcode*

1. 修改了 LeetCode 插件的标题和图标，这样一来，老板就不知道你在划水刷题了。

2. 增加了一个配置项“Enable Main Code”，打开这个，会在代码文件中增加main函数，方便使用ide调试。(目前只支持java和go，欢迎添加其他语言的main函数)

3. 增加了做题的计时器

4. 去掉了原有插件点击测试按钮时弹出的测试方式选择框，直接使用默认Testcase测试

5. 在代码文件中增加了一个代码区域可以写自定义Testcase，插件会添加Test按钮

类似这样的，你可以把这个多复制几遍：

```
@lc testcase=start
[5,6,7,8]
11
@lc testcase=end

@lc testcase=start
[5,6,7,8,9,10]
15
@lc testcase=end
```

## 配置

请在 vs code 的`settings.json`作类似下面的配置

```json
    "lovecode.filePath": {
        "golang": {
            "folder": "go/${id}.${kebab-case-name}"
        },
        "java": {
            "folder": "java/lode_${id}_${snake_case_name}",
            "filename": "lode_${id}_${snake_case_name}.${ext}"
        },
        "default": {
            "folder": "",
            "filename": "${id}.${kebab-case-name}.${ext}"
        }
    },
```
