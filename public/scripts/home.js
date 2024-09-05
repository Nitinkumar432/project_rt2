document.addEventListener("DOMContentLoaded", function() {
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    const ctxJobStats = document.getElementById('jobStatsChart').getContext('2d');

    // Example data for live status
    const liveStatusData = {
        labels: ['Active Jobs', 'Total Applicants'],
        datasets: [{
            label: 'Job Statistics',
            // data: [<%= company.activeJobs %>, <%= company.totalApplicants %>],
            data:[12,13],
            backgroundColor: ['#007bff', '#28a745'],
            borderColor: ['#0056b3', '#218838'],
            borderWidth: 1
        }]
    };

    const statusChart = new Chart(ctxStatus, {
        type: 'bar',
        data: liveStatusData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });

    // Example data for job statistics
    const jobStatsData = {
        labels: ['Job 1', 'Job 2', 'Job 3', 'Job 4'],
        datasets: [{
            label: 'Applicants',
            data: [12, 19, 3, 5], // Replace with actual data
            backgroundColor: '#ffc107',
            borderColor: '#e0a800',
            borderWidth: 1
        }]
    };

    const jobStatsChart = new Chart(ctxJobStats, {
        type: 'line',
        data: jobStatsData,
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
});
// spinner design
