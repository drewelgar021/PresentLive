//import { useState } from "react";
import { BrowserRouter as Router, Route, Routes, NavLink, useLocation, Navigate }
    from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";
import Editor from "./Editor";
import Viewer from "./Viewer";
import Analytics from "./Analytics";
import Row from "react-bootstrap/Row"

const navLinks = [
    { name: "Edit", path: "edit" },
    { name: "Watch", path: "watch" },
    { name: "Analytics", path: "analytics" }
];

function Header() {
    const location = useLocation();
    return (
        <header className="pt-3 px-2">
            <Row><h1>PresentLive</h1></Row>
            <Row><ul className="nav nav-tabs justify-content-center mt-3">
                {navLinks.map((navLink) => (
                    <li className="nav-item" key={navLink.name}><NavLink
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
    return (<>
        <Router><div className="App" data-bs-theme="dark">
            <Header/>
            <Routes>
                <Route index path="edit" element={<Editor/>} />
                <Route path="edit/:code" element={<Editor />} />
                <Route path="watch" element={<Viewer />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="/" element={<Navigate to="edit"/>} />
            </Routes>
        </div></Router>
    </>);
}


export default App
