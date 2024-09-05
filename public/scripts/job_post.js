document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('jobPostForm');
    const previewContainer = document.getElementById('previewContainer');
    const previewContent = document.getElementById('previewContent');
    const spinner = document.getElementById('spinner');
    const successContainer = document.getElementById('successContainer');
    const errorContainer = document.getElementById('errorContainer');
    const overlay = document.getElementById('overlay');

    form.addEventListener('submit', (event) => {
        event.preventDefault();

        if (validateForm()) {
            // Show spinner
            spinner.classList.remove('hidden');

            // Show preview pop-up and blur background
            setTimeout(() => {
                showPreview();
                overlay.classList.add('visible');
                spinner.classList.add('hidden'); // Hide spinner after preview is shown
            }, 500); // Adjust timeout as needed
        } else {
            showError('Please fill all the details correctly.');
        }
    });

    document.getElementById('confirmSubmitBtn').addEventListener('click', async () => {
        try {
            // Show spinner
            spinner.classList.remove('hidden');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            // Send request to the backend
            const response = await fetch('/post-job', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            // Hide spinner
            spinner.classList.add('hidden');

            if (result.success) {
                // Hide preview, success message, and remove background blur
                previewContainer.classList.add('hidden');
                overlay.classList.remove('visible');
                showSuccess();
                // Optionally, redirect or reload to main page
                setTimeout(() => {
                    window.location.href = '/'; // Redirect to main page or other action
                }, 3000); // Adjust the timeout as needed
            } else {
                // Handle error
                showError(result.error);
            }
        } catch (error) {
            console.error('Error:', error);
            // Hide spinner and show error message
            spinner.classList.add('hidden');
            showError('Failed to submit the job. Please try again.');
        }
    });

    document.getElementById('editFormBtn').addEventListener('click', () => {
        previewContainer.classList.add('hidden');
        overlay.classList.remove('visible');
    });

    document.getElementById('closePreview').addEventListener('click', () => {
        previewContainer.classList.add('hidden');
        overlay.classList.remove('visible');
    });

    function validateForm() {
        // Perform form validation (check required fields, etc.)
        let isValid = true;

        // Example validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            if (input.required && !input.value) {
                isValid = false;
            }
        });

        return isValid;
    }

    function showPreview() {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        previewContent.innerHTML = `
            <h3>Job Title: ${data.title}</h3>
            <p>Description: ${data.description}</p>
            <p>Total Posts: ${data.total_post}</p>
            <p>Salary: ${data.minSalary} - ${data.maxSalary} ${data.currency}</p>
            <p>Job Type: ${data.jobType}</p>
            <p>Working Hours: ${data.workingHours}</p>
            <p>Company Name: ${data.companyName}</p>
            <p>Company Name: ${data.companyId}</p>
            <p>Company Logo: <img src="${data.companyLogo}" alt="Company Logo" style="max-width: 100px;"></p>
            <p>Company Website: <a href="${data.companyWebsite}" target="_blank">${data.companyWebsite}</a></p>
            <p>Location: ${data.streetAddress}, ${data.city}, ${data.state}, ${data.country}, ${data.postalCode}</p>
            <p>Experience: ${data.experience} years</p>
            <p>Skills: ${data.skills}</p>
            <p>Education: ${data.education}</p>
            <p>Certifications: ${data.certifications}</p>
            <p>Benefits: ${data.benefits}</p>
            <p>Application Deadline: ${data.applicationDeadline}</p>
            <button id="confirmSubmitBtn" class="submit-btn">Confirm Submit</button>
            <button id="editFormBtn" class="submit-btn">Edit</button>
        `;

        previewContainer.classList.remove('hidden');
    }

    function showSuccess() {
        // Show the success container and overlay
        successContainer.classList.remove('hidden');
        overlay.classList.add('visible');
        
        // Hide the success message and overlay after 3 seconds and redirect
        setTimeout(() => {
            successContainer.classList.add('hidden');
            overlay.classList.remove('visible');
            // Redirect to the home page after hiding the success container
            window.location.href = '/'; // Adjust URL if needed
        }, 3000); // Show success message for 3 seconds
    }
    
    // Attach event listener to the close button to manually handle close and redirection
    document.querySelector('#successContainer button').addEventListener('click', () => {
        successContainer.classList.add('hidden');
        overlay.classList.remove('visible');
        // Redirect to the home page after hiding the success container
        window.location.href = '/'; // Adjust URL if needed
    });
    
    
    function showError(message) {
        errorContainer.textContent = message;
        errorContainer.classList.remove('hidden');
        setTimeout(() => {
            errorContainer.classList.add('hidden');
        }, 3000); // Hide error message after 3 seconds
    }
});
