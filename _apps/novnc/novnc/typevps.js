import UI from "./app/ui.js"


export const typevpsSendAuthMessage = (sock) => {
    // get dbVmId and accessToken from url of the iframe
    // get url of iframe
    console.log(window.location.search)

    const urlParams = new URLSearchParams(window.location.search);
    const vmId = urlParams.get('dbVmId');
    const accessToken = urlParams.get('accessToken');

    if(!vmId || !accessToken) {
        console.log('no vmId or accessToken')
        return
    }

    sock.sendString(JSON.stringify({
        "vmId": vmId,
        "accessToken": accessToken
    }))
}

export const typevpsParseServerMessage = (sock) => {
    console.log('parse server message')
    const message = sock.rQshiftStr(sock.rQlen);
    const messageParsed = JSON.parse(message)
    const password = messageParsed?.password
    if(!password) {
        console.log('no password')
        return
    }

    // set password wtf
    typevpsState.isConnected = true
    typevpsState.isLoggedIn = true
    
    console.log('password', password)
    UI.rfb.sendCredentials({ username: '', password: password });

}

export const typevpsState = {
    isConnected: false,
    isLoggedIn: false,   
}