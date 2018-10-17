var express         = require("express"),
    app             = express(),
    readline        = require("readline"),
    metadata        = require('./metadata.json'),
    PORT            = 3000

var server = app.listen(PORT, () => {
 console.log("Server running on port "+PORT)
})

var io = require('socket.io')(server)

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.on('line', (input) => {
    io.sockets.emit('send_message', {message: input})
  });

io.on('connection', socket => {
    console.log('client connected')
    socket.on('disconnect', () => console.log('client disconnected'))
    socket.on('post_message', data => console.log('incoming message: ', data.message))
})

app.get("/", (req, res) => {
 res.json(metadata)
});
