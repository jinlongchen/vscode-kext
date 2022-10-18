# LoveCode

*forked from https://github.com/LeetCode-OpenSource/vscode-leetcode*

如果安装了0.18.4之前的版本，可以把它卸载再装当前版本，因为0.18.4以及之后的版本换了id，相当于不是同一个插件了。

1. 修改了 LeetCode 插件的标题和图标

2. 增加了一个配置项“Enable Main Code”，打开这个，会在代码文件中增加main函数，方便使用ide调试。(目前只支持java和go，欢迎添加其他语言的main函数)

3. 增加了做题的计时器

4. 去掉了原有插件点击测试按钮时弹出的测试方式选择框，直接使用默认Testcase或者用文件用例测试（在设置里进行设置）
    * submit
    * test
    * star
    * solution
    * description
    * **filecase**

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

1. 请在 vs code 的`settings.json`作类似下面的配置

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

2. 如果不想使用智能提示（要知道，笔试的时候是没有智能提示的），在Workspace设置中使用如下配置：
```json
{
    // Controls if quick suggestions should show up while typing
    "editor.quickSuggestions": {
        "other": "off"
    },

     // Controls whether suggestions should be accepted on commit characters. For example, in JavaScript, the semi-colon (`;`) can be a commit character that accepts a suggestion and types that character.
    "editor.acceptSuggestionOnCommitCharacter": false,

    // Controls if suggestions should be accepted on 'Enter' - in addition to 'Tab'. Helps to avoid ambiguity between inserting new lines or accepting suggestions. The value 'smart' means only accept a suggestion with Enter when it makes a textual change
    "editor.acceptSuggestionOnEnter": "off",

    // Controls if suggestions should automatically show up when typing trigger characters
    "editor.suggestOnTriggerCharacters": false,

    // Controls if pressing tab inserts the best suggestion and if tab cycles through other suggestions
    "editor.tabCompletion": "off",

    // Enable word based suggestions
    "editor.wordBasedSuggestions": false,

    // Enable parameter hints
    "editor.parameterHints.enabled": false,
}
```
