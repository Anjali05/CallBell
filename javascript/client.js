/*
@author Anjali
Script for connecting clients and passing messages
*/
$(document).ready(function()
{


		console.log("Ready");

    //setting username
		var username;
    var connected = false;
    var typing = false;
    var lastSeen;
    var socket = io();

    //object creation for connecting to appbase.io
    var appbaseRef = new Appbase({
    url: 'https://scalr.api.appbase.io',
    appname: 'CallBell',
    username: 'Hf8IWUfRQ',
    password: 'bf01d752-6cc5-4f47-82ce-1797ea4a76e1'
    });

		/*appbaseRef.delete({
			type: "messages",
			body:{
				query:{
					match_all:{}
				}
			}
		}).on('data', function(res){
			console.log("Successfully deleted");
		}).on('error', function(err){
			console.log("Deleted error");
		});*/
    //Loading message history
		appbaseRef.search({
		type: "messages",
		size: 10,
		body:{
			query:{
				match_all:{}
			}
		}
		}).on('data', function(res){
			console.log("Inside search");
			if(res.hits.hits){
				  var ui = document.getElementById("messages");
					console.log("Length is "+res.hits.hits.length);
					for(var i =0;i<res.hits.hits.length;i++)
					{
						var msg = res.hits.hits[i]._source.message;
						var username = res.hits.hits[i]._source.username;
				    var date = res.hits.hits[i]._source.timestamp;
						console.log("Message is "+res.hits.hits[i]._source.message);
						var li = document.createElement("li");
						li.setAttribute("class", "media");
						li.innerHTML="<div class='media-body'><div class='media'><div class='media-body'>"+msg+"<br /><small class='text-muted'>"+username+" | "+date+"</small><hr /></div></div></div>";
						ui.appendChild(li);
					}
			}

		}).on('error', function(err){
			console.log("Fail search");
		});

    /*  //retrieving data
      appbaseRef.search({
      type: 'product',
      body:{
        query:{
          match_all:{}
        }
      }
    }).on('data', function(response){
      console.log("Length is "+response.length);
    }).on('error', function(response){
      console.log("Fail search");
    });*/

    //logs new message from the users
    socket.on('chat message', function(data){
		var date = new Date();
    var ui = document.getElementById("messages");
    var li = document.createElement("li");
    li.setAttribute("class", "media");
    li.innerHTML="<div class='media-body'><div class='media'><div class='media-body'>"+data.message+"<br /><small class='text-muted'>"+data.username+" | "+date.toDateString();+"</small><hr /></div></div></div>";
    ui.appendChild(li);
    });

    //whenever new user join, log it into the window
    socket.on('userJoined', function(data){
      var ui = document.getElementById("messages");
      var li = document.createElement("li");
      li.setAttribute("class", "media");
      li.innerHTML="<div class='media-body'><div class='media'><div class='media-body'>"+data.username+" joined </div></div></div>";
      ui.appendChild(li);
    });

    //typing event of user
    socket.on('typing', function(data){
      var ui = document.getElementById("messages");
      var li = document.createElement("li");
			li.setAttribute("id", data.username)
      li.setAttribute("class", "media");
      li.innerHTML="<div class='media-body'><div class='media'><div class='media-body'>"+data.username+" is typing </div></div></div>";
      ui.appendChild(li);
    });

		//stop typing event
		socket.on('stopTyping', function(data){
			var ui = document.getElementById("messages");
			var li = document.getElementById("data.username");
			ui.removeChild(li);
		});

    //Online user event
		socket.on('onlineUsers', function(data){
			connected = true;
			var ui = document.getElementById("onlineUsers");
      var li = document.createElement("li");
      li.setAttribute("class", "media");
      li.innerHTML="<div class='media-body'><div class='media'><div class='media-body'>"+data.username+"</div></div></div>";
      ui.appendChild(li);
		});

    //Adding each message in the DB for historical data
    addToDB = function(msg)
		{
			var date = new Date();
			date = date.toDateString();
      //putting details in a json object
      var jsonObject={
          "message":msg,
					"username": username,
					"timestamp": date
        };
        console.log("Message "+jsonObject.message);


      /*  //delete data
				appbaseRef.delete({
					type: 'product',
					id: 'X1'
				}).on('data', function(res){
					console.log("Successfully deleted");
				}).on('error', function(err){
					console.log("Deleted error");
				});*/

      //storing data in appbase
      appbaseRef.index({
        type: "messages",
        body: jsonObject
      }).on('data', function(res){
        console.log("Successfully added");
      }).on('error', function(err){
        console.log("Failure");
      });

		/*	appbaseRef.search({
      type: 'messages',
      body:{
        query:{
          match_all:{}
        }
      }
      }).on('data', function(res){
				if(res.hits.hits){
					  console.log("Length is "+res.hits.hits.length);
						for(var i =0;i<res.hits.hits.length;i++)
						{
							console.log("Message is "+res.hits.hits[i]._source.message);
						}
				}
      }).on('error', function(err){
        console.log("Fail search");
      });*/
		/*	appbaseRef.get({
				type:'product',
				id: 'X1'
			}).on('data', function(res){
				console.log("Successfully retrieved");
			}).on('error', function(err){
				console.log('Failure');
			});*/
    }


    //Setting username
    setUsername = function(){
			//var username = document .getElementById("msg");
      username = document.getElementById("msg").value;
			document .getElementById("msg").value="";
      if(username)
      {
        //sending server the username

        socket.emit('setUsername', username);
      }
    }

    //sending message
    sendMsg = function(msg)
		{
      socket.emit('chat message', msg);
    }

    //handling on click function for button click
    postMsg = function(e)
		{
			var i = document.getElementById("msg");
			var placeHolder = i.getAttribute("placeholder");
			if(e.keyCode == 13 && placeHolder == "Enter Username")
			{
         i.setAttribute("placeholder","Enter message");
				 setUsername();
			}
			else
			{
				if(e.keyCode ==13)
				{
					console.log(appbaseRef);
					var msg = document.getElementById("msg").value;
					document.getElementById("msg").value="";
					sendMsg(msg);
					addToDB(msg);
				}

			}

    }

    updateTyping = function()
		{
      if(!typing)
      {
        typing = true;
        socket.emit('typing');
      }

			if(document.getElementById("msg").focus==false)
			{
				socket.emit('stopTyping');
				typing = false;
			}
    }

    console.log("object created");

		//
   createChannel = function()
		{
			var type;
			var createdBy = username;
			var createdAt = new Date().toDateString();
			var name = document.getElementById("channelName").value;
			var desc = document.getElementById("purpose").value;
			if(document.getElementById("public").checked)
			{
				type = "public";
			}
			else if(document.getElementById("private").checked)
			{
				type = "private";
			}
			else
			{
				type = "public";
			}
			//putting details in a json object
			var jsonObject={
					"createdAt": createdAt,
					"channelName": name,
					"createdBy": createdBy,
					"description": desc,
					"type": type
				};

				appbaseRef.index()
				document.getElementById("channelName").value="";
				document.getElementById("purpose").value="";
			  console.log("createdAt "+jsonObject.createdAt+ " channelName "+jsonObject.channelName+" createdBy "+jsonObject.createdBy+" desc "+jsonObject.description+" type "+jsonObject.type);

				$('#myModal').modal('hide');
	}

  /*  $("#create").click(function(e){
        console.log("Reaching button");
		}); */
		//Adding new channel
		addChannel = function()
		{
			if(connected)
			{
				$('#myModal').modal('show');
			/*	$('#myModal').on('shown.bs.modal', function () {
					console.log("Here");
				  //$('#myInput').focus()
				});*/

			}
			else
			{
				alert("Enter Username");
			}
		}

})
