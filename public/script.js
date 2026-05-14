// This file contains the JavaScript code that handles user interactions, such as submitting the student's argument, making requests to the server, and updating the UI with the AI's response.

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('debate-form');
    const studentInput = document.getElementById('student-input');
    const responseContainer = document.getElementById('response-container');

    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const studentArgument = studentInput.value;

        if (studentArgument.trim() === '') {
            alert('Please enter your argument before submitting.');
            return;
        }

        responseContainer.innerHTML = 'Thinking...';

        try {
            const response = await fetch('/api/debate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ argument: studentArgument }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            responseContainer.innerHTML = `<p><strong>AI의 반론:</strong> ${data.counterArgument}</p>`;
                } catch (error) {
            responseContainer.innerHTML = 'Sorry, something went wrong. Please try again later.';
            console.error('Error:', error);
        }

        studentInput.value = '';
    });
});