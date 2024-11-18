// Fixed and improved createBill function
async function createBill(customerData) {
    const billData = {
        // Required parameters
        userSecretKey: '9kc2d65k-sxak-8h12-owox-lu1iulcr60dz',
        categoryCode: 'lqtvz19i',
        billName: 'Flutter Development Course',
        billDescription: 'Complete Flutter Course by HazimDev',
        billPriceSetting: 1,
        billPayorInfo: 1,
        billAmount: 3500,
        billReturnUrl: window.location.origin + 'https://hazimdeveloper.github.io/BuyFlutterBook/success.html',
        billCallbackUrl: window.location.origin + 'https://hazimdeveloper.github.io/BuyFlutterBook/',
        billExternalReferenceNo: 'FLUTTER_' + Date.now(),
        billTo: customerData.name,
        billEmail: customerData.email,
        billPhone: customerData.phone,
        
        // Optional parameters
        billSplitPayment: 0,
        billSplitPaymentArgs: '',
        billPaymentChannel: 2,
        billContentEmail: 'Thank you for purchasing our Flutter course! You will receive access details shortly.',
        billChargeToCustomer: '',
        billExpiryDays: 7,
        enableFPXB2B: 0,
        chargeFPXB2B: 1
    };

    try {
        // Store customer data before redirect
        localStorage.setItem('customerData', JSON.stringify(customerData));

        const response = await fetch('https://toyyibpay.com/index.php/api/createBill', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(billData)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        console.log('ToyyibPay API Response:', result);

        if (result.Error) {
            throw new Error(result.Error);
        }

        if (!result[0]?.BillCode) {
            throw new Error('Invalid bill code received from ToyyibPay');
        }

        return result[0].BillCode;

    } catch (error) {
        console.error('Error creating ToyyibPay bill:', error);
        throw error;
    }
}

// Initialize EmailJS
(function() {
    emailjs.init("WOIOhv2Ev44peCAjc"); // Add your EmailJS public key
})();

// Handle form submission and payment
async function handlePayment(event) {
    event.preventDefault();
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    try {
        // Show loading state
        submitBtn.innerHTML = '<div class="loader"></div>';
        submitBtn.disabled = true;

        // Validate form data
        const name = document.getElementById('name').value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();

        // Additional validation
        if (!isValidName(name)) {
            throw new Error('Please enter a valid name (max 30 characters, alphanumeric and spaces only)');
        }

        // Create the bill
        const billCode = await createBill({
            name: name,
            email: email,
            phone: phone
        });

        // Redirect to ToyyibPay payment page
        if (billCode) {
            window.location.href = `https://toyyibpay.com/${billCode}`;
        } else {
            throw new Error('Failed to create bill');
        }

    } catch (error) {
        console.error('Payment processing error:', error);
        
        // Show user-friendly error message
        let errorMessage = 'There was an error processing your payment. Please try again.';
        
        if (error.message.includes('KEY-DID-NOT-EXIST')) {
            errorMessage = 'Payment system configuration error. Please contact support.';
        } else if (error.message.includes('valid name')) {
            errorMessage = error.message;
        }
        
        alert(errorMessage);
        
        // Reset button state
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Updated email sending function
async function sendCourseEmail(customerData, orderId) {
    try {
        const templateParams = {
            to_name: customerData.name,
            to_email: customerData.email,
            order_id: orderId,
            purchase_date: new Date().toLocaleDateString(),
            download_link: 'https://drive.google.com/drive/folders/10S4dHEXTPO7AoXYdon9-CPhmoFrQQLaf?usp=drive_link' // Add your secure download link
        };

        const response = await emailjs.send(
            'service_giqg5gt',
            'template_lygfqdk',
            templateParams
        );

        if (response.status === 200) {
            console.log('Email sent successfully');
        } else {
            throw new Error('Failed to send email');
        }

    } catch (error) {
        console.error('Error sending email:', error);
        // Still show success message but with warning about email
        alert('Payment successful! If you don\'t receive an email within 5 minutes, please contact support.');
    }
}

   // Function to show success message
   function showSuccessMessage() {
    const modal = document.getElementById('successModal');
    if (!modal) {
        // Create success modal if it doesn't exist
        const successModal = document.createElement('div');
        successModal.id = 'successModal';
        successModal.className = 'modal active';
        successModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Payment Successful! 🎉</h3>
                    <span class="close">&times;</span>
                </div>
                <div class="modal-body">
                    <p>Thank you for purchasing the Flutter Development Course!</p>
                    <p>We've sent your course materials to your email address.</p>
                    <p>Please check your inbox (and spam folder) for the course PDF.</p>
                    <div class="telegram-invite">
                        <p>Join our Telegram community for support:</p>
                        <a href="https://t.me/+1bFt1Jr3GFs3ZGM1" class="btn btn-primary">
                            Join Telegram Group 👥
                        </a>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(successModal);

        // Add close functionality
        const closeBtn = successModal.querySelector('.close');
        closeBtn.onclick = () => {
            successModal.remove();
            window.location.href = '/'; // Redirect to home page
        };
    }
}

// Improved payment status check
function checkPaymentStatus() {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get('status_id');
    const billcode = urlParams.get('billcode');
    const orderid = urlParams.get('order_id');
    
    if (status === '1' && billcode) {
        try {
            const customerData = JSON.parse(localStorage.getItem('customerData'));
            if (customerData) {
                sendCourseEmail(customerData, orderid || billcode);
                localStorage.removeItem('customerData');
                
                // Show success message
                showSuccessMessage();
            } else {
                console.error('Customer data not found in localStorage');
                alert('Payment successful but customer data not found. Please contact support.');
            }
        } catch (error) {
            console.error('Error processing success:', error);
            alert('Payment successful but there was an error. Please contact support.');
        }
    } else if (status && status !== '1') {
        // Handle failed payment
        alert('Payment was not successful. Please try again or contact support.');
    }
}

// Check payment status when page loads
document.addEventListener('DOMContentLoaded', checkPaymentStatus);



// Validation functions
function isValidName(name) {
    const nameRegex = /^[a-zA-Z0-9\s_]{1,30}$/;
    return nameRegex.test(name);
}

// Form validation and setup
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('paymentForm');
    
    // Real-time input validation
    const nameInput = document.getElementById('name');
    nameInput.addEventListener('input', function(e) {
        // Allow only alphanumeric, spaces, and underscore
        this.value = this.value.replace(/[^a-zA-Z0-9\s_]/g, '');
        
        // Limit to 30 characters
        if (this.value.length > 30) {
            this.value = this.value.slice(0, 30);
        }
    });

    const phoneInput = document.getElementById('phone');
    phoneInput.addEventListener('input', function(e) {
        // Allow only numbers
        this.value = this.value.replace(/[^0-9]/g, '');
        
        // Limit to 15 characters
        if (this.value.length > 15) {
            this.value = this.value.slice(0, 15);
        }
    });

    // Form submission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Validate all fields before submission
        const name = nameInput.value.trim();
        const email = document.getElementById('email').value.trim();
        const phone = phoneInput.value.trim();

        if (!name || !email || !phone) {
            alert('Please fill in all fields');
            return;
        }

        if (!isValidName(name)) {
            alert('Please enter a valid name (max 30 characters, alphanumeric and spaces only)');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            alert('Please enter a valid email address');
            return;
        }

        const phoneRegex = /^[0-9]{10,15}$/;
        if (!phoneRegex.test(phone)) {
            alert('Please enter a valid phone number');
            return;
        }

        // Process payment
        await handlePayment(e);
    });
});