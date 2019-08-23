if($(window).width() > 767){
  $("#chatbox").addClass('show');
} else{
  $("#chatbox").removeClass('show');
  if($("#emoji-box").hasClass('right')){
    $("#emoji-box").toggleClass('emoji-right');
  }
  window.onload=function(){
    $("#drop-chat").click(()=>{
      var msgbox = $('#messages');
      msgbox.animate({scrollTop: 5000}, 1500);
    });
  };
}

$("#arrows-v").click(()=>{
  $("#arrows-v").toggleClass('blackcolor');
  $("#messages").toggleClass('messages-long');
});

$("#thumbstack").click(()=>{
  $("#thumbstack").toggleClass('blackcolor');
  $("#pin-chatbox").toggleClass('pin-chatbox');
  $("#emoji-box2").toggleClass('emoji-up');
});

var socket = io();
if(socket !== undefined){
  // console.log('Connected to socket...');
  
  // USER-CHAT STATUS
  var msgStatus = document.getElementById("msg-status");
  if(msgStatus){
    var statusDefault = msgStatus.textContent;
    var setStatus = function(s){
      // Set status
      msgStatus.textContent = s;
      if(s !== statusDefault){
        var delay = setTimeout(function(){
          setStatus(statusDefault);
        }, 3000);
      }
    }
  }
  $("#user-message").keyup(function(){
    socket.emit('typing', $("#pin-chatbox").attr("value"));
  });
  // Get typing status From Server
  socket.on('typing', function(data){
    setStatus(data + ' is typing...');
  })
  socket.on('status', function(data){
    // get message status
    setStatus((typeof data === 'object')? data.message : data);
    if(data.clear){
      $('#user-message').val('');
    }
  });

  // CLUB-CHAT STATUS
  var clubMsgStatus = document.getElementById("club-msg-status");
  if(clubMsgStatus){
    var clubStatusDefault = clubMsgStatus.textContent;
    var setClubStatus = function(s){
      // Set status
      clubMsgStatus.textContent = s;
      if(s !== clubStatusDefault){
        var delay = setTimeout(function(){
          setClubStatus(clubStatusDefault);
        }, 3000);
      }
    }
  }
  $("#club-message").keyup(function(){
    socket.emit('clubTyping', $("#pin-chatbox").attr("value"));
  });
  // Get typing status From Server
  socket.on('clubTyping', function(data){
    setClubStatus(data + ' is typing...');
  })
  socket.on('clubStatus', function(data){
    // get message status
    setClubStatus((typeof data === 'object')? data.message : data);
    if(data.clear){
      $('#club-message').val('');
    }
  });

  $(() =>{
    // USER CHAT
    $("#user-send").click(()=>{
      var composedMessage = $("#user-message").val();
      var convIdrecpIdcurrId = $("#user-convoId").attr("value").split(',');
      var conversationId = convIdrecpIdcurrId[0];
      var recipientId = convIdrecpIdcurrId[1];
      var authorId = convIdrecpIdcurrId[2];
      sendMessage({
        composedMessage: composedMessage,
        conversationId: conversationId,
        recipientId: recipientId,
        authorId: authorId
      });
    })
    $(() =>{
      if($("#user-convoId").hasClass("user-convoId")){
        var convIdrecpId = $("#user-convoId").attr("value").split(',');
        var conversationId = convIdrecpId[0];
        var recipientId = convIdrecpId[1];
        getMessages({
          conversationId: conversationId,
          recipientId: recipientId
        })
        scrollToBottom()
      }
    });
    // CLUB CHAT
    $("#club-send").click(()=>{
      var authorName = $("#pin-chatbox").attr("value");
      var composedMessage = $("#club-message").val();
      var convIdclubIdcurrId = $("#club-convoId").attr("value").split(',');
      var conversationId = convIdclubIdcurrId[0];
      var clubId = convIdclubIdcurrId[1];
      var authorId = convIdclubIdcurrId[2];
      sendClubMessage({
        composedMessage: composedMessage,
        conversationId: conversationId,
        clubId: clubId,
        authorId: authorId,
        authorName: authorName
      });
    })
    $(() =>{
      if($("#club-convoId").hasClass("club-convoId")){
        var convIdclubId = $("#club-convoId").attr("value").split(',');
        var conversationId = convIdclubId[0];
        var clubId = convIdclubId[1];
        getClubMessages({
          conversationId: conversationId,
          clubId: clubId
        })
        scrollToBottom()
      }
    })
  })

  socket.on('message', newMessage)
  socket.on('clubMessage', newClubMessage)
  socket.on('userRefresh', userRefresh)
  socket.on('clubRefresh', clubRefresh)

  function userRefresh(data){
    window.location.replace('/users/'+data);
  }
  function clubRefresh(data){
    window.location.replace('/clubs/'+data);
  }

  function scrollToBottom(){
    var msgbox = $('#messages');
    msgbox.animate({scrollTop: 5000}, 1500);
  }

  function scrollToNext(){
    var checkbottom; var msgbox = $("#messages");
    // slack of about two one liners ~ 100px
    var diff = ((msgbox.scrollTop() + msgbox.innerHeight() + 200) - msgbox[0].scrollHeight);
    var check = diff>0;
    if(check){
      checkbottom = "bottom";
    } else{
    checkbottom = "nobottom";
    }
    if (checkbottom == "bottom"){
      var currHeight = msgbox.scrollTop();
      msgbox.animate({scrollTop: currHeight+500}, 1500);
    }
  }

  function addMessages(data){
    var prevDate;
    $('#load-prevMsgs-btn').val(data.foundMessageIds);
    for(i=data.messages.messageBuckets.length-1;i>=0;i--){
      data.messages.messageBuckets[i].messages.forEach(function(message){
        if(moment(message.createdAt).format("MMM Do YY") != prevDate){
          $("#messages").append(`
            <div class="chat-head3"> ${moment(message.createdAt).format("MMM Do YY")} </div>`);
        }
        prevDate = moment(message.createdAt).format("MMM Do YY");
        if(message.authorId == data.currentUser){
          $("#messages").append(`
            <div class="flex-end"><div class="chat-msg2"><div> ${message.text} </div><div class="chat-head2">
             ${moment(message.createdAt).format('LT')} </div></div></div>`);
        } else{
          $("#messages").append(`
            <div><div class="chat-msg"><div> ${message.text} </div><div class="chat-head">
             ${moment(message.createdAt).format('LT')} </div></div></div>`);
        }
      });
    }
  }
  function addClubMessages(data){
    var prevDate;
    $('#load-prevMsgs-btn').val(data.foundMessageIds);
    for(i=data.messages.messageBuckets.length-1;i>=0;i--){
      data.messages.messageBuckets[i].messages.forEach(function(message){
        if(moment(message.createdAt).format("MMM Do YY") != prevDate){
          $("#messages").append(`
            <div class="chat-head3"> ${moment(message.createdAt).format("MMM Do YY")} </div>`);
        }
        prevDate = moment(message.createdAt).format("MMM Do YY");
        if(message.authorId == data.currentUser){
          $("#messages").append(`
            <div class="flex-end"><div class="chat-msg2"><div class="chat-head2"> ${data.firstName} 
             ${moment(message.createdAt).format('LT')} </div><div> ${message.text}</div> </div></div>`);
        } else{
          $("#messages").append(`
            <div><div class="chat-msg"><div class="chat-head bluecolor"> ${message.authorName} 
             ${moment(message.createdAt).format('LT')} </div><div> ${message.text}</div> </div></div>`);
        }
      });
    }
  }

  function newMessage(data){
    var convIdrecpIdcurrId = $("#user-convoId").attr("value").split(',');
    var currentUserId = convIdrecpIdcurrId[2];
    if(currentUserId == data.authorId){
      $("#messages").append(`
        <div class="flex-end"><div class="chat-msg2"> ${data.composedMessage} </div></div>`);
    } else{
      $("#messages").append(`
        <div><div class="chat-msg"> ${data.composedMessage} </div></div>`);
    }
    scrollToNext();
  }
  function newClubMessage(data){
    var convIdclubIdcurrId = $("#club-convoId").attr("value").split(',');
    var currentUserId = convIdclubIdcurrId[2];
    if(currentUserId == data.authorId){
        $("#messages").append(`
          <div class="flex-end"><div class="chat-msg2"><div class="chat-head2"> ${data.authorName} </div>
           ${data.composedMessage} </div></div>`);
      } else{
        $("#messages").append(`
          <div><div class="chat-msg"><div class="chat-head bluecolor"> ${data.authorName} </div>
           ${data.composedMessage} </div></div>`);
      }
    scrollToNext();
  }

  function getMessages(conversation){
    if(conversation.conversationId == ''){
      $('#load-prevMsgs-btn').addClass('nodisplay');
      $("#messages").append(`
        <div class="chat-msg3"><span class="boldtext"> Start a conversation </span></div> <br>`);
    } else{
      $.get('/chat/'+conversation.conversationId, (data) =>{
        addMessages(data);
      })
    }
  }
  function getClubMessages(conversation){
    if(conversation.conversationId == ''){
      $('#load-prevMsgs-btn').addClass('nodisplay');
      $("#messages").append(`
        <div class="chat-msg3"><span class="boldtext"> Start a conversation </span></div> <br>`);
    } else{
      $.get('/club-chat/'+conversation.conversationId, (data) =>{
        addClubMessages(data);
      })
    }
  }

  function sendMessage(message){
    if(message.conversationId == ''){
      $.post('/new/chat', message);
    } else if(message.recipientId == ''){
      $.post('/chat/'+message.conversationId, message);
    }
  }
  function sendClubMessage(message){
    if(message.conversationId == ''){
      $.post('/new/club-chat', message);
    } else if(message.clubId == ''){
      $.post('/club-chat/'+message.conversationId, message);
    }
  }
}
