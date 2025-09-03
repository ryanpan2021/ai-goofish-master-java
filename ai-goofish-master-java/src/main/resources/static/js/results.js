// Results module - handles result viewing functionality
export class ResultsModule {
    constructor() {
        console.log('ResultsModule initialized');
    }

    async fetchResultFiles() {
        try {
            const response = await fetch('/api/results/files');
            if (!response.ok) throw new Error('无法获取结果文件列表');
            return await response.json();
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    async fetchResultContent(filename, recommendedOnly = false) {
        try {
            const params = new URLSearchParams({
                page: 1,
                limit: 100,
                recommended_only: recommendedOnly
            });
            const response = await fetch(`/api/results/${filename}?${params}`);
            if (!response.ok) throw new Error('无法获取结果内容');
            return await response.json();
        } catch (error) {
            console.error('获取结果内容失败:', error);
            throw error;
        }
    }

    renderResultsSection() {
        return `
            <section id="results-section" class="content-section">
                <div class="results-filter-bar">
                    ${this.renderFilterBar()}
                </div>
                <div id="results-grid-container">
                    <div class="loading-container">
                        <div class="loading-spinner"></div>
                        <p>正在加载商品数据...</p>
                    </div>
                </div>
            </section>`;
    }

    renderFilterBar() {
        return `
            <div class="filter-group">
                <label class="filter-label">选择任务</label>
                <select id="result-file-selector">
                    <option>加载中...</option>
                </select>
            </div>
            <div class="filter-group">
                <label class="filter-label">筛选条件</label>
                <label class="custom-checkbox">
                    <input type="checkbox" id="recommended-only-checkbox">
                    <span class="checkbox-indicator"></span>
                    仅显示AI推荐
                </label>
            </div>
            <div class="filter-group">
                <label class="filter-label">操作</label>
                <button id="refresh-results-btn" class="refresh-btn">
                    <span class="refresh-icon">🔄</span>
                    刷新数据
                </button>
            </div>
        `;
    }

    renderResultsGrid(data) {
        if (!data || !data.items || data.items.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-state-icon">📦</div>
                    <h3>暂无商品数据</h3>
                    <p>该任务还没有找到任何商品，或者所有商品都被筛选条件过滤掉了。</p>
                </div>
            `;
        }

         const cards = data.items.map((item, index) => {
            const info = item.商品信息 || {};
            const seller = item.卖家信息 || {};
            const ai = item.ai_analysis || {};
            const detailStatus = item.详情获取状态 || '成功';

            const isRecommended = ai.is_recommended === true;
            const isNotRecommended = ai.is_recommended === false;
            const isFailed = ai.status === 'failed' || ai.error;
            const isPending = !isRecommended && !isNotRecommended && !isFailed;
            const hasDetailIssue = detailStatus !== '成功';
            
            let recommendationClass, recommendationText, badgeClass;
            if (isFailed) {
                recommendationClass = 'failed';
                recommendationText = 'AI分析失败';
                badgeClass = 'failed';
            } else if (isRecommended) {
                recommendationClass = 'recommended';
                recommendationText = 'AI推荐';
                badgeClass = 'recommended';
            } else if (isNotRecommended) {
                recommendationClass = 'not-recommended';
                recommendationText = 'AI不推荐';
                badgeClass = 'not-recommended';
            } else {
                recommendationClass = 'pending';
                recommendationText = '待分析';
                badgeClass = 'pending';
            }
            
            const imageUrl = (info.商品图片列表 && info.商品图片列表[0]) ? 
                info.商品图片列表[0] : 
                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuaXoOWbvueJhzwvdGV4dD48L3N2Zz4=';

            let reason, shortReason, needsExpansion;
            if (isFailed) {
                reason = ai.error || '分析过程中发生错误';
                shortReason = reason.length > 100 ? reason.substring(0, 100) + '...' : reason;
                needsExpansion = reason.length > 100;
            } else {
                reason = ai.reason || '暂无分析';
                shortReason = reason.length > 100 ? reason.substring(0, 100) + '...' : reason;
                needsExpansion = reason.length > 100;
            }

            // 构建操作按钮 - 移除查看详情按钮
            let actionButtons = '';
            if (isFailed) {
                actionButtons += `<button class="retry-analysis-btn" data-product-id="${info.商品ID}">重新分析</button>`;
            }
            if (hasDetailIssue) {
                actionButtons += `<button class="retry-detail-btn" data-product-id="${info.商品ID}">重新获取详情</button>`;
            }

            // 详情状态指示器
            let detailStatusIndicator = '';
            if (hasDetailIssue) {
                detailStatusIndicator = `<div class="detail-status-warning" title="详情获取状态: ${detailStatus}">⚠️ 商品详情获取不完整</div>`;
            }

            return `
            <div class="result-card" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}' data-index="${index}">
                <div class="recommendation-badge ${badgeClass}">${recommendationText}</div>
                ${detailStatusIndicator}
                <div class="card-image">
                    <a href="${info.商品链接 || '#'}" target="_blank">
                        <img src="${imageUrl}" 
                             alt="${info.商品标题 || '商品图片'}" 
                             loading="lazy"
                             data-loading="true"
                             onload="this.setAttribute('data-loaded', 'true'); this.setAttribute('data-loading', 'false');"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';">
                    </a>
                </div>
                <div class="card-content">
                    <h3 class="card-title">
                        <a href="${info.商品链接 || '#'}" target="_blank" title="${info.商品标题 || ''}">
                            ${info.商品标题 || '无标题'}
                        </a>
                    </h3>
                    <div class="card-ai-summary ${recommendationClass}">
                        <strong>${recommendationText}</strong>
                        <p class="ai-reason" data-full-reason="${reason.replace(/"/g, '&quot;')}" title="点击查看完整分析">
                            ${shortReason}
                        </p>
                        ${needsExpansion ? '<button class="expand-btn" data-expanded="false">展开</button>' : ''}
                    </div>
                    <div class="card-footer">
                        <div class="seller-price-row">
                            <span class="seller-info">${info.卖家昵称 || seller.卖家昵称 || '未知卖家'}</span>
                            <p class="card-price">${info.当前售价 || '价格未知'}</p>
                        </div>
                        ${actionButtons ? `<div class="card-actions">${actionButtons}</div>` : ''}
                    </div>
                </div>
            </div>
            `;
        }).join('');

        return `
            <div class="results-summary">
                <p>共找到 <strong>${data.items.length}</strong> 个商品</p>
            </div>
            <div id="results-grid">
                ${cards}
            </div>
        `;
    }

    renderResultCard(item, index) {
        // 兼容新旧数据格式
        const itemInfo = item['商品信息'] || item;
        const sellerInfo = item['卖家信息'] || {};
        const aiAnalysis = item['AI分析结果'] || item['ai_analysis'] || {};
        
        const title = itemInfo['商品标题'] || '无标题';
        const price = itemInfo['当前售价'] || itemInfo['商品价格'] || '价格未知';
        const location = itemInfo['商品位置'] || '位置未知';
        const images = itemInfo['商品图片列表'] || [];
        const mainImage = images.length > 0 ? images[0] : '/static/placeholder.jpg';
        const productLink = itemInfo['商品链接'] || '#';
        
        const sellerName = sellerInfo['卖家昵称'] || itemInfo['卖家昵称'] || '未知卖家';
        const sellerLevel = sellerInfo['卖家等级'] || '未知';
        
        // 兼容不同的AI分析结果格式
        const isRecommended = aiAnalysis['推荐购买'] === true || aiAnalysis['is_recommended'] === true;
        const aiReason = aiAnalysis['推荐理由'] || aiAnalysis['不推荐理由'] || aiAnalysis['reason'] || '暂无AI分析';
        const aiScore = aiAnalysis['综合评分'] || 'N/A';
        
        const detailStatus = item['详情获取状态'] || '未知';
        const productId = itemInfo['商品ID'] || 'unknown';

        const reasonPreview = aiReason.length > 100 ? aiReason.substring(0, 100) + '...' : aiReason;
        const needsExpansion = aiReason.length > 100;

        return `
            <div class="result-card" data-item='${JSON.stringify(item).replace(/'/g, "&#39;")}' data-index="${index}">
                <div class="recommendation-badge ${badgeClass}">${recommendationText}</div>
                ${detailStatusIndicator}
                <div class="card-image">
                    <a href="${info.商品链接 || '#'}" target="_blank">
                        <img src="${imageUrl}" 
                             alt="${info.商品标题 || '商品图片'}" 
                             loading="lazy"
                             data-loading="true"
                             onload="this.setAttribute('data-loaded', 'true'); this.setAttribute('data-loading', 'false');"
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPuWKoOi9veWksei0pTwvdGV4dD48L3N2Zz4=';">
                    </a>
                </div>
                <div class="card-content">
                    <h3 class="card-title">
                        <a href="${info.商品链接 || '#'}" target="_blank" title="${info.商品标题 || ''}">
                            ${info.商品标题 || '无标题'}
                        </a>
                    </h3>
                    <div class="card-ai-summary ${recommendationClass}">
                        <strong>${recommendationText}</strong>
                        <p class="ai-reason" data-full-reason="${reason.replace(/"/g, '&quot;')}" title="点击查看完整分析">
                            ${shortReason}
                        </p>
                        ${needsExpansion ? '<button class="expand-btn" data-expanded="false">展开</button>' : ''}
                    </div>
                    <div class="card-footer">
                        <div class="seller-price-row">
                            <span class="seller-info">${info.卖家昵称 || seller.卖家昵称 || '未知卖家'}</span>
                            <p class="card-price">${info.当前售价 || '价格未知'}</p>
                            <button class="action-btn view-json-btn">查看详情</button>
                        </div>
                        ${actionButtons ? `<div class="card-actions">${actionButtons}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    formatJsonContent(data) {
        return `<pre class="json-content">${JSON.stringify(data, null, 2)}</pre>`;
    }

    async fetchAndRenderResults() {
        const selector = document.getElementById('result-file-selector');
        const checkbox = document.getElementById('recommended-only-checkbox');
        const container = document.getElementById('results-grid-container');
        const refreshBtn = document.getElementById('refresh-results-btn');

        const selectedFile = selector.value;
        const recommendedOnly = checkbox.checked;

        if (!selectedFile || selectedFile === '加载中...' || selectedFile === '暂无可用任务') {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">📋</div>
                    <h3>请选择任务</h3>
                    <p>请从上方下拉菜单中选择一个任务来查看结果。</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="loading-container">
                <div class="loading-spinner"></div>
                <p>正在加载 "${selectedFile}" 的商品数据...</p>
            </div>
        `;

        if (refreshBtn) {
            refreshBtn.classList.add('loading');
            refreshBtn.disabled = true;
        }

        try {
            const data = await this.fetchResultContent(selectedFile, recommendedOnly);
            container.innerHTML = this.renderResultsGrid(data);
            
            this.initializeResultsInteractions();
            
        } catch (error) {
            console.error('获取结果数据失败:', error);
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <h3>加载失败</h3>
                    <p>无法加载商品数据，请检查网络连接后重试。</p>
                </div>
            `;
        } finally {
            if (refreshBtn) {
                refreshBtn.classList.remove('loading');
                refreshBtn.disabled = false;
            }
        }
    }

    initializeResultsInteractions() {
        const container = document.getElementById('results-grid-container');
        if (!container) return;

        // Expand/collapse AI analysis reason
        container.addEventListener('click', (event) => {
            if (event.target.classList.contains('expand-btn')) {
                const btn = event.target;
                const reasonElement = btn.parentElement.querySelector('.ai-reason');
                const isExpanded = btn.getAttribute('data-expanded') === 'true';
                
                if (isExpanded) {
                    reasonElement.classList.remove('expanded');
                    reasonElement.textContent = reasonElement.getAttribute('data-full-reason').substring(0, 100) + '...';
                    btn.textContent = '展开';
                    btn.setAttribute('data-expanded', 'false');
                } else {
                    reasonElement.classList.add('expanded');
                    reasonElement.textContent = reasonElement.getAttribute('data-full-reason');
                    btn.textContent = '收起';
                    btn.setAttribute('data-expanded', 'true');
                }
            }
            
            // Click card to view details (exclude buttons and links)
            else if (event.target.closest('.result-card') && 
                     !event.target.closest('button') && 
                     !event.target.closest('a') && 
                     !event.target.classList.contains('expand-btn')) {
                const card = event.target.closest('.result-card');
                const itemData = JSON.parse(card.dataset.item);
                const jsonContent = document.getElementById('json-viewer-content');
                
                jsonContent.innerHTML = this.formatJsonContent(itemData);
                
                const modal = document.getElementById('json-viewer-modal');
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('visible'), 10);
            }
        });

        // Handle retry buttons
        container.addEventListener('click', async (event) => {
            if (event.target.classList.contains('retry-analysis-btn')) {
                const productId = event.target.getAttribute('data-product-id');
                const button = event.target;
                
                button.disabled = true;
                button.textContent = '分析中...';
                
                try {
                    const response = await fetch('/api/retry-analysis', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product_id: productId })
                    });
                    
                    if (response.ok) {
                        alert('重新分析请求已提交，请稍后刷新查看结果');
                        await this.fetchAndRenderResults();
                    } else {
                        const error = await response.json();
                        alert(`重新分析失败: ${error.detail || '未知错误'}`);
                    }
                } catch (error) {
                    console.error('重新分析失败:', error);
                    alert('重新分析失败，请检查网络连接');
                } finally {
                    button.disabled = false;
                    button.textContent = '重新分析';
                }
            }
            
            else if (event.target.classList.contains('retry-detail-btn')) {
                const productId = event.target.getAttribute('data-product-id');
                const button = event.target;
                
                button.disabled = true;
                button.textContent = '获取中...';
                
                try {
                    const response = await fetch('/api/retry-detail', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ product_id: productId })
                    });
                    
                    if (response.ok) {
                        alert('重新获取详情请求已提交，请稍后刷新查看结果');
                        await this.fetchAndRenderResults();
                    } else {
                        const error = await response.json();
                        alert(`重新获取详情失败: ${error.detail || '未知错误'}`);
                    }
                } catch (error) {
                    console.error('重新获取详情失败:', error);
                    alert('重新获取详情失败，请检查网络连接');
                } finally {
                    button.disabled = false;
                    button.textContent = '重新获取详情';
                }
            }

            else if (event.target.classList.contains('view-json-btn')) {
                const card = event.target.closest('.result-card');
                const itemData = JSON.parse(card.dataset.item);
                const jsonContent = document.getElementById('json-viewer-content');
                
                jsonContent.innerHTML = this.formatJsonContent(itemData);
                
                const modal = document.getElementById('json-viewer-modal');
                modal.style.display = 'flex';
                setTimeout(() => modal.classList.add('visible'), 10);
            }
        });

        // Implement lazy loading optimization for images
        const images = container.querySelectorAll('img[loading="lazy"]');
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.setAttribute('data-loading', 'false');
                        observer.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    async initialize() {
        const selector = document.getElementById('result-file-selector');
        const checkbox = document.getElementById('recommended-only-checkbox');
        const refreshBtn = document.getElementById('refresh-results-btn');

        try {
            const fileData = await this.fetchResultFiles();
            if (fileData && fileData.files && fileData.files.length > 0) {
                selector.innerHTML = fileData.files.map(f => `<option value="${f}">${f}</option>`).join('');
                
                // Bind event listeners
                selector.addEventListener('change', () => this.fetchAndRenderResults());
                checkbox.addEventListener('change', () => this.fetchAndRenderResults());
                refreshBtn.addEventListener('click', () => this.fetchAndRenderResults());
                
                // Initial load
                await this.fetchAndRenderResults();
            } else {
                selector.innerHTML = '<option value="">暂无可用任务</option>';
                document.getElementById('results-grid-container').innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">🔍</div>
                        <h3>暂无监控任务</h3>
                        <p>还没有找到任何监控任务的结果文件。请先在"任务管理"页面创建并运行监控任务。</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('初始化结果视图失败:', error);
            selector.innerHTML = '<option value="">加载失败</option>';
            document.getElementById('results-grid-container').innerHTML = `
                <div class="empty-state">
                    <div class="empty-state-icon">❌</div>
                    <h3>初始化失败</h3>
                    <p>无法加载任务列表，请刷新页面重试。</p>
                </div>
            `;
        }

        // JSON Viewer Modal events
        const jsonViewerModal = document.getElementById('json-viewer-modal');
        const closeBtn = document.getElementById('close-json-viewer-btn');
        
        const closeModal = () => {
            jsonViewerModal.classList.remove('visible');
            setTimeout(() => {
                jsonViewerModal.style.display = 'none';
            }, 300);
        };

        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        jsonViewerModal.addEventListener('click', (event) => {
            if (event.target === jsonViewerModal) {
                closeModal();
            }
        });
    }
}
