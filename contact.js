document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');

    if (contactForm) {
        contactForm.addEventListener('submit', async function(e) {
            e.preventDefault();

            // 獲取表單數據
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            try {
                // 發送請求到後端
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    // 顯示成功訊息
                    alert(data.message);
                    // 清空表單
                    contactForm.reset();
                } else {
                    // 顯示錯誤訊息
                    alert(data.error || '提交表單時發生錯誤，請稍後再試');
                }
            } catch (error) {
                console.error('提交表單時發生錯誤:', error);
                alert('提交表單時發生錯誤，請稍後再試');
            }
        });
    }

    function validateForm(data) {
        // 簡單的表單驗證
        if (!data.name || !data.email || !data.subject || !data.message) {
            showNotification('請填寫所有必填欄位', 'error');
            return false;
        }

        // 驗證 Email 格式
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            showNotification('請輸入有效的電子郵件地址', 'error');
            return false;
        }

        // 如果有電話，驗證電話格式（台灣手機號碼）
        if (data.phone) {
            const phoneRegex = /^09\d{8}$/;
            if (!phoneRegex.test(data.phone)) {
                showNotification('請輸入有效的手機號碼', 'error');
                return false;
            }
        }

        return true;
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
});