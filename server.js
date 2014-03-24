var fs = require('fs'),
    http = require('http'),
    sio = require('socket.io');

var server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync('./index.html'));
});
server.listen(8000, function() {
    console.log('Server listening at http://localhost:8000/');
});
// Attach the socket.io server
io = sio.listen(server);



var messages = [],      //消息队列
    users = [],         //用户列表
    obj;                //单条消息记录

/**
 * 移除array元素
 * @param arr
 * @param val
 * @returns {*}
 */
var remove = function(arr,val){
    var idx = arr.indexOf(val);
    if(idx != -1){
        return arr.splice(idx,1);
    }
    return false;
}
// Define a message handler
io.sockets.on('connection', function (socket) {
    //创建连接后 广播一下
    socket.broadcast.emit('cUserNum',users.length);

    /**
     * 绑定事件，之所以用 s 和 c 开头，是为了区分服务端事件及客户端事件
     */
    socket.on('sMsg', function (msg) {
        console.log('Received: ', msg);
        obj = {
            user:socket.name,
            msg:msg
        };
        messages.push(obj);
        //发送消息到客户端
        socket.broadcast.emit('cMsg', obj);
    });

    /**
     * 新增用户 接收到用户信息后 再将用户信息广播到各个客户端
     */
    socket.on('sAddUser',function(data){
        socket.name = data || 'Anonymous';
        users.push(data);
        //发送消息到客户端
        socket.broadcast.emit('cAddUser',{
            user:data,
            num:users.length
        });
    });

    /**
     * 当客户端断开连接时调用该事件
     */
    socket.on('disconnect',function(){
        console.info('socket.name',socket.name);
        remove(users,socket.name);
        console.info(users);
        socket.broadcast.emit('updateUser',{
            user:socket.name,
            num:users.length
        });
    });

    /**
     * 页面加载时发送信息
     */
    socket.json.send({
        users:users,
        msg:messages
    })

});