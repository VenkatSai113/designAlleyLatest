const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const initilizeDBAndServer = () => {
  app.listen(4000, () => {
    console.log("sever is running");
  });
};
initilizeDBAndServer();