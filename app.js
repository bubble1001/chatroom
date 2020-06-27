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
		// var user=users.find(item=>item.username===data.username);
		let getUser='select * from user_info where name=?';
		let userParams=[data.username];
		connection.query(getUser,userParams,(err,result)=>{
			if(err){
				console.log(err.message);
				return;
			}
			if(result.length){
				if(result[0].online===1){
					socket.emit('loginError',{msg:'该账号已经在其他地方登陆了哦'});
				}else if(result[0].online===0){  //有该账号的登陆记录
					let loginSql='update user_info set online=1 where name=?';
					let loginParams=[data.username];
					connection.query(loginSql,loginParams,(err,result)=>{
						if(err){
							console.log(err.message);
							return;
						}
						socket.emit('loginSuccess',data);
						io.emit('addUser',data);
						socket.username=data.username;
						socket.avatar=data.avatar;
					});
					let getUserList='select * from user_info where online=1';
					connection.query(getUserList,[],(err,result)=>{
						if(err){
							console.log(err.message);
							return;
						}
						io.emit('userList',result);
					})
				}
			}else{  //没有该账号的登陆记录
				var add_user_info='insert into user_info(name,avatar,date,online) values(?,?,?,?)';
				var addSqlParams=[data.username,data.avatar,data.times,1];
				connection.query(add_user_info,addSqlParams,function(err,result){
					if(err){
						console.log(data.username+'的用户登录信息保存失败');
						return;
					}
					console.log(data.username+'用户信息保存成功');
					socket.emit('loginSuccess',data);
					io.emit('addUser',data);
					socket.username=data.username;
					socket.avatar=data.avatar;
				});
				let getUserList='select * from user_info where online=1';
				connection.query(getUserList,[],(err,result)=>{
					if(err){
						console.log(err.message);
						return;
					}
					io.emit('userList',result);
				})
			}
		});
	// 	if(user){
	// 		socket.emit('loginError',{msg:'用户名已存在'});
	// 	}else{
	// 		users.push(data);
	// 		socket.emit('loginSuccess',data);
			
	// 		//广播新用户
	// 		io.emit('addUser',data);
	// 		//把用户列表发送给每个用户
	// 		io.emit('userList',users);
			
	// 		socket.username=data.username;
	// 		socket.avatar=data.avatar;
	// 		{
	// 			//把当前用户信息存入数据库
	// 			var add_user_info='insert into user_info(name,avatar,date) values(?,?,?)';
	// 			var addSqlParams=[socket.username,socket.avatar,data.times];
	// 			connection.query(add_user_info,addSqlParams,function(err,result){
	// 				if(err){
	// 					console.log(socket.username+'的用户登录信息保存失败');
	// 					return;
	// 				}
	// 				console.log(socket.username+'用户信息保存成功');
	// 			});
	// 		}
			
			
	// 	}
 })
	
	socket.on('sendIP',data=>{
		socket.ip=data.ip;
		socket.city=data.city;
	})
	
	socket.on('disconnect',()=>{
		// let idx;
		// users.forEach((item,index)=>{
		// 	if(item.username===socket.username){
		// 		idx=index;
		// 		return;
		// 	}
		// });
		// let idx=users.findIndex(item=>{item.username===socket.username});
		let offLineSql='update user_info set online=0 where name=?';
		let offLineParams=[socket.username];
		connection.query(offLineSql,offLineParams,(err,result)=>{
			if(err){
				console.log('登出异常'+err.message);
				return;
			}
			console.log(socket.username+'退出登录');
		})
		
		
		// users.splice(idx,1);
		io.emit('deleteUser',{
			username:socket.username
		});
		
		let getUserList='select * from user_info where online=1';
		connection.query(getUserList,[],(err,result)=>{
			if(err){
				console.log(err.message);
				return;
			}
			io.emit('userList',result);
		})
		// io.emit('userList',users);
	})
	
	socket.on('sendMessage',data=>{
		{
			var add_user_msg='insert into user_msg(user,avatar,msg,date) values(?,?,?,?)';
			var addSqlParams=[data.username,data.avatar,data.msg,data.times];
			connection.query(add_user_msg,addSqlParams,(err,result)=>{
				if(err){
					console.log(data.username+'的聊天信息保存失败'+err.message);
					return;
				}
				console.log(data.username+'的聊天信息保存成功');
			});
		}
		io.emit('receiveMessage',data);
	})
	
	socket.on('sendImage',data=>{
		io.emit('receiveImage',data);
	})
	
	
	//历史记录
	socket.on('select_message',data=>{
		connection.query(data.select,function(err,result){
			if(err){
				console.log(err.message);
				return;
			}
			socket.emit('show_message',result);
		})
	})
})




let connection='';
mysql=require('mysql');
function handleDisconnection(){
	connection=mysql.createConnection({
		host:'localhost',
		user:'root',
		password:'123',
		database:'mychat',
		port:'3306'
	})
	connection.connect(function(err){
		console.log('数据库连接成功');
		if(err){
			setTimeout(handleDisconnection,2000);
		}
	});
	connection.on('error',function(err){
		console.log('db error',err);
		if(err.code==='PROTOCOL_CONNECTION_LOST'){
			console.log('db error执行重连:'+err.message);
			handleDisconnection();
		}else{
			throw err;
		}
	});
}
handleDisconnection();