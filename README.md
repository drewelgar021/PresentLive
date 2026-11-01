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

## API
This project was created for a uni assignment with a provided API, so API keys are hardcoded because
I do not pay for the API and this was the easiest way to make the web app testable across different
people and devices.
With that being said, the API features will last for only as long as the course API survives.
Without the API, the presentation editing features will still work, including downloading of
markdown and ODF.
