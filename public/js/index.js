var socket=io('http://localhost:3000');

var username='';
var avatar='';
//登录
$('#login_avatar li').on('click',function(){
	$(this).addClass('current').siblings().removeClass('current');
});
$('#loginBtn').on('click',function(){
	var username=$('#username').val().trim();
	if(!username){
		alert('请输入用户名');
		return;
	}
	var avatar=$('#login_avatar li.current img').attr('src');
	
	socket.emit('login',{
		username:username,
		avatar:avatar
	})
})

socket.on('loginError',function(data){
	alert(data.msg);
});
socket.on('loginSuccess',function(data){
	$('.login_box').fadeOut();
	$('.container').fadeIn();
	
	$('.avatar_url').attr('src',data.avatar);
	$('.info .username').text(data.username);
	
	username=data.username;
	avatar=data.avatar;
});

socket.on('addUser',function(data){
	$('.chatroom_bd').append(`
		<div class="system">
			<p class="message_system">
				<span class="content">${data.username}加入了群聊</span>
			</p>
		</div>
	`)
	scrollIntoView();
});

socket.on('deleteUser',function(data){
	$('.chatroom_bd').append(`
		<div class="system">
			<p class="message_system">
				<span class="content">${data.username}离开了群聊</span>
			</p>
		</div>
	`)
	scrollIntoView();
});

socket.on('userList',data=>{
	$('#users').html('');
	data.forEach(item=>{
		$('#users').append(`
			<li class="user">
				<div class="avatar"><img src=${item.avatar} ></div>
				<div class="name">
					<h3 class="username">${item.username}</h3>
				</div>
			</li>
		`)
	});
	
	$('#user_count').text(data.length);
})


$(document).keydown (function(e) {
    if(e.keyCode == 13) {
        send();
		return false;
    }
})
$('#sendBtn').on('click',()=>{
    send();
})
function send(){
	var content=$('#content').html().trim();
	$('#content').html('');
	if(!content){
		return alert('请输入内容');
	}
	socket.emit('sendMessage',{
		msg:content,
		username:username,
		avatar:avatar
	})
}


socket.on('receiveMessage',data=>{
	if(data.username===username){
		$('.chatroom_bd').append(`
			<div class="message_box">
				<div class="my message">
					<img src="${data.avatar}" class="avatar">
					<div class="content">
						<div class="bubble">
							<div class="bubble_count">
								${data.msg}
							</div>
						</div>
					</div>
				</div>
			</div>
		`)
	}else{
		$('.chatroom_bd').append(`
			<div class="message_box">
				<div class="other message">
					<img src="${data.avatar}" class="avatar" >
					<div class="content">
						<div class="nickname">${data.username}</div>
						<div class="bubble">
							<div class="bubble_count">
								${data.msg}
							</div>
						</div>
					</div>
				</div>
			</div>
		`)
	}
	
	scrollIntoView();
	
})


function scrollIntoView(){
	//滚动到底部
	$('.chatroom_bd').children(':last').get(0).scrollIntoView(false);
	
}


//发送图片
$('#file').on('change',function(){
	var file=this.files[0];
	var fr=new FileReader();
	fr.readAsDataURL(file);
	fr.load=function(){
		socket.emit('sendImage',{
			username:username,
			avatar:avatar,
			img:fr.result
		})
	}
	
})

socket.on('receiveImage',data=>{
	if(data.username===username){
		$('.chatroom_bd').append(`
			<div class="message_box">
				<div class="my message">
					<img src="${data.avatar}" class="avatar">
					<div class="content">
						<div class="bubble">
							<div class="bubble_count">
								<img src="${data.img}">
							</div>
						</div>
					</div>
				</div>
			</div>
		`)
	}else{
		$('.chatroom_bd').append(`
			<div class="message_box">
				<div class="other message">
					<img src="${data.avatar}" class="avatar" >
					<div class="content">
						<div class="nickname">${data.username}</div>
						<div class="bubble">
							<div class="bubble_count">
								<img src="${data.img}">
							</div>
						</div>
					</div>
				</div>
			</div>
		`)
	}
	
	$('.chatroom_bd img:last').on('load',()=>{
		scrollIntoView();
	})
	
})

//表情
$('.face').on('click',function(){
	$('#content').emoji({
		button:'.face',
		showTab:false,
		animation:'slide',
		position:'topRight',
		icons:[
			{
				name:'QQ表情',
				path:'lib/dist/img/qq/',
				maxNum:91,
				excludeNums:[41,45,54],
				file:'.gif'
				
			},
			{
				name:'myEmoji',
				path:'lib/dist/img/myEmoji/',
				maxNum:12,
				file:'.jpg'
				
			}
		]
	})
})