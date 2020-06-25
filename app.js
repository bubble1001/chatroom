const app=require('express')();
const server=require('http').Server(app);
var io=require('socket.io')(server);

const users=[];

server.listen(3000,()=>{
	console.log('server OK...');
})

app.use(require('express').static('public'));

app.get('/',(req,res)=>{
	res.redirect('/index.html');
})

io.on('connection',(socket)=>{
	console.log('新用户连接了');
	socket.on('login',function(data){
		var user=users.find(item=>item.username===data.username);
		if(user){
			socket.emit('loginError',{msg:'用户名已存在'});
		}else{
			users.push(data);
			socket.emit('loginSuccess',data);
			
			//广播新用户
			io.emit('addUser',data);
			//把用户列表发送给每个用户
			io.emit('userList',users);
			
			socket.username=data.username;
			socket.avatar=data.avatar;
			
		}
	})
	
	socket.on('disconnect',()=>{
		console.log(socket.username);
		console.log(users);
		let idx;
		users.forEach((item,index)=>{
			if(item.username===socket.username){
				idx=index;
				return;
			}
		});
		// let idx=users.findIndex(item=>{item.username===socket.username});
		console.log(idx);
		users.splice(idx,1);
		console.log(users);
		io.emit('deleteUser',{
			username:socket.username
		});
		io.emit('userList',users);
	})
	
	socket.on('sendMessage',data=>{
		io.emit('receiveMessage',data);
	})
	
	socket.on('sendImage',data=>{
		io.emit('receiveImage',data);
	})
})