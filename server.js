var express = require("express")
var fs = require("fs");

var app = express();

var recordSize = 256;
var dataDir = "data";
if (!fs.existsSync(dataDir)) {
    fs.mkdir(dataDir); 
}

app.use("/", express.static("static"));

var getFileFromParams = function(req) {
    return dataDir + "/" + req.params.name;
};

function respond(res, count, changes) {
    res.send({
        count: count,
        changes: changes,
        state: !!(count % 2)
    });
}

app.get("/bits/:name", function(req, res) {
    fs.open(getFileFromParams(req), "r", function(err, fd) {
        if (err) {
            respond(res, 0, []);
        } else {
            fs.fstat(fd, function(err, stats) {
                if (err) {
                    res.send(500, err.message);
                } else {
                    var count = Math.floor(stats.size / recordSize);
                    var skip = Math.min(req.query.skip || 0, count);
                    var take = Math.min(count - skip, req.query.take || 1);
                    if (take == 0) {
                        respond(res, count, []);
                    } else {
                        var byteStart = (count - (skip + take)) * recordSize;
                        var byteCount = take * recordSize;
                        fs.read(fd, new Buffer(byteCount),
                                0, byteCount, byteStart,
                                function(err, bytesRead, buf) {
                            if (err) {
                                respond(res, count, []);
                            } else {
                                var changes = [];
                                for (var r = take - 1; r >= 0; r--) {
                                    var start = r * recordSize;
                                    var size = buf[start];
                                    var recordBuffer = buf.slice(start + 1, start + size + 1);
                                    changes.push(recordBuffer.toString().split("\n"));
                                }
                                respond(res, count, changes);
                            }
                        });
                    }
                }
            });
        }
    });
});

app.post("/bits/:name/:from", function(req, res) {    
    var recordBuffer = new Buffer(recordSize);
    recordBuffer.fill(0);
    var size = recordBuffer.write(new Date().toISOString() + "\n" + req.params.from, 1);
    recordBuffer[0] = size;
    fs.appendFile(getFileFromParams(req), recordBuffer, function(err) {
        if (err) {
            res.send({ error: err.message });
        } else {
            res.send({ toggled: true });
        }
    });
});

app.listen(3000);

