// Settings module - handles system settings functionality
export class SettingsModule {
    constructor() {
        console.log('SettingsModule initialized');
    }

    async fetchSystemStatus() {
        try {
            const response = await fetch('/api/settings/system-status');
            if (!response.ok) throw new Error('获取系统状态失败');
            return await response.json();
        } catch (error) {
            console.error('获取系统状态失败:', error);
            return null;
        }
    }

    async fetchEnvConfig() {
        try {
            const response = await fetch('/api/settings/env-config');
            if (!response.ok) throw new Error('获取环境配置失败');
            return await response.json();
        } catch (error) {
            console.error('获取环境配置失败:', error);
            return {};
        }
    }

    async saveEnvConfigItem(key) {
        const input = document.querySelector(`input[data-key="${key}"]`);
        const select = document.querySelector(`select[data-key="${key}"]`);

        if (!input && !select) return;

        let value;
        if (select) {
            value = select.value;
        } else {
            value = input.value.trim();
        }
        const button = document.querySelector(`button[data-key="${key}"]`);
        
        if (button) {
            button.disabled = true;
            button.textContent = '保存中...';
        }

        try {
            const response = await fetch(`/api/settings/env-config/${key}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('配置保存成功', 'success');
            } else {
                this.showNotification(`保存失败: ${result.detail}`, 'error');
            }
        } catch (error) {
            console.error('保存配置失败:', error);
            this.showNotification('保存配置失败', 'error');
        } finally {
            if (button) {
                button.disabled = false;
                button.textContent = '保存';
            }
        }
    }

    renderSettingsSection() {
        return `
            <section id="settings-section" class="content-section">
                <div class="section-header">
                    <h2>系统设置</h2>
                </div>
                
                <div class="settings-container">
                    <div class="settings-card full-width">
                        <h3>系统状态</h3>
                        <div id="system-status-content">
                            <p>正在加载系统状态...</p>
                        </div>
                    </div>

                    <div class="settings-card full-width">
                        <h3>环境配置</h3>
                        <div id="env-config-content">
                            <p>正在加载环境配置...</p>
                        </div>
                    </div>

                    <!-- 测试功能区域 - 两列布局 -->
                    <div class="settings-row">
                        <div class="settings-card half-width">
                            <h3>🧪 代理测试</h3>
                            <div class="test-section">
                                <div class="test-info">
                                    <p>测试当前代理配置是否正常工作</p>
                                </div>
                                <div class="test-controls">
                                    <button id="test-proxy-btn" class="test-btn">🔧 测试代理连接</button>
                                    <div id="proxy-test-result" class="test-result" style="display: none;"></div>
                                </div>
                            </div>
                        </div>

                        <div class="settings-card half-width">
                            <h3>📧 SMTP邮件测试</h3>
                            <div class="test-section">
                                <div class="test-info">
                                    <p>测试SMTP邮件配置是否正常工作</p>
                                </div>
                                <div class="test-controls">
                                    <button id="test-smtp-email-btn" class="test-btn">📧 发送测试邮件</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="settings-card full-width">
                        <h3>🤖 AI提示词管理</h3>
                        <div id="prompt-manager-content">
                            <p>正在加载提示词管理器...</p>
                        </div>
                    </div>
                </div>
            </section>`;
    }

    renderSystemStatus(status) {
        if (!status) {
            return '<p class="error">❌ 无法获取系统状态</p>';
        }

        return `
            <div class="status-grid">
                <div class="status-item">
                    <span class="status-label">爬虫进程:</span>
                    <span class="status-value ${status.scraper_running ? 'running' : 'stopped'}">
                        ${status.scraper_running ? '🟢 运行中' : '🔴 已停止'}
                    </span>
                </div>
                <div class="status-item">
                    <span class="status-label">登录状态:</span>
                    <span class="status-value ${status.login_state.exists ? 'active' : 'inactive'}">
                        ${status.login_state.exists ? '🟢 已登录' : '🔴 未登录'}
                    </span>
                </div>
                <div class="status-item">
                    <span class="status-label">数据库:</span>
                    <span class="status-value ${status.database.connected ? 'active' : 'inactive'}">
                        ${status.database.connected ? `🟢 已连接 (${status.database.tables_count}张表)` : '🔴 连接失败'}
                    </span>
                </div>
                <div class="status-item smtp-status">
                    <span class="status-label">SMTP邮件:</span>
                    <span class="status-value ${status.smtp.configured ? 'active' : 'inactive'}">
                        ${status.smtp.configured ? '🟢 已配置' : '🔴 未配置'}
                    </span>
                </div>
            </div>
        `;
    }

    renderEnvConfig(config) {
        const configItems = [
            { key: 'OPENAI_BASE_URL', label: 'OpenAI API地址', type: 'url', required: true },
            { key: 'OPENAI_API_KEY', label: 'OpenAI API密钥', type: 'text', required: true },
            { key: 'OPENAI_MODEL_NAME', label: 'OpenAI模型名称', type: 'text', required: true },
            { key: 'SKIP_EXISTING_PRODUCTS', label: '跳过已存在商品', type: 'boolean', required: false },
            { key: 'PROXY_ENABLED', label: '启用代理功能', type: 'boolean', required: false },
            { key: 'PROXY_API_URL', label: '代理API地址', type: 'url', required: false },
            { key: 'PROXY_API_KEY', label: '代理API密钥', type: 'password', required: false },
            { key: 'PROXY_REFRESH_INTERVAL', label: '代理更换间隔，单位秒', type: 'number', required: false },
            { key: 'SMTP_HOST', label: '邮件-SMTP服务器', type: 'text', required: false },
            { key: 'SMTP_PORT', label: '邮件-SMTP端口', type: 'number', required: false },
            { key: 'SMTP_USER', label: '邮件-SMTP用户名', type: 'email', required: false },
            { key: 'SMTP_PASSWORD', label: '邮件-SMTP密码', type: 'text', required: false },
            { key: 'SMTP_USE_TLS', label: '邮件-SMTP使用TLS', type: 'boolean', required: false },
            { key: 'SMTP_FROM_NAME', label: '邮件-发件人名称', type: 'text', required: false },
        ];

        return `
            <table class="env-config-table">
                <thead>
                    <tr>
                        <th>配置项</th>
                        <th>环境变量名</th>
                        <th>当前值</th>
                        <th>状态</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    ${configItems.map(item => `
                        <tr>
                            <td class="config-label">${item.label}</td>
                            <td class="config-key">${item.key}</td>
                            <td class="config-input">
                                ${item.type === 'boolean' ?
                                    `<select data-key="${item.key}" class="config-select">
                                        <option value="true" ${config[item.key] === 'true' ? 'selected' : ''}>开启</option>
                                        <option value="false" ${config[item.key] === 'false' || !config[item.key] ? 'selected' : ''}>关闭</option>
                                    </select>` :
                                    item.type === 'checkbox' ?
                                        `<input type="checkbox" data-key="${item.key}" ${config[item.key] === 'true' ? 'checked' : ''}>` :
                                        `<input type="${item.type}" data-key="${item.key}" value="${config[item.key] || ''}" placeholder="请输入${item.label}">`
                                }
                            </td>
                            <td class="config-status ${item.required ? 'required' : 'optional'}">
                                ${item.required ? '必需' : '可选'}
                            </td>
                            <td class="config-actions">
                                <button class="save-config-btn" data-key="${item.key}">保存</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderPromptManager() {
        return `
            <div class="prompt-manager">
                <div class="prompt-files-panel">
                    <div class="prompt-files-header">
                        <h4>📁 文件列表</h4>
                        <button id="create-prompt-file-btn" class="create-file-btn">➕ 新建</button>
                    </div>
                    <div class="prompt-files-list" id="prompt-files-container">
                        <div class="loading-files">
                            <p>🔄 正在加载文件列表...</p>
                        </div>
                    </div>
                </div>
                <div class="prompt-editor-panel">
                    <div class="prompt-editor-header">
                        <h4 id="prompt-editor-title" class="prompt-editor-title">💡 请选择一个文件开始编辑</h4>
                        <button id="prompt-save-btn" class="prompt-save-btn" disabled>💾 保存</button>
                    </div>
                    <textarea id="prompt-editor-textarea" class="prompt-editor-textarea" readonly placeholder="👈 点击左侧的文件名开始编辑内容...

💡 提示：
• 点击文件名可以加载文件内容
• 点击'编辑'按钮也可以编辑文件
• 修改内容后记得点击'💾 保存'按钮
• 支持创建新的.txt文件"></textarea>
                </div>
            </div>
        `;
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            z-index: 10000;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    async sendTestEmail() {
        const testEmail = prompt('请输入测试邮箱地址：', '');
        if (!testEmail) return;
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(testEmail)) {
            alert('请输入有效的邮箱地址');
            return;
        }
        
        const button = document.getElementById('test-smtp-email-btn');
        const originalText = button.textContent;
        
        try {
            button.disabled = true;
            button.textContent = '发送中...';
            
            const testProductData = {
                '商品信息': {
                    '商品标题': '【测试商品】DJI Pocket 3 口袋云台相机',
                    '当前售价': '¥2,899',
                    '原价': '¥3,299',
                    '商品链接': 'https://2.taobao.com/item.htm?id=test123456',
                    '商品图片列表': ['https://via.placeholder.com/300x200?text=测试商品图片'],
                    '商品位置': '上海市 浦东新区',
                    '商品ID': 'test_123456'
                },
                '卖家信息': {
                    '卖家昵称': '测试卖家',
                    '卖家信用等级': '4钻'
                },
                '爬取时间': new Date().toISOString()
            };
            
            const testAiAnalysis = {
                'is_recommended': true,
                'reason': '这是一封测试邮件。商品价格合理，卖家信誉良好，符合您的购买需求。如果您收到这封邮件，说明您的邮件配置已经成功！'
            };
            
            const response = await fetch('/api/email/test-product', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: testEmail,
                    product_data: testProductData,
                    ai_analysis: testAiAnalysis,
                    task_name: '邮件配置测试'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert(`✅ 测试邮件发送成功！\n\n请检查邮箱 ${testEmail} 是否收到测试邮件。\n\n如果没有收到，请检查垃圾邮件文件夹。`);
            } else {
                let errorMessage = `❌ 测试邮件发送失败：\n\n${result.error}`;
                
                if (result.diagnostic) {
                    errorMessage += `\n\n📊 诊断信息：`;
                    errorMessage += `\n• SMTP服务器: ${result.diagnostic.smtp_host}:${result.diagnostic.smtp_port}`;
                    errorMessage += `\n• TLS加密: ${result.diagnostic.smtp_use_tls ? '启用' : '禁用'}`;
                    errorMessage += `\n• 错误类型: ${result.diagnostic.error_type}`;
                }
                
                if (result.suggestions && result.suggestions.length > 0) {
                    errorMessage += `\n\n💡 解决建议：`;
                    result.suggestions.forEach((suggestion, index) => {
                        errorMessage += `\n${index + 1}. ${suggestion}`;
                    });
                }
                
                errorMessage += `\n\n请检查SMTP配置是否正确。`;
                alert(errorMessage);
            }
            
        } catch (error) {
            console.error('发送测试邮件失败:', error);
            alert(`❌ 发送测试邮件时发生错误：\n\n${error.message}`);
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    async initialize() {
        console.log('Initializing settings module');
        
        try {
            await Promise.all([
                this.loadSystemStatus(),
                this.loadEnvConfig(),
                this.loadPromptManager()
            ]);
            
            this.bindEvents();
        } catch (error) {
            console.error('Error initializing settings module:', error);
        }
    }

    async loadSystemStatus() {
        const container = document.getElementById('system-status-content');
        if (!container) return;
        
        const status = await this.fetchSystemStatus();
        container.innerHTML = this.renderSystemStatus(status);
    }

    async loadEnvConfig() {
        const container = document.getElementById('env-config-content');
        if (!container) return;
        
        const config = await this.fetchEnvConfig();
        container.innerHTML = this.renderEnvConfig(config);
    }

    async loadPromptManager() {
        const container = document.getElementById('prompt-manager-content');
        if (!container) return;

        container.innerHTML = this.renderPromptManager();

        // 加载文件列表
        await this.loadPromptFiles();

        // 绑定Prompt管理器的事件
        this.bindPromptManagerEvents();
    }

    async loadPromptFiles() {
        const filesContainer = document.getElementById('prompt-files-container');
        if (!filesContainer) return;

        try {
            const response = await fetch('/api/prompts');
            if (!response.ok) throw new Error('获取文件列表失败');

            const files = await response.json();

            if (files.length === 0) {
                filesContainer.innerHTML = '<p class="no-files">暂无Prompt文件</p>';
                return;
            }

            filesContainer.innerHTML = files.map(filename => `
                <div class="prompt-file-item" data-filename="${filename}">
                    <span class="file-name" data-filename="${filename}">${filename}</span>
                    <div class="file-actions">
                        <button class="edit-file-btn" data-filename="${filename}">编辑</button>
                        <button class="delete-file-btn" data-filename="${filename}">删除</button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('加载Prompt文件列表失败:', error);
            filesContainer.innerHTML = '<p class="error">加载文件列表失败</p>';
        }
    }

    bindPromptManagerEvents() {
        // 绑定创建文件按钮
        const createBtn = document.getElementById('create-prompt-file-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.createPromptFile());
        }

        // 绑定保存按钮
        const saveBtn = document.getElementById('prompt-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.savePromptFile());
        }

        // 绑定文件操作按钮（使用事件委托）
        const filesContainer = document.getElementById('prompt-files-container');
        if (filesContainer) {
            filesContainer.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-file-btn')) {
                    const filename = e.target.dataset.filename;
                    this.editPromptFile(filename);
                } else if (e.target.classList.contains('delete-file-btn')) {
                    const filename = e.target.dataset.filename;
                    this.deletePromptFile(filename);
                } else if (e.target.classList.contains('file-name') || e.target.classList.contains('prompt-file-item')) {
                    // 点击文件名或文件项时加载文件内容
                    const filename = e.target.dataset.filename || e.target.closest('.prompt-file-item')?.dataset.filename;
                    if (filename) {
                        this.editPromptFile(filename);
                    }
                }
            });
        }
    }

