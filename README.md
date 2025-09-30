# 代码由DeepSeek生成

## 1.0
```
我需要你帮我写个油猴脚本，自动根据封号名单里的角色昵称查询贴吧里这个人的相关信息，查询可能会触发验证码，所以需要随机的10-20秒的间隔，查询结果如果很长需要自动缩短用...省略，可以点击打开新页面，地址参考我提供的，需要一个开始按钮，我自己去点击，如果启动时就运行可能会导致无法获取tab，具体方式：
封号名单页面：https://actff1.web.sdo.com/project/20210621ffviolation/index.html#/release
贴吧查询链接：https://tieba.baidu.com/f/search/res?ie=utf-8&kw=ff14&qw={角色昵称}
鉴于你可能无法访问封号页面，我提供你获取角色昵称的方式：
第一个人的昵称位置：#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(1) > div:nth-child(1)
第二个人的昵称位置：#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(2) > div:nth-child(1)
第三个人的昵称位置：....
结果绘制的地方：
第一个人的查询结果：
在#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(1)里面添加html<div class="item">{查询结果}</div>
第二个人的查询结果：
在#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(2)里面添加html<div class="item">{查询结果}</div>
第三个人的查询结果：...
鉴于你可能无法访问贴吧的查询结果页面，我直接提供你需要的结果的位置：
结果1：body > div.wrap1 > div > div.s_container.clearfix > div.s_main > div.s_post_list > div:nth-child(1) > span > a
结果1的跳转url：https://tieba.baidu.com{a[href]}
结果2：body > div.wrap1 > div > div.s_container.clearfix > div.s_main > div.s_post_list > div:nth-child(2) > span > a
结果2的跳转url：https://tieba.baidu.com{a[href]}
结果3：....
```

## 1.1
```
参考上一个问题和回复
原生的页面里添加结果还是太丑了，我需要你在页面最上面开辟一块区域，来显示查询的是谁，查询结果列表，这样可以显示所有内容不用...省略，还有我需要你添加一个终止按钮来终止查询，点击终止后，查询按钮变成继续查询，继续从终止的那个人往下查询，请给出完整的油猴脚本。
```

## 1.2
```
参考上面的问题和回复
UI很好看，我还需要你帮我，在查询的时候带上他的所在服务器，服务器获取方式：
第一个人：#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(1) > div:nth-child(2)
第二个人：#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(2) > div:nth-child(2)
第三个人：...
查询的地址为：https://tieba.baidu.com/f/search/res?ie=utf-8&kw=ff14&qw={角色昵称@角色服务器}
在你写的独立的UI里需要把他的所在服务器和封号原因加上，封号原因获取方式：
第一个人：#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(1) > div:nth-child(3)
第二个人：#app > div.viewsWaper > div > div.releTab > div.tabinfo > div:nth-child(2) > div:nth-child(3)
第三个人：...
其他要求：
1.独立UI里的查询按钮、查询状态需要始终显示，目前我滚轮往下滚的时候就看不见了
2.独立UI里查询状态为等待中的时候，需要显示下一个查的是谁，目前查询的进度(n/all)
```

## 1.3
```
参考上面的问题和回答
我的要求是在独立UI里固定住查询按钮、查询状态、查询进度这些信息，不随着页面滚动，始终可见，请给出完整的油猴脚本
```

## 1.4
```
参考上面的问题和回复
写的很好，我又想出了一些其他的点子：
1.独立UI的查询结果部分加点边框，并且可拖动
2.查询参数部分可以让用户自定义，在控制面板里提供自定义的功能，默认是"{nickname} {server}"，注意，只可以自定义查询的后缀，而不是整个url，上下文是：用户昵称=nickname，服务器=server，封号原因=banReason，可以吧上下文写个tips提醒用户
```

## 1.5
### 自己改了下样式

## 1.6
```
参考上面的结果，继续修改：
1.设置里增加自定义延迟，默认10-20
2.默认查询的{nickname} {server}改成{nickname}
```