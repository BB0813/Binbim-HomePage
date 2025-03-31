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
});

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
    
    // 滚动时导航栏效果
    window.addEventListener('scroll', function() {
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
    });
}

// 技能进度条动画
function initSkillsAnimation() {
    const skillSection = document.querySelector('#skills');
    const progressBars = document.querySelectorAll('.skill-progress');
    
    function checkScroll() {
        const triggerBottom = window.innerHeight / 5 * 4;
        const skillsTop = skillSection.getBoundingClientRect().top;
        
        if (skillsTop < triggerBottom) {
            progressBars.forEach(progress => {
                const value = progress.getAttribute('data-progress');
                progress.style.width = value + '%';
            });
            window.removeEventListener('scroll', checkScroll);
        }
    }
    
    window.addEventListener('scroll', checkScroll);
    // 初始检查
    checkScroll();
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
    
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // 获取表单字段
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();
            
            // 简单验证
            if (name === '') {
                showError('name', '请输入您的姓名');
                return;
            }
            
            if (email === '') {
                showError('email', '请输入您的邮箱');
                return;
            } else if (!isValidEmail(email)) {
                showError('email', '请输入有效的邮箱地址');
                return;
            }
            
            if (subject === '') {
                showError('subject', '请输入消息主题');
                return;
            }
            
            if (message === '') {
                showError('message', '请输入您的消息');
                return;
            }
            
            // 如果验证通过，可以在这里添加发送表单的代码
            // 这里只是模拟提交成功
            form.innerHTML = '<div class="success-message"><i class="fas fa-check-circle"></i><p>您的消息已成功发送！我会尽快回复您。</p></div>';
        });
    }
    
    // 显示错误信息
    function showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add('error');
        
        // 移除之前的错误消息
        const existingError = field.parentElement.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // 添加新的错误消息
        const errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.textContent = message;
        field.parentElement.appendChild(errorMessage);
        
        // 焦点事件移除错误状态
        field.addEventListener('focus', function() {
            field.classList.remove('error');
            const error = field.parentElement.querySelector('.error-message');
            if (error) {
                error.remove();
            }
        });
    }
    
    // 验证邮箱格式
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
    
    // 平滑滚动效果
    const scrollElements = document.querySelectorAll('.animate-text, .animate-image');
    
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
    // 初始检查
    checkElements();
}

function initScrollIndicator() {
    const scrollIndicator = document.querySelector('.scroll-indicator');
    
    window.addEventListener('scroll', function() {
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;
        
        scrollIndicator.style.width = scrollPercent + '%';
    });
}

function initPreloader() {
    const preloader = document.querySelector('.preloader');
    
    window.addEventListener('load', function() {
        setTimeout(function() {
            preloader.classList.add('fade-out');
        }, 500);
    });
}