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

        result = mapReqest(method, NewMessage);
        if(!!result)
            connection.send(JSON.stringify(result))

    })
})


const actions = {
    "create": CreateGame,
    "join" : JoinGame,
    "play" : PlayGame
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
    const gameId = data.gameId
    const cellId = data.cellId
    const symbol = data.symbol


    let state = games[gameId].state

    state[cellId] = symbol
    games[gameId].state = state
    games[gameId].turn = symbol == "X" ? "O" : "X"

    updateGameState(gameId)
}

function CreateGame() {
    const gameId = guid()

    games[gameId] = {
        "id": gameId,
        "clients": [],
        "state": {},
        "turn": 'X'
    }

    return {
        "method": "create",
        "game": games[gameId]
    }
}





function updateGameState(gameId) {
    let winner = checkWinner(gameId);
    const payLoad = {
        "method": "update",
        "game": games[gameId],
        ...winner
    }

    games[gameId].clients.forEach(c => {
        clients[c.clientId].connection.send(JSON.stringify(payLoad))
    })



    if(winner.winner)
    {
        resetGameState(gameId);
    }

}
function guid() {
    return Math.floor(Math.random() * 100000);
}


let winningPatterns = [
    [1,2,3],
    [4,5,6],
    [7,8,9],
    [1,4,7],
    [2,5,8],
    [3,6,9],
    [1,5,9],
    [3,5,7],
]

function checkWinner(gameId)
{
    let game = games[gameId]
    let winning = false
    let winnerObj = {};
    winningPatterns.forEach(pattern => {
        if(winning == false)
        {
            winning = game.state[pattern[0]] == game.state[pattern[1]] && game.state[pattern[0]] == game.state[pattern[2]]

            if(winning)
            {
                //symbol of winner
                winnerObj =  {
                    "winner" : game.state[pattern[0]],
                    "pattern": pattern
                }
            }
        }

    });

    return winnerObj;
    
}


function resetGameState(gameId)
{
    games[gameId].state = {} 
}


