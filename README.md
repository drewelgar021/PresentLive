# PresentLive

PresentLive is an application that allows for editing and sharing of presentation decks written with
markdown.

```
npm i
npm run dev & npm run server
```

Firstly run `npm i` to install/update dependencies.

`npm run dev` runs the web application on `localhost`, the port of which will be displayed by
`stdout`.

`npm run server` runs the LLM communication server, which is necessary for using the AI assistant
feature.
This **must** be run from the root project directory to work as expected.

## AI Assistant Setup
The server handles cross-origin requests between the web app and the API's LLM interface.
The AI assistant will only work if the server is running on localhost, port `3001` (which it should
since this is hardcoded into the server), and if the web app is running on port `5173` (which is the
default for Vite, unless something else is already using this port).

The web app sends a POST request to the server, then the server sends a POST request to the LLM API.

The environment variable `AI_API_KEY` must be set to a valid API key.

## Editing PresentMD With Live Preview

Any features that use the API (saving, loading, AI assistant) must have environment variable
`VITE_API_KEY` set to a valid API key, or the API will respond with a `401`.

Use of the AI assistant requires the environment variable `AI_API_KEY` to be set to a valid key.

### GUI Controls
![Editor GUI](/img/editor.png "Editor GUI")

- "New Presentation" resets the state of the editor, including the presentation code (see below),
  so that you are able to edit a new presentation without overwriting the one you were previously
  working on.
- "Save/Share" uploads the current presentation to the API.
  An alert will display with the unique presentation code, which can be loaded by yourself or a
  collaborator to continue working on the presentation.
    - If the "Public" checkbox is checked upon saving, then the presentation can be viewed by others
      using a public code, which will also be displayed in the alert.
      The public code is only usable in the "Watch" tab, which will not allow users to edit the
      presentation.
- "Load" loads the presentation corresponding to the provided code from the API into the editor.
- "Delete" deletes the current presentation from the API.
  This option will only be available if working on a presentation that was loaded from the API.
- "Generate" uses the AI assistant to generate a new presentation about the provided topic.
- "Download MD" downloads a markdown file to the local device containing the contents of the editor.
- "Export ODF" downloads a Flat ODP file to the local device which can be opened in LibreOffice
  Impress.
- The arrow icons below the preview window change the slide being shown in the preview.
  The current slide number is displayed between them.

### Workflow
1. Navigate to the "Edit" tab in the navbar at the top of the page (which is loaded by default).
2. Use the text area on the left to edit the contents of the slide with PresentMD, and notice that
   the preview on the right updates in real time.
3. Add a new slide by using a separator `---`, and write more contents below it.
   Now you can navigate between slides using the arrow buttons below the previewer.
4. Click "Save/Share" to save it to the API.
   Keep the code it shows you so that you can load it again later.
5. Click "New Presentation" to start fresh.
6. Type the presentation code from before into the text input that says "Code".
   Now click the "Load" button to restore the presentation that you had before.
7. Open a new tab and navigate to `http://localhost:5173/edit/<code>` and your presentation will
   open in the editor straight away.
8. Download the Markdown file, and export to ODF to open in LibreOffice using the buttons below the
   editor.
   I promise these do not give you a virus.
9. Click the "Delete" button, then try to load the same presentation from before.
   Notice that it no longer exists.
10. Type a topic into the "Write me a presentation about..." text input and click "Generate".
    After it loads, the editor and preview will show an AI generated presentation about the provided
    topic.
11. Add a poll somewhere in the presentation using the syntax below.
    The square brackets and quotation marks are required for options, which will be parsed as a JSON
    array.
```md
<!-- poll: <title> -->

<!-- options: ["<option 1>", ...] -->
```
12. Save the presentation after checking the "Public" box.
    There is now an additional public code.
    Consider saving both of these codes to test the other workflows!

## Viewing Presentations

This workflow requires use of the API, so environment variable `VITE_API_KEY` must be set to a valid
API key.

- Use the form to input a public presentation code (starting with `w-`), and a display name.
- Watch the presentation starting from the first slide, and press the "Next" button to progress to
  the next slide.
  You cannot go back slides (as per assignment brief).
- On slides containing polls, a poll form will appear below the slide.
  Select an option and click the "Submit" button to submit your response.

