import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Row from "react-bootstrap/Row"

import type { Deck, Alert } from "./types"
import { presentMDToJSX } from "./deckconverter";
import { AspectRatio } from "./components/ui/aspect-ratio";

const API = "https://comp2140-3ea651da.uqcloud.net/api";

function Viewer() {
    const [model, setmodel] = useState<Deck>();
    const [code, setcode] = useState<string>();
    const [displayName, setdisplayName] = useState<string>();
    const [ready, setready] = useState<boolean>(false);
    const [alert, setAlert] = useState<Alert>({ hidden: true, type: "dark", message: <></> });


    /**
     * GETs the presentation corresponding to the publicCode stored in state from the API.
     * Upon success, sets the state variable model to the presentation's model, then returns true.
     * Otherwise returns false, and displays an alert.
     */
    async function getPresentation() {
        const response = await fetch(`${API}/public?public_code=${code}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
            }
        }).then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error.")))
        .catch((error) => console.error(error.message));

        if (!response) {
            setAlert({ hidden: false, type: "danger",
                message: <><b>Error:</b> Could not fetch presentation.  Please check API status.</>
            });
            return false;
        }

        if (response.total == 0) {
            setAlert({ hidden: false, type: "danger",
                message: <><b>Error:</b> No presentation corresponsing to provided code.</> });
            return false;
        }

        setmodel(response.data[0].model);

        const body = { viewers: [...response.data[0].viewers,
                                    { name: displayName, datetime: Date.now()}] }
        await fetch(`${API}/public/${response.data[0].id}`,
            {
                method: "PATCH",
                body: JSON.stringify(body),
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
                }
            }
        ).then((response) => response.ok ?
            response.json :
            Promise.reject(new Error(response.statusText || "Unknown error."))
        ).catch((error) => console.error(error.message));

        return true;
    }

    /**
     * Handles submission of the form containing inputs for display name and watch code.
     * Sets the state variable `ready` to true if inputs are valid, or displays an alert otherwise.
     */
    async function submit(e: React.SubmitEvent) {
        e.preventDefault();
        if (!code) {
            setAlert({ hidden: false, type: "danger", message: <>Please enter a watch code!</> });
            return;
        }
        if (!displayName) {
            setAlert({ hidden: false, type: "danger", message: <>Please enter a display name!</> });
            return;
        }

        // getPresentation() displays alert based on the specific error.
        if (await getPresentation()) {
            setready(true);
            setAlert({ hidden: true, type: "dark", message: <></> })
        }

    }


    return (
        <div className="m-2">
            {!ready &&
                <div>
                    <form onSubmit={submit}>
                        <Row className="mt-5">
                            <div className="d-flex justify-content-center align-items-center">
                                <label>Watch Code:</label> 
                                <Input className="mx-2" style={{ maxWidth: "100px" }}
                                    placeholder="w-xxxxxx" value={code}
                                    onChange={(e) => setcode(e.target.value)} />
                            </div>
                        </Row>

                        <Row className="mt-3">
                            <div className="d-flex justify-content-center align-items-center">
                                <label>Display Name:</label> 
                                <Input className="mx-2" style={{ maxWidth: "150px" }}
                                    placeholder="A. Student" value={displayName}
                                    onChange={(e) => setdisplayName(e.target.value)} />
                            </div>
                        </Row>

                        <Row className="mt-3">
                            <div className="d-flex justify-content-center align-items-center">
                                <Button className="mx-2 rounded px-5" variant="outline" 
                                        type="submit">
                                    Join
                                </Button>
                            </div> 
                        </Row>

                    </form>
                </div>
            }

            {ready &&
                <DeckWatcher deck={model} />
            }
            <div className="d-flex justify-content-center mt-3">
                <div className={`alert alert-${alert.type}`} hidden={alert.hidden}>
                    {alert.message}
                </div>
            </div>
        </div>
    );
}

function DeckWatcher(props: { deck: Deck | undefined}) {
    const [slideNo, setslideNo] = useState<number>(1);
    const [finished, setfinished] = useState<boolean>(false);
    const preview = presentMDToJSX(props.deck);

    if (!props.deck) {
        return <></>
    }

    if (slideNo > props.deck.slides.length) {
        setslideNo(props.deck.slides.length);
    }

    /**
     * Increments the slideNo state variable if the current value is less than the number of slides
     * in the loaded preview.
     * If there are no more slides, then the finished state variable is set to true.
     */
    function nextPage() {
        if (!props.deck) {
            return;
        }

        if (slideNo < props.deck.slides.length) {
            setslideNo(slideNo + 1);
        } else {
            setfinished(true);
        }
    }

    return (<>
        <div className="d-flex justify-content-center">
            <div style={{ width: "80vw" }}><AspectRatio ratio={16/9}>
                <div className="w-full h-full overflow-hidden border border-dark rounded p-2
                        viewer">
                    {!finished && preview[slideNo - 1]}
                    {finished && <PresentationFinished />}
                </div>
            </AspectRatio></div>
        </div>
        <div className="d-flex justify-content-center align-items-center mt-3">
            <Button className="rounded p-4" variant="outline" onClick={nextPage}>
                Next
            </Button>
        </div>
    </>);
}

function PresentationFinished() {
    return (
        <div className="w-full h-full d-flex justify-content-center align-items-center finished">
            Presentation finished.<br/>
            Thanks for watching!
        </div>
    )
}

export default Viewer;
