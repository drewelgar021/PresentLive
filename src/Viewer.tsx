import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Row from "react-bootstrap/Row"

import type { Deck, Alert } from "./types"

function Viewer() {
    const [slideNo, setslideNo] = useState<number>(1);
    const [model, setmodel] = useState<Deck>();
    const [code, setcode] = useState<string>();
    const [displayName, setdisplayName] = useState<string>();
    const [ready, setready] = useState<boolean>(false);
    const [alert, setAlert] = useState<Alert>({ hidden: true, type: "dark", message: <></> });

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

        setAlert({ hidden: true, type: "dark", message: <></> })
    }

    return (
        <div className="m-2">
            {!ready &&
                <div>
                    <form onSubmit={submit}>
                        
                        <Row className="mt-5">
                            <div className="d-flex justify-content-center align-items-center">
                                <label>Watch Code:</label> 
                                <Input className="mx-2" style={{ maxWidth: "100px" }} placeholder="w-xxxxxx"
                                    value={code} onChange={(e) => setcode(e.target.value)} />
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
                                <Button className="mx-2 rounded px-5" variant="outline" type="submit">
                                    Join
                                </Button>
                            </div> 
                        </Row>

                    </form>
                </div>
            }
            <div className="d-flex justify-content-center mt-3">
                <div className={`alert alert-${alert.type}`} hidden={alert.hidden}>
                    {alert.message}
                </div>
            </div>
        </div>
    );
}

export default Viewer;
