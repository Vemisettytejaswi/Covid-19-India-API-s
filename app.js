const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToStateObject = (obj) => {
  return {
    stateId: obj.state_id,
    stateName: obj.state_name,
    population: obj.population,
  };
};

const convertDbObjectToDistrictObject = (obj) => {
  return {
    districtId: obj.district_id,
    districtName: obj.district_name,
    stateId: obj.state_id,
    cases: obj.cases,
    cured: obj.cured,
    active: obj.active,
    deaths: obj.deaths,
  };
};
//API 1
app.get("/states/", async (request, response) => {
  const statesQuery = `SELECT * FROM state;`;
  const statesResult = await database.all(statesQuery);
  response.send(
    statesResult.map((eachResult) => convertDbObjectToStateObject(eachResult))
  );
});
//API2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateQuery = `SELECT * FROM state WHERE state_id = ${stateId}`;
  const getStatesResult = await database.get(getStateQuery);
  response.send(convertDbObjectToStateObject(getStatesResult));
});
//API3
app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district (state_id, district_name, cases, cured, active, deaths)
  VALUES
    (${stateId}, '${districtName}', ${cases}, ${cured}, ${active}, ${deaths});`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});
//API4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictsQuery = `
    SELECT
      *
    FROM
     district
    WHERE
      district_id = ${districtId};`;
  const district = await database.get(getDistrictsQuery);
  response.send(convertDbObjectToDistrictObject(district));
});

//API5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `DELETE FROM district WHERE district_id = ${districtId};`;
  const deleteDistrictResult = await database.run(deleteDistrictQuery);
  response.send("District Removed");
});
//API6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `UPDATE district SET district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},cured = ${cured},active = ${active},deaths = ${deaths}
     WHERE district_id = ${districtId};`;
  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});
//API7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM
      district
    WHERE
      state_id=${stateId};`;
  const stats = await database.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getStateNameQuery = `
    SELECT
      state_name
    FROM
      district
    NATURAL JOIN
      state
    WHERE 
      district_id=${districtId};`;
  const state = await database.get(getStateNameQuery);
  response.send({ stateName: state.state_name });
});
module.exports = app;
