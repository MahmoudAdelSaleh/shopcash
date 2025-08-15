// انتظار تحميل الصفحة بالكامل قبل تنفيذ الكود
document.addEventListener('DOMContentLoaded', () => {

    const tabLinks = document.querySelectorAll('.tab-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const customerNav = document.getElementById('customer-nav');
    const adminNav = document.getElementById('admin-nav');

    // --- وظيفة التحكم في التبويبات (كما هي) ---
    function showTab(tabId) {
        tabContents.forEach(content => content.classList.remove('active'));
        tabLinks.forEach(link => link.classList.remove('active-link'));
        
        const selectedTab = document.getElementById(tabId);
        if (selectedTab) selectedTab.classList.add('active');

        const activeLink = document.querySelector(`.tab-link[data-tab="${tabId}"]`);
        if (activeLink) activeLink.classList.add('active-link');
    }

    // --- إضافة مستمعي الأحداث لروابط التبويبات (كما هي) ---
    tabLinks.forEach(link => {
        link.addEventListener('click', (event) => {
            event.preventDefault();
            const tabId = link.getAttribute('data-tab');
            showTab(tabId);
        });
    });

    // --- منطق نموذج التسجيل (جديد) ---
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        // **هنا ستكتب كود تسجيل المستخدم في Firebase Authentication**
        // **ثم حفظ بياناته في Firestore**

        // بعد نجاح عملية التسجيل
        alert('تم تسجيل حسابك بنجاح! يرجى تسجيل الدخول.');
        showTab('login-tab'); // **الانتقال إلى صفحة تسجيل الدخول**
    });

    // --- منطق تسجيل الدخول (معدّل) ---
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (event) => {
        event.preventDefault();
        
        // **هنا ستكتب كود التحقق من Firebase**
        // بعد نجاح تسجيل الدخول...
        // 1. تحقق من صلاحيات المستخدم (customer or admin) من Firestore
        // 2. بناءً على الصلاحيات، أظهر شريط التنقل المناسب

        // كمثال توضيحي:
        const isAdmin = false; // افتراض أن المستخدم عميل
        if (isAdmin) {
            customerNav.classList.add('hidden');
            adminNav.classList.remove('hidden');
            showTab('admin-items-tab');
        } else {
            // **الانتقال إلى المتجر بعد تسجيل الدخول**
            showTab('store-tab');
        }
    });

    // --- وظيفة التحقق من حالة تسجيل الدخول عند تحميل الصفحة (الأهم) ---
    function checkAuthState() {
        // **هذا الجزء هو المكان الذي ستضع فيه مستمع Firebase onAuthStateChanged**
        // const user = firebase.auth().currentUser;
        
        // محاكاة للتحقق: سنفترض أن المستخدم غير مسجل دخول
        const userIsLoggedIn = false; 

        if (userIsLoggedIn) {
            // إذا كان المستخدم مسجل دخوله بالفعل
            console.log("المستخدم مسجل دخوله، سيتم توجيهه للمتجر.");
            // هنا تتحقق من صلاحياته وتوجهه للصفحة المناسبة (متجر أو لوحة تحكم)
            showTab('store-tab');
        } else {
            // إذا لم يكن مسجل دخوله
            console.log("لا يوجد مستخدم، سيتم عرض صفحة التسجيل.");
            // **هنا نجعل صفحة التسجيل هي الصفحة الافتراضية**
            showTab('register-tab');
        }
    }

    // --- بدء تشغيل التطبيق ---
    checkAuthState(); // استدعاء دالة التحقق عند بدء تشغيل الصفحة

});
