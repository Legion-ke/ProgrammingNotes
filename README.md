# Programming Notes App

## Overview

Programming Notes is a mobile application built with React Native and Expo, designed to help developers organize and manage their programming-related notes. It offers features like categorization, tagging, code snippet support, and voice recording, making it an ideal companion for learning and reference.

## Features

- Create, edit, and delete notes
- Categorize notes for easy organization
- Add tags to notes for quick filtering
- Support for code snippets with syntax highlighting
- Search functionality to quickly find notes
- Voice recording for audio notes
- Cloud sync with Firebase (anonymous authentication)
- Import and export notes for backup
- Cross-platform support (iOS and Android)

## Technologies Used

- React Native
- Expo
- Firebase (Firestore and Authentication)
- React Native Paper (UI components)
- AsyncStorage (local storage)
- Expo AV (audio recording)

## Setup Instructions

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/programming-notes-app.git
   cd programming-notes-app
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up Firebase:
   - Create a new Firebase project at https://console.firebase.google.com/
   - Enable Firestore and Authentication (anonymous) in your Firebase project
   - Create a file named `firebaseConfig.js` in the project root and add your Firebase configuration:
     ```javascript
     import { initializeApp } from 'firebase/app';
     import { getFirestore } from 'firebase/firestore';
     import { getAuth } from 'firebase/auth';

     const firebaseConfig = {
       // Your Firebase configuration here
     };

     const app = initializeApp(firebaseConfig);
     const db = getFirestore(app);
     const auth = getAuth(app);

     export { db, auth };
     ```

4. Start the development server:
   ```
   npx expo start
   ```

5. Use the Expo Go app on your mobile device to scan the QR code and run the app, or use an emulator.

## Building for Production

To create a production build:

1. Install EAS CLI:
   ```
   npm install -g eas-cli
   ```

2. Log in to your Expo account:
   ```
   eas login
   ```

3. Configure the build:
   ```
   eas build:configure
   ```

4. Build for Android (APK):
   ```
   eas build -p android --profile preview
   ```

5. Build for iOS:
   ```
   eas build -p ios
   ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Contact

If you have any questions or feedback, please open an issue in the GitHub repository.