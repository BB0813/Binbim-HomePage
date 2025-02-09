// ========== 初始化函数 ==========
document.addEventListener('DOMContentLoaded', () => {
    // 现代特性检测（保持不变）
    if (!('IntersectionObserver' in window)) {
        alert('您的浏览器不支持现代特性，建议使用最新版Chrome或Edge');
        return;
    }

    // ==================== 粒子系统初始化 ====================
    const initParticles = () => {
        particlesJS('particles', {/* 参数保持原有配置 */});
    };

    // ==================== 修复增强主题系统 ====================
    const ThemeModule = (() => {
        let isDark = localStorage.getItem('theme') === 'dark';
        const storageKey = 'theme';

        const updateVisuals = () => {
            // 更新核心视觉元素
            document.body.classList.toggle('dark-mode', isDark);
            document.getElementById('theme-toggle').innerHTML =
                `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i>`;

            // 更新粒子颜色
            if (window.pJSDom?.[0]?.pJS) {
                const particles = pJSDom[0].pJS;
                particles.particles.color.value = isDark ? '#FFFFFF' : '#7F5FFF';
                particles.particles.line_linked.color.value = isDark ? '#CCCCCC' : '#A68EFF';
                particles.fn.particlesRefresh();
            }
        };

        const handleThemeToggle = () => {
            isDark = !isDark;
            localStorage.setItem(storageKey, isDark ? 'dark' : 'light');
            updateVisuals();
        };

        return {
            init() {
                // 初始化主题状态
                if (!localStorage.getItem(storageKey)) {
                    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                }

                // 绑定事件到具体按钮
                document.getElementById('theme-toggle').addEventListener('click', handleThemeToggle);
                updateVisuals();
            }
        };
    })();

    // ==================== 导航栏控制 ====================
    const navController = () => {
        const navbar = document.querySelector('.glass-nav');
        const updateNavbarStyle = () => {
            const currentScroll = window.pageYOffset;
            navbar.style.background = currentScroll > 100
                ? document.body.classList.contains('dark-mode')
                    ? 'rgba(18, 18, 18, 0.9)'
                    : 'rgba(255, 255, 255, 0.9)'
                : '';
        };
        window.addEventListener('scroll', updateNavbarStyle);
    };

    // ==================== 其他模块初始化 ====================
    const initScrollAnimations = () => {/* 滚动动画代码保持不变 */};
    const initFooter = () => {/* 页脚代码保持不变 */};
    const initCopyFeature = () => {/* 复制功能代码保持不变 */};

    // ==================== 友情链接模块 ====================
    const FriendManager = (() => {
        const themeAwareRender = () => {
            const getThemeColors = () => ({
                bg: document.body.classList.contains('dark-mode')
                    ? 'rgba(35,35,35,0.95)'
                    : 'rgba(255,255,255,0.95)',
                border: document.body.classList.contains('dark-mode')
                    ? 'rgba(255,255,255,0.15)'
                    : 'rgba(127,95,255,0.1)'
            });

            return (friends) => {
                const { bg, border } = getThemeColors();
                const grid = document.querySelector('#friendGrid');
                grid.innerHTML = friends.map(friend => `
                    <article class="friend-card" 
                            style="background:${bg};border:1px solid ${border}">
                        <!-- 卡片内容保持不变 -->
                    </article>
                `).join('');
            };
        };

        return {
            init() {
                if (!document.querySelector('.friends-section')) return;

                // 获取数据并渲染
                fetch('/data/friends.json')
                    .then(res => res.json())
                    .then(data => themeAwareRender()(data.friends));
            }
        };
    })();

    // ==================== 主初始化流程 ====================
    const init = () => {
        ThemeModule.init(); // 必须首先初始化
        initParticles();
        navController();
        initScrollAnimations();
        initFooter();
        initCopyFeature();
        FriendManager.init();
    };

    window.addEventListener('load', init);
});
