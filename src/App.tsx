import { BrowserRouter as Router, Route, Routes, NavLink }
    from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Editor from "./Editor";

import Row from "react-bootstrap/Row"
import Nav from "react-bootstrap/Nav";

function Header() {
    return (
        <header>
            <Row><h1>PresentLive</h1></Row>
            <Row><Nav>

            </Nav></Row>
        </header>
    );
}


function App() {

    return (
        <Router><div className="App">
            <Header/>
            <Routes>
                <Route index path="/" element={<Editor/>} />
            </Routes>
        </div></Router>
    );
}



export default App
