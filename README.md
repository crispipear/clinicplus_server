## Clinic+ Server

BIS 398 Indepedent Study project Clinic+

install node
`npm install`
`npm run start`

---

### Data Payload

When sending in data, include the keys: 
**"type"** - "patients", "appointments" 
**"action"** - "create", "edit", "delete" 
**"id"** - the id of the specific item
**"dataComponent"** - individual data item that needs to be modified (can be excluded when `"action": "delete"`)

example (edit the name of exisiting patient):
```    
{
  "type": "patients", 
  "action": "edit",
  "id": 1102,
  "dataComponent": {
    "name": "Jonathan Doe"
  }
}
```

---

## Routes

#### "/" (root)
returns all current data

#### "/metadata"
returns example data structure

#### "/patients"
returns patients data

#### "/patients/${id}"
returns specific patient data by id
`http://IP:PORT/patients/1101`

#### "/appointments"
returns appoinments data

#### "/appointments/${id}"
returns specific appoinment data by id
`http://IP:PORT/appointments/1101`

---