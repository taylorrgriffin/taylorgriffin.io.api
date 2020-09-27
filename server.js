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

app.get('/python-ast/:code', (req, res) => {
  res.sendFile(path.resolve(path.resolve(__dirname,`./python-ast/images/${req.params.code}.png`)));
});

app.post('/python-ast', (req, res) => {
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
            exec(`dot -Tpng -o./python-ast/images/${code}.png ./${code}.gv`, (err, stdout, stderr) => {
              if (err) {
                console.error(err);
                res.status(500).send(`Error converting ${code}.gv to ${code}.png`);
              }
              else {
                res.status(200).send(JSON.stringify({ code }));
                deleteFiles([`${code}.py`, `${code}.gv`], (err) => {
                  if (err) {
                    console.error(err);
                    res.status(500).send(`Error deleteing ${code}.py and/or ${code}.gv`);
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

// catch-all for 404
app.get('*', (req, res) => {
  res.status(404);
});

app.listen(port, 'localhost', () => {
  console.info(`== Server listening on port ${port}`);
});