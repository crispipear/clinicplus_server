var express         = require("express"),
    app             = express(),
    readline        = require("readline"),
    metadata        = require('./data/metadata.json'),
    PORT            = 3001,
    os              = require('os'),
    fs              = require('fs'),
    package         = require('./package.json'),
    bodyParser      = require('body-parser')



//on load store metadata to data
storeData(JSON.stringify(metadata, null, 4))

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var server = app.listen(PORT, () => {
  console.log('Server version: ', package.version)
  if(os.networkInterfaces().hasOwnProperty('en0')){
    console.log(`Server running on ${os.networkInterfaces().en0[1].address}:${PORT}`)
  }else{
    console.log(`No internet, server running on localhost:${PORT}`)
  }
})
var urlencodedParser = bodyParser.urlencoded({extended: false});

// Add headers
app.use(function (req, res, next) {

  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', 'http://192.168.1.24:3000');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Request headers you wish to allow
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

  // Set to true if you need the website to include cookies in the requests sent
  // to the API (e.g. in case you use sessions)
  res.setHeader('Access-Control-Allow-Credentials', true);

  // Pass to next layer of middleware
  next();
});

var temp = {}
app.post("/login", urlencodedParser, (req, res) => {
  console.log(req.body)
  temp = req.body
  res.status(200).send('done')
})

app.get("/users", (req, res) => {
  res.json(temp)
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
    socket.on('create_appointment', payload => {
      validateData(payload)
    })
    io.sockets.emit('init', {version: package.version})
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

app.get("/appointments", (req, res) => {
  let data = require('./data/data.json')
  res.json(data.appointments)
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
          appointments: ["user", "date", "time", "type", "symptoms"]
        }
        let propsValidation = dataProps[data.type].every(prop => data.dataComponent.hasOwnProperty(prop))
        if(!isEmptyValue(filtered)){
          io.sockets.emit('response', {res: `${data.type} id ${data.id}: already exists in database`})
        }
        if (propsValidation && isEmptyValue(filtered)) {
          let newData = data.dataComponent
          newData.id = data.id
          if(data.type == 'patients'){
            newData.appointments = []
          }
          if(data.type == 'appointments'){
            let user = currentData.patients.find(p => p.id == data.dataComponent.user)
            let index = currentData.patients.indexOf(user)
            currentData.patients[index].appointments.push(data.id)
          }
          currentData[data.type].push(newData)
          console.log(`creating new data ${data.type} at id ${data.id}`)
        }
        break;
      case "edit":
        if(!isEmptyValue(filtered)){
          let keys = Object.getOwnPropertyNames(data.dataComponent)
          keys.map(key =>  {
              if(!isEmptyValue(data.dataComponent[key])){
                filtered[key] = data.dataComponent[key]
              }
            })
        }else{
          io.sockets.emit('response', {res: `${data.type} id ${data.id}: does not exist in database`})
        }
        break;
      case "delete":
        if(!isEmptyValue(filtered)){
          let itemIndex = currentData[data.type].indexOf(filtered)
          currentData[data.type].splice(itemIndex, 1)
          console.log(`creating new data ${data.type} at id ${data.id}`)
        }else{
          io.sockets.emit('response', {res: `${data.type} id ${data.id}: does not exist in database`})
        }
        break;
    }
    storeData(JSON.stringify(currentData, null, 4))
  }
} 

function getFilteredData(current, dataType, incoming){
  let filtered = current[dataType].find(f => f.id == incoming.id)
  if(!isEmptyValue(filtered)){
    console.log(`found ${incoming.type} at id ${incoming.id}`)
    return filtered
  }else{
    return null
  }
}

function isEmptyValue(val){
  return val == null || val == undefined || val == ""
}

function storeData(data){
  fs.writeFile("./data/data.json", data, function(err) {
    if(err) {
        return console.log('write file failed: ', err)
    }
  })
}