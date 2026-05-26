

const API_URL = window.location.hostname === "localhost" ? "http://localhost:3000": 
                "https://shiven-tennis-website-355e82df78df.herokuapp.com";

//Get Booking ID from URL
const params = new URLSearchParams(window.location.search);
const bookingId = params.get('id');
console.log(bookingId);


async function loadBooking() {

    if (!bookingId) {
        showError('not_found'); //Shows the error display
        return;
    }

    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`);
        const booking = await response.json();

        if (!booking || booking.error) { //Show error display if booking request fails
            showError('not_found');
            return;
        }
 
        if (booking.status === 'cancelled') { //Show error display if booking is already cancelled
            showError('already_cancelled');
            return;
        }

        //Replace the booking details from the API request
        document.getElementById("c-datetime").textContent = booking.datetime;
        document.getElementById("c-name").textContent = (`${booking.first_name} ${booking.last_name}`);
        document.getElementById("c-skill").textContent = (booking.skill_level);

        //Remove loading state and show cancel screen
        document.getElementById("cancel-loading").style.display = 'none'; 
        document.getElementById("cancel-details").style.display = 'block';


    } catch (err) {
        showError('server_error');
    }
    
}


document.getElementById('cancel-confirm-btn').addEventListener('click', async () => {
    try {

        //API request to set the status of the current booking to 'canceled' in SQL table
        const response = await fetch(`${API_URL}/cancel`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({bookingId})
        });
        
        const result = await response.json();


        //If the booking was successfully canceled, then show the sucess state for the cancel page
        if (result.success) {
            document.getElementById('cancel-details').style.display = 'none';
            document.getElementById('cancel-success').style.display = 'block';
            alert('Booking successfully cancelled');
        } else {
            showError(result.reason);
            alert('Something went wrong, please try again later');
        }

    } catch (err) {
        console.error(err.message);
        alert('Something went wrong, try again later');
    }
})



//Function for showing Cancelation Error HTML in case anything fails
function showError(reason = 'server_error') {
    document.getElementById("cancel-details").style.display = 'none';
    document.getElementById("cancel-loading").style.display = 'none';

    const errorDiv = document.getElementById('cancel-error');
    const errorHeading = document.getElementById('error-heading');
    const errorMessage = document.getElementById('error-message');

    const messages = {
        already_cancelled: {
            heading: 'Already Cancelled',
            message: 'This booking has already been cancelled'
        },
        not_found: {
            heading: 'Booking Not Found',
            message: 'We couldn\'t find this booking. It may have already been cancelled'
        },
        server_error: {
            heading: 'Something Went Wrong',
            message: 'An unexpected error occurred. Please try again later.'
        }
    }

    const content = messages[reason] || messages.server_error;
    errorHeading.textContent = content.heading;
    errorMessage.textContent = content.message;
    errorDiv.style.display = 'block';

}

loadBooking();