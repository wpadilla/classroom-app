import {startWhatsappServices} from "../services/whatsapp";
import {toast} from "react-toastify";
import {onSocketOnce, PROD_SOCKET_URL} from "../utils/socket.io";
import {IStudent} from "../App";
import React, {useMemo} from "react";
import * as io from "socket.io-client";
import {Button} from "reactstrap";
import {Link, useSearchParams} from "react-router-dom";

export const Layout = ({children}: any) => {
    const [socket, setSocket] = React.useState<io.Socket>();
    const [logged, setLogged] = React.useState<boolean>(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const isAdmin = useMemo(() => {
        return searchParams.get('admin') === '123456';
    }, [searchParams]);
    React.useEffect(() => {
        if (!socket) {
            setSocket(io.connect(PROD_SOCKET_URL));
        }
    }, [])

    React.useEffect(() => {
        handleWhatsappMessaging(onMessageSent, onMessageEnd);
    }, [logged]);

    const onMessageSent = (contact: IStudent) => {
        console.log('contact', contact)
        toast(`Mensaje enviado a ${contact.firstName}`);
    }

    const onMessageEnd = (contacts: IStudent[]) => {
        toast('¡Mensajes Enviados con Exito!', {type: 'success'});
    }
    const login = async (sessionId: string) => {
        const response: any = await (await startWhatsappServices(true, sessionId)).json();
        console.log('response', response);
        const {status} = response;
        toast(`Whatsapp is ${status}`);
        setLogged(status === 'logged')
    }


    const handleWhatsappMessaging = (sent: (contact: IStudent) => any, end: (contacts: IStudent[]) => any) => {
        if (socket) {
            onSocketOnce(socket, 'ws-message-sent', sent);
            onSocketOnce(socket, 'ws-messages-end', end);
        }
    }

    return (
        <div>
            {children}
            {isAdmin &&
                <div
                    className="bg-white p-3 d-flex justify-content-around align-items-center shadow-lg position-sticky bottom-0 w-100">
                    <Button
                        color="info"
                        onClick={() => login('wpadilla')}>Run Whatsapp
                    </Button>

                    <Link to="wpadilla?admin=123456">
                        <Button
                            color="info"
                        >
                            Williams
                        </Button>
                    </Link>

                    <Link to="/?admin=123456">
                        <Button
                            color="info"
                        >
                            Aulas
                        </Button>
                    </Link>
                </div>}
        </div>
    )
}