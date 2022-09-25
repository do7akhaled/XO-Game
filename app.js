const app = require('express')();
const http = require('http')

app.listen(8080, () => console.log('HTTP server Listenting on port 8080'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
})



const websocketServer = require('websocket').server
const httpServer = http.createServer();

const clients = {};
const games = {};


httpServer.listen(9090, () => console.log('Ws Listening on port 9090'))

const wsServer = new websocketServer({
    "httpServer": httpServer
})

wsServer.on('request', request => {
    const connection = request.accept(null, request.origin)

    const clientId = guid()
    clients[clientId] = {
        "connection" : connection
    }

    const payLoad = {
        "method" : 'connect',
        "client" : clientId
    }

    connection.send(JSON.stringify(payLoad))


    connection.on('message', request => {
        const message = JSON.parse(request.utf8Data)
        let {method, ...NewMessage} = message
        connection.send(JSON.stringify(mapReqest(method, NewMessage)))

    })
})


const actions = {
    "create": CreateGame,
    "join" : JoinGame,
}


function mapReqest(method, data) {
    return actions[method](data)
}

function JoinGame(data) {
    const clientId  = data.clientId
    const gameId = data.gameId

    game = games[gameId]
    const symbol =['X', 'O'][game.clients.length]
    game.clients.push({
        "clientId": clientId,
        "symbol": symbol
    })

    const payLoad = {
        "method": "join",
        "game": game
    }

    game.clients.forEach(client => {
        clients[client.clientId].connection.send(JSON.stringify(payLoad))
    })

    return ''
} 


function PlayGame(data) {
    const clientId = data.clientId
    const gameId = data.gameId
    const cellId = data.cellId
    
    let state = games[gameId].state

    state[cellId] = clientId
    games[gameId].state = state

    updateGameState()
}

function CreateGame() {
    const gameId = guid()

    games[gameId] = {
        "id": gameId,
        "clients": [],
        "state": {}
    }

    return {
        "method": "create",
        "game": games[gameId]
    }
}





function updateGameState() {
    for (const g of Object.keys(games)) {

        const payLoad = {
            "method": "update",
            "game": games[g]
        }

        games[g].clients.forEach(c => {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }
}
function guid() {
    return Math.floor(Math.random() * 100000);
}
