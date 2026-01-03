# Teamwork & Collaboration Report
## Bus Ticket Booking System

**Date:** January 3, 2026
**Repository:** [bus-ticket-booking-system](https://github.com/NgocAnhDo26/bus-ticket-booking-system)
**Focus Branch:** `development`

---

## 1. Collaboration Overview

The team utilized GitHub for version control and collaboration, focusing mainly on the `development` branch for active feature integration. The workflow involved distinct areas of responsibility, allowing for parallel development of core system features.

### Methodology
*   **Version Control:** Git & GitHub.
*   **Branching Strategy:** Feature branches were likely used and merged into `development`, which served as the primary integration branch before release.
*   **Coordination:** Activity logs show a high frequency of commits, indicating an agile and iterative development process.

---

## 2. Team Members & Contributions

Based on the commit history and contribution analysis on the `development` branch, the primary contributors and their focuses were:

### **NgocAnhDo26** (Lead / Full Stack)
*   **Trip Management:** Implemented complex state management for trips, including status updates (Delayed, Boarding, Departed) and real-time synchronization via WebSockets.
*   **Administrative Features:** Built the Admin dashboard, including user account management (Role-Based Access Control for Admin/Customer) and bus fleet management (photo uploads, details).
*   **Search & Discovery:** Developed the search functionality for routes and stations, enabling users to find trips effectively.
*   **System Refinements:** Handled cross-cutting concerns like refund estimation logic and safety/confirmation dialogs for critical actions.

### **PhamHoangKha1403** (Backend / Core Transactional)
*   **Booking Engine:** Developed the end-to-end booking lifecycle. This includes:
    *   Seat selection and locking mechanisms.
    *   Payment gateway integration.
    *   Booking status transitions (e.g., Pending -> Confirmed).
    *   **Ticket Generation:** Implemented the logic for generating and managing e-tickets upon successful booking.

---

## 3. Git History Evidence

The following recording captures the commit history on the `development` branch, verifying the timeline and nature of contributions.

![Git Commit History & Contributors](file:///C:/Users/Admin/.gemini/antigravity/brain/274b6764-cb8f-496d-96d2-d102f4e4498f/github_commits_dev_branch_1767421128499.webp)

*The recording above demonstrates the active commit history and the contributions graph for the project.*

---

## 4. Summary

The collaboration demonstrates a clear separation of concerns:
*   **NgocAnhDo26** focused on the Platform (Admin, Search, Real-time status).
*   **PhamHoangKha1403** focused on the Commerce (Bookings, Payments, Tickets).

This division of labor allowed for rapid development of the MVP functionalities while ensuring both the administrative and user-facing sides of the application were robust.
