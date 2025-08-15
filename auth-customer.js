import { db, collection, addDoc, getDocs, query, where, serverTimestamp } from './firebase-config.js';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";

const auth = getAuth();

document.addEventListener('DOMContentLoaded', () => {
    // This function generates the unique 5-digit customer code
    const generateCustomerCode = () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
    };

    // --- Logic for Registration Page (register.html) ---
    const registerForm = document.getElementById('customer-register-form');
    if (registerForm) {
        // Setup reCAPTCHA for phone number verification
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'invisible'
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('nameInput').value.trim();
            const phone = document.getElementById('phoneInput').value.trim();
            const address = document.getElementById('addressInput').value.trim();
            const registerBtn = document.getElementById('registerCustomerBtn');

            if (!name || !phone || !address) {
                alert("يرجى ملء جميع الحقول.");
                return;
            }
            
            // Format phone number to international format for Firebase
            const formattedPhone = `+20${phone.slice(1)}`; // Assuming Egyptian numbers
            registerBtn.disabled = true;
            registerBtn.textContent = 'جار التحقق...';

            try {
                // Check if phone number already exists
                const customersRef = collection(db, "customers");
                const q = query(customersRef, where("phone", "==", formattedPhone));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    alert("هذا الرقم مسجل بالفعل. يرجى تسجيل الدخول.");
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'إنشاء الحساب';
                    return;
                }

                // If number is new, send verification code
                const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
                window.confirmationResult = confirmationResult;

                const code = prompt("تم إرسال كود التحقق إلى هاتفك. يرجى إدخاله:");
                if (code) {
                    await confirmationResult.confirm(code);
                    
                    // After successful verification, create the user in Firestore
                    const newCustomerData = {
                        name,
                        phone: formattedPhone,
                        address,
                        customerId: generateCustomerCode(), // The unique 5-digit code
                        points: 0,
                        createdAt: serverTimestamp()
                    };
                    
                    await addDoc(collection(db, "customers"), newCustomerData);
                    alert("تم إنشاء حسابك بنجاح! سيتم تحويلك لصفحة المتجر.");
                    // Redirect to the shop page
                    window.location.href = 'shop.html'; 

                } else {
                    alert("لم يتم إدخال الكود. فشلت العملية.");
                    registerBtn.disabled = false;
                    registerBtn.textContent = 'إنشاء الحساب';
                }
            } catch (error) {
                console.error("Error during registration: ", error);
                alert("حدث خطأ. قد يكون رقم الهاتف غير صحيح أو هناك مشكلة في الاتصال. حاول مرة أخرى.");
                registerBtn.disabled = false;
                registerBtn.textContent = 'إنشاء الحساب';
                // In case of error, render reCAPTCHA again if needed
                window.recaptchaVerifier.render().then(widgetId => {
                    window.recaptchaWidgetId = widgetId;
                });
            }
        });
    }

    // --- Logic for Login Page (login-customer.html) ---
    // (We will add the login logic here in the next step after building the shop page)
    const loginForm = document.getElementById('customer-login-form');
    if (loginForm) {
        // Login logic will go here
        alert("صفحة تسجيل الدخول جاهزة، سيتم برمجة وظيفتها لاحقاً.");
    }
});
