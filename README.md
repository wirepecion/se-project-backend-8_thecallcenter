# 🏨 Hotel Booking System (Backend)

> **A scalable REST API handling bookings, payments, and membership logic.**

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Jest](https://img.shields.io/badge/Testing-Jest-C21325?style=for-the-badge&logo=jest&logoColor=white)

## 📖 About The Project

This is the **Backend** repository for the Hotel Booking System. It follows a strict **MVC (Model-View-Controller)** architecture to manage data flow and business logic. The system is containerized using Docker for consistent deployment.

It provides a secure API for the frontend, handling complex tasks such as membership tier calculation, automated emails, and payment verification.

---

## ⚙️ Core Logic & Services

### 💰 Payment & Refund Engine
* **Payment Processing:** Dedicated controllers (`payments.js`) to handle transactions and status updates.
* **Automated Refunds:** The `refundCalculation.js` utility ensures accurate refund amounts based on cancellation policies.
* **Timeout Handling:** `paymentTimeoutUtil.js` manages session expirations to prevent locked inventory.

### 🏆 Membership Logic
* **Dynamic Tier Assessment:** `checkMembershipTier.js` utility evaluates user points after every booking to trigger automatic upgrades.
* **Booking Integration:** `bookings.js` controller integrates with membership logic to apply discounts and accrue points.

### 🔐 Security & Utilities
* **Authentication:** Middleware (`middleware/auth.js`) protects sensitive routes.
* **Notifications:** `sendEmails.js` utility handles transactional emails for booking confirmations.
* **Logging:** `Log.js` model tracks system events for auditing.

---

## 🛠️ Technical Architecture

* **Architecture:** MVC (Models, Views/Routes, Controllers).
* **Database:** MongoDB (implied by Mongoose-style models in `models/`).
* **Containerization:** Fully Dockerized with `Dockerfile` and `docker-compose.yml`.
* **Deployment:** Configured for Vercel deployment (`vercel.json`).

### 📂 Project Structure
```text
.
├── controllers/    # Business logic (bookings, hotels, payments, reviews)
├── models/         # Database schemas (Booking, Hotel, User, Room)
├── routes/         # API endpoint definitions
├── middleware/     # Auth and validation middleware
├── utils/          # Helper functions (refunds, email, tier checks)
├── test/           # Jest unit tests (checkTier, refund, updatePayment)
└── config/         # Database connection configuration
````

-----

## 🚀 How to Run

### Using Docker (Recommended)

1.  **Build and Run:**
    ```bash
    docker-compose up --build
    ```

### Manual Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Start the Server:**
    ```bash
    npm start
    ```
3.  **Run Tests:**
    ```bash
    npm test
    ```

-----

## 👨‍💻 Contributors

**The Call Center Team**

  * **Nattarat Samartkit**
  * **Worachart Poungtabtim**
  * **Patcharapon Srisuwan**
  * **Jedsada Meesuk**
  * **Patcharapon Ongkakul**
  * **Patthadon Phengpinij**
  * **Warapong Thongkhundam**
  * **Titiporn Somboon**
  * **Siravut Chunu**

<!-- end list -->
