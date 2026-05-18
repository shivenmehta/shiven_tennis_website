

const currentDate = document.querySelector(".current-date"); //Query the div that has the class current-date
const daysTag = document.querySelector(".days"); //Query the div that has the class days: "ul" element for all the days
const prevNextIcon = document.querySelectorAll(".icons span"); //Select all icons within the icons class that have the span tag



// Getting new date, current year, and month
let date = new Date(), //Creating date object and store in variable date
currYear = date.getFullYear(), //Date class has getter methods for year
currMonth = date.getMonth(); //Date class has getter methods for month


//Create array for months in the year
const months = ["January", "February", "March", "April", "May", "June", "July", "August", 
                "September", "October", "November", "December"];

//Create array for Shiven's availability
const availability = {
    0: ['4:00 PM', '5:00 PM', '6:00 PM'], //Sunday
    1: ['4:00 PM', '5:00 PM', '6:00 PM'], //Monday
    2: ['4:00 PM', '5:00 PM', '6:00 PM'], //Tuesday
    3: ['4:00 PM', '5:00 PM', '6:00 PM'], //Wednesday
    4: ['4:00 PM', '5:00 PM', '6:00 PM'], //Thursday
    5: ['4:00 PM', '5:00 PM', '6:00 PM'], //Friday
    6: ['4:00 PM', '5:00 PM', '6:00 PM'], //Saturday
}

// Test console.log for current date, year, and month
/*console.log(date, currYear, currMonth);*/

const renderCalendar = () => { //Function in JS
    let firstDayofMonth = new Date(currYear, currMonth, 1).getDay(); //Getting first day of month
    let lastDateofMonth = new Date(currYear, currMonth + 1, 0).getDate(); //Getting last date of month
    let lastDayofMonth = new Date(currYear, currMonth, lastDateofMonth).getDay(); //Getting last day of month
    let lastDateofLastMonth = new Date(currYear, currMonth, 0).getDate(); //Getting last date of previous month
    let liTag = "";

    //Creating li of previous month last days
    for (let i = firstDayofMonth; i > 0; i--) { 
        liTag += `<li class = "inactive">${lastDateofLastMonth - i + 1 }</li>`;
    }

    //Creating li of all days of current month
    for (let i = 1; i <= lastDateofMonth; i++) { 
        let isToday = i === date.getDate() && currMonth === new Date().getMonth() 
                        && currYear === new Date().getFullYear() ? "active" : "";

        const thisDate = new Date(currYear, currMonth, i);
        const today = new Date();
        today.setHours(0,0,0,0);

        const isPast = thisDate < today;
        const isAvailable = availability[thisDate.getDay()] && !isPast;
        const availClass = isAvailable ? "available": "unavailable"; //Check if the date we are iterating through is valid for a booking

        liTag += `<li class = "${isToday} ${availClass}" 
                    data-day = "${i}" 
                    data-month = "${currMonth}" 
                    data-year = "${currYear}">${i}
                 </li>`;
    }

    //Creating li of next month first days
    for (let i = lastDayofMonth; i < 6; i++) {
        liTag += `<li class = "inactive">${i - lastDayofMonth + 1}</li>`;
    }

    daysTag.innerHTML = liTag;

    //Set the text for the currentDate div in bookings.html with current month and year
    currentDate.innerText = `${months[currMonth]} ${currYear}`; 
}

renderCalendar();

prevNextIcon.forEach(icon => {
    icon.addEventListener("click", () => { //Adding click event on both icons
        //if clicked icon is previous icon then decrement current month by 1, else increment it by 1
        currMonth = icon.id === "prev" ? currMonth - 1 : currMonth + 1;

        if (currMonth < 0 || currMonth > 11) { //if current month is past december or before january

            //creating a new date of current year & month and pass it as date value
            date = new Date(currYear, currMonth); //Java script automatically mods invalid cases 
            currYear = date.getFullYear(); //updating current year with new date year
            currMonth = date.getMonth(); //updating current month with new date month
        }  else { //else pass new Date as date value
            date = new Date();
        }
        renderCalendar();
    })
})

