//importing and setting up up.
const pg = require("pg");
const express = require("express");
app = express();
const client = new pg.Client(
  process.env.DATABASE_URL || "postgres://localhost/acme_hr_directory"
);
const PORT = 8080;
//connecting to server.
client.connect((error) => {
  if (error) {
    console.error("there was an error connecting");
    throw new Error("failed to connect");
  } else {
    console.log("connected");
  }
});

init();

async function init() {
  app.listen(PORT);
  //dropping tables and creating new ones
  try {
    await client.query(`
        DROP TABLE IF EXISTS employee;
        DROP TABLE IF EXISTS department;
        CREATE TABLE department(
        id SERIAL PRIMARY KEY,
         name VARCHAR(50));
        CREATE TABLE employee(
        id SERIAL PRIMARY KEY,
        name VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP,
        department_id INTEGER REFERENCES department(id)NOT NULL);`);
  } catch (error) {
    console.error("there was an error droping and creating tables");
  }

  //inserting data into tables
  try {
    await client.query(`
        INSERT INTO department(name)
        VALUES('sales'), ('HR'), ('operations');
        INSERT INTO employee(name, created_at, department_id)

        VALUES ('Alice Johnson',NOW(),(SELECT id FROM department WHERE name = 'sales')),

               ('Carol Davis',  NOW(),(SELECT id FROM department WHERE name = 'operations')),
               
                ('Bob Smith',NOW(),(SELECT id FROM department WHERE name = 'HR'));`);
  } catch (error) {
    console.error("there was an error inserting your data", error);
  }
}

//----------------------------routes-----------------------------------------------------------------------------
app.use(express.json());
// get all emlpyess
app.get("/api/employees", async (req, res) => {
  try {
    const result = await client.query(`SELECT * FROM employee;`);
    res.json(result.rows);
  } catch (error) {
    console.error("therer was an error in you /GET request, employees");
  }
});
// get all departements
app.get("/api/departments", async (req, res) => {
  try {
    const result = await client.query(`SELECT * FROM department;`);
    res.json(result.rows);
  } catch (error) {
    console.error("therer was an error in you /GET request, department");
  }
});
// add new employee
app.post("/api/employees", async (req, res) => {
  try {
    const { name, department_id } = req.body;

    const result = await client.query(
      `
    INSERT INTO employee(name,created_at,department_id)
    VALUES($1,NOW(),$2) RETURNING *;`,
      [name, department_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("there was an error adding an employee /POST", error);
  }
});
// remove employee
app.delete("/api/employees/:id", async (req, res) => {
  const employeeid = req.params.id;
  try {
    const result = await client.query(
      `
       DELETE FROM  employee WHERE id = $1 RETURNING *;`,
      [employeeid]
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: "empoyee not found" });
    } else
      res
        .status(200)
        .json({ message: "employee has been deleted successfully" });
  } catch (error) {
    console.error("there was an error deleteing", error);
  }
});
// updating an employee
app.put("/api/employees/:id", async (req, res) => {
  const employeeId = req.params.id;
  const { name, department_id } = req.body;

  try {
    const result = await client.query(
      `
      UPDATE employee SET name = $1, 
      department_id = $2,
      updated_at = NOW()
      WHERE id = $3 RETURNING *;`,
      [name, department_id, employeeId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "employee not found" });
    } else {
      res.status(200).json(result.rows[0]);
    }
  } catch (error) {
    console.error("there was an updating an employeee", error);
  }
});
