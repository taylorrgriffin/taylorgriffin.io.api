const fs = require('fs');
const cors = require('cors');
const path = require('path');
const rimraf = require('rimraf');
const cron = require('node-cron');
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

// delete all generated ASTs at 11:59:59 pm every night
cron.schedule('59 59 23 * * *', () => {
  rimraf('./python-ast-images', (error) => {
    if (error) {
      console.error(`Error cleaning up ASTs: ${error}`);
    }
  });
});

// serve static file p3.png 
app.get('/python-ast', (req, res) => {
  res.sendFile(path.resolve(path.resolve(__dirname, `./python-ast/tests/example_output/p1.simple.png`)));
})

// serve generated png file labeled with "code"
app.get('/python-ast/:code', (req, res) => {
  res.sendFile(path.resolve(path.resolve(__dirname,`./python-ast-images/${req.params.code}.png`)));
});

// generate png file given input python program and return "code" to access it with
app.post('/python-ast', (req, res) => {
  if (!req.body.python) {
    res.status(400).send('Bad request, no data sent.');
  }
  else {
    let code = uuidv4();
    fs.writeFile(`./python-ast-staging/${code}.py`, req.body.python, (err) => {
      if (err) {
        console.error(err);
        res.status(500).send(`Error writing ${code}.py to disk.`);
      }
      else {
        exec(`./python-ast/parse < ./python-ast-staging/${code}.py > ./python-ast-staging/${code}.gv --color dark --dir horizontal`, (err, stdout, stderr) => {
          if (err) {
            console.error(err);
            res.status(500).send(`Error running parse on ${code}.py`);
            // cleanup .gv and .py files
            deleteFiles([`./python-ast-staging/${code}.py`, `python-ast-staging/${code}.gv`], (err) => {
              if (err) {
                console.error(err);
                res.status(500).send(`Error deleteing ${code}.py and/or ${code}.gv`);
              }
            })
          }
          else {
            // check size of generated gv file
            let fileSize = fs.statSync(`./python-ast-staging/${code}.gv`).size;
        
            // only generate png if gv file isn't empty
            if (fileSize > 0) {
              if (!fs.existsSync('./python-ast-images')) {
                fs.mkdirSync('./python-ast-images')
              }
              exec(`dot -Tpng -o./python-ast-images/${code}.png ./python-ast-staging/${code}.gv`, (err, stdout, stderr) => {
                if (err) {
                  console.error(err);
                  res.status(500).send(`Error converting ${code}.gv to ${code}.png`);
                }
                else {
                  res.status(200).send(JSON.stringify({ code }));
                }
                // cleanup .gv and .py files
                deleteFiles([`./python-ast-staging/${code}.py`, `python-ast-staging/${code}.gv`], (err) => {
                  if (err) {
                    console.error(err);
                    res.status(500).send(`Error deleteing ${code}.py and/or ${code}.gv`);
                  }
                })
              });
            }
            // if gv was empty that means the input code had invalid syntax
            else {
              res.status(500).send(`Invalid python syntax.`);
              // cleanup .gv and .py files
              deleteFiles([`./python-ast-staging/${code}.py`, `python-ast-staging/${code}.gv`], (err) => {
                if (err) {
                  console.error(err);
                  res.status(500).send(`Error deleteing ${code}.py and/or ${code}.gv`);
                }
              })
            }
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

// only listen for requests on localhost
app.listen(port, 'localhost', () => {
  console.info(`== Server listening on port ${port}`);
});