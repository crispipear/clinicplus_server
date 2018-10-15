var express = require("express"),
    app = express(),
    metadata = require('./metadata.json'),
    PORT = 3000

var server = app.listen(PORT, () => {
 console.log("Server running on port "+PORT)
 //get ip using "netstat -rn |grep default"
});

var io = require('socket.io')(server)

io.on('connection', socket => {
    console.log('client connected')
    socket.on('disconnect', () => console.log('client disconnected'))
})

app.get("/", (req, res) => {
 res.json(metadata)
});
