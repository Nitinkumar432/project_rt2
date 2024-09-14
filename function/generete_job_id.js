function generateJobId() {
    // Generate a random number between 0 and 999999999999 (12 digits)
    const randomNumber = Math.floor(Math.random() * 1000000000000);
    
    // Format the number to ensure it is always 12 digits long
    const formattedNumber = String(randomNumber).padStart(12, '0');
    
    // Combine "JBID" with the formatted number
    const jobId = `JBID${formattedNumber}`;
    
    return jobId;
}

// Export the function for use in other modules
module.exports = generateJobId;