    bindEvents() {
        // Bind save config buttons
        document.querySelectorAll('.save-config-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const key = e.target.dataset.key;
                await this.saveEnvConfigItem(key);
            });
        });
        
        // Bind test email button
        const testEmailBtn = document.getElementById('test-smtp-email-btn');
        if (testEmailBtn) {
            testEmailBtn.addEventListener('click', () => this.sendTestEmail());
        }

        // Bind test proxy button
        const testProxyBtn = document.getElementById('test-proxy-btn');
        if (testProxyBtn) {
            testProxyBtn.addEventListener('click', () => this.testProxy());
        }
    }

    async testProxy() {
        const testBtn = document.getElementById('test-proxy-btn');
        const resultDiv = document.getElementById('proxy-test-result');

        if (!testBtn || !resultDiv) return;

        // 禁用按钮并显示加载状态
        testBtn.disabled = true;
        testBtn.textContent = '🔄 测试中...';
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <div class="test-progress">
                <div class="progress-step active">📡 读取代理配置</div>
                <div class="progress-step">🔍 获取代理IP</div>
                <div class="progress-step">🌐 测试连接</div>
                <div class="progress-step">✅ 完成测试</div>
            </div>
        `;

        try {
            // 更新进度
            this.updateTestProgress(1, '🔍 获取代理IP中...');

            const response = await fetch('/api/test-proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();

            // 更新进度
            this.updateTestProgress(2, '🌐 测试代理连接...');

            // 等待一下让用户看到进度
            await new Promise(resolve => setTimeout(resolve, 1000));

            // 显示测试结果
            this.updateTestProgress(3, '✅ 测试完成');
            this.displayProxyTestResult(result);

        } catch (error) {
            console.error('代理测试失败:', error);
            resultDiv.innerHTML = `
                <div class="test-result error">
                    <h4>❌ 测试失败</h4>
                    <p>网络错误: ${error.message}</p>
                </div>
            `;
        } finally {
            // 恢复按钮状态
            testBtn.disabled = false;
            testBtn.textContent = '🧪 测试代理连接';
        }
    }

    updateTestProgress(step, message) {
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach((stepEl, index) => {
            if (index < step) {
                stepEl.classList.add('completed');
                stepEl.classList.remove('active');
            } else if (index === step) {
                stepEl.classList.add('active');
                stepEl.classList.remove('completed');
            } else {
                stepEl.classList.remove('active', 'completed');
            }
        });

        if (message) {
            const progressDiv = document.querySelector('.test-progress');
            if (progressDiv) {
                progressDiv.innerHTML += `<div class="progress-message">${message}</div>`;
            }
        }
    }

    displayProxyTestResult(result) {
        const resultDiv = document.getElementById('proxy-test-result');
        const details = result.details || {};

        let resultHtml = '';

        if (result.success) {
            resultHtml = `
                <div class="test-result success">
                    <h4>✅ 代理测试成功</h4>
                    <p>${result.message}</p>
                    <div class="test-details">
                        <div class="detail-item">
                            <span class="label">代理IP:</span>
                            <span class="value">${details.proxy_ip || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">响应时间:</span>
                            <span class="value">${details.response_time || 'N/A'}ms</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">测试URL:</span>
                            <span class="value">${details.test_url || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            resultHtml = `
                <div class="test-result error">
                    <h4>❌ 代理测试失败</h4>
                    <p>${result.message}</p>
                    <div class="test-details">
                        <div class="detail-item">
                            <span class="label">代理启用:</span>
                            <span class="value">${details.proxy_enabled ? '是' : '否'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">API地址:</span>
                            <span class="value">${details.proxy_api_url || '未配置'}</span>
                        </div>
                        ${details.proxy_ip ? `
                        <div class="detail-item">
                            <span class="label">获取的IP:</span>
                            <span class="value">${details.proxy_ip}</span>
                        </div>
                        ` : ''}
                        ${details.error ? `
                        <div class="detail-item">
                            <span class="label">错误信息:</span>
                            <span class="value error-text">${details.error}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }

        resultDiv.innerHTML = resultHtml;
    }

    async createPromptFile() {
        const filename = prompt('请输入文件名（必须以.txt结尾）:');
        if (!filename) return;

        if (!filename.endsWith('.txt')) {
            alert('文件名必须以.txt结尾');
            return;
        }

        try {
            const response = await fetch(`/api/prompts/${filename}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: '' })
            });

            if (response.ok) {
                this.showNotification('文件创建成功', 'success');
                await this.loadPromptFiles();
                await this.editPromptFile(filename);
            } else {
                const error = await response.json();
                alert(`创建文件失败: ${error.detail}`);
            }
        } catch (error) {
            console.error('创建文件失败:', error);
            alert('创建文件失败');
        }
    }

    async editPromptFile(filename) {
        try {
            const response = await fetch(`/api/prompts/${filename}`);
            if (!response.ok) throw new Error('获取文件内容失败');

            const data = await response.json();

            // 更新编辑器
            const titleEl = document.getElementById('prompt-editor-title');
            const textareaEl = document.getElementById('prompt-editor-textarea');
            const saveBtn = document.getElementById('prompt-save-btn');

            if (titleEl) titleEl.textContent = `编辑: ${filename}`;
            if (textareaEl) {
                textareaEl.value = data.content;
                textareaEl.readOnly = false;
                textareaEl.dataset.filename = filename;
            }
            if (saveBtn) saveBtn.disabled = false;

            // 高亮当前选中的文件
            document.querySelectorAll('.prompt-file-item').forEach(item => {
                item.classList.toggle('active', item.dataset.filename === filename);
            });

        } catch (error) {
            console.error('加载文件内容失败:', error);
            alert('加载文件内容失败');
        }
    }

    async savePromptFile() {
        const textareaEl = document.getElementById('prompt-editor-textarea');
        const saveBtn = document.getElementById('prompt-save-btn');

        if (!textareaEl || !textareaEl.dataset.filename) return;

        const filename = textareaEl.dataset.filename;
        const content = textareaEl.value;

        try {
            saveBtn.disabled = true;
            saveBtn.textContent = '保存中...';

            const response = await fetch(`/api/prompts/${filename}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                this.showNotification('文件保存成功', 'success');
            } else {
                const error = await response.json();
                alert(`保存失败: ${error.detail}`);
            }
        } catch (error) {
            console.error('保存文件失败:', error);
            alert('保存文件失败');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 保存';
        }
    }

    async deletePromptFile(filename) {
        if (!confirm(`确定要删除文件 "${filename}" 吗？此操作不可恢复。`)) {
            return;
        }

        try {
            const response = await fetch(`/api/prompts/${filename}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                this.showNotification('文件删除成功', 'success');
                await this.loadPromptFiles();

                // 清空编辑器
                const titleEl = document.getElementById('prompt-editor-title');
                const textareaEl = document.getElementById('prompt-editor-textarea');
                const saveBtn = document.getElementById('prompt-save-btn');

                if (titleEl) titleEl.textContent = '请选择一个文件';
                if (textareaEl) {
                    textareaEl.value = '';
                    textareaEl.readOnly = true;
                    delete textareaEl.dataset.filename;
                }
                if (saveBtn) saveBtn.disabled = true;

            } else {
                const error = await response.json();
                alert(`删除失败: ${error.detail}`);
            }
        } catch (error) {
            console.error('删除文件失败:', error);
            alert('删除文件失败');
        }
    }
}