daysTag.addEventListener("click", (e) => {
    const day = e.target.closest("li");
    if (!day || !day.classList.contains("available")){ 
        return;
    }

    //Remove selected tags from all other day "li" tags
    const dayTag = document.querySelectorAll(".days li");
    dayTag.forEach(day => {
        day.classList.remove("selected");
    })
    day.classList.add("selected");

    const d = parseInt(day.dataset.day);
    const m = parseInt(day.dataset.month);
    const y = parseInt(day.dataset.year);
    const selectedDate = new Date(y, m, d);

    showTimeSlots(selectedDate); //Shows all the time slots for the according day

});

function showTimeSlots(date) {
    const slots = availability[date.getDay()]; //Get the slots list
    const dateStr = date.toLocaleDateString('default', 
        { weekday: 'long',
          month: 'long', 
          day: 'numeric' 
        });

    let buttons = "";

    slots.forEach(slot => {
        buttons += `<button class = "time-slot" onclick = "pickTime('${slot}', this, '${dateStr}')">${slot}</button>`;
    })

    document.getElementById("time-slot-panel").innerHTML = `
        <p class = "slot-date-label">${dateStr}</p>
        <p class = "slot-subtitle">Available Times</p>
        <div class = "slot-grid">
            ${buttons}
        </div>
    `

    document.getElementById("time-slot-panel").style.display = "block";

    
}

function pickTime(time, button, dateStr) {

    const allSlots = document.querySelectorAll(".time-slot");
    allSlots.forEach(slot => {
        slot.classList.remove("active");
    })
    button.classList.add("active");

    /*const dateStr = date.toLocaleDateString('default', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    })*/

    const full = `${dateStr} at ${time}`;
    document.getElementById("datetime-label").textContent = full; // datetime-label is the text in the selection square
    document.getElementById("selected-datetime").value = full; //Set hidden input selected-datetime's value to the selected date

}

//Function for toggling calendar on and off when datetime selector is clicked
function toggleCalendar() {
        const popup = document.getElementById('calendar-popup');
        const isOpen = popup.style.display === 'flex';
        popup.style.display = isOpen ? 'none' : 'flex';
}

//API request for form submission
document.querySelector(".submit-btn").addEventListener('click', async () => {
    const data = {
        firstName: document.getElementById("first-name").value,
        lastName: document.getElementById("last-name").value,
        email: document.getElementById("email").value,
        phone: document.getElementById("phone").value,
        datetime: document.getElementById("selected-datetime").value,
        skillLevel: document.getElementById("skill-level").value,
        notes: document.getElementById("notes").value
    }

    const response = await fetch("https://shiventenniswebsite-production.up.railway.app/bookings", {
        method: "POST", //We are putting data into the database, so we use POST
        headers: {'Content-Type': 'application/json'}, //Tells backend that we are sending data in JSON formatting
        body: JSON.stringify(data) //Turns our data array into a JSON formatting
    })

    const result = await response.json();

    if (result.success) {
        alert("Booking Confirmed");
        document.getElementById("first-name").value = "";
        document.getElementById("last-name").value = "";
        document.getElementById("email").value = "";
        document.getElementById("phone").value = "";
        document.getElementById("skill-level").value = "";
        document.getElementById("notes").value = "";
        document.getElementById("calendar-popup").style.display = "none";

        //Remove selected tags from all other day "li" tags
        const dayTag = document.querySelectorAll(".days li");
        dayTag.forEach(day => {
            day.classList.remove("selected");
        })

        //Remove the previous datetime selected by the booking that just occurred
        document.getElementById("selected-datetime").value = "";
        document.getElementById("datetime-label").textContent = "";

    } else {
        alert("Something went wront, please try again later!");
    }

})