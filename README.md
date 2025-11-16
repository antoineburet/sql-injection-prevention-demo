<img width="1586" height="340" alt="sqli-demo-screenshot" src="https://github.com/user-attachments/assets/b5383400-e0b9-4fac-ac66-b77ad9601b95" />

# SQL Injection Prevention Demo

This project is a simple Node.js, Express, and MySQL application built to demonstrate **two major security flaws** and, more importantly, how to fix them.

It provides a hands-on comparison of a dangerously vulnerable login system versus a modern, secure one.

## 🚀 Project Purpose

This app features three routes to illustrate key security concepts:

1.  **`/register` (Flawed but functional):**
    * Securely validates input (e.g., password length).
    * Securely hashes the password using **`bcrypt`**.
    * **🚨 Major Flaw:** It *also* saves the plain text password in a `password_clear` column, completely defeating the purpose of hashing.

2.  **`/login` (Extremely Vulnerable):**
    * **🚨 Flaw 1 (SQL Injection):** This route builds its query by concatenating strings, making it vulnerable to a classic `' OR 1 = 1 #` SQL injection attack.
    * **🚨 Flaw 2 (Plain Text):** It works by checking against the `password_clear` column, demonstrating an insecure authentication method.

3.  **`/login-secure` (The Correct Way):**
    * **✅ Secure (Parameterized Queries):** This route uses prepared statements (`?` placeholders), which makes SQL injection impossible.
    * **✅ Secure (Hashing):** It *only* reads the `bcrypt` hash and uses the `bcrypt.compare()` function to safely verify the user's password.



---

## ⚙️ How to Run

### 1. Prerequisites
* Node.js
* MySQL (Workbench or server)

### 2. Setup
1.  **Clone the repository:**
    ```sh
    git clone https://github.com/antoineburet/sql-injection-prevention-demo.git
    cd sql-injection-prevention-demo
    ```
2.  **Install dependencies:**
    ```sh
    npm install
    ```
3.  **Set up the database:**
    * Open MySQL Workbench and connect to your server.
    * Create a database named `accounts`.
    * Create the `credentials` table using the following SQL. (This schema is *intentionally* insecure.)
        ```sql
        USE accounts;
        CREATE TABLE credentials (
          id INT NOT NULL AUTO_INCREMENT,
          user VARCHAR(45) NOT NULL,
          password VARCHAR(255) NOT NULL, -- For the bcrypt hash
          password_clear VARCHAR(45) NULL, -- INTENTIONALLY INSECURE COLUMN
          PRIMARY KEY (id),
          UNIQUE INDEX user_UNIQUE (user ASC)
        );
        ```
4.  **Create your environment file:**
    * Create a file named `.env` in the root of the project.
    * Add your database credentials:
        ```
        DB_HOST=localhost
        DB_USER=root
        DB_PASSWORD=your_mysql_password
        DB_NAME=accounts
        ```

### 3. Run the Server
```sh
node server.js
````

The server will be running on `http://localhost:3000`.

-----

## 🛡️ How to Test the Vulnerabilities

1.  **Create an Account:**

      * Use the "Create Account" form. (e.g., `user: admin`, `pass: password123`)
      * *Observe:* The `credentials` table now contains both a `bcrypt` hash and the plain text "password123".

2.  **Test the Vulnerable Login:**

      * **Test 1 (Normal Login):** Use `user: admin`, `pass: password123`. It will **work** because it reads the plain text column.
      * **Test 2 (SQL Injection):** Use `user: ' OR 1 = 1 #`, `pass: (anything)`. It will **work** and log you in as the first user in the database.

3.  **Test the Secure Login:**

      * **Test 1 (Normal Login):** Use `user: admin`, `pass: password123`. It will **work** because it correctly uses `bcrypt.compare()`.
      * **Test 2 (SQL Injection):** Use `user: ' OR 1 = 1 #`, `pass: (anything)`. It will **FAIL** (as it should). The parameterized query treats the entire string as a username, and no user exists with that literal name.
