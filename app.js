const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
let db = null
const dbPath = path.join(__dirname, 'covid19India.db')
const app = express()
app.use(express.json())
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server Running At http://localhost/3000/')
    })
  } catch (e) {
    console.log(`Error Occured:${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

//Getting List Of States
function convertDBOjectToResponseObject(dbObject) {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  }
}
function convertDBOjectToResponseObjectDistrict(dbObject) {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const sqlquery = `
    SELECT * FROM state 
    ORDER BY STATE_ID;
    `
  const statesList = await db.all(sqlquery)
  response.send(
    statesList.map(eachItem => convertDBOjectToResponseObject(eachItem)),
  )
})

//Getting a State Based on Sate_id

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const sqlquery = `
  SELECT * FROM STATE
  WHERE STATE_ID=${stateId};
  `
  const state = await db.get(sqlquery)
  response.send(convertDBOjectToResponseObject(state))
})

//Creating a New District

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const sqlquery = `
  INSERT INTO DISTRICT(
    district_name,
    state_id,
     cases,
     cured,
  active,
  deaths)
  VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});
  `
  await db.run(sqlquery)
  response.send('District Successfully Added')
})

//Getting a District Based On district_id

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const sqlquery = `
  SELECT * FROM DISTRICT
  WHERE DISTRICT_ID=${districtId};
  `
  const district = await db.get(sqlquery)
  response.send(convertDBOjectToResponseObjectDistrict(district))
})

//Deleting a District
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const sqlquery = `
  DELETE FROM DISTRICT
  WHERE DISTRICT_ID=${districtId};
  `
  await db.run(sqlquery)
  response.send('District Removed')
})

//Updating a District
app.put('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const sqlquery = `
  UPDATE DISTRICT
  SET
  district_name='${districtName}',
    state_id=${stateId},
     cases=${cases},
     cured=${cured},
  active=${active},
  deaths=${deaths}
  WHERE DISTRICT_ID=${districtId};
  `
  await db.run(sqlquery)
  response.send('District Details Updated')
})

//Total Details in a state

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const sqlquery = `
  SELECT 
  sum(cases) as totalCases,
  sum(cured) as totalCured,
  sum(active) as totalActive,
  sum(deaths) as totalDeaths
  FROM DISTRICT
  WHERE STATE_ID=${stateId}
  GROUP BY STATE_ID
  `
  const report = await db.get(sqlquery)
  response.send(report)
})

//Returns an object containing the state name of a district based on the district ID

app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const sqlquery = `
  SELECT STATE_NAME
  FROM STATE JOIN DISTRICT ON STATE.STATE_ID=DISTRICT.STATE_ID
  WHERE DISTRICT.DISTRICT_ID=${districtId};
  `
  const state = await db.get(sqlquery)
  response.send({stateName: state.state_name})
})
module.exports = app
