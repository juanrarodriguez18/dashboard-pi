/**
 * Autor: Mario Pérez Esteso <mario@geekytheory.com>
 * Web: geekytheory.com
*/

require('dotenv').config()

module.exports = {

    initMonitor(app){

        var io = require('socket.io').listen(app),
        sys = require('util'),
        exec = require('child_process').exec,
        child, child1;
        var connectCounter = 0;
        
        //Each X seconds we send a new value to the graph 
        io.sockets.on('connection', function(socket) {
            var memTotal, memUsed = 0, memFree = 0, memBuffered = 0, memCached = 0, sendData = 1, percentBuffered, percentCached, percentUsed, percentFree;
            var address = socket.handshake.address;

            console.log("New connection from " + address.address + ":" + address.port);
            connectCounter++; 
            console.log("NUMBER OF CONNECTIONS++: "+connectCounter);
            socket.on('disconnect', function() { connectCounter--;  console.log("NUMBER OF CONNECTIONS--: "+connectCounter);});

            // Function for checking memory
            child = exec("egrep --color 'MemTotal' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                memTotal = stdout;
                socket.emit('memoryTotal', stdout); 
            }
            });

            child = exec("hostname", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                socket.emit('hostname', stdout); 
            }
            });

            child = exec("uptime | tail -n 1 | awk '{print $1}'", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                socket.emit('uptime', stdout); 
            }
            });

            child = exec("uname -r", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                socket.emit('kernel', stdout); 
            }
            });

            child = exec("top -d 0,5 -b -n2 | tail -n 10 | awk '{print $12}'", function (error, stdout, stderr) {
                if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    socket.emit('toplist', stdout); 
                }
        });
            

        setInterval(function(){
        // Function for checking memory free and used
            child1 = exec("egrep --color 'MemFree' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
            if (error == null) {
                memFree = stdout;
                memUsed = parseInt(memTotal)-parseInt(memFree);
                percentUsed = Math.round(parseInt(memUsed)*100/parseInt(memTotal));
                percentFree = 100 - percentUsed;
            } else {
                sendData = 0;
                console.log('exec error: ' + error);
            }
        });

        // Function for checking memory buffered
        child1 = exec("egrep --color 'Buffers' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
            if (error == null) {
                memBuffered = stdout;
                percentBuffered = Math.round(parseInt(memBuffered)*100/parseInt(memTotal));
            } else {
                sendData = 0;
                console.log('exec error: ' + error);
            }
        });

        // Function for checking memory buffered
        child1 = exec("egrep --color 'Cached' /proc/meminfo | egrep '[0-9.]{4,}' -o", function (error, stdout, stderr) {
            if (error == null) {
                memCached = stdout;
                percentCached = Math.round(parseInt(memCached)*100/parseInt(memTotal));
            } else {
                sendData = 0;
                console.log('exec error: ' + error);
            }
            });

            if (sendData == 1) {
                socket.emit('memoryUpdate', percentFree, percentUsed, percentBuffered, percentCached); 
            } else {
                sendData = 1;
            }
        }, 5000);
        
        // Function for checking disk usage
        setInterval(function(){
            child = exec("df -Bm | grep '/dev/root' | tail -n 1 | awk '{print $2,$5}'", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                var total = parseInt(stdout.split(" ")[0])
                var used = parseInt(stdout.split(" ")[1])
                var free = 100-used;
                socket.emit('diskUsageUpdate', total, used, free); 
            }
        });}, 5000);

        // Function for measuring temperature
        setInterval(function(){
            child = exec("cat /sys/class/thermal/thermal_zone0/temp", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                //Es necesario mandar el tiempo (eje X) y un valor de temperatura (eje Y).
                var date = new Date().getTime();
                var temp = parseFloat(stdout)/1000;
                socket.emit('temperatureUpdate', date, temp); 
            }
        });}, 5000);

        setInterval(function(){
        child = exec("top -d 0,5 -b -n2 | grep 'Cpu(s)'|tail -n 1 | awk '{print $2 + $4}'", function (error, stdout, stderr) {
            if (error !== null) {
                    console.log('exec error: ' + error);
                } else {
                    //Es necesario mandar el tiempo (eje X) y un valor de temperatura (eje Y).
                    var date = new Date().getTime();
                    socket.emit('cpuUsageUpdate', date, parseFloat(stdout)); 
                }
        });}, 10000);

        // Uptime
        setInterval(function(){
        child = exec("uptime | tail -n 1 | awk '{print $3 $4 $5}'", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                socket.emit('uptime', stdout); 
            }
        });}, 60000);

        // TOP list
        setInterval(function(){
        child = exec("ps aux --width 30 --sort -rss --no-headers | head  | awk '{print $11}'", function (error, stdout, stderr) {
            if (error !== null) {
                console.log('exec error: ' + error);
            } else {
                socket.emit('toplist', stdout); 
            }
            });}, 10000);
        });

    }
}