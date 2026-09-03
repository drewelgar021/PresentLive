//import { useState } from "react";
import { BrowserRouter as Router, Route, Routes, NavLink, useLocation }
    from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Editor from "./Editor";
import Viewer from "./Viewer";

import Row from "react-bootstrap/Row"

const navLinks = [
    {name: "Edit", path: "editor"},
    {name: "Watch", path: "viewer"}
];

function Header() {
    const location = useLocation();
    return (
        <header className="pt-3 px-2">
            <Row><h1>PresentLive</h1></Row>
            <Row><ul className="nav nav-tabs justify-content-center mt-3">
                {navLinks.map((navLink) => (
                
                    <li className="nav-item"><NavLink
                            className={location.pathname == navLink.name ?
                                "nav-link active" : "nav-link"}
                            to={navLink.path}>

                        {navLink.name}

                    </NavLink></li>
                ))}
            </ul></Row>
        </header>
    );
}


function App() {
    return (
        <Router><div className="App">
            <Header/>
            <Routes>
                <Route index path="editor" element={<Editor/>} />
                <Route path="viewer" element={<Viewer/>} />
            </Routes>
        </div></Router>
    );
}



export default App
