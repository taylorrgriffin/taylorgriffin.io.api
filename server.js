const fs = require('fs');
const cors = require('cors');
const path = require('path');
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const { exec } = require('child_process');

const app = express();
const port = process.env.PORT || 8080;

// middleware config
app.use(
  bodyParser.urlencoded({
      extended: true,
  })
);
app.use(bodyParser.json());
app.use(cors());

const deleteFiles = (files, callback) => {
  var i = files.length;
  files.forEach((filepath) => {
    fs.unlink(filepath, (err) => {
      i--;
      if (err) {
        callback(err);
        return;
      } else if (i <= 0) {
        callback(null);
      }
    });
  });
}

app.post('/', (req, res) => {
  if (!req.body.python) {
    res.status(400).send('Bad request, no data sent.');
  }
  else {
    let code = uuidv4();
    fs.writeFile(`${code}.py`, req.body.python, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send(`Error writing ${code}.py to disk.`);
      }
      else {
        exec(`./python-ast/parse < ./${code}.py > ./${code}.gv`, (err, stdout, stderr) => {
          if (err) {
            console.error(err);
            res.status(500).send(`Error running parse on ${code}.py`);
          }
          else {
            exec(`dot -Tpng -o${code}.png ./${code}.gv`, (err, stdout, stderr) => {
              if (err) {
                console.error(err);
                res.status(500).send(`Error converting ${code}.gv to ${code}.png`);
              }
              else {
                deleteFiles([`${code}.py`, `${code}.gv`], (err) => {
                  if (err) {
                    console.error(err);
                    res.status(500).send(`Error deleteing ${code}.py and/or ${code}.gv`);
                  }
                  else {
                    res.sendFile(`${code}.png`, { root: path.join(__dirname) }, (err) => {
                      if (err) {
                        console.error(err);
                      }
                      fs.unlink(`${code}.png`, (err) => {
                        if (err) {
                          console.error(err);
                        }
                      });
                    });
                  }
                })
              }
            });
          }
        });
      }
    });
  }
});

app.listen(port, () => {
  console.log("== Server listening on port", port);
});