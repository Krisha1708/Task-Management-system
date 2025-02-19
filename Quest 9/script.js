const API_URL = "http://localhost:3000/tickets";
const ITEMS_PER_PAGE = 5;
let currentPage = 1;

document.addEventListener("DOMContentLoaded", () => {
  fetchTickets();
  setupEventListeners();
});

// Function to fetch tickets from the server
async function fetchTickets() {
  try {
    const response = await fetch(`${API_URL}?_page=${currentPage}&_limit=${ITEMS_PER_PAGE}`);
    const tickets = await response.json();
    displayTickets(tickets);
    setupPagination();
  } catch (error) {
    console.error("Error fetching tickets:", error);
  }
}

// Function to display tickets in the table
function displayTickets(tickets) {
  const tableBody = document.querySelector("#ticket-table tbody");
  tableBody.innerHTML = "";
  tickets.forEach(ticket => {
    const priority = calculatePriority(ticket.dueDate);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${ticket.title}</td>
      <td>${ticket.description}</td>
      <td>${ticket.status}</td>
      <td>${new Date(ticket.dueDate).toLocaleString()}</td>
      <td>${priority}</td>
      <td>
        <button onclick="editTicket(${ticket.id})">Edit</button>
        <button onclick="deleteTicket(${ticket.id})">Delete</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
}

// Calculate dynamic priority based on due date
function calculatePriority(dueDate) {
  const currentTime = new Date();
  const dueTime = new Date(dueDate);
  const timeDifference = (dueTime - currentTime) / 1000 / 60; // difference in minutes

  if (timeDifference <= 2) return "High";
  if (timeDifference <= 3) return "Medium";
  return "Low";
}

// Pagination setup
function setupPagination() {
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = `
    <button onclick="goToPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>Previous</button>
    <span>Page ${currentPage}</span>
    <button onclick="goToPage(${currentPage + 1})">Next</button>
  `;
}

// Go to next/previous page
function goToPage(page) {
  currentPage = page;
  fetchTickets();
}

// Event listeners for filters
function setupEventListeners() {
  document.getElementById("status-filter").addEventListener("change", applyFilters);
  document.getElementById("priority-filter").addEventListener("change", applyFilters);
}

// Apply filters to the ticket data
async function applyFilters() {
  const status = document.getElementById("status-filter").value;
  const priority = document.getElementById("priority-filter").value;

  let url = `${API_URL}?_page=${currentPage}&_limit=${ITEMS_PER_PAGE}`;

  if (status) url += `&status=${status}`;
  if (priority) url += `&priority=${priority}`;

  try {
    const response = await fetch(url);
    const tickets = await response.json();
    displayTickets(tickets);
  } catch (error) {
    console.error("Error applying filters:", error);
  }
}

// Edit Ticket (Show Edit Form)
function showEditTicketModal(ticket) {
  const modal = document.getElementById("edit-ticket-modal");
  document.getElementById("edit-title").value = ticket.title;
  document.getElementById("edit-description").value = ticket.description;
  document.getElementById("edit-status").value = ticket.status;
  document.getElementById("edit-dueDate").value = new Date(ticket.dueDate).toISOString().slice(0, 16);

  modal.style.display = "block";

  // Handle the form submission for updating the ticket
  const form = document.getElementById("edit-ticket-form");
  form.onsubmit = async function (event) {
    event.preventDefault(); // Prevent the default form submission

    const updatedTicket = {
      ...ticket, // Keep the original ticket data
      title: document.getElementById("edit-title").value,
      description: document.getElementById("edit-description").value,
      status: document.getElementById("edit-status").value,
      dueDate: document.getElementById("edit-dueDate").value,
    };

    try {
      // Send PUT request to update the ticket in JSON-server
      const response = await fetch(`${API_URL}/${ticket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTicket),
      });

      if (!response.ok) throw new Error("Failed to update ticket");

      // Close modal after successful update
      modal.style.display = "none";
      fetchTickets(); // Refresh the ticket list after update
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update the ticket.");
    }
  };
}

// Edit Ticket Button Clicked
function editTicket(id) {
  // Fetch the ticket to edit from the server
  fetch(`${API_URL}/${id}`)
    .then(response => response.json())
    .then(ticket => {
      // Call the function to show the edit form modal
      showEditTicketModal(ticket);
    })
    .catch(error => {
      console.error("Error fetching ticket:", error);
      alert("Failed to load ticket for editing.");
    });
}

// Close Edit Modal
document.getElementById("close-edit-modal").addEventListener("click", function() {
  document.getElementById("edit-ticket-modal").style.display = "none";
});

// Delete Ticket
async function deleteTicket(id) {
  try {
    await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });
    fetchTickets(); // Reload tickets after deletion
  } catch (error) {
    console.error("Error deleting ticket:", error);
  }
}
