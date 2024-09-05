// Assuming you have a canvas element with id 'companyStatsChart'
const ctx = document.getElementById('companyStatsChart').getContext('2d');

const companyStatsChart = new Chart(ctx, {
    type: 'bar', // You can change this to 'line', 'pie', etc.
    data: {
        labels: ['Total Jobs Posted', 'Total Applications Received'], // Example labels
        datasets: [{
            label: 'Count',
            data: [50, 200], // Example data
            backgroundColor: [
                'rgba(75, 192, 192, 0.6)', // Color for total jobs posted
                'rgba(255, 99, 132, 0.6)' // Color for total applications received
            ],
            borderColor: [
                'rgba(75, 192, 192, 1)',
                'rgba(255, 99, 132, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        responsive: true,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: 'Count'
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            title: {
                display: true,
                text: 'Company Job Statistics'
            }
        }
    }
});