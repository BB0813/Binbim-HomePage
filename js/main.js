// 性能优化工具函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }
}

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

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 初始化
    initThemeSwitch();
    initNavigation();
    initSkillsAnimation();
    initProjectFilters();
    initContactForm();
    initScrollAnimation();
    initScrollIndicator();
    initPreloader();
    initImageLazyLoading();
    initBackToTop();
});

// 返回顶部按钮
function initBackToTop() {
    // 创建返回顶部按钮
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.setAttribute('aria-label', '返回顶部');
    document.body.appendChild(backToTopBtn);
    
    // 节流处理滚动事件
    const handleScroll = throttle(() => {
        if (window.pageYOffset > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    }, 100);
    
    // 点击返回顶部
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    window.addEventListener('scroll', handleScroll, { passive: true });
}

// 主题切换功能
function initThemeSwitch() {
    const themeSwitch = document.querySelector('.theme-switch');
    const icon = themeSwitch.querySelector('i');
    
    // 检查本地存储中的主题设置
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        document.body.setAttribute('data-theme', 'dark');
        icon.classList.replace('fa-moon', 'fa-sun');
    }
    
    themeSwitch.addEventListener('click', function() {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            icon.classList.replace('fa-sun', 'fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.setAttribute('data-theme', 'dark');
            icon.classList.replace('fa-moon', 'fa-sun');
            localStorage.setItem('theme', 'dark');
        }
    });
}

// 导航栏功能
function initNavigation() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links a');
    
    // 汉堡菜单点击事件
    hamburger.addEventListener('click', function() {
        navLinks.classList.toggle('active');
        hamburger.classList.toggle('active');
    });
    
    // 导航链接点击事件
    links.forEach(link => {
        link.addEventListener('click', function() {
            navLinks.classList.remove('active');
            hamburger.classList.remove('active');
            
            // 更新活动链接
            document.querySelector('.nav-links a.active').classList.remove('active');
            this.classList.add('active');
        });
    });
    
    // 滚动时导航栏效果（使用节流优化性能）
    const handleScroll = throttle(function() {
        const header = document.querySelector('header');
        header.classList.toggle('sticky', window.scrollY > 0);
        
        // 更新活动链接
        const sections = document.querySelectorAll('section');
        let current = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });
        
        links.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === current) {
                link.classList.add('active');
            }
        });
    }, 16); // 约60fps
    
    window.addEventListener('scroll', handleScroll);
}

// 技能进度条动画
function initSkillsAnimation() {
    const skillBars = document.querySelectorAll('.skill-progress');
    
    if ('IntersectionObserver' in window) {
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bar = entry.target;
                    const percentage = bar.getAttribute('data-percentage');
                    
                    // 添加动画延迟
                    setTimeout(() => {
                        bar.style.width = percentage + '%';
                        bar.classList.add('animated');
                    }, 200);
                    
                    skillObserver.unobserve(bar);
                }
            });
        }, {
            threshold: 0.3,
            rootMargin: '0px 0px -20px 0px'
        });
        
        skillBars.forEach(bar => {
            bar.style.width = '0%';
            skillObserver.observe(bar);
        });
    } else {
        // 降级处理
        skillBars.forEach(bar => {
            const percentage = bar.getAttribute('data-percentage');
            bar.style.width = percentage + '%';
        });
    }
}

