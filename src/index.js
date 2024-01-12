import http from "http";
import {server} from "websocket";

const httpServer = http.createServer();
httpServer.listen(9090, () => console.log("Listening.. on 9090"))
//hashmap clients
const clients = {};
const games = {};
const wsServer = new server({
    "httpServer": httpServer
})
wsServer.on("request", request => {
    //connect
    const connection = request.accept(null, request.origin);
    connection.on("open", () => console.log("opened!"))
    connection.on("close", () => console.log("closed!"))
    connection.on("message", message => {
        const result = JSON.parse(message.utf8Data)
        //I have received a message from the client
        //a user want to create a new game
        if (result.method === "create") {
            const gameId = guid();
            games[gameId] = {
                "id": gameId,
                "player1": {
                    name: "",
                    squares: Array(10).fill(false)
                },
                "player2": {
                    name: "",
                    squares: Array(10).fill(false)
                },
                "host": result.userId,
                "clients": [{
                    "clientId": result.userId,
                }]
            }

            const payLoad = {
                "method": "create",
                "game" : games[gameId]
            }

            const con = clients[result.userId].connection;
            con.send(JSON.stringify(payLoad));
            updateGameState();
        }

        //a client want to join
        if (result.method === "join") {

            const gameId = result.gameId;
            const game = games[gameId];

            game.clients.push({
                "clientId": result.userId,
            })

            const payLoad = {
                "method": "join",
                "game": game
            }
            //loop through all clients and tell them that people has joined
            clients[result.userId].connection.send(JSON.stringify(payLoad))
        }
        //a user plays
        if (result.method === "update") {
            const gameId = result.gameId;

            if(!games[gameId]){
                games[gameId] = {host: result.gameId, clients: [{clientId: result.userId}]}
                games[gameId].player1 = {};
                games[gameId].player2 = {};
            }


            games[gameId].player1 = result.game.player1;
            games[gameId].player2 = result.game.player2;
            updateGameState()       
        }

    })

    //generate a new clientId
    const clientId = guid();
    clients[clientId] = {
        "connection":  connection
    }

    const payLoad = {
        "method": "connect",
        "clientId": clientId
    }
    //send back the client connect
    connection.send(JSON.stringify(payLoad))
})


function updateGameState(){

    //{"gameid", fasdfsf}
    for (const g of Object.keys(games)) {
        const game = games[g]
        const payLoad = {
            "method": "update",
            "game": game
        }

        game.clients.forEach(c=> {
            clients[c.clientId].connection.send(JSON.stringify(payLoad))
        })
    }

}



function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
 