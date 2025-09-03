// Logs module - handles log viewing functionality
export class LogsModule {
    constructor() {
        this.logsState = {
            currentPage: 1,
            hasMore: true,
            loading: false,
            taskFilter: '',
            levelFilter: '',
            autoRefreshInterval: 0,
            autoRefreshTimer: null,
            countdownTimer: null
        };
    }

    async fetchTasks() {
        try {
            const response = await fetch('/api/tasks');
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error("无法获取任务列表:", error);
            return null;
        }
    }

    async fetchLogs(page = 1, reset = false) {
        if (this.logsState.loading) return;
        
        this.logsState.loading = true;
        
        if (reset) {
            this.logsState.currentPage = 1;
            this.logsState.hasMore = true;
        }

        try {
            const params = new URLSearchParams({
                page: reset ? 1 : page,
                limit: '50'
            });

            if (this.logsState.taskFilter) {
                params.append('task_id', this.logsState.taskFilter);
            }
            if (this.logsState.levelFilter) {
                params.append('level', this.logsState.levelFilter);
            }

            const response = await fetch(`/api/logs?${params}`);
            if (!response.ok) throw new Error('获取日志失败');
            
            const data = await response.json();
            
            if (reset) {
                this.renderLogs(data.logs, true);
            } else {
                this.appendLogs(data.logs);
            }
            
            this.logsState.hasMore = data.has_more;
            this.logsState.currentPage = data.current_page || page;
            
        } catch (error) {
            console.error('获取日志失败:', error);
            if (reset) {
                const container = document.getElementById('logs-container');
                if (container) {
                    container.innerHTML = `
                        <div class="error-message">
                            <p>❌ 获取日志失败: ${error.message}</p>
                            <button onclick="window.logsModule.fetchLogs(1, true)" class="retry-btn">重试</button>
                        </div>
                    `;
                }
            }
        } finally {
            this.logsState.loading = false;
        }
    }

    renderLogsSection() {
        return `
            <section id="logs-section" class="content-section">
                <div class="section-header">
                    <h2>运行日志</h2>
                    <div class="logs-controls">
                        <select id="log-level-filter" class="filter-select">
                            <option value="">所有级别</option>
                            <option value="INFO">信息</option>
                            <option value="WARNING">警告</option>
                            <option value="ERROR">错误</option>
                        </select>
                        <select id="auto-refresh-select" class="filter-select">
                            <option value="0">手动刷新</option>
                            <option value="5">5秒自动刷新</option>
                            <option value="10" selected>10秒自动刷新</option>
                            <option value="30">30秒自动刷新</option>
                        </select>
                        <button id="refresh-logs-btn" class="refresh-btn">
                            <span class="refresh-icon">🔄</span>
                            刷新日志
                        </button>
                        <button id="clear-logs-btn" class="control-button">🗑️ 清空日志</button>
                    </div>
                </div>
                <div id="logs-container">
                    <div class="logs-list">
                        <p>正在加载日志...</p>
                    </div>
                </div>
            </section>`;
    }

    
    renderLogsList(logs) {
        if (!logs || logs.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📝</div>
                    <h3>暂无日志</h3>
                    <p>还没有任何运行日志。</p>
                </div>
            `;
        }

        return logs.map(log => {
            const logClass = this.getLogClass(log.level);
            return `
                <div class="log-item ${logClass}">
                    <div class="log-header">
                        <span class="log-time">${new Date(log.timestamp).toLocaleString()}</span>
                        <span class="log-level log-${log.level.toLowerCase()}">${log.level}</span>
                    </div>
                    <div class="log-message">${log.message}</div>
                    ${log.details ? `<div class="log-details">${log.details}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    getLogClass(level) {
        const levelMap = {
            'INFO': 'log-info',
            'WARNING': 'log-warning', 
            'ERROR': 'log-error',
            'DEBUG': 'log-debug'
        };
        return levelMap[level] || 'log-info';
    }

    setupAutoRefresh(interval) {
        // Clear existing timers
        if (this.logsState.autoRefreshTimer) {
            clearInterval(this.logsState.autoRefreshTimer);
            this.logsState.autoRefreshTimer = null;
        }
        if (this.logsState.countdownTimer) {
            clearInterval(this.logsState.countdownTimer);
            this.logsState.countdownTimer = null;
        }

        if (interval <= 0) {
            document.getElementById('refresh-countdown').textContent = '';
            return;
        }

        this.logsState.autoRefreshInterval = interval;
        let countdown = interval;

        // Update countdown display
        const updateCountdown = () => {
            const countdownElement = document.getElementById('refresh-countdown');
            if (countdownElement) {
                countdownElement.textContent = `(${countdown}s)`;
            }
            countdown--;
            
            if (countdown < 0) {
                countdown = interval;
                this.fetchLogs(1, true);
            }
        };

        // Start countdown timer
        updateCountdown();
        this.logsState.countdownTimer = setInterval(updateCountdown, 1000);
    }

    async initialize() {
        console.log('Initializing logs module');
        
        // Load tasks for filter
        const tasks = await this.fetchTasks();
        const taskFilter = document.getElementById('task-filter');
        if (tasks && taskFilter) {
            const taskOptions = tasks.map(task => 
                `<option value="${task.id}">${task.task_name}</option>`
            ).join('');
            taskFilter.innerHTML = '<option value="">所有任务</option>' + taskOptions;
        }

        // Bind events
        this.bindEvents();

        // Initial load
        await this.fetchLogs(1, true);
    }

    renderLogs(logs, reset = false) {
        const container = document.getElementById('logs-container');
        if (!container) return;
        
        if (reset) {
            if (logs && logs.length > 0) {
                container.innerHTML = `<div class="logs-list" id="logs-list"></div>`;
                const logsList = document.getElementById('logs-list');
                logs.forEach(log => {
                    const logItem = this.createLogItem(log);
                    logsList.appendChild(logItem);
                });
            } else {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📝</div>
                        <h3>暂无日志</h3>
                        <p>还没有任何运行日志。</p>
                    </div>
                `;
            }
        } else {
            const logsList = document.getElementById('logs-list');
            if (logsList) {
                logs.forEach(log => {
                    const logItem = this.createLogItem(log);
                    logsList.appendChild(logItem);
                });
            }
        }
    }

