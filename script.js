const firebaseConfig = {
  apiKey: "AIzaSyDgQs66swLR18duIyW-frJahuDLuxs7JwE",
  authDomain: "book-log-400ac.firebaseapp.com",
  projectId: "book-log-400ac",
  storageBucket: "book-log-400ac.firebasestorage.app",
  messagingSenderId: "839949552600",
  appId: "1:839949552600:web:82b93006d19e4da6a580ad",
  measurementId: "G-S0L0X1LNNL",
};

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.3.1/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.3.1/firebase-auth.js";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// DOM Elements
const authContainer = document.getElementById("auth-container");
const appContainer = document.getElementById("app-container");
const bookForm = document.getElementById("book-form");
const bookList = document.getElementById("book-list");
const filterButtons = {
  recent: document.getElementById("filter-recent"),
  genre: document.getElementById("filter-genre"),
  rating: document.getElementById("filter-rating"),
  all: document.getElementById("filter-all"),
};
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginButton = document.getElementById("login");
const signupButton = document.getElementById("signup");
const logoutButton = document.getElementById("logout");
const authStatus = document.getElementById("auth-status");

let currentEditId = null;

// Add or update book
bookForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const dateFinished = document.getElementById("date-finished").value;
  const rating = document.getElementById("rating").value;
  const genre = document.getElementById("genre").value;
  const user = auth.currentUser;

  if (user) {
    try {
      if (currentEditId) {
        // Update existing book
        const docRef = doc(db, "books", currentEditId);
        await updateDoc(docRef, {
          title,
          author,
          dateFinished,
          rating: parseInt(rating),
          genre,
        });
        currentEditId = null;
      } else {
        // Add new book
        await addDoc(collection(db, "books"), {
          userId: user.uid,
          title,
          author,
          dateFinished,
          rating: parseInt(rating),
          genre,
        });
      }
      bookForm.reset();
    } catch (error) {
      console.error("Error adding/updating book: ", error);
    }
  } else {
    authStatus.textContent = "Please log in to add books.";
  }
});

// Filter logic
function filterBooks(books, filterType) {
  switch (filterType) {
    case "recent":
      const now = new Date();
      const threeMonthsAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 3,
        now.getDate()
      );
      return books.sort(
        (a, b) => new Date(b.dateFinished) - new Date(a.dateFinished)
      );

    case "genre":
      // Group by genre without additional filtering
      return  books.sort((a, b) => a.genre.localeCompare(b.genre));;

    case "rating":
      // Sort by rating in descending order
      return books.sort((a, b) => b.rating - a.rating);

    case "all":
    default:
      return books;
  }
}

// Render books grouped by genre
// function renderBooksGrouped(snapshot, filterType = "all") {
//   const genres = {};

//   const books = snapshot.docs.map((docSnapshot) => ({
//     id: docSnapshot.id,
//     ...docSnapshot.data(),
//   }));
//   const filteredBooks = filterBooks(books, filterType);

//   filteredBooks.forEach((book) => {
//     if (!genres[book.genre]) {
//       genres[book.genre] = { books: [], count: 0 };
//     }
//     genres[book.genre].books.push(book);
//     genres[book.genre].count++;
//   });

//   bookList.innerHTML = "";

//   for (const [genre, { books, count }] of Object.entries(genres)) {
//     const genreDiv = document.createElement("div");
//     const genreTitle = document.createElement("h2");
//     genreTitle.textContent = `${genre} - ${count} book(s)`;
//     genreDiv.appendChild(genreTitle);

//     books.forEach((book) => {
//       const li = document.createElement("li");
//       const titleSpan = document.createElement("span");
//       const authorSpan = document.createElement("span");
//       const dateSpan = document.createElement("span");
//       const ratingSpan = document.createElement("span");
//       const delBtn = document.createElement("button");
//       const editBtn = document.createElement("button");

//       titleSpan.textContent = `Title: ${book.title}`;
//       titleSpan.classList.add('fixed-width');
//       authorSpan.textContent = `Author: ${book.author}`;
//       authorSpan.classList.add('fixed-width');
//       dateSpan.textContent = `Finished: ${book.dateFinished}`;
//       dateSpan.classList.add('fixed-width');
//       ratingSpan.textContent = `Rating: ${'★'.repeat(book.rating)}${'☆'.repeat(5-book.rating)}`;
//       ratingSpan.classList.add('fixed-width');

