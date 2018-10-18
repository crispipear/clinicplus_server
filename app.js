var express         = require("express"),
    app             = express(),
    readline        = require("readline"),
    metadata        = require('./data/metadata.json'),
    PORT            = 3000,
    NETWORK_IP      = require('os').networkInterfaces().en0[1].address,
    fs              = require('fs')


//on load store metadata to data
storeData(JSON.stringify(metadata, null, 4))

var server = app.listen(PORT, () => {
 console.log(`Server running on ${NETWORK_IP}:${PORT}`)
})

var io = require('socket.io')(server)

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
})

rl.on('line', (input) => {
  io.sockets.emit('send_message', {message: input})
})

io.on('connection', socket => {
    console.log('client connected')
    socket.on('disconnect', () => console.log('client disconnected'))
    socket.on('post_message', payload => {
      validateData(payload)
    })
})

//routes//
app.get("/", (req, res) => {
//  res.json(metadata)
  let data = require('./data/data.json')
  res.json(data)
})

app.get("/metadata", (req, res) => {
  res.json(metadata)
})

app.get("/patients", (req, res) => {
  let data = require('./data/data.json')
  res.json(data.patients)
})

app.get("/patients/:id", (req, res) => {
  let data = require('./data/data.json')
  let filtered = data.patients.find(f => f.id == req.params.id)
  res.json(filtered)
})

app.get("/appointments/:id", (req, res) => {
  let data = require('./data/data.json')
  let filtered = data.appointments.find(f => f.id == req.params.id)
  res.json(filtered)
})
//end routes//

function validateData(data){
  console.log('processing data: \n', data)
  const dataTypes = ['patients', 'appointments']
  if (dataTypes.includes(data.type)){
    let currentData = require('./data/data.json')
    let filtered = getFilteredData(currentData, data.type, data)
    switch(data.action){
      case "create":
        const dataProps = {
          patients: ["name", "age"],
          appointments: ["date", "time"]
        }
        let propsValidation = dataProps[data.type].every(prop => data.dataComponent.hasOwnProperty(prop))
        if (propsValidation && (filtered == null || filtered == undefined)) {
          let newData = data.dataComponent
          newData.id = data.id
          newData.appointments = []
          currentData[data.type].push(newData)
          console.log(`creating new data ${data.type} at id ${data.id}`)
        }
        break;
      case "edit":
        if(filtered != undefined || filtered != null){
          let keys = Object.getOwnPropertyNames(data.dataComponent)
          keys.map(key => filtered[key] = data.dataComponent[key])
        }
        break;
      case "delete":
        if(filtered != undefined || filtered != null){
          let itemIndex = currentData[data.type].indexOf(filtered)
          currentData[data.type].splice(itemIndex, 1)
          console.log(`creating new data ${data.type} at id ${data.id}`)
        }
        break;
    }
    storeData(JSON.stringify(currentData, null, 4))
  }
}

function getFilteredData(current, dataType, incoming){
  let filtered = current[dataType].find(f => f.id == incoming.id)
  if(filtered != undefined || filtered != null){
    console.log(`found ${incoming.type} at id ${incoming.id}`)
    return filtered
  }else{
    console.log(`${incoming.type} id: ${incoming.id} does not exist in database`)
    return null
  }
}

function storeData(data){
  fs.writeFile("./data/data.json", data, function(err) {
    if(err) {
        return console.log('write file failed: ', err)
    }
  })
}