<div align="center" id="top"> 
  <img src="Notey/assets/logo.png" alt="Notey" style="width: 25%;"/>

</div>

<h1 align="center">Notey</h1>

<p align="center" >
<a href="https://www.python.org/" target="_blank">
    <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white"> 
</a>
<a href="https://flet.dev/" target="_blank">
    <img src="https://img.shields.io/badge/Flet-000000?style=for-the-badge&logo=flutter&logoColor=02569B"> 
</a>
<a href="https://github.com/MichalDakowicz" target="_blank">
    <img src="https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white"> 
</a>
</p>

<h4 align="center">	🚧  Notey 📝 Under construction...  🚧 </h4>

```bash
I SUGGEST USING LOCAL STORAGE FOR NOW AS DROPBOX REFRESH TOKEN IS NOT WORKING YET
```

<div align="center">
    A simple note taking application built with Flet.
</div>

<hr>

## Table of Contents

-   [Introduction](#introduction)
-   [Installation](#installation)
-   [Running the program](#running-the-program)
-   [Features](#features)
    -   [Feature Requests](#feature-requests)
    -   [Feature Plans](#feature-plans)
-   [Usage](#usage)
    -   [Adding a Note](#adding-a-note)
    -   [Editing a Note](#editing-a-note)
    -   [Deleting a Note](#deleting-a-note)
    -   [Settings](#settings)
-   [Contributing](#contributing)
-   [Issues](#issues)
-   [License](#license)

FOR TECHNICAL DOCUMENTATION [GO HERE](technical.adoc)

## Introduction

Notey is a cross platform application that can be ran on Windows, MacOS and Linux that was built using Flet. The application is still under development with the plan to add more features in the future. It currently uses local storage to store your notes however it will support Dropbox cloud storage in the future.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/MichalDakowicz/Notey.git
    ```
2. Navigate to the project directory:
    ```bash
    cd Notey
    ```
3. Install the dependencies:
    ```bash
    pip install -r requirements.txt
    ```

## Running the program

1. Run the Flask application:
    ```bash
    cd Notey
    python main.py
    ```

## Features

-   Create, edit, and delete notes.
-   Light and dark mode.
-   Cross Platform Support
-   Color Theme Support

#### Feature Requests

Have a suggestion or want to see a new feature added? Your input is invaluable! Visit GitHub Issues to create a new issue, and mark it as an _"enhancement"_ request. I'll review your proposal with enthusiasm!

#### Feature Plans

1. ADD BUTTON TEXT COLOR UPDATING ON THEME CHANGE
2. FIX DROPBOX API KEY
3. FIX DROPBOX REFRESH TOKEN
4. ADD A WAY ON MOBILE TO GET THE API KEY
5. ADD MORE COLOR THEMES

## Usage

#### Adding a Note

To add a note simply click the plus button on the bottom right of the screen. A new page will appear where you can enter the title and the content of your new note.

#### Editing a Note

To edit an existing note click on the button that contains the title of the note. The same page as when adding a note will appear however it will be pre-populated with the title and the content of your note.

#### Deleting a Note

To delete a note, click on the button that contains the title of the note that you want to delete. Then simply click the red _"Delete"_ button. You cannot undo this action so make sure that you want to delete the note before doing so.

#### Settings

You can access the settings page by clicking the settings icon on the top right of the screen. From there you can switch between light and dark mode and also change the main color theme of the app. To apply the changes make sure to click the _"Save Settings"_ button.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please follow these steps:

1. Fork the repository.
2. Create a new branch:
    ```bash
    git checkout -b feature-branch
    ```
3. Make your changes.
4. Commit your changes:
    ```bash
    git commit -am 'Add new feature'
    ```
5. Push to the branch:
    ```bash
    git push origin feature-branch
    ```
6. Create a new pull request.

## Issues

Encountered a bug or have an issue with the application? Please head to GitHub Issues and click on the _"New Issue"_ button. Specify your problem in detail, and make sure to select _"bug"_ as the label. Rest assured, I'll strive to address it promptly.

## License

This project is licensed under the **[GPL-3.0 License](LICENSE)**

<hr>
<a href="#top">Back to top</a>

&#xa0;

Made with :heart: by <a href="https://github.com/MichalDakowicz" target="_blank">Michu</a>
