const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const isValid = require("date-fns/isValid");
const format = require("date-fns/format");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    await app.listen(3010);
    console.log("Server Running at http://localhost:3010/");
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

const hasCategoryAndPriorityProperties = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

const isValidTodoPriority = (item) => {
  return item === "HIGH" || item === "Medium" || item === "LOW";
};

const isValidTodoCategory = (item) => {
  return item === "WORK" || item === "HOME" || item === "LEARNING";
};

const isValidTodoStatus = (item) => {
  return item === "TO DO" || item === "IN PROGRESS" || item === "DONE";
};

const isValidTodoDueDate = (item) => {
  return isValid(new Date(item));
};

const convertDueDate = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    category: dbObject.category,
    status: dbObject.status,
    dueDate: dbObject.dueDate,
  };
};

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodosQuery = "";
  const { search_q = "", priority, status, category } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      if (isValidTodoPriority(priority) && isValidTodoStatus(status)) {
        data = await database.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else if (isValidTodoPriority(priority)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasCategoryAndStatusProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND category = '${category}';`;
      if (isValidTodoCategory(category) && isValidTodoStatus(status)) {
        data = await database.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else if (isValidTodoCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Status");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryAndPriorityProperties(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}'
        AND category = '${category}';`;
      if (isValidTodoCategory(category) && isValidTodoPriority(priority)) {
        data = await database.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else if (isValidTodoCategory(category)) {
        response.status(400);
        response.send("Invalid Todo Priority");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasCategoryProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND category = '${category}';`;
      if (isValidTodoCategory(category)) {
        data = await database.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND priority = '${priority}';`;
      if (isValidTodoPriority(priority)) {
        data = await database.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}';`;
      if (isValidTodoStatus(status)) {
        data = await database.all(getTodosQuery);
        response.send(data.map((object) => convertDueDate(object)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    default:
      getTodosQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%';`;
      data = await database.all(getTodosQuery);
      response.send(data.map((object) => convertDueDate(object)));
  }
});
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
      id = ${todoId};`;
  const todo = await database.get(getTodoQuery);
  response.send(convertDueDate(todo));
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (date === undefined) {
    response.status(400);
    response.send("Invalid Due Date");
  } else {
    if (isValidTodoDueDate(date)) {
      const formattedDate = format(new Date(date), "yyyy-MM-dd");
      const getTodoQuery = `SELECT * FROM todo WHERE due_date= '${formattedDate}';`;
      const todo = await database.all(getTodoQuery);
      response.send(todo.map((object) => convertDueDate(object)));
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});
app.post("/todos/", async (request, response) => {
  const todoDetails = request.body;
  const { id, todo, priority, status, category, dueDate } = todoDetails;

  switch (false) {
    case isValidTodoPriority(priority):
      response.status(400).send("Invalid Todo Priority");
      break;
    case isValidTodoStatus(status):
      response.status(400).send("Invalid Todo Status");
      break;
    case isValidTodoCategory(category):
      response.status(400).send("Invalid Todo Category");
      break;
    case isValidTodoDueDate(dueDate):
      response.status(400).send("Invalid Todo Due Date");
      break;
    default:
      const formattedDate = format(new Date(dueDate), "yyyy-MM-dd");
      const addTodoQuery = `INSERT INTO todo (id, todo, priority, status, category, dueDate)
            VALUES
            (${id}, '${todo}', '${priority}', '${status}', '${category}', '${formattedDate}')`;
      const databaseResponse = await database.run(addTodoQuery);
      response.send("Todo Successfully Added");
      break;
  }
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const todoDetails = request.body;
  const { todo, priority, status, category, dueDate } = todoDetails;
  switch (true) {
    case hasStatusProperty(request.body):
      const updateTodoStatusQuery = `UPDATE todo SET status='${status}' WHERE id = ${todoId};`;
      if (isValidTodoStatus(status)) {
        await database.run(updateTodoStatusQuery);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.body):
      const updateTodoCategoryQuery = `UPDATE todo SET category='${category}' WHERE id = ${todoId};`;
      if (isValidTodoCategory(category)) {
        await database.run(updateTodoCategoryQuery);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasPriorityProperty(request.body):
      const updateTodoPriorityQuery = `UPDATE todo SET priority='${priority}' WHERE id = ${todoId};`;
      if (isValidTodoPriority(priority)) {
        await database.run(updateTodoPriorityQuery);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasDueDateProperty(request.body):
      const updateTodoDueDateQuery = `UPDATE todo SET due_date='${dueDate}' WHERE id = ${todoId};`;
      if (isValidTodoDueDate(dueDate)) {
        await database.run(updateTodoDueDateQuery);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}'
    WHERE
      id = ${todoId};`;
      await database.run(updateTodoQuery);
      response.send("Todo Updated");
      break;
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const checkTodoQuery = `SELECT id FROM todo WHERE id = ${todoId};`;
  const existingTodo = await database.get(checkTodoQuery);

  if (existingTodo) {
    const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId};`;
    await database.run(deleteTodoQuery);
    response.send("Todo Deleted");
  } else {
    response.status(404).send("Todo not found");
  }
});

module.exports = app;
