// انتظار تحميل الصفحة بالكامل قبل تنفيذ الكود
document.addEventListener('DOMContentLoaded', () => {

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const customerNav = document.getElementById('customer-nav');
    const adminNav = document.getElementById('admin-nav');

    // --- وظيفة التحكم في التبويبات ---
    function showTab(tabId) {
        // إخفاء جميع محتويات التبويبات
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        // إزالة علامة النشاط من جميع روابط التبويبات
        tabLinks.forEach(link => {
            link.classList.remove('active-link');
        });

        // إظهار المحتوى المطلوب
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) {
            selectedTab.classList.add('active');
        }

        // إضافة علامة النشاط للرابط المضغوط
        const activeLink = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
         if (activeLink) {
            activeLink.classList.add('active-link');
        }
    }

    // --- إضافة مستمعي الأحداث لروابط التبويبات ---
    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault(); // منع السلوك الافتراضي للرابط
            const tabId = link.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // --- منطق تسجيل الدخول (كمثال) ---
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const email = loginForm.querySelector('input[type="email"]').value;
        const password = loginForm.querySelector('input[type="password"]').value;
        const adminCode = loginForm.querySelector('input[type="text"]').value;

        // **هنا ستكتب كود التحقق من Firebase**
        // مثال توضيحي للمنطق فقط:
        if (email === "admin@example.com" && password === "123456" && adminCode === "ADMIN_CODE") {
            // إذا كان مدير
            alert('مرحباً أيها المدير!');
            customerNav.classList.add('hidden'); // إخفاء نافذة العميل
            adminNav.classList.remove('hidden'); // إظهار نافذة المدير
            showTab('admin-items-tab'); // عرض تبويب الأصناف كصفحة رئيسية للمدير
        } else {
            // إذا كان عميل عادي
            alert('تم تسجيل الدخول بنجاح!');
            showTab('store-tab'); // عرض المتجر بعد تسجيل الدخول
        }
    });
    
    // --- إظهار تبويب تسجيل الدخول عند فتح الصفحة لأول مرة ---
    showTab('login-tab');

});
