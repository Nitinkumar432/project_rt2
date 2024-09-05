document.addEventListener('DOMContentLoaded', () => {
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');
    const step3 = document.getElementById('step-3');
    const nextBtn1 = document.getElementById('next-btn-1');
    const nextBtn2 = document.getElementById('next-btn-2');
    const prevBtn2 = document.getElementById('prev-btn-2');
    const prevBtn3 = document.getElementById('prev-btn-3');
    const submitBtn = document.getElementById('submit-btn');
    const spinnerWrapper = document.getElementById('spinner-wrapper');
    const successPopup = document.getElementById('success-popup');
    const popupClose = document.querySelector('.popup-close');
    const successMessage = document.getElementById('success-message');
    const referenceNumberElement = document.getElementById('reference-number');

    function isFormValid(formId) {
        const form = document.getElementById(formId);
        const inputs = form.querySelectorAll('input, textarea');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.checkValidity()) {
                input.classList.add('error');
                if (!input.nextElementSibling || !input.nextElementSibling.classList.contains('error-message')) {
                    const errorMessage = document.createElement('span');
                    errorMessage.classList.add('error-message');
                    errorMessage.textContent = input.validationMessage;
                    input.insertAdjacentElement('afterend', errorMessage);
                }
                isValid = false;
            } else {
                input.classList.remove('error');
                if (input.nextElementSibling && input.nextElementSibling.classList.contains('error-message')) {
                    input.nextElementSibling.remove();
                }
            }
        });

        return isValid;
    }

    function showSpinner() {
        spinnerWrapper.style.display = 'flex';
    }

    function hideSpinner() {
        spinnerWrapper.style.display = 'none';
    }

    function showSuccessPopup(message, referenceNumber) {
        const popupTitle = document.getElementById("popup-title");
        const successMessage = document.getElementById("success-message");
        const referenceNumberElement = document.getElementById("reference-number");
        const successPopup = document.getElementById("success-popup");
    
        if (referenceNumber === undefined) {
            // Error scenario
            popupTitle.textContent = "Error!";
            successMessage.textContent = "Your company is already registered. Please check your company registration ID or email and proceed to login.";
            referenceNumberElement.textContent = "";  // Clear reference number in case of error
            successPopup.style.border = "2px solid red";  // Optional: Add a red border for error
        } else {
            // Success scenario
            popupTitle.textContent = "Success!";
            successMessage.textContent = message;
            referenceNumberElement.textContent = `Reference Number: ${referenceNumber}`;
            successPopup.style.border = "2px solid green";  // Optional: Add a green border for success
        }
    
        // Show the popup
        successPopup.style.display = 'flex';
    }
    

    function hideSuccessPopup() {
        successPopup.style.display = 'none';
    }

    function populateReview() {
        const fields = {
            'company-name': 'review-company-name',
            'contact-email': 'review-contact-email',
            'contact-phone': 'review-contact-phone',
            'company-address': 'review-company-address',
            'company-registration': 'review-company-registration',
            'tax-id': 'review-tax-id',
            'industry': 'review-industry',
            'company-size': 'review-company-size',
            'website': 'review-website',
            'company-description': 'review-company-description',
            'finances': 'review-finances',
            'number-of-employees': 'review-number-of-employees'
        };

        for (const [inputId, reviewId] of Object.entries(fields)) {
            document.getElementById(reviewId).textContent = document.getElementById(inputId).value;
        }
    }

    nextBtn1.addEventListener('click', () => {
        if (isFormValid('registration-form')) {
            step1.style.display = 'none';
            step2.style.display = 'block';
        }
    });

    nextBtn2.addEventListener('click', () => {
        if (isFormValid('additional-form')) {
            populateReview();
            step2.style.display = 'none';
            step3.style.display = 'block';
        }
    });

    prevBtn2.addEventListener('click', () => {
        step2.style.display = 'none';
        step1.style.display = 'block';
    });

    prevBtn3.addEventListener('click', () => {
        step3.style.display = 'none';
        step2.style.display = 'block';
    });

    submitBtn.addEventListener('click', () => {
        if (isFormValid('review-form')) {
            showSpinner();

            const formData = new FormData(document.getElementById('registration-form'));
            const additionalData = new FormData(document.getElementById('additional-form'));

            additionalData.forEach((value, key) => {
                formData.append(key, value);
            });

            const urlEncodedData = new URLSearchParams();
            for (const [key, value] of formData.entries()) {
                urlEncodedData.append(key, value);
            }

            fetch('/company_register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: urlEncodedData
            })
            .then(response => response.json())
            .then(data => {
                hideSpinner();
                showSuccessPopup(data.message, data.referenceNumber);
                document.querySelector('.registration-container').style.display = 'none';
            })
            .catch(error => {
                hideSpinner();
                console.error('Error:', error);
            });
        }
    });

    popupClose.addEventListener('click', hideSuccessPopup);
    successPopup.addEventListener('click', (e) => {
        if (e.target === successPopup) {
            hideSuccessPopup();
        }
    });
});
// spinner design for button
document.querySelectorAll('.action-button').forEach(button => {
    button.addEventListener('click', function() {
      // Show the spinner
      document.getElementById('spinners').style.display = 'flex';
      
      // Simulate some delay (e.g., for form submission or navigation)
      setTimeout(function() {
        // Hide the spinner after the operation
        document.getElementById('spinners').style.display = 'none';
      }, 3000); // Replace with actual delay or logic for your action
    });
  });
  