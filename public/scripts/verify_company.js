document.addEventListener('DOMContentLoaded', function() {
    const filterForm = document.getElementById('filter-form');
    const pendingCompaniesContainer = document.getElementById('pending-companies');
    
    let allCompanies = []; // To store all fetched company data

    // Fetch all companies initially
    fetch('/pending_companies')
        .then(response => response.json())
        .then(data => {
            allCompanies = data;
            displayCompanies(allCompanies); // Display initial list
        })
        .catch(error => {
            console.error('Error fetching companies:', error);
        });

    filterForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission
        
        const searchQuery = document.getElementById('search').value.toLowerCase();
        const dateStart = new Date(document.getElementById('dateStart').value);
        const dateEnd = new Date(document.getElementById('dateEnd').value);
        
        // Filter the data based on user input
        const filteredCompanies = allCompanies.filter(company => {
            // Check company name
            const nameMatches = company.companyName.toLowerCase().includes(searchQuery);
            
            // Check submission time
            const submissionTime = new Date(company.submissionTime);
            const dateMatches = (!dateStart || submissionTime >= dateStart) &&
                                (!dateEnd || submissionTime <= dateEnd);
            
            return nameMatches && dateMatches;
        });
        
        displayCompanies(filteredCompanies);
    });

    function displayCompanies(companies) {
        pendingCompaniesContainer.innerHTML = ''; // Clear existing content

        if (companies.length > 0) {
            const ul = document.createElement('ul');
            companies.forEach(company => {
                const li = document.createElement('li');
                li.classList.add('pending');
                li.innerHTML = `
                    <h3>${company.companyName}</h3>
                    <strong>Email:</strong> ${company.contactEmail}
                    <form action="/verify_company/approve/${company._id}" method="POST">
                        <button type="submit" class="action-button">Approve</button>
                    </form>
                    <div class="details">
                        <p><span>Phone:</span> ${company.contactPhone}</p>
                        <p><span>Address:</span> ${company.companyAddress}</p>
                        <p><span>Registration:</span> ${company.companyRegistration}</p>
                        <p><span>Tax ID:</span> ${company.taxId}</p>
                        <p><span>Industry:</span> ${company.industry}</p>
                        <p><span>Size:</span> ${company.companySize}</p>
                        <p><span>Website:</span> <a href="${company.website}" target="_blank">${company.website}</a></p>
                        <p><span>Description:</span> ${company.companyDescription}</p>
                        <p><span>Finances:</span> ${company.finances}</p>
                        <p><span>Employees:</span> ${company.numberOfEmployees}</p>
                        <p><span>Reference:</span> ${company.referenceNumber}</p>
                        <p><span>Submission Time:</span> ${new Date(company.submissionTime).toLocaleString()}</p>
                    </div>
                `;
                ul.appendChild(li);
            });
            pendingCompaniesContainer.appendChild(ul);
        } else {
            pendingCompaniesContainer.innerHTML = '<p>No companies match the filter criteria.</p>';
        }
    }
});
