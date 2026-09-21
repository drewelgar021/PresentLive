import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Public, PresentMD, Alert } from "./types.tsx"
import { useParams } from "react-router-dom";
import Row from "react-bootstrap/Row";

const API = "https://comp2140-3ea651da.uqcloud.net/api";

function Analytics() {
    const [code, setcode] = useState<string>();
    const [loadCode, setloadCode] = useState<string>("");
    const [privatePresentation, setprivatePresentation] = useState<PresentMD>();
    const [publicPresentation, setpublicPresentation] = useState<Public>();
    const [alert, setalert] = useState<Alert>({ hidden: true, type: "dark", message: <></> });
    const [showInfo, setshowInfo] = useState<boolean>(false);

    const { code: urlCode } = useParams<{ code?: string }>();
    useEffect(() => {
        if (urlCode) {
            // eslint-disable-next-line react-hooks/immutability
            getPresentation(urlCode);
        }
    }, [urlCode]);

    async function getPresentation(code: string) {
        const privateResponse = await fetch(`${API}/presentmd?code=${code}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
                }
            }
        ).then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error."))
        ).catch((error) => console.error(error.message));

        if (!privateResponse) {
            setalert({ hidden: false, type: "danger",
                message: <><b>Error:</b> Could not fetch presentation.
                            Please check API status.</>});
            return;
        }

        if (privateResponse.total == 0) {
            setalert({ hidden: false, type: "danger",
                message: <><b>Error:</b> No presentation corresponding to provided code.</>
            });
            return;
        }

        setalert({ hidden: false, type: "success",
            message: <>Presentation analytics loaded successfully!</>});

        setprivatePresentation(privateResponse.data[0]);

        const publicResponse = await fetch(
            `${API}/public?public_code=${privateResponse.data[0].public_code}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
                }
            }
        ).then((response) => response.ok ?
            response.json() :
            Promise.reject(new Error(response.statusText ?? "Unknown error."))
        ).catch((error) => console.error(error.message));

        if (!publicResponse) {
            setalert({ hidden: false, type: "warning",
                message: <><b>Warning:</b> Could not fetch public presentation entity.
                        Poll responses and viewer information is currently unavailable.</>
            });
            return;
        }

        if (publicResponse.total == 0) {
            return;
        }

        setpublicPresentation(publicResponse.data[0]);
    }

    function togglePresentationInfo() {
        setshowInfo(!showInfo);
    }

    function exit() {
        setprivatePresentation(undefined);
        setpublicPresentation(undefined);
        setalert({ ...alert, hidden: true });
        setshowInfo(false);
    }


    return <>
        <div className="d-flex align-items-center justify-content-center mt-3">
            <div className={`alert alert-${alert.type}`} hidden={alert.hidden}>
                {alert.message}
            </div>
        </div>

        {!privatePresentation && <>
            <Row>
                <div className="d-flex justify-content-center align-items-center mt-3">
                    <label>Presentation Code:</label>
                    <Input className="mx-2" style={{maxWidth: "140px"}} placeholder="Code"
                            value={loadCode} onChange={(e) => setloadCode(e.target.value)} />
                </div>
            </Row>
            <Row>
                <div className="d-flex justify-content-center align-items-center mt-3">
                    <Button variant="outline" className="rounded p-3"
                            onClick={() => getPresentation(loadCode)}>
                        Load Analytics
                    </Button>
                </div>
            </Row></>
        }
        {privatePresentation && <>
            <Row>
                <div className="d-flex justify-content-center align-items-center mt-3">
                    <Button variant="outline" className="rounded p-3" onClick={() => exit()}>
                        Exit
                    </Button>
                </div>
            </Row>

            <div className="d-flex align-items-center justify-content-center mt-3">
                <Button variant="outline" className="rounded p-3"
                        onClick={() => togglePresentationInfo()}>
                    Presentation Info
                </Button>
            </div>
            {showInfo &&
                <div className="d-flex align-items-center justify-content-center mt-3">
                    <table className="table table-bordered mx-5"><tbody>
                        <tr>
                            <th>code</th>
                            <td>{privatePresentation.code}</td>
                        </tr>
                        <tr>
                            <th>contents</th>
                            <td>{privatePresentation.contents}</td>
                        </tr>
                    {publicPresentation && <>
                        <tr>
                            <th>public_code</th>
                            <td>{privatePresentation.public_code}</td>
                        </tr>
                        <tr>
                            <th>model</th>
                            <td>{JSON.stringify(publicPresentation.model)}</td>
                        </tr>
                    </>}
                    </tbody></table>
                </div>
            }
        </>}

    </>;
}

export default Analytics
