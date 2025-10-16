// ==UserScript==
// @name         FF14封号名单贴吧查询工具增强版
// @namespace    https://github.com/thevsk/tampermonkey-ff14-banlist-tieba-search
// @version      1.11
// @description  自动查询封号名单中角色在贴吧的相关信息，带有自定义延迟和查询格式功能
// @author       thevsk
// @match        https://actff1.web.sdo.com/project/20210621ffviolation/index.html*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @connect      tieba.baidu.com
// @downloadURL  https://github.com/thevsk/tampermonkey-ff14-banlist-tieba-search/raw/refs/heads/main/ff14-banlist-tieba-search.user.js
// @updateURL    https://github.com/thevsk/tampermonkey-ff14-banlist-tieba-search/raw/refs/heads/main/ff14-banlist-tieba-search.user.js
// ==/UserScript==

(function() {
    'use strict';

    // 添加自定义样式
    GM_addStyle(`
        #tieba-query-panel {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            z-index: 10000;
            background: white;
            border-bottom: 1px solid #ccc;
            padding: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
        }

        #tieba-query-controls {
            display: flex;
            gap: 5px;
            margin-bottom: 5px;
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

        #tieba-query-refresh {
            background: #f0f0f0;
            color: #333;
        }

        .tieba-query-btn:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        #tieba-query-status {
            font-size: 12px;
            color: #666;
            line-height: 1.4;
            margin-bottom: 5px;
        }

        #tieba-query-results-container {
            position: fixed;
            top: 120px;
            right: 10px;
            width: 500px;
            max-height: calc(100vh - 130px);
            overflow: hidden;
            background: white;
            border: 2px solid #4e6ef2;
            border-radius: 5px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 9999;
            resize: both;
            min-width: 400px;
            min-height: 300px;
        }

        #tieba-query-results-header {
            background: #4e6ef2;
            color: white;
            padding: 5px 10px;
            cursor: move;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        #tieba-query-results {
            height: calc(100% - 30px);
            overflow-y: auto;
            padding: 10px;
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

        /* 新时间样式 */
        .tieba-result-date {
            color: #666;
            font-size: 11px;
            margin-right: 5px;
            font-weight: normal;
            background: #f0f0f0;
            padding: 1px 4px;
            border-radius: 2px;
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

        .status-section {
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .progress-info {
            font-weight: bold;
            color: #333;
            margin-right: 10px;
        }

        #settings-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #4e6ef2;
            border-radius: 5px;
            padding: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            z-index: 10001;
            width: 500px;
            max-width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            color: black;
        }

        #settings-modal h3 {
            margin-top: 0;
            color: #4e6ef2;
        }

        .settings-group {
            margin-bottom: 15px;
        }

        .settings-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }

        .settings-group input {
            width: 100%;
            padding: 5px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }

        #query-format {
            width: 100%;
            padding: 5px;
            margin-bottom: 10px;
            border: 1px solid #ccc;
            border-radius: 3px;
        }

        #settings-tips {
            background: #f9f9f9;
            border: 1px solid #eee;
            border-radius: 3px;
            padding: 10px;
            margin-bottom: 10px;
            font-size: 12px;
        }

        #settings-tips ul {
            margin: 5px 0;
            padding-left: 20px;
        }

        #settings-buttons {
            display: flex;
            justify-content: flex-end;
            gap: 5px;
        }

        .modal-backdrop {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10000;
        }

        /* 筛选器样式 */
        .filter-group {
            margin-bottom: 15px;
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
        }

        .filter-group h4 {
            margin-top: 0;
            margin-bottom: 8px;
            color: #4e6ef2;
            font-size: 14px;
        }

        .filter-item {
            margin-bottom: 5px;
        }

        .filter-item label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-size: 13px;
        }

        .filter-item input {
            margin-right: 6px;
        }

        .filter-count {
            margin-left: 5px;
            color: #666;
            font-size: 12px;
        }

        .select-all-controls {
            display: flex;
            gap: 5px;
            margin-bottom: 8px;
        }

        .select-all-controls button {
            padding: 3px 8px;
            font-size: 12px;
            border: 1px solid #ddd;
            border-radius: 3px;
            background: #f5f5f5;
            cursor: pointer;
        }
    `);

    // 工具函数：生成随机延迟
    function getRandomDelay() {
        const minDelay = GM_getValue('minDelay', 10) * 1000;
        const maxDelay = GM_getValue('maxDelay', 20) * 1000;
        return Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    }

    // 提取角色信息
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

    // 提取所有封号原因并统计数量
    function extractBanReasonsWithCount() {
        const reasonCounts = {};
        const elements = document.querySelectorAll('#app > div.viewsWaper > div > div.releTab > div.tabinfo > div > div:nth-child(3)');

        elements.forEach(element => {
            if (element.textContent) {
                const reason = element.textContent.trim();
                reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
            }
        });

        // 转换为数组并排序
        return Object.entries(reasonCounts)
            .map(([reason, count]) => ({ reason, count }))
            .sort((a, b) => b.count - a.count);
    }

    // 提取所有服务器并统计数量
    function extractServersWithCount() {
        const serverCounts = {};
        const elements = document.querySelectorAll('#app > div.viewsWaper > div > div.releTab > div.tabinfo > div > div:nth-child(2)');

        elements.forEach(element => {
            if (element.textContent) {
                const server = element.textContent.trim();
                serverCounts[server] = (serverCounts[server] || 0) + 1;
            }
        });

        // 转换为数组并排序
        return Object.entries(serverCounts)
            .map(([server, count]) => ({ server, count }))
            .sort((a, b) => b.count - a.count);
    }

    // 查询贴吧信息（严格按照提供的选择器提取时间）
    function queryTiebaInfo(characterName, server, queryFormat) {
        return new Promise((resolve) => {
            const queryText = queryFormat
                .replace(/{nickname}/g, characterName)
                .replace(/{server}/g, server)
                .replace(/{banReason}/g, "");

            const queryUrl = `https://tieba.baidu.com/f/search/res?ie=utf-8&kw=ff14&qw=${encodeURIComponent(queryText)}`;

            GM_xmlhttpRequest({
                method: "GET",
                url: queryUrl,
                onload: function(response) {
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(response.responseText, "text/html");
                        const results = [];
                        const resultElements = doc.querySelectorAll('div.s_post_list > div');

                        resultElements.forEach((resultElem, i) => {
                            const linkElem = resultElem.querySelector('span > a');
                            if (linkElem) {
                                const title = linkElem.textContent;
                                const href = linkElem.getAttribute('href');

                                // 严格按照提供的选择器路径提取时间
                                let dateText = '';
                                const dateElem = resultElem.querySelector('font.p_date');
                                if (dateElem && dateElem.textContent) {
                                    // 提取日期部分（YYYY-MM-DD）
                                    const fullDate = dateElem.textContent.trim();
                                    dateText = fullDate.substring(0, 10);
                                }

                                results.push({
                                    title: title,
                                    url: 'https://tieba.baidu.com' + href,
                                    date: dateText
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

    // 添加结果到显示面板（使用新的时间样式）
    function addResultToPanel(characterName, server, reason, results) {
        const resultsContainer = document.getElementById('tieba-query-results');
        const resultItem = document.createElement('div');
        resultItem.className = 'query-result-item';

        const characterDiv = document.createElement('div');
        characterDiv.className = 'query-result-character';
        characterDiv.textContent = `角色: ${characterName}`;
        resultItem.appendChild(characterDiv);

        const serverSpan = document.createElement('span');
        serverSpan.className = 'query-result-server';
        serverSpan.textContent = `服务器: ${server}`;
        characterDiv.appendChild(serverSpan);

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

                // 创建时间元素（使用新的样式类）
                if (result.date) {
                    const dateSpan = document.createElement('span');
                    dateSpan.className = 'tieba-result-date';
                    dateSpan.textContent = `[${result.date}]`;
                    postDiv.appendChild(dateSpan);
                }

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
        resultsContainer.scrollTop = resultsContainer.scrollHeight;
    }

    // 创建设置模态框
    function createSettingsModal() {
        const modal = document.createElement('div');
        modal.id = 'settings-modal';

        // 获取所有封号原因及数量
        const banReasons = extractBanReasonsWithCount();
        // 获取所有服务器及数量
        const servers = extractServersWithCount();

        // 生成封号原因筛选HTML
        let reasonsHTML = '';
        if (banReasons.length > 0) {
            reasonsHTML += `
                <div class="filter-group">
                    <h4>封号原因筛选:</h4>
                    <div class="select-all-controls">
                        <button id="select-all-reasons">全选</button>
                        <button id="deselect-all-reasons">全不选</button>
                    </div>
            `;

            banReasons.forEach(item => {
                reasonsHTML += `
                    <div class="filter-item">
                        <label>
                            <input type="checkbox" class="ban-reason-checkbox" value="${item.reason}">
                            ${item.reason}
                            <span class="filter-count">(${item.count})</span>
                        </label>
                    </div>
                `;
            });

            reasonsHTML += '</div>';
        }

        // 生成服务器筛选HTML
        let serversHTML = '';
        if (servers.length > 0) {
            serversHTML += `
                <div class="filter-group">
                    <h4>服务器筛选:</h4>
                    <div class="select-all-controls">
                        <button id="select-all-servers">全选</button>
                        <button id="deselect-all-servers">全不选</button>
                    </div>
            `;

            servers.forEach(item => {
                serversHTML += `
                    <div class="filter-item">
                        <label>
                            <input type="checkbox" class="server-checkbox" value="${item.server}">
                            ${item.server}
                            <span class="filter-count">(${item.count})</span>
                        </label>
                    </div>
                `;
            });

            serversHTML += '</div>';
        }

        modal.innerHTML = `
            <h3>查询设置</h3>
            <div id="settings-tips">
                <strong>可用变量:</strong>
                <ul>
                    <li><code>{nickname}</code> - 角色昵称</li>
                    <li><code>{server}</code> - 服务器名称</li>
                    <li><code>{banReason}</code> - 封号原因</li>
                </ul>
            </div>

            ${reasonsHTML}
            ${serversHTML}

            <div class="settings-group">
                <label for="query-format">查询格式:</label>
                <input type="text" id="query-format" value="{nickname}">
            </div>

            <div class="settings-group">
                <label for="min-delay">最小延迟(秒):</label>
                <input type="number" id="min-delay" min="1" max="60" value="10">
            </div>

            <div class="settings-group">
                <label for="max-delay">最大延迟(秒):</label>
                <input type="number" id="max-delay" min="1" max="60" value="20">
            </div>

            <div id="settings-buttons">
                <button id="settings-cancel" class="tieba-query-btn">取消</button>
                <button id="settings-start" class="tieba-query-btn" style="background: #4e6ef2; color: white;">开始查询</button>
            </div>
        `;

        document.body.appendChild(modal);

        const backdrop = document.createElement('div');
        backdrop.className = 'modal-backdrop';
        document.body.appendChild(backdrop);

        // 加载保存的设置
        const savedFormat = GM_getValue('queryFormat', '{nickname}');
        const minDelay = GM_getValue('minDelay', 10);
        const maxDelay = GM_getValue('maxDelay', 20);
        const savedReasons = GM_getValue('selectedReasons', banReasons.map(item => item.reason));
        const savedServers = GM_getValue('selectedServers', servers.map(item => item.server));

        document.getElementById('query-format').value = savedFormat;
        document.getElementById('min-delay').value = minDelay;
        document.getElementById('max-delay').value = maxDelay;

        // 设置封号原因复选框状态
        const reasonCheckboxes = modal.querySelectorAll('.ban-reason-checkbox');
        reasonCheckboxes.forEach(checkbox => {
            checkbox.checked = savedReasons.includes(checkbox.value);
        });

        // 设置服务器复选框状态
        const serverCheckboxes = modal.querySelectorAll('.server-checkbox');
        serverCheckboxes.forEach(checkbox => {
            checkbox.checked = savedServers.includes(checkbox.value);
        });

        // 封号原因全选/全不选按钮事件
        if (banReasons.length > 0) {
            document.getElementById('select-all-reasons').addEventListener('click', function() {
                reasonCheckboxes.forEach(checkbox => {
                    checkbox.checked = true;
                });
            });

            document.getElementById('deselect-all-reasons').addEventListener('click', function() {
                reasonCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }

        // 服务器全选/全不选按钮事件
        if (servers.length > 0) {
            document.getElementById('select-all-servers').addEventListener('click', function() {
                serverCheckboxes.forEach(checkbox => {
                    checkbox.checked = true;
                });
            });

            document.getElementById('deselect-all-servers').addEventListener('click', function() {
                serverCheckboxes.forEach(checkbox => {
                    checkbox.checked = false;
                });
            });
        }

        document.getElementById('settings-cancel').addEventListener('click', function() {
            document.body.removeChild(modal);
            document.body.removeChild(backdrop);
        });

        // 返回一个Promise，用于在设置完成后开始查询
        return new Promise((resolve) => {
            document.getElementById('settings-start').addEventListener('click', function() {
                const format = document.getElementById('query-format').value;
                let minDelay = parseInt(document.getElementById('min-delay').value) || 10;
                let maxDelay = parseInt(document.getElementById('max-delay').value) || 20;

                // 获取选中的封号原因
                const selectedReasons = [];
                reasonCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        selectedReasons.push(checkbox.value);
                    }
                });

                // 获取选中的服务器
                const selectedServers = [];
                serverCheckboxes.forEach(checkbox => {
                    if (checkbox.checked) {
                        selectedServers.push(checkbox.value);
                    }
                });

                if (minDelay < 1) minDelay = 1;
                if (maxDelay > 60) maxDelay = 60;
                if (minDelay > maxDelay) {
                    alert('最小延迟不能大于最大延迟');
                    return;
                }

                GM_setValue('queryFormat', format);
                GM_setValue('minDelay', minDelay);
                GM_setValue('maxDelay', maxDelay);
                GM_setValue('selectedReasons', selectedReasons);
                GM_setValue('selectedServers', selectedServers);

                document.body.removeChild(modal);
                document.body.removeChild(backdrop);

                resolve(); // 解析Promise，表示设置完成
            });
        });
    }

    // 创建查询控制面板
    function createControlPanel() {
        if (document.getElementById('tieba-query-panel')) {
            return;
        }

        const panel = document.createElement('div');
        panel.id = 'tieba-query-panel';

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

        // 修改：将清除按钮改为刷新页面按钮
        const refreshBtn = document.createElement('button');
        refreshBtn.id = 'tieba-query-refresh';
        refreshBtn.className = 'tieba-query-btn';
        refreshBtn.textContent = '刷新页面';

        controls.appendChild(startBtn);
        controls.appendChild(pauseBtn);
        controls.appendChild(refreshBtn);

        const statusSection = document.createElement('div');
        statusSection.className = 'status-section';

        const status = document.createElement('div');
        status.id = 'tieba-query-status';
        status.textContent = '就绪';

        const progress = document.createElement('div');
        progress.id = 'tieba-query-progress';
        progress.className = 'progress-info';
        progress.textContent = '进度: 0/0';

        statusSection.appendChild(status);
        statusSection.appendChild(progress);

        panel.appendChild(controls);
        panel.appendChild(statusSection);

        document.body.appendChild(panel);

        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'tieba-query-results-container';

        const resultsHeader = document.createElement('div');
        resultsHeader.id = 'tieba-query-results-header';
        resultsHeader.textContent = '查询结果';
        resultsHeader.addEventListener('mousedown', initDrag);

        resultsContainer.appendChild(resultsHeader);

        const results = document.createElement('div');
        results.id = 'tieba-query-results';

        resultsContainer.appendChild(results);
        document.body.appendChild(resultsContainer);

        let isQuerying = false;
        let currentIndex = 0;
        let characters = [];
        let queryTimeout = null;

        function updateStatus(text, isWaiting = false, nextCharacter = null) {
            status.innerHTML = text;
            progress.textContent = `进度: ${currentIndex}/${characters.length}`;

            if (isWaiting && nextCharacter) {
                const nextInfo = document.createElement('div');
                nextInfo.className = 'next-query-info';
                nextInfo.textContent = `下一个: ${nextCharacter.name} (${nextCharacter.server})`;
                status.appendChild(nextInfo);
            }
        }

        // 开始查询的实际逻辑
        function startQuery() {
            if (isQuerying) return;

            isQuerying = true;
            startBtn.disabled = true;
            pauseBtn.disabled = false;

            // 获取所有角色
            const allCharacters = extractCharacterInfo();

            // 获取选中的封号原因
            const selectedReasons = GM_getValue('selectedReasons', []);
            // 获取选中的服务器
            const selectedServers = GM_getValue('selectedServers', []);

            // 过滤角色：只查询选中的封号原因和服务器
            characters = allCharacters.filter(char => {
                const reasonMatch = selectedReasons.length === 0 || selectedReasons.includes(char.reason);
                const serverMatch = selectedServers.length === 0 || selectedServers.includes(char.server);
                return reasonMatch && serverMatch;
            });

            updateStatus(`找到 ${allCharacters.length} 个角色，筛选后 ${characters.length} 个角色，开始查询...`);

            startQueryProcess();
        }

        // 修改：开始按钮点击事件
        startBtn.addEventListener('click', function() {
            if (!isQuerying && currentIndex === 0) {
                // 第一次开始查询，显示设置窗口
                createSettingsModal().then(startQuery);
            } else if (!isQuerying && currentIndex > 0) {
                // 继续查询，直接开始
                startQuery();
            }
        });

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

        // 修改：刷新页面按钮事件
        refreshBtn.addEventListener('click', function() {
            location.reload();
        });

        async function startQueryProcess() {
            const queryFormat = GM_getValue('queryFormat', '{nickname}');

            for (; currentIndex < characters.length; currentIndex++) {
                if (!isQuerying) break;

                const character = characters[currentIndex];
                updateStatus(`查询中: ${character.name} (${character.server})`);

                try {
                    const result = await queryTiebaInfo(character.name, character.server, queryFormat);
                    addResultToPanel(result.characterName, result.server, character.reason, result.results);
                } catch (error) {
                    console.error(`查询 ${character.name} 时出错:`, error);
                    updateStatus(`查询 ${character.name} 时出错`);
                }

                if (currentIndex < characters.length - 1 && isQuerying) {
                    const delay = getRandomDelay();
                    const nextCharacter = characters[currentIndex + 1];
                    updateStatus(`等待中... ${Math.round(delay/1000)}秒后继续`, true, nextCharacter);

                    await new Promise(resolve => {
                        queryTimeout = setTimeout(resolve, delay);
                    });

                    if (!isQuerying) break;
                }
            }

            isQuerying = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;

            if (currentIndex >= characters.length) {
                updateStatus('查询完成');
                startBtn.textContent = '重新开始';
                currentIndex = 0;
            } else {
                updateStatus(`已暂停，已查询 ${currentIndex}/${characters.length} 个角色`);
                startBtn.textContent = '继续查询';
            }
        }

        function initDrag(e) {
            e.preventDefault();

            const container = document.getElementById('tieba-query-results-container');
            let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

            pos3 = e.clientX;
            pos4 = e.clientY;

            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;

            function elementDrag(e) {
                e.preventDefault();
                pos1 = pos3 - e.clientX;
                pos2 = pos4 - e.clientY;
                pos3 = e.clientX;
                pos4 = e.clientY;

                container.style.top = (container.offsetTop - pos2) + "px";
                container.style.left = (container.offsetLeft - pos1) + "px";
                container.style.right = "auto";
            }

            function closeDragElement() {
                document.onmouseup = null;
                document.onmousemove = null;
            }
        }
    }

    // 初始化
    function init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createControlPanel);
        } else {
            createControlPanel();
        }
    }

    // 启动脚本
    init();
})();