//       delBtn.textContent = "Delete";
//       delBtn.style.backgroundColor = "#ff0000";
//       delBtn.style.border = "none";
//       delBtn.style.color = "white";
//       delBtn.style.padding = "10px 20px";
//       delBtn.style.borderRadius = "4px";
//       delBtn.classList.add('del-btn');

//       editBtn.textContent = "Edit";
//       editBtn.style.backgroundColor = "#2c3e50";
//       editBtn.style.border = "none";
//       editBtn.style.color = "white";
//       editBtn.style.padding = "10px 20px";
//       editBtn.style.borderRadius = "4px";

//       li.appendChild(titleSpan);
//       li.appendChild(authorSpan);
//       li.appendChild(dateSpan);
//       li.appendChild(ratingSpan);
//       li.appendChild(delBtn);
//       li.appendChild(editBtn);

//       genreDiv.appendChild(li);

//       // Delete book with confirmation
//       delBtn.addEventListener("click", async (e) => {
//         e.stopPropagation();
//         const confirmDelete = confirm(
//           "Are you sure you want to delete this book?"
//         );
//         if (confirmDelete) {
//           try {
//             const docRef = doc(db, "books", book.id);
//             await deleteDoc(docRef);
//           } catch (error) {
//             console.error("Error removing book: ", error);
//           }
//         }
//       });

//       // Edit book
//       editBtn.addEventListener("click", () => {
//         document.getElementById("title").value = book.title;
//         document.getElementById("author").value = book.author;
//         document.getElementById("date-finished").value = book.dateFinished;
//         document.getElementById("rating").value = book.rating;
//         document.getElementById("genre").value = book.genre;
//         currentEditId = book.id;
//       });
//     });

//     bookList.appendChild(genreDiv);
//   }
// }

function renderBooksGrouped(snapshot, filterType = "all") {
  const books = snapshot.docs.map((docSnapshot) => ({
    id: docSnapshot.id,
    ...docSnapshot.data(),
  }));

  // Apply filtering
  const filteredBooks = filterBooks(books, filterType);

  // Prepare to group books
  const genres = {};

  filteredBooks.forEach((book) => {
    if (!genres[book.genre]) {
      genres[book.genre] = { books: [], count: 0 };
    }
    genres[book.genre].books.push(book);
    genres[book.genre].count++;
  });

  // Clear previous content
  bookList.innerHTML = "";

  // Render books
  for (const [genre, { books, count }] of Object.entries(genres)) {
    const genreDiv = document.createElement("div");
    const genreTitle = document.createElement("h2");
    genreTitle.textContent = `${genre} - ${count} book(s)`;
    genreDiv.appendChild(genreTitle);

    // Rest of the rendering logic remains the same as in your original code
    books.forEach((book) => {
      const li = document.createElement("li");
      // ... (rest of your existing book rendering code)
      const titleSpan = document.createElement("span");
      const authorSpan = document.createElement("span");
      const dateSpan = document.createElement("span");
      const ratingSpan = document.createElement("span");
      const delBtn = document.createElement("button");
      const editBtn = document.createElement("button");

      titleSpan.textContent = `Title: ${book.title}`;
      titleSpan.classList.add("fixed-width");
      authorSpan.textContent = `Author: ${book.author}`;
      authorSpan.classList.add("fixed-width");
      dateSpan.textContent = `Finished: ${book.dateFinished}`;
      dateSpan.classList.add("fixed-width");
      ratingSpan.textContent = `Rating: ${"★".repeat(book.rating)}${"☆".repeat(
        5 - book.rating
      )}`;
      ratingSpan.classList.add("fixed-width");

      delBtn.textContent = "Delete";
      delBtn.style.backgroundColor = "#ff0000";
      delBtn.style.border = "none";
      delBtn.style.color = "white";
      delBtn.style.padding = "10px 20px";
      delBtn.style.borderRadius = "4px";
      delBtn.classList.add("del-btn");

      editBtn.textContent = "Edit";
      editBtn.style.backgroundColor = "#2c3e50";
      editBtn.style.border = "none";
      editBtn.style.color = "white";
      editBtn.style.padding = "10px 20px";
      editBtn.style.borderRadius = "4px";

      li.appendChild(titleSpan);
      li.appendChild(authorSpan);
      li.appendChild(dateSpan);
      li.appendChild(ratingSpan);
      li.appendChild(delBtn);
      li.appendChild(editBtn);

      genreDiv.appendChild(li);

      // Delete book with confirmation
      delBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        const confirmDelete = confirm(
          "Are you sure you want to delete this book?"
        );
        if (confirmDelete) {
          try {
            const docRef = doc(db, "books", book.id);
            await deleteDoc(docRef);
          } catch (error) {
            console.error("Error removing book: ", error);
          }
        }
      });

      // Edit book
      editBtn.addEventListener("click", () => {
        document.getElementById("title").value = book.title;
        document.getElementById("author").value = book.author;
        document.getElementById("date-finished").value = book.dateFinished;
        document.getElementById("rating").value = book.rating;
        document.getElementById("genre").value = book.genre;
        currentEditId = book.id;
      });
    });

    bookList.appendChild(genreDiv);
  }
}

