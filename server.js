const express = require('express');
const path = require('path');
const connection = require('./db.js');

const app = express();
const PORT = 3000;

const bcrypt = require('bcrypt');
const saltRounds = 10; // Hashing cost

// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: false }));
// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files (like CSS or client-side JS if you add them)
app.use(express.static(path.join(__dirname, 'public')));

// --- Routes ---

// Route to serve the main HTML page
app.get('/', (req, res) => {
    // This requires you to have a 'views' folder with index.html inside it
    res.sendFile(path.join(__dirname, "views/index.html"));
});

// Route for user registration (SECURE)
app.post('/register', (req, res) => {
    const username = req.body.user;
    const password = req.body.password;

    // --- VALIDATION ---
    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required.' });
    }
    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
    }

    // Hash the password (for the secure part)
    bcrypt.hash(password, saltRounds, (err, hash) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error hashing password' });
        }

        // We store BOTH: the hash and the plain text
        const query = 'INSERT INTO credentials (user, password, password_clear) VALUES (?, ?, ?)';
        
        // We pass [username, bcrypt_hash, plain_text_password]
        connection.query(query, [username, hash, password], (err, results) => {
            if (err) {
                console.error(err);
                // Handle duplicate username error
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Username already taken' });
                }
                return res.status(500).json({ message: 'Error registering user' });
            }
            res.status(201).json({ message: 'Account created successfully (WARNING: plain text password stored!)' });
        });
    });
});

// Route for user login (INTENTIONALLY VULNERABLE)
app.post("/login", (req, res) => {
    const username = req.body.user;
    const password = req.body.password;

    // *** VULNERABLE AND TARGETS THE PLAIN TEXT PASSWORD ***
    // The query is modified to use 'password_clear'
    const query = "SELECT * FROM credentials WHERE user = '" + username + "' AND password_clear = '" + password + "'";

    connection.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ err: err.message });
        }
        
        if (results.length > 0) {
            res.status(200).json({ message: "Login successful (vulnerable)" });
        } else {
            res.status(401).json({ message: "Wrong username or password" });
        }
    });
});

// Route for user login (SECURE)
app.post("/login-secure", (req, res) => {
    const username = req.body.user;
    const password = req.body.password;

    // This query correctly ignores 'password_clear'
    const query = "SELECT * FROM credentials WHERE user = ?";

    // 1. Find the user
    connection.query(query, [username], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database query error" });
        }

        if (results.length > 0) {
            const hash = results[0].password; // The hash from the DB

            // 2. Securely compare the provided password with the hash
            bcrypt.compare(password, hash, (err, isMatch) => {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "Error comparing passwords" });
                }

                if (isMatch) {
                    res.status(200).json({ message: "Login successful (secure)" });
                } else {
                    res.status(401).json({ message: "Wrong username or password" });
                }
            });
        } else {
            // No user found
            res.status(401).json({ message: "Wrong username or password" });
        }
    });
});

// --- Start Server ---

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    connection.connect((err) => {
        if (err) {
            console.error('Error connecting to the database:', err);
            return;
        }
        console.log('Connected to the MySQL database.');
    });
});