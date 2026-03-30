/**
 * 书页阅读应用 - 使用 Pretext 进行文本布局
 */

// 从 pretext 库导入函数（通过 CDN）
import { prepare, layout, prepareWithSegments, layoutWithLines } from 'https://cdn.jsdelivr.net/npm/@chenglou/pretext@0.0.3/+esm';

// 应用状态
const state = {
    currentPage: 1,
    totalPages: 3,
    paragraphs: [],
    paragraphsPerPage: []
};

// DOM 元素
const elements = {
    prevBtn: document.getElementById('prev-btn'),
    nextBtn: document.getElementById('next-btn'),
    pageNumber: document.getElementById('page-number'),
    contentArea: document.querySelector('.content-paragraphs')
};

/**
 * 初始化应用
 */
async function init() {
    console.log('📖 初始化书页阅读应用...');
    
    // 获取所有段落
    const paragraphs = document.querySelectorAll('.paragraph');
    state.paragraphs = Array.from(paragraphs).map(p => ({
        text: p.textContent,
        element: p
    }));

    // 使用 pretext 计算每页可容纳的段落
    calculatePagination();
    
    // 渲染第一页
    renderPage(1);
    
    // 绑定事件
    elements.prevBtn.addEventListener('click', () => goToPage(state.currentPage - 1));
    elements.nextBtn.addEventListener('click', () => goToPage(state.currentPage + 1));
    
    // 监听窗口大小变化
    window.addEventListener('resize', debounce(() => {
        calculatePagination();
        renderPage(state.currentPage);
    }, 250));

    console.log('✅ 应用初始化完成');
}

/**
 * 使用 pretext 计算文本布局
 */
function calculatePagination() {
    const contentWidth = document.querySelector('.page-content').clientWidth - 120;
    const contentHeight = 500;
    const lineHeight = 36;
    
    // 使用 pretext 测量文本
    const font = '18px "Noto Serif SC", "Source Han Serif SC", serif';
    
    state.paragraphsPerPage = [];
    let currentPageParagraphs = [];
    let currentHeight = 0;
    
    state.paragraphs.forEach((paragraph, index) => {
        // 使用 pretext 计算段落高度
        const prepared = prepare(paragraph.text, font);
        const { height, lineCount } = layout(prepared, contentWidth, lineHeight);
        
        const paragraphHeight = height + 20; // 添加段落间距
        
        if (currentHeight + paragraphHeight > contentHeight && currentPageParagraphs.length > 0) {
            // 当前页已满，开始新页
            state.paragraphsPerPage.push([...currentPageParagraphs]);
            currentPageParagraphs = [];
            currentHeight = 0;
        }
        
        currentPageParagraphs.push({
            ...paragraph,
            height: paragraphHeight,
            lineCount: lineCount
        });
        currentHeight += paragraphHeight;
    });
    
    // 添加最后一页
    if (currentPageParagraphs.length > 0) {
        state.paragraphsPerPage.push(currentPageParagraphs);
    }
    
    state.totalPages = state.paragraphsPerPage.length;
    console.log(`📄 计算完成：共 ${state.totalPages} 页`);
}

/**
 * 渲染指定页面
 */
function renderPage(pageNum) {
    if (pageNum < 1 || pageNum > state.totalPages) return;
    
    state.currentPage = pageNum;
    
    // 更新页码显示
    elements.pageNumber.textContent = pageNum;
    
    // 更新按钮状态
    elements.prevBtn.disabled = pageNum === 1;
    elements.nextBtn.disabled = pageNum === state.totalPages;
    
    // 获取当前页的段落
    const pageParagraphs = state.paragraphsPerPage[pageNum - 1] || [];
    
    // 清空并重新渲染内容
    const contentDivs = document.querySelectorAll('.content-paragraphs');
    contentDivs.forEach(div => {
        if (div !== elements.contentArea?.closest('.content-paragraphs')) {
            div.innerHTML = '';
        }
    });
    
    // 渲染段落
    const firstContentDiv = document.querySelector('.content-paragraphs');
    if (firstContentDiv) {
        firstContentDiv.innerHTML = pageParagraphs.map(p => 
            `<p class="paragraph" style="text-indent: 2em; margin-bottom: 20px; line-height: 2; font-size: 18px;">${p.text}</p>`
        ).join('');
    }
    
    // 添加翻页动画
    document.querySelector('.page-content').style.animation = 'none';
    setTimeout(() => {
        document.querySelector('.page-content').style.animation = 'fadeIn 0.3s ease';
    }, 10);
    
    console.log(`📖 渲染第 ${pageNum} 页，共 ${pageParagraphs.length} 段`);
}

/**
 * 跳转到指定页
 */
function goToPage(pageNum) {
    if (pageNum >= 1 && pageNum <= state.totalPages) {
        renderPage(pageNum);
    }
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 添加淡入动画 CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    
    .page-content {
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(style);

// 启动应用
init().catch(console.error);