Object.entries(filterButtons).forEach(([filterType, button]) => {
  button.addEventListener("click", () => {
    // Remove active class from all buttons
    Object.values(filterButtons).forEach((btn) =>
      btn.classList.remove("active")
    );
    // Add active class to clicked button
    button.classList.add("active");

    const user = auth.currentUser;
    if (user) {
      const userBooksQuery = query(
        collection(db, "books"),
        where("userId", "==", user.uid)
      );

      // Use onSnapshot to get real-time updates with the selected filter
      onSnapshot(userBooksQuery, (snapshot) => {
        renderBooksGrouped(snapshot, filterType);
      });
    }
  });
});

// Authentication state listener
onAuthStateChanged(auth, (user) => {
  if (user) {
    const userBooksQuery = query(
      collection(db, "books"),
      where("userId", "==", user.uid)
    );
    onSnapshot(userBooksQuery, (snapshot) => {
      renderBooksGrouped(snapshot);
    });
    showApp();
  } else {
    bookList.innerHTML = "<p>Please log in to view your book log.</p>";
    showAuth();
  }
});

// Login function
loginButton.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    authStatus.textContent = "Login successful!";
  } catch (error) {
    authStatus.textContent = `Error: ${error.message}`;
  }
});

// Sign up function
signupButton.addEventListener("click", async () => {
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);
    authStatus.textContent = "Sign up successful!";
  } catch (error) {
    authStatus.textContent = `Error: ${error.message}`;
  }
});

// Logout function
logoutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    emailInput.value = "";
    passwordInput.value = "";
    authStatus.textContent = "Logged out successfully!";
  } catch (error) {
    authStatus.textContent = `Error: ${error.message}`;
  }
});

// Show app function
function showApp() {
  authContainer.style.display = "none";
  appContainer.style.display = "block";
}

// Show auth function
function showAuth() {
  authContainer.style.display = "block";
  appContainer.style.display = "none";
}

// Filter buttons event listeners
Object.entries(filterButtons).forEach(([filterType, button]) => {
  button.addEventListener("click", () => {
    Object.values(filterButtons).forEach((btn) =>
      btn.classList.remove("active")
    );
    button.classList.add("active");

    const user = auth.currentUser;
    if (user) {
      const userBooksQuery = query(
        collection(db, "books"),
        where("userId", "==", user.uid)
      );
      onSnapshot(userBooksQuery, (snapshot) => {
        renderBooksGrouped(snapshot, filterType);
      });
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const togglePanelBtn = document.getElementById("toggle-left-panel");
  const leftPanel = document.getElementById("left-panel");
  const appLayout = document.getElementById("app-layout");

  togglePanelBtn.addEventListener("click", () => {
    // Toggle classes
    leftPanel.classList.toggle("collapsed");
    appLayout.classList.toggle("panel-collapsed");

    // Toggle icon
    const icon = togglePanelBtn.querySelector(".toggle-icon");
    icon.textContent = leftPanel.classList.contains("collapsed") ? "▶" : "◀";
    console.log("Clicked");
  });
});
