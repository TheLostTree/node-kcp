var kcp = require('./build/Release/kcp');
var dgram = require('dgram');
var server = dgram.createSocket('udp4');
var clients = {};

var output = function(data, size, context) {
    server.send(data, 0, size, context.port, context.address);
};

server.on('error', (err) => {
    console.log(`server error:\n${err.stack}`);
    server.close();
});

server.on('message', (msg, rinfo) => {
    var k = rinfo.address+'_'+rinfo.port;
    if (undefined === clients[k]) {
        var context = {
            address : rinfo.address,
            port : rinfo.port
        };
        var kcpobj = new kcp.KCP(123, context);
        kcpobj.output(output);
        clients[k] = kcpobj;
    }
    var kcpobj = clients[k];
    kcpobj.input(msg);
});

server.on('listening', () => {
    var address = server.address();
    console.log(`server listening ${address.address} : ${address.port}`);
    setInterval(() => {
        for (var k in clients) {
            var kcpobj = clients[k];
        	kcpobj.update(Date.now());
        	var recv = kcpobj.recv();
        	if (recv) {
            	console.log(`server recv ${recv} from ${kcpobj.context().address}:${kcpobj.context().port}`);
           		kcpobj.send('RE-'+recv);
       	 	}
       	}
    }, 200);
});

server.bind(41234);