// 项目过滤功能
function initProjectFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // 更新活动按钮
            document.querySelector('.filter-btn.active').classList.remove('active');
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            
            projectCards.forEach(card => {
                if (filter === 'all' || card.getAttribute('data-category') === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// 联系表单验证
function initContactForm() {
    const form = document.querySelector('.contact-form form');
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea');
    const submitBtn = form.querySelector('button[type="submit"]');
    
    // 防抖验证
    const debouncedValidate = debounce(validateField, 300);
    
    inputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', (e) => {
            clearError(e);
            debouncedValidate(e);
        });
    });
    
    form.addEventListener('submit', handleSubmit);
    
    function validateField(e) {
        const field = e.target;
        const value = field.value.trim();
        const fieldName = field.getAttribute('placeholder') || field.name;
        
        clearError(e);
        
        if (!value) {
            showError(field, `${fieldName} 不能为空`);
            return false;
        }
        
        if (field.type === 'email' && !isValidEmail(value)) {
            showError(field, '请输入有效的邮箱地址');
            return false;
        }
        
        if (field.name === 'message' && value.length < 10) {
            showError(field, '消息内容至少需要10个字符');
            return false;
        }
        
        showSuccess(field);
        return true;
    }
    
    function clearError(e) {
        const field = e.target;
        const errorElement = field.parentElement.querySelector('.error-message');
        const successElement = field.parentElement.querySelector('.success-message');
        
        if (errorElement) errorElement.remove();
        if (successElement) successElement.remove();
        
        field.classList.remove('error', 'success');
    }
    
    function showError(field, message) {
        field.classList.add('error');
        const errorElement = document.createElement('span');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        field.parentElement.appendChild(errorElement);
    }
    
    function showSuccess(field) {
        field.classList.add('success');
        const successElement = document.createElement('span');
        successElement.className = 'success-message';
        successElement.innerHTML = '<i class="fas fa-check"></i>';
        field.parentElement.appendChild(successElement);
    }
    
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    function handleSubmit(e) {
        e.preventDefault();
        
        // 禁用提交按钮防止重复提交
        submitBtn.disabled = true;
        submitBtn.textContent = '提交中...';
        
        let isValid = true;
        inputs.forEach(input => {
            if (!validateField({ target: input })) {
                isValid = false;
            }
        });
        
        setTimeout(() => {
            if (isValid) {
                // 模拟提交成功
                showSubmitSuccess();
                form.reset();
                inputs.forEach(input => clearError({ target: input }));
            }
            
            // 恢复按钮状态
            submitBtn.disabled = false;
            submitBtn.textContent = '发送消息';
        }, 1000);
    }
    
    function showSubmitSuccess() {
        const successDiv = document.createElement('div');
        successDiv.className = 'submit-success';
        successDiv.innerHTML = '<i class="fas fa-check-circle"></i> 消息发送成功！';
        form.appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

// 滚动动画
function initScrollAnimation() {
    // 返回顶部按钮
    const backToTop = document.querySelector('.back-to-top');
    
    // 滚动显示/隐藏返回顶部按钮
    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTop.classList.add('active');
        } else {
            backToTop.classList.remove('active');
        }
    });
    
    // 使用Intersection Observer优化滚动动画
    const scrollElements = document.querySelectorAll('.animate-text, .animate-image');
    
    if ('IntersectionObserver' in window) {
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('show');
                    // 一次性动画，观察后即移除
                    animationObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });
        
        scrollElements.forEach(element => {
            animationObserver.observe(element);
        });
    } else {
        // 降级处理：使用传统滚动事件
        function checkElements() {
            const triggerBottom = window.innerHeight / 5 * 4;
            
            scrollElements.forEach(element => {
                const elementTop = element.getBoundingClientRect().top;
                
                if (elementTop < triggerBottom) {
                    element.classList.add('show');
                }
            });
        }
        
        window.addEventListener('scroll', checkElements);
        checkElements();
    }
}

function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    const updateScrollIndicator = throttle(() => {
        const scrollTop = window.pageYOffset;
        const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = Math.min((scrollTop / documentHeight) * 100, 100);
        
        scrollIndicator.style.transform = `scaleX(${scrollPercent / 100})`;
    }, 16);
    
    window.addEventListener('scroll', updateScrollIndicator, { passive: true });
}

function initPreloader() {
    const preloader = document.querySelector('.preloader');
    
    window.addEventListener('load', function() {
        setTimeout(function() {
            preloader.classList.add('fade-out');
        }, 500);
    });
}

// 图片懒加载
function initImageLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        images.forEach(img => {
            img.classList.add('lazy');
            imageObserver.observe(img);
        });
    } else {
        // 降级处理：直接加载所有图片
        images.forEach(img => {
            img.src = img.dataset.src;
            img.classList.add('loaded');
        });
    }
}