const socket = io();
if(socket !== undefined){
  // console.log('Connected to socket...');
  
  // ============================================== USER CHAT ================================================= //
  // 1). DOM EVENTS
  $(() =>{
    // Run when page loads
    $(() =>{
      if($("#user-convoId").hasClass("user-convoId")){
        var convIdrecpId = $("#user-convoId").attr("value").split(',');
        var conversationId = convIdrecpId[0];
        var recipientId = convIdrecpId[1];
        socket.emit('joinRoom', conversationId);
        getMessages({
          conversationId: conversationId,
          recipientId: recipientId
        })
        chatBoxOnLoad()
      }
    });
    // Handle input
    $("#user-send").click(()=>{
      var composedMessage = $("#user-message").val();
      if(composedMessage && composedMessage != ''){
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
      } else{
        // TEMPORARY 'till server function(msgStatus)/event 'status' is not working
        setStatus('Pl. enter a message');
      };
      $("#user-send").blur();
      $("#user-message").val('').focus();
    });
  });

  // 2). SOCKET EVENTS
  // Status
  var msgStatus = document.getElementById("msg-status");
  if(msgStatus){
    var statusDefault = msgStatus.textContent;
    var setStatus = function(s){
      // Set 'default' status
      msgStatus.textContent = s;
      if(s !== statusDefault){
        var delay = setTimeout(function(){
          setStatus(statusDefault);
        }, 3000);
      }
    }
  }
  // Emit typing
  $("#user-message").on('input', function(){
    // Send value = firstName to server to 'broadcast'
    socket.emit('typing', $("#pin-chatbox").attr("value"));
  });
  // Listen on typing (status from server)
  socket.on('typing', function(data){
    setStatus(data + ' is typing...');
  })
  // socket.on('status', function(data){
  //   // get message status
  //   setStatus((typeof data === 'object')? data.message : data);
  //   // If status is clear, clear text
  //   if(data.clear){
  //     $('#user-message').val('');
  //   }
  // });
  // From routes.js
  socket.on('message', newMessage)
  socket.on('userRefresh', userRefresh)

  // 3). FUNCTIONS
  function userRefresh(data){
    window.location.replace('/users/'+data);
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
  function sendMessage(message){
    if(message.conversationId == ''){
      $.post('/new/chat', message);
      // TEMPORARY 'till server function(msgStatus)/event 'status' is not working
      setStatus('Conversation started!');
    } else if(message.recipientId == ''){
      $.post('/chat/'+message.conversationId, message);
    }
  }




  // ================================================ CLUB CHAT =============================================== //
  $(() =>{
    $(() =>{
      if($("#club-convoId").hasClass("club-convoId")){
        var convIdclubId = $("#club-convoId").attr("value").split(',');
        var conversationId = convIdclubId[0];
        var clubId = convIdclubId[1];
        socket.emit('joinClubRoom', conversationId);
        getClubMessages({
          conversationId: conversationId,
          clubId: clubId
        })
        chatBoxOnLoad()
      }
    });
    $("#club-send").click(()=>{
      var authorName = $("#pin-chatbox").attr("value");
      var composedMessage = $("#club-message").val();
      if(composedMessage && composedMessage != ''){
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
      } else{
        setClubStatus('Pl. enter a message');
      };
      $("#club-send").blur();
      $("#club-message").val('').focus();
    });
  });

  var clubMsgStatus = document.getElementById("club-msg-status");
  if(clubMsgStatus){
    var clubStatusDefault = clubMsgStatus.textContent;
    var setClubStatus = function(s){
      clubMsgStatus.textContent = s;
      if(s !== clubStatusDefault){
        var delay = setTimeout(function(){
          setClubStatus(clubStatusDefault);
        }, 3000);
      }
    }
  }
  $("#club-message").on('input', function(){
    socket.emit('clubTyping', $("#pin-chatbox").attr("value"));
  });
  socket.on('clubTyping', function(data){
    setClubStatus(data + ' is typing...');
  })
  // socket.on('clubStatus', function(data){
  //   setClubStatus((typeof data === 'object')? data.message : data);
  //   if(data.clear){
  //     $('#club-message').val('');
  //   }
  // });
  socket.on('clubMessage', newClubMessage)
  socket.on('clubRefresh', clubRefresh)

  function clubRefresh(data){
    window.location.replace('/clubs/'+data);
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
  function sendClubMessage(message){
    if(message.conversationId == ''){
      $.post('/new/club-chat', message);
      setStatus('Conversation started!');
    } else if(message.clubId == ''){
      $.post('/club-chat/'+message.conversationId, message);
    }
  }


  // ==================================== MISC. SCROLL CHATBOX ======================================== //
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
  function chatBoxOnLoad(){
    if($(window).width() > 767){
      $("#chatbox").addClass('show');
      var msgbox = $('#messages');
      msgbox.animate({scrollTop: 5000}, 1500);
    } else{
      $("#chatbox").removeClass('show');
      if($("#emoji-box").hasClass('right')){
        $("#emoji-box").toggleClass('emoji-right');
      }
      $("#drop-chat").click(()=>{
        var msgbox = $('#messages');
        msgbox.animate({scrollTop: 5000}, 1500);
      });
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
  }
}
