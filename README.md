# Monthly Expense & Income Manager

A React application with Firestore integration for tracking monthly expenses and income.

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Configure Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Get your Firebase config and update `src/firebase.js`

3. Start the development server:
   ```
   npm start
   ```

## Features

- Add income and expense transactions
- Delete transactions with confirmation
- View monthly summary with balance calculation
- Real-time updates using Firestore
- Simple and clean interface

## Firebase Configuration

Update the `firebaseConfig` object in `src/firebase.js` with your actual Firebase project credentials.