### Workflow
1. Enter a public presentation code (the one starting with `w-`) and display name into the
   respective text inputs and click "Join" to start a presentation.
2. Click the "Next" button to advance to the next slide.
3. When a poll slide is reached, use the form below the preview window to submit a response to the
   poll.
   The slide will be advanced upon submission.
4. When the end of the presentation is reached, click "Exit" to exit the presentation.

## Satisfaction of Functionality Requirements

### App Design and Navigation
- The application contains a consistent header.
- The application navigation is clear, with each nav tab displaying in text where it navigates to.
- Foreground elements have whitish outlines and text on top of a dark background so that they are
  visually distinguishable.
- All buttons have a text description or commonly recognised visual description (i.e. arrow icons)
  indicating their function.
- All text inputs have placeholder text describing what should be input.
- All actions that have possible failures trigger visual alerts upon their failure or success.

### A Multi-Entity Data Structure
```ts
type PresentMD = { code: string, public_code: string, contents: string }
type Public = { public_code: string, model: Deck, viewers: Viewer[], polls: Poll[] }
type Deck = { title: string, author: string, backgroundColor?: string, color?: string, layout?: string, slides: Slide[] }
type Slide = { display?: string, backgroundColor?: string, draft?: null, poll?: string, options?: string, content: object[] }
type Viewer = { name: string, timestamp: Time }
type Poll = { name: string, options: string[], responses: PollResponse[] }
type PollResponse = { responder: string, selection: string }
```

- These data entities are stored and retrieved via the RESTful API provided by the course.
- Records can be added, deleted, and edited using the GUI controls in the app.
- Text inputs are validated with alerts to display success or failure of inputs.

### Data Collection and Interaction
- All data collected is intended to be used again in the app.
  - Saved presentation -> loaded presentation
  - Public presentation -> presentation watcher
  - Display name, poll submissions -> presentation analytics menu
- Summary information derived from related data is displayed.
  - Poll results displayed as graphs and individual responses with names.
  - Number of participants/viewers as well as list of names.
- Data makes a round trip between user types.
  - A presentation editor can save their presentation, so that another editor can contribute to it.
  - When it is made public, viewers can watch the presentation and participate in polls.
  - Editors can look at poll results obtained from viewers' submissions.

### User Stories / Workflows
- Presentation editor
  - Creates and edits presentations.
  - Views analytics, including poll responses and attendance.
- Presentation viewer
  - Views presentations and participates in polls.
  - This workflow is a guided multi-step flow: viewers are prompted to enter their name, then
    advance through slides irreversably, answer polls as they appear, then a "presentation finished"
    message.

### Unique Link Access
- A unique presentation code is generated so that editors and their collaborators can access and
  edit an already initialised presentation.
- A presentation saved to the API can be accessed by adding `/<code>` to the url, where `<code>` is
  the unique presentation code generated from saving.
- A unique public code is generated so that users can view the presentation without being able to
  edit it.
- Authentication is not required for these accesses.

### AI Integration
- An AI assistant exists which can generate a presentation about a provided topic.
  It directly modifies the contents of the markdown input field.

### Advanced Features
- Bar graphs displaying poll info.
- Download `.md` and export presentation to `.fodp`.

## AI Usage Statement / References
No generative AI tools were used in the completion of this assessment.

The [Node.js](https://nodejs.org/api/), [React](https://react.dev/reference/react), and
[MDN Web](https://developer.mozilla.org/en-US/docs/Web/JavaScript) documentations were used as a
reference for function usages and definitions, and much of the code in this project was
inspired/guided by (but not directly copied from) these sources.

The week 4 applied class (fetching) code was used as a reference for how this application fetches
data from the API.
The week 7 applied class (AI) code was used as a reference for communication between the application
and the API's LLM.

[Bootstrap](https://getbootstrap.com/docs/5.0/) and [shadcn/ui](https://ui.shadcn.com/docs/) were
used prominently in this project, and so were their documentations as a reference.

This [Stack Overflow](https://stackoverflow.com/questions/3665115/how-to-create-a-file-in-memory-for-user-to-download-but-not-through-server)
page was used as inspiration for implementing the application's file download/export features.
