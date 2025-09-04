// ==UserScript==
// @name         FF14封号名单贴吧查询工具增强版
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  自动查询封号名单中角色在贴吧的相关信息，带有独立结果显示区域
// @author       thevsk
// @match        https://actff1.web.sdo.com/project/20210621ffviolation/index.html*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @connect      tieba.baidu.com
// ==/UserScript==

(function() {
    'use strict';

    // 代码生成自deepseek
    // 添加自定义样式
    GM_addStyle(`
        #tieba-query-panel {
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: white;
            border: 1px solid #ccc;
            border-radius: 5px;
            padding: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            min-width: 350px;
            max-width: 500px;
            max-height: 80vh;
            overflow-y: auto;
            font-family: Arial, sans-serif;
        }

        #tieba-query-controls {
            margin-bottom: 10px;
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
        }

        .tieba-query-btn {
            padding: 5px 10px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
            font-weight: bold;
            font-size: 12px;
        }

        #tieba-query-start {
            background: #4e6ef2;
            color: white;
        }

        #tieba-query-pause {
            background: #ff9900;
            color: white;
        }

        #tieba-query-clear {
            background: #f0f0f0;
            color: #333;
        }

        .tieba-query-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        #tieba-query-status {
            font-size: 12px;
            margin: 5px 0;
            color: #666;
            line-height: 1.4;
        }

        #tieba-query-results {
            border-top: 1px solid #eee;
            padding-top: 10px;
        }

        .query-result-item {
            margin-bottom: 10px;
            padding: 8px;
            border: 1px solid #eee;
            border-radius: 3px;
            background: #fafafa;
        }

        .query-result-character {
            font-weight: bold;
            margin-bottom: 5px;
            color: #4e6ef2;
            font-size: 14px;
        }

        .query-result-server {
            display: inline-block;
            background: #e6f7ff;
            padding: 2px 6px;
            border-radius: 3px;
            margin-right: 8px;
            font-size: 11px;
            color: #1890ff;
        }

        .query-result-reason {
            display: inline-block;
            background: #fff2e8;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 11px;
            color: #fa541c;
        }

        .query-result-content {
            font-size: 13px;
            margin-top: 8px;
        }

        .query-result-post {
            margin: 3px 0;
            padding: 3px 5px;
            border-left: 2px solid #4e6ef2;
            background: #f9f9f9;
        }

        .query-result-post a {
            color: #4e6ef2;
            text-decoration: none;
            font-size: 12px;
        }

        .query-result-post a:hover {
            text-decoration: underline;
        }

        .query-no-results {
            color: #999;
            font-style: italic;
            font-size: 12px;
        }

        .query-progress {
            font-weight: bold;
            margin-top: 5px;
            color: #333;
        }

        .next-query-info {
            background: #f6ffed;
            border: 1px solid #b7eb8f;
            border-radius: 3px;
            padding: 5px;
            margin-top: 5px;
            font-size: 11px;
        }
    `);

    // 工具函数：生成随机延迟(10-20秒)
    function getRandomDelay() {
        return Math.floor(Math.random() * 10000) + 10000;
    }

    // 提取角色信息（名称、服务器、封号原因）
    function extractCharacterInfo() {
        const characters = [];
        const elements = document.querySelectorAll('#app > div.viewsWaper > div > div.releTab > div.tabinfo > div');

        elements.forEach((element, index) => {
            const nameElement = element.querySelector('div:nth-child(1)');
            const serverElement = element.querySelector('div:nth-child(2)');
            const reasonElement = element.querySelector('div:nth-child(3)');

            if (nameElement && serverElement && reasonElement) {
                characters.push({
                    index: index,
                    name: nameElement.textContent.trim(),
                    server: serverElement.textContent.trim(),
                    reason: reasonElement.textContent.trim(),
                    element: element
                });
            }
        });

        return characters;
    }

    // 查询贴吧信息
    function queryTiebaInfo(characterName, server) {
        return new Promise((resolve) => {
            const queryText = `${characterName}@${server}`;
            const queryUrl = `https://tieba.baidu.com/f/search/res?ie=utf-8&kw=ff14&qw=${encodeURIComponent(queryText)}`;

            GM_xmlhttpRequest({
                method: "GET",
                url: queryUrl,
                onload: function(response) {
                    try {
                        // 创建一个临时DOM元素来解析响应
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, "text/html");

                        // 提取查询结果
                        const results = [];
                        const resultElements = doc.querySelectorAll('div.s_post_list > div');

                        resultElements.forEach((resultElem, i) => {
                            const linkElem = resultElem.querySelector('span > a');
                            if (linkElem) {
                                const title = linkElem.textContent;
                                const href = linkElem.getAttribute('href');
                                results.push({
                                    title: title,
                                    url: 'https://tieba.baidu.com' + href
                                });
                            }
                        });

                        resolve({characterName, server, results});
                    } catch (e) {
                        console.error('解析错误:', e);
                        resolve({characterName, server, results: []});
                    }
                },
                onerror: function(error) {
                    console.error('请求错误:', error);
                    resolve({characterName, server, results: []});
                }
            });
        });
    }

    // 添加结果到显示面板
    function addResultToPanel(characterName, server, reason, results) {
        const resultsContainer = document.getElementById('tieba-query-results');

        const resultItem = document.createElement('div');
        resultItem.className = 'query-result-item';

        const characterDiv = document.createElement('div');
        characterDiv.className = 'query-result-character';
        characterDiv.textContent = `角色: ${characterName}`;
        resultItem.appendChild(characterDiv);

        // 添加服务器信息
        const serverSpan = document.createElement('span');
        serverSpan.className = 'query-result-server';
        serverSpan.textContent = `服务器: ${server}`;
        characterDiv.appendChild(serverSpan);

        // 添加封号原因
        const reasonSpan = document.createElement('span');
        reasonSpan.className = 'query-result-reason';
        reasonSpan.textContent = `封号原因: ${reason}`;
        characterDiv.appendChild(reasonSpan);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'query-result-content';

        if (results.length === 0) {
            const noResults = document.createElement('div');
            noResults.className = 'query-no-results';
            noResults.textContent = '贴吧查询: 无相关结果';
            contentDiv.appendChild(noResults);
        } else {
            results.forEach((result, i) => {
                const postDiv = document.createElement('div');
                postDiv.className = 'query-result-post';

                const link = document.createElement('a');
                link.href = result.url;
                link.target = '_blank';
                link.textContent = result.title;

                postDiv.appendChild(link);
                contentDiv.appendChild(postDiv);
            });
        }

        resultItem.appendChild(contentDiv);
        resultsContainer.appendChild(resultItem);

        // 滚动到最新结果
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }

    // 创建查询控制面板
    function createControlPanel() {
        // 检查是否已存在面板
        if (document.getElementById('tieba-query-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'tieba-query-panel';

        // 创建控制按钮
        const controls = document.createElement('div');
        controls.id = 'tieba-query-controls';

        const startBtn = document.createElement('button');
        startBtn.id = 'tieba-query-start';
        startBtn.className = 'tieba-query-btn';
        startBtn.textContent = '开始查询';

        const pauseBtn = document.createElement('button');
        pauseBtn.id = 'tieba-query-pause';
        pauseBtn.className = 'tieba-query-btn';
        pauseBtn.textContent = '暂停查询';
        pauseBtn.disabled = true;

        const clearBtn = document.createElement('button');
        clearBtn.id = 'tieba-query-clear';
        clearBtn.className = 'tieba-query-btn';
        clearBtn.textContent = '清除结果';

        controls.appendChild(startBtn);
        controls.appendChild(pauseBtn);
        controls.appendChild(clearBtn);

        // 创建状态显示
        const status = document.createElement('div');
        status.id = 'tieba-query-status';
        status.textContent = '就绪';

        // 创建结果容器
        const results = document.createElement('div');
        results.id = 'tieba-query-results';

        panel.appendChild(controls);
        panel.appendChild(status);
        panel.appendChild(results);

        document.body.appendChild(panel);

        // 添加事件监听
        let isQuerying = false;
        let currentIndex = 0;
        let characters = [];
        let queryTimeout = null;

        // 更新状态显示
        function updateStatus(text, isWaiting = false, nextCharacter = null) {
            status.innerHTML = text;

            // 添加进度信息
            const progress = document.createElement('div');
            progress.className = 'query-progress';
            progress.textContent = `进度: ${currentIndex}/${characters.length}`;
            status.appendChild(progress);

            // 如果是等待状态，显示下一个查询的角色信息
            if (isWaiting && nextCharacter) {
                const nextInfo = document.createElement('div');
                nextInfo.className = 'next-query-info';
                nextInfo.textContent = `下一个: ${nextCharacter.name} (${nextCharacter.server})`;
                status.appendChild(nextInfo);
            }
        }

        // 开始查询
        startBtn.addEventListener('click', function() {
            if (isQuerying) return;

            isQuerying = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;

            // 获取角色列表
            characters = extractCharacterInfo();
            updateStatus(`找到 ${characters.length} 个角色，开始查询...`);

            // 开始查询过程
            startQueryProcess();
        });

        // 暂停查询
        pauseBtn.addEventListener('click', function() {
            if (!isQuerying) return;

            isQuerying = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
            startBtn.textContent = '继续查询';

            if (queryTimeout) {
                clearTimeout(queryTimeout);
                queryTimeout = null;
            }

            updateStatus(`已暂停，已查询 ${currentIndex}/${characters.length} 个角色`);
        });

        // 清除结果
        clearBtn.addEventListener('click', function() {
            const resultsContainer = document.getElementById('tieba-query-results');
            resultsContainer.innerHTML = '';
            updateStatus('结果已清除');
        });

        // 查询处理函数
        async function startQueryProcess() {
            for (; currentIndex < characters.length; currentIndex++) {
                if (!isQuerying) break;

                const character = characters[currentIndex];
                updateStatus(`查询中: ${character.name} (${character.server})`);

                try {
                    const result = await queryTiebaInfo(character.name, character.server);
                    addResultToPanel(result.characterName, result.server, character.reason, result.results);
                } catch (error) {
                    console.error(`查询 ${character.name} 时出错:`, error);
                    updateStatus(`查询 ${character.name} 时出错`);
                }

                // 如果不是最后一个，添加延迟
                if (currentIndex < characters.length - 1 && isQuerying) {
                    const delay = getRandomDelay();
                    const nextCharacter = characters[currentIndex + 1];
                    updateStatus(`等待中... ${Math.round(delay/1000)}秒后继续`, true, nextCharacter);

                    // 使用Promise和setTimeout实现可中断的延迟
                    await new Promise(resolve => {
                        queryTimeout = setTimeout(resolve, delay);
                    });

                    if (!isQuerying) break;
                }
            }

            // 查询完成或中断
            isQuerying = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;

            if (currentIndex >= characters.length) {
                updateStatus('查询完成');
                startBtn.textContent = '重新开始';
                currentIndex = 0; // 重置索引以便重新开始
            } else {
                updateStatus(`已暂停，已查询 ${currentIndex}/${characters.length} 个角色`);
                startBtn.textContent = '继续查询';
            }
        }
    }

    // 初始化
    function init() {
        // 等待页面加载完成
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createControlPanel);
        } else {
            createControlPanel();
        }
    }

    // 启动脚本
    init();
})();