    appendLogs(logs) {
        this.renderLogs(logs, false);
    }

    createLogItem(log) {
        const item = document.createElement('div');
        item.className = `log-item log-${log.level.toLowerCase()}`;
        
        const timestamp = new Date(log.timestamp).toLocaleString('zh-CN');
        const taskName = log.task_name || `任务${log.task_id}`;
        
        item.innerHTML = `
            <div class="log-header">
                <span class="log-timestamp">${timestamp}</span>
                <span class="log-level log-level-${log.level.toLowerCase()}">${log.level}</span>
                <span class="log-task">${taskName}</span>
            </div>
            <div class="log-message">${this.escapeHtml(log.message)}</div>
            ${log.details ? `<div class="log-details">${this.renderLogDetails(log.details)}</div>` : ''}
        `;
        
        return item;
    }

    renderLogDetails(details) {
        if (typeof details === 'object') {
            return `<pre class="log-details-json">${JSON.stringify(details, null, 2)}</pre>`;
        }
        return `<div class="log-details-text">${this.escapeHtml(details.toString())}</div>`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    bindEvents() {
        const refreshBtn = document.getElementById('refresh-logs-btn');
        const levelFilter = document.getElementById('log-level-filter');
        const autoRefreshSelect = document.getElementById('auto-refresh-select');

        // Refresh button
        if (refreshBtn) {
            refreshBtn.addEventListener('click', async () => {
                const icon = refreshBtn.querySelector('.refresh-icon');
                
                refreshBtn.classList.add('loading');
                if (icon) icon.style.animation = 'spin 1s linear infinite';
                
                try {
                    await this.fetchLogs(1, true);
                    // Reset auto refresh countdown after manual refresh
                    if (this.logsState.autoRefreshInterval > 0) {
                        this.setupAutoRefresh(this.logsState.autoRefreshInterval);
                    }
                } finally {
                    refreshBtn.classList.remove('loading');
                    if (icon) icon.style.animation = '';
                }
            });
        }

        // Level filter
        if (levelFilter) {
            levelFilter.addEventListener('change', (e) => {
                this.logsState.levelFilter = e.target.value;
                this.fetchLogs(1, true);
            });
        }

        // Auto refresh
        if (autoRefreshSelect) {
            autoRefreshSelect.addEventListener('change', (e) => {
                const interval = parseInt(e.target.value);
                this.setupAutoRefresh(interval);
            });
            
            // Set default auto refresh
            this.setupAutoRefresh(10);
        }
    }